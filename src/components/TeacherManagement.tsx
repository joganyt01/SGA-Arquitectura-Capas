import React, { useState } from 'react';
import { TeacherService, PeriodAndGroupService, CurriculumService } from '../services/businessServices';
import { Teacher } from '../domain/types';
import {
  Briefcase,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  BookOpen,
  Award,
  Phone,
  Mail,
  X
} from 'lucide-react';

export const TeacherManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const [formData, setFormData] = useState({
    documentNumber: '',
    fullName: '',
    email: '',
    phone: '',
    department: 'Departamento de Ingeniería de Sistemas y Computación',
    academicDegree: 'Magíster',
    contractType: 'TIEMPO_COMPLETO' as Teacher['contractType']
  });

  const teachers = TeacherService.getAll();
  const allGroups = PeriodAndGroupService.getGroups();

  const departments = Array.from(new Set(teachers.map(t => t.department)));

  const filteredTeachers = teachers.filter(t => {
    const matchesSearch =
      t.documentNumber.includes(searchTerm) ||
      t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !selectedDeptFilter || t.department === selectedDeptFilter;
    return matchesSearch && matchesDept;
  });

  const handleOpenAdd = () => {
    setFormData({
      documentNumber: '',
      fullName: '',
      email: '',
      phone: '',
      department: 'Departamento de Ingeniería de Sistemas y Computación',
      academicDegree: 'Magíster',
      contractType: 'TIEMPO_COMPLETO'
    });
    setIsAddModalOpen(true);
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTeacher) {
      TeacherService.updateTeacher(editingTeacher.id, {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        academicDegree: formData.academicDegree,
        contractType: formData.contractType
      });
      setEditingTeacher(null);
    } else {
      TeacherService.registerTeacher(formData);
      setIsAddModalOpen(false);
    }
  };

  const handleStartEdit = (t: Teacher) => {
    setEditingTeacher(t);
    setFormData({
      documentNumber: t.documentNumber,
      fullName: t.fullName,
      email: t.email,
      phone: t.phone,
      department: t.department,
      academicDegree: t.academicDegree,
      contractType: t.contractType
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            Módulo de Gestión de Docentes (RF-04)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Planta profesoral, escalafón docente, asignación a asignaturas y carga horaria semanal.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer self-start md:self-auto hover:scale-102"
        >
          <UserPlus className="w-4 h-4" />
          Registrar Docente
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por documento o nombre..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={selectedDeptFilter}
          onChange={e => setSelectedDeptFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
        >
          <option value="">Todos los Departamentos</option>
          {departments.map((d, i) => (
            <option key={i} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
              <tr>
                <th className="p-3">Documento</th>
                <th className="p-3">Docente Titular</th>
                <th className="p-3">Departamento Académico</th>
                <th className="p-3">Nivel de Formación</th>
                <th className="p-3 text-center">Tipo Contrato</th>
                <th className="p-3 text-center">Grupos Asignados</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTeachers.map(t => {
                const assignedGroups = allGroups.filter(g => g.teacherId === t.id);
                return (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-700">{t.documentNumber}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{t.fullName}</div>
                      <div className="text-[11px] text-slate-500">{t.email} • {t.phone}</div>
                    </td>
                    <td className="p-3 text-slate-700 max-w-[220px] truncate">{t.department}</td>
                    <td className="p-3">
                      <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-medium">
                        {t.academicDegree}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-mono text-[11px] text-slate-700">
                        {t.contractType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold text-blue-700">
                      {assignedGroups.length} grupos
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleStartEdit(t)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar docente"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {(isAddModalOpen || editingTeacher) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingTeacher ? 'Actualizar Docente' : 'Registrar Nuevo Docente'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingTeacher(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Documento *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingTeacher}
                    value={formData.documentNumber}
                    onChange={e => setFormData({ ...formData, documentNumber: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Correo Institucional *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Departamento Académico</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Título / Grado Académico</label>
                  <select
                    value={formData.academicDegree}
                    onChange={e => setFormData({ ...formData, academicDegree: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Especialista">Especialista</option>
                    <option value="Magíster">Magíster</option>
                    <option value="Doctor (Ph.D.)">Doctor (Ph.D.)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Modalidad de Contrato</label>
                  <select
                    value={formData.contractType}
                    onChange={e => setFormData({ ...formData, contractType: e.target.value as any })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="TIEMPO_COMPLETO">Tiempo Completo</option>
                    <option value="MEDIO_TIEMPO">Medio Tiempo</option>
                    <option value="CATEDRA">Cátedra</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingTeacher(null);
                  }}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700"
                >
                  Guardar Docente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

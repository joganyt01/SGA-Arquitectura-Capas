import React, { useState } from 'react';
import { StudentService, CurriculumService, AuthService } from '../services/businessServices';
import { Student } from '../domain/types';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  X,
  Phone,
  Mail,
  GraduationCap
} from 'lucide-react';

export const StudentManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgramFilter, setSelectedProgramFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [suspendModalStudent, setSuspendModalStudent] = useState<Student | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    documentNumber: '',
    fullName: '',
    email: '',
    phone: '',
    programId: 'prg-1',
    currentSemester: 1
  });

  const students = StudentService.getAll();
  const programs = CurriculumService.getPrograms();

  const filteredStudents = students.filter(s => {
    const matchesSearch =
      s.documentNumber.includes(searchTerm) ||
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProgram = !selectedProgramFilter || s.programId === selectedProgramFilter;
    const matchesStatus = !selectedStatusFilter || s.status === selectedStatusFilter;
    return matchesSearch && matchesProgram && matchesStatus;
  });

  const handleOpenAdd = () => {
    setFormData({
      documentNumber: '',
      fullName: '',
      email: '',
      phone: '',
      programId: programs[0]?.id || 'prg-1',
      currentSemester: 1
    });
    setIsAddModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.documentNumber || !formData.fullName || !formData.email) {
      alert('Por favor complete los campos obligatorios.');
      return;
    }

    if (editingStudent) {
      StudentService.updateStudent(editingStudent.id, {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        programId: formData.programId,
        currentSemester: formData.currentSemester
      });
      setEditingStudent(null);
    } else {
      const res = StudentService.registerStudent(formData);
      if (!res.success) {
        alert(res.error);
        return;
      }
      setIsAddModalOpen(false);
    }
  };

  const handleStartEdit = (s: Student) => {
    setEditingStudent(s);
    setFormData({
      documentNumber: s.documentNumber,
      fullName: s.fullName,
      email: s.email,
      phone: s.phone,
      programId: s.programId,
      currentSemester: s.currentSemester
    });
  };

  const handleConfirmSuspend = () => {
    if (!suspendModalStudent) return;
    StudentService.toggleSuspendStudent(
      suspendModalStudent.id,
      suspendReason || 'Ajuste administrativo disciplinario o financiero'
    );
    setSuspendModalStudent(null);
    setSuspendReason('');
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Confirma la eliminación del estudiante ${name}?`)) {
      StudentService.deleteStudent(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Módulo de Gestión de Estudiantes (RF-03)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Administración del ciclo de vida estudiantil: Registro, Actualización, Suspensión Disciplinaria y Estado Académico.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer self-start md:self-auto hover:scale-102"
        >
          <UserPlus className="w-4 h-4" />
          Registrar Nuevo Estudiante
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por documento, nombre o email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={selectedProgramFilter}
            onChange={e => setSelectedProgramFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
          >
            <option value="">Todos los Programas</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            value={selectedStatusFilter}
            onChange={e => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
          >
            <option value="">Todos los Estados</option>
            <option value="ACTIVO">Activo</option>
            <option value="SUSPENDIDO">Suspendido</option>
            <option value="GRADUADO">Graduado</option>
            <option value="RETIRADO">Retirado</option>
          </select>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
              <tr>
                <th className="p-3">Documento</th>
                <th className="p-3">Estudiante</th>
                <th className="p-3">Programa Académico</th>
                <th className="p-3 text-center">Nivel</th>
                <th className="p-3 text-center">Promedio (GPA)</th>
                <th className="p-3 text-center">Créditos</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No se encontraron estudiantes con los criterios de filtro aplicados.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(s => {
                  const program = programs.find(p => p.id === s.programId);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-700">{s.documentNumber}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{s.fullName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>{s.email}</span>
                          <span>•</span>
                          <span>{s.phone}</span>
                        </div>
                      </td>
                      <td className="p-3 font-medium text-slate-700">
                        {program?.name || 'N/A'}
                      </td>
                      <td className="p-3 text-center text-slate-600 font-medium">
                        Sem {s.currentSemester}°
                      </td>
                      <td className="p-3 text-center font-bold text-emerald-600 font-mono">
                        {s.gpa > 0 ? s.gpa.toFixed(2) : '-'}
                      </td>
                      <td className="p-3 text-center font-mono">
                        {s.creditsApproved} cr.
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'ACTIVO'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : s.status === 'SUSPENDIDO'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleStartEdit(s)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar estudiante"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSuspendModalStudent(s)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              s.status === 'SUSPENDIDO'
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-amber-600 hover:bg-amber-50'
                            }`}
                            title={s.status === 'SUSPENDIDO' ? 'Reactivar estudiante' : 'Suspender estudiante'}
                          >
                            {s.status === 'SUSPENDIDO' ? (
                              <ShieldCheck className="w-3.5 h-3.5" />
                            ) : (
                              <ShieldAlert className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(s.id, s.fullName)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {(isAddModalOpen || editingStudent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingStudent ? 'Actualizar Datos de Estudiante' : 'Registrar Nuevo Estudiante'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingStudent(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Documento de Identidad *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingStudent}
                    value={formData.documentNumber}
                    onChange={e => setFormData({ ...formData, documentNumber: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono disabled:bg-slate-100"
                    placeholder="1020304050"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Teléfono Móvil</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                    placeholder="+57 300 000 0000"
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
                  placeholder="Juan Camilo Pérez Salazar"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Correo Electrónico Institucional *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono"
                  placeholder="juan.perez@universidad.edu.co"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Programa Académico</label>
                  <select
                    value={formData.programId}
                    onChange={e => setFormData({ ...formData, programId: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                  >
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Semestre Actual</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={formData.currentSemester}
                    onChange={e => setFormData({ ...formData, currentSemester: parseInt(e.target.value) || 1 })}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700"
                >
                  {editingStudent ? 'Guardar Cambios' : 'Registrar Estudiante'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUSPENSION MODAL */}
      {suspendModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-md space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              {suspendModalStudent.status === 'SUSPENDIDO'
                ? 'Reactivar Estudiante'
                : 'Suspender Estudiante'}
            </h3>
            <p className="text-xs text-slate-600">
              Estudiante: <strong>{suspendModalStudent.fullName}</strong> ({suspendModalStudent.documentNumber})
            </p>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">Motivo / Sustentación Administrativa:</label>
              <textarea
                rows={3}
                value={suspendReason}
                onChange={e => setSuspendReason(e.target.value)}
                placeholder="Indique la causa legal, disciplinaria o financiera..."
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setSuspendModalStudent(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSuspend}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold text-white ${
                  suspendModalStudent.status === 'SUSPENDIDO'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirmar {suspendModalStudent.status === 'SUSPENDIDO' ? 'Reactivación' : 'Suspensión'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

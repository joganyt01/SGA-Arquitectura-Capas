import React, { useState } from 'react';
import { PeriodAndGroupService, CurriculumService, TeacherService } from '../services/businessServices';
import { CourseGroup, AcademicPeriod, ScheduleSlot, DayOfWeek } from '../domain/types';
import {
  Calendar,
  Layers,
  Plus,
  Users,
  MapPin,
  Clock,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  X,
  Edit2
} from 'lucide-react';
import { CourseGroupRepository } from '../persistence/repositories';

export const GroupOfferingManagement: React.FC = () => {
  const periods = PeriodAndGroupService.getPeriods();
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(
    PeriodAndGroupService.getActivePeriod()?.id || periods[0]?.id || ''
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activePeriod = periods.find(p => p.id === selectedPeriodId);
  const groups = PeriodAndGroupService.getGroups(selectedPeriodId);
  const classrooms = PeriodAndGroupService.getClassrooms();
  const teachers = TeacherService.getAll();
  const courses = CurriculumService.getCourses();

  const [formData, setFormData] = useState({
    courseId: courses[0]?.id || '',
    groupCode: 'G1',
    teacherId: teachers[0]?.id || '',
    classroomId: classrooms[0]?.id || '',
    maxCapacity: 30,
    day1: 'LUNES' as DayOfWeek,
    start1: '07:00',
    end1: '09:00',
    day2: 'MIERCOLES' as DayOfWeek,
    start2: '07:00',
    end2: '09:00'
  });

  const handleToggleEnrollment = () => {
    if (!activePeriod) return;
    activePeriod.isEnrollmentOpen = !activePeriod.isEnrollmentOpen;
    CourseGroupRepository.savePeriod(activePeriod);
  };

  const handleToggleGrading = () => {
    if (!activePeriod) return;
    activePeriod.isGradingOpen = !activePeriod.isGradingOpen;
    CourseGroupRepository.savePeriod(activePeriod);
  };

  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    const schedule: ScheduleSlot[] = [
      { day: formData.day1, startTime: formData.start1, endTime: formData.end1 },
      { day: formData.day2, startTime: formData.start2, endTime: formData.end2 }
    ];

    PeriodAndGroupService.saveGroup({
      courseId: formData.courseId,
      periodId: selectedPeriodId,
      groupCode: formData.groupCode,
      teacherId: formData.teacherId,
      classroomId: formData.classroomId,
      maxCapacity: formData.maxCapacity,
      enrolledCount: 0,
      schedule
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Configuración de Periodos y Oferta de Grupos (RF-06)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Programación de horarios, capacidad física de aulas, cupos máximos y ventanas de matrícula.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer self-start md:self-auto hover:scale-102"
        >
          <Plus className="w-4 h-4" />
          Ofertar Nuevo Grupo
        </button>
      </div>

      {/* Period Controls Card */}
      {activePeriod && (
        <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-blue-400">{activePeriod.code}</span>
              <h3 className="font-bold text-sm text-white">{activePeriod.name}</h3>
              {activePeriod.isCurrent && (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Periodo Activo Oficial
                </span>
              )}
            </div>
            <p className="text-slate-300 text-[11px]">
              Vigencia del Calendario: {activePeriod.startDate} hasta {activePeriod.endDate}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={handleToggleEnrollment}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                activePeriod.isEnrollmentOpen
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              Ventana Matrícula: {activePeriod.isEnrollmentOpen ? 'ABIERTA' : 'CERRADA'}
            </button>

            <button
              onClick={handleToggleGrading}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                activePeriod.isGradingOpen
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              Registro de Notas: {activePeriod.isGradingOpen ? 'HABILITADO' : 'BLOQUEADO'}
            </button>
          </div>
        </div>
      )}

      {/* Group Offering List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <h3 className="font-bold text-slate-900">Grupos Académicos Ofertados ({groups.length})</h3>
          <span className="text-slate-500">Capacidad Total Ofertada: {groups.reduce((a, g) => a + g.maxCapacity, 0)} cupos</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
              <tr>
                <th className="p-3">Código</th>
                <th className="p-3">Asignatura</th>
                <th className="p-3">Grupo</th>
                <th className="p-3">Docente Asignado</th>
                <th className="p-3">Aula / Laboratorio</th>
                <th className="p-3">Horario</th>
                <th className="p-3 text-center">Cupos (Ocupados/Máx)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {groups.map(grp => {
                const course = courses.find(c => c.id === grp.courseId);
                const teacher = teachers.find(t => t.id === grp.teacherId);
                const classroom = classrooms.find(c => c.id === grp.classroomId);
                const isFull = grp.enrolledCount >= grp.maxCapacity;

                return (
                  <tr key={grp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-blue-700">{course?.code}</td>
                    <td className="p-3 font-semibold text-slate-900">{course?.name}</td>
                    <td className="p-3">
                      <span className="bg-slate-100 font-mono text-[11px] font-bold px-2 py-0.5 rounded text-slate-800">
                        {grp.groupCode}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700">{teacher?.fullName || 'Pendiente'}</td>
                    <td className="p-3">
                      <span className="text-slate-800 font-medium">{classroom?.code}</span>
                      <span className="text-[10px] text-slate-400 block">{classroom?.type}</span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-600">
                      {grp.schedule.map((s, idx) => (
                        <div key={idx}>
                          {s.day}: {s.startTime} - {s.endTime}
                        </div>
                      ))}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`font-bold font-mono ${isFull ? 'text-red-600' : 'text-slate-800'}`}>
                          {grp.enrolledCount} / {grp.maxCapacity}
                        </span>
                        <div className="w-20 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isFull ? 'bg-red-500' : grp.enrolledCount > grp.maxCapacity * 0.8 ? 'bg-amber-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${Math.min((grp.enrolledCount / grp.maxCapacity) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE GROUP MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Ofertar Nuevo Grupo Académico</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGroup} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Asignatura del Plan *</label>
                <select
                  value={formData.courseId}
                  onChange={e => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Código de Grupo *</label>
                  <input
                    type="text"
                    required
                    value={formData.groupCode}
                    onChange={e => setFormData({ ...formData, groupCode: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono"
                    placeholder="SIS-401-G3"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cupo Máximo (Aforo)</label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={formData.maxCapacity}
                    onChange={e => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) || 30 })}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Docente Asignado</label>
                  <select
                    value={formData.teacherId}
                    onChange={e => setFormData({ ...formData, teacherId: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.fullName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Aula / Laboratorio</label>
                  <select
                    value={formData.classroomId}
                    onChange={e => setFormData({ ...formData, classroomId: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                  >
                    {classrooms.map(c => (
                      <option key={c.id} value={c.id}>{c.code} ({c.type})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Schedule Slots */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-700 block text-[11px]">Franja Horaria 1:</span>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={formData.day1}
                    onChange={e => setFormData({ ...formData, day1: e.target.value as any })}
                    className="p-2 rounded border border-slate-300 bg-white"
                  >
                    <option value="LUNES">Lunes</option>
                    <option value="MARTES">Martes</option>
                    <option value="MIERCOLES">Miércoles</option>
                    <option value="JUEVES">Jueves</option>
                    <option value="VIERNES">Viernes</option>
                    <option value="SABADO">Sábado</option>
                  </select>
                  <input
                    type="time"
                    value={formData.start1}
                    onChange={e => setFormData({ ...formData, start1: e.target.value })}
                    className="p-2 rounded border border-slate-300 font-mono"
                  />
                  <input
                    type="time"
                    value={formData.end1}
                    onChange={e => setFormData({ ...formData, end1: e.target.value })}
                    className="p-2 rounded border border-slate-300 font-mono"
                  />
                </div>

                <span className="font-bold text-slate-700 block text-[11px] pt-1">Franja Horaria 2:</span>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={formData.day2}
                    onChange={e => setFormData({ ...formData, day2: e.target.value as any })}
                    className="p-2 rounded border border-slate-300 bg-white"
                  >
                    <option value="LUNES">Lunes</option>
                    <option value="MARTES">Martes</option>
                    <option value="MIERCOLES">Miércoles</option>
                    <option value="JUEVES">Jueves</option>
                    <option value="VIERNES">Viernes</option>
                    <option value="SABADO">Sábado</option>
                  </select>
                  <input
                    type="time"
                    value={formData.start2}
                    onChange={e => setFormData({ ...formData, start2: e.target.value })}
                    className="p-2 rounded border border-slate-300 font-mono"
                  />
                  <input
                    type="time"
                    value={formData.end2}
                    onChange={e => setFormData({ ...formData, end2: e.target.value })}
                    className="p-2 rounded border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700"
                >
                  Ofertar Grupo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

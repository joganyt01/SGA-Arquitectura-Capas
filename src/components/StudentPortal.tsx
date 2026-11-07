import React, { useState } from 'react';
import { StudentAcademicRecordService, ReportService } from '../services/businessServices';
import {
  GraduationCap,
  Calendar,
  FileText,
  Award,
  CheckCircle,
  Clock,
  Lock,
  Download,
  BookOpen,
  MapPin,
  UserCheck
} from 'lucide-react';
import { Course } from '../domain/types';

interface Props {
  studentId: string;
}

export const StudentPortal: React.FC<Props> = ({ studentId }) => {
  const [activeSubTab, setActiveSubTab] = useState<'curriculum' | 'schedule' | 'grades'>('curriculum');
  const record = StudentAcademicRecordService.getStudentFullHistory(studentId);
  const scheduleItems = StudentAcademicRecordService.getStudentSchedule(studentId);

  if (!record) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-500 text-sm">No se encontró el registro del estudiante seleccionado.</p>
      </div>
    );
  }

  // Group courses by semester level (Sem 1 to Sem 5)
  const semesters = [1, 2, 3, 4, 5];

  const handleDownloadPDF = () => {
    ReportService.exportTranscriptToPDF(studentId);
  };

  return (
    <div className="space-y-6">
      {/* Student Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-6 rounded-2xl shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 font-bold text-2xl shadow-inner">
              {record.student.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">{record.student.fullName}</h2>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  record.student.status === 'ACTIVO'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-red-500/20 text-red-300 border-red-500/30'
                }`}>
                  {record.student.status}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>Doc: <strong className="text-white">{record.student.documentNumber}</strong></span>
                <span>Programa: <strong className="text-white">{record.program?.name}</strong></span>
                <span>Semestre: <strong className="text-white">{record.student.currentSemester}°</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer hover:scale-102"
            >
              <Download className="w-4 h-4" />
              Descargar Certificado PDF
            </button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Promedio Acumulado (GPA)</span>
            <span className="text-xl font-bold text-emerald-400">{record.student.gpa.toFixed(2)} / 5.0</span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Créditos Aprobados</span>
            <span className="text-xl font-bold text-white">{record.approvedCredits} <span className="text-xs font-normal text-slate-400">/ {record.totalCredits}</span></span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Avance de Carrera</span>
            <span className="text-xl font-bold text-blue-400">{record.progressPercentage}%</span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Asignaturas en Curso (2026-I)</span>
            <span className="text-xl font-bold text-purple-400">
              {record.coursesProgress.filter(c => c.status === 'MATRICULADA').length} materias
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl px-4 shadow-xs">
        <button
          onClick={() => setActiveSubTab('curriculum')}
          className={`py-3.5 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 transition-all ${
            activeSubTab === 'curriculum'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Malla Curricular Interactiva (RF-05, RF-09)
        </button>
        <button
          onClick={() => setActiveSubTab('schedule')}
          className={`py-3.5 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 transition-all ${
            activeSubTab === 'schedule'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Horario Semanal (RF-09)
        </button>
        <button
          onClick={() => setActiveSubTab('grades')}
          className={`py-3.5 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 transition-all ${
            activeSubTab === 'grades'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4" />
          Boletín e Historial de Calificaciones
        </button>
      </div>

      {/* SUBTAB 1: CURRICULUM GRID */}
      {activeSubTab === 'curriculum' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-slate-800">Leyenda de Estados Curriculares:</span>
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Aprobada
              </span>
              <span className="flex items-center gap-1.5 text-blue-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Matriculada Actual
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Pendiente Habilitada
              </span>
              <span className="flex items-center gap-1.5 text-amber-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Bloqueada (Faltan Prerrequisitos)
              </span>
            </div>
          </div>

          {/* Semesters Columns */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {semesters.map(sem => {
              const semCourses = record.coursesProgress.filter(c => c.course.semesterLevel === sem);
              return (
                <div key={sem} className="bg-slate-100/70 p-3 rounded-2xl border border-slate-200/80 flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs font-bold text-slate-800">
                    <span>Semestre {sem}</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {semCourses.reduce((acc, c) => acc + c.course.credits, 0)} créditos
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {semCourses.map(item => {
                      const { course, status, gradeDef } = item;
                      return (
                        <div
                          key={course.id}
                          className={`p-3 rounded-xl border transition-all text-xs bg-white shadow-xs ${
                            status === 'APROBADA'
                              ? 'border-emerald-300 ring-1 ring-emerald-400/20'
                              : status === 'MATRICULADA'
                              ? 'border-blue-400 ring-2 ring-blue-500/20'
                              : status === 'BLOQUEADA'
                              ? 'border-amber-200 bg-amber-50/30 opacity-75'
                              : 'border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-[10px] font-bold text-slate-500">{course.code}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                              {course.credits} cr.
                            </span>
                          </div>

                          <h4 className="font-bold text-slate-900 leading-snug mb-2 line-clamp-2">
                            {course.name}
                          </h4>

                          {/* Status Badge */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                            {status === 'APROBADA' && (
                              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                {gradeDef ? `Nota: ${gradeDef.toFixed(1)}` : 'Aprobada'}
                              </span>
                            )}
                            {status === 'MATRICULADA' && (
                              <span className="flex items-center gap-1 text-blue-700 font-bold">
                                <Clock className="w-3 h-3 text-blue-600" />
                                En Curso 2026-I
                              </span>
                            )}
                            {status === 'PENDIENTE' && (
                              <span className="text-slate-500">Disponible</span>
                            )}
                            {status === 'BLOQUEADA' && (
                              <span className="flex items-center gap-1 text-amber-700 font-semibold">
                                <Lock className="w-3 h-3 text-amber-600" />
                                Prerrequisito req.
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 2: WEEKLY SCHEDULE */}
      {activeSubTab === 'schedule' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Horario Académico Semanal - Periodo 2026-I
            </h3>
            <span className="text-xs text-slate-500">
              {scheduleItems.length} asignaturas matriculadas
            </span>
          </div>

          {scheduleItems.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              El estudiante no tiene asignaturas matriculadas para el periodo actual. Diríjase al módulo de Matrícula Académica.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scheduleItems.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-700">{item.course?.code}</span>
                    <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                      {item.group?.groupCode}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{item.course?.name}</h4>
                  
                  <div className="text-xs text-slate-600 space-y-1 pt-1">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.teacher?.fullName || 'Docente asignado'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.classroom?.code} ({item.classroom?.building})</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80">
                    <span className="text-[11px] font-bold text-slate-700 block mb-1">Franjas de Clase:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.schedule.map((slot, sIdx) => (
                        <span key={sIdx} className="bg-white border border-slate-300 text-slate-800 text-[10px] font-mono px-2 py-0.5 rounded-md">
                          {slot.day}: {slot.startTime} - {slot.endTime}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: GRADES SHEET */}
      {activeSubTab === 'grades' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Boletín Oficial de Calificaciones</h3>
              <p className="text-xs text-slate-500">Historial completo y ponderaciones acumuladas</p>
            </div>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar Boletín PDF
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                <tr>
                  <th className="p-3">Código</th>
                  <th className="p-3">Asignatura</th>
                  <th className="p-3 text-center">Nivel</th>
                  <th className="p-3 text-center">Créditos</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-center">Definitiva</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {record.coursesProgress.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="p-3 font-mono font-bold text-slate-600">{item.course.code}</td>
                    <td className="p-3 font-semibold text-slate-900">{item.course.name}</td>
                    <td className="p-3 text-center text-slate-500">Sem {item.course.semesterLevel}</td>
                    <td className="p-3 text-center">{item.course.credits}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'APROBADA'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'MATRICULADA'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-900">
                      {item.gradeDef !== null ? item.gradeDef.toFixed(1) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

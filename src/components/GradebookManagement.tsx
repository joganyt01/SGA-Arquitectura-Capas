import React, { useState } from 'react';
import {
  GradeService,
  ReportService,
  AuthService,
  PeriodAndGroupService
} from '../services/businessServices';
import {
  CourseGroupRepository,
  EnrollmentRepository,
  StudentRepository,
  GradeRepository,
  CurriculumRepository,
  TeacherRepository
} from '../persistence/repositories';
import {
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  AlertCircle,
  Download,
  Edit3,
  Check,
  X,
  ShieldCheck,
  Award
} from 'lucide-react';
import { Grade, GradeChangeRequest } from '../domain/types';

export const GradebookManagement: React.FC = () => {
  const currentUser = AuthService.getCurrentUser();
  const isCoordinator = currentUser.role === 'COORDINATOR' || currentUser.role === 'ADMIN';

  const teacher = TeacherRepository.findByUserId(currentUser.id);
  const teacherId = teacher?.id || 'tch-1'; // Default to Carlos Mendoza if testing with other roles

  const allGroups = CourseGroupRepository.findAllGroups();
  const availableGroups = isCoordinator
    ? allGroups
    : allGroups.filter(g => g.teacherId === teacherId);

  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    availableGroups[0]?.id || ''
  );

  const [activeSubTab, setActiveSubTab] = useState<'grades' | 'requests'>('grades');
  const [editingGradeId, setEditingGradeId] = useState<string | null>(null);
  const [tempGrades, setTempGrades] = useState<{ p1: string; p2: string; ef: string }>({ p1: '', p2: '', ef: '' });
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modal for requesting grade change
  const [requestModalGrade, setRequestModalGrade] = useState<{
    grade: Grade;
    studentName: string;
    courseGroupId: string;
  } | null>(null);
  const [requestComponent, setRequestComponent] = useState<'parcial1' | 'parcial2' | 'examenFinal'>('parcial1');
  const [proposedValue, setProposedValue] = useState<string>('4.5');
  const [justification, setJustification] = useState<string>('');

  // Coordinator rejection notes
  const [rejectModalReqId, setRejectModalReqId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState<string>('');

  const currentGroup = CourseGroupRepository.findById(selectedGroupId);
  const currentCourse = currentGroup ? CurriculumRepository.findCourseById(currentGroup.courseId) : undefined;
  const enrollments = selectedGroupId ? EnrollmentRepository.findByGroup(selectedGroupId) : [];
  const groupGrades = selectedGroupId ? GradeRepository.findByCourseGroupId(selectedGroupId) : [];

  const pendingRequests = GradeRepository.findAllChangeRequests().filter(r =>
    isCoordinator ? r.status === 'PENDIENTE' : r.teacherId === teacherId
  );

  const handleStartEdit = (g: Grade) => {
    setEditingGradeId(g.id);
    setTempGrades({
      p1: g.parcial1 !== null ? String(g.parcial1) : '',
      p2: g.parcial2 !== null ? String(g.parcial2) : '',
      ef: g.examenFinal !== null ? String(g.examenFinal) : ''
    });
  };

  const handleSaveGrade = (gradeId: string) => {
    const parse = (val: string) => (val.trim() === '' ? null : parseFloat(val));
    const p1 = parse(tempGrades.p1);
    const p2 = parse(tempGrades.p2);
    const ef = parse(tempGrades.ef);

    const res = GradeService.updateGrades(gradeId, {
      parcial1: p1,
      parcial2: p2,
      examenFinal: ef
    });

    if (res.success) {
      setEditingGradeId(null);
      setFeedback('Calificación guardada y recalculada con éxito.');
      setTimeout(() => setFeedback(null), 3000);
    } else {
      alert(res.error);
    }
  };

  const handleExportExcel = () => {
    if (selectedGroupId) {
      ReportService.exportGradesToExcel(selectedGroupId);
    }
  };

  const handleSendGradeChangeRequest = () => {
    if (!requestModalGrade || !justification.trim()) {
      alert('Por favor ingrese la justificación académica de la rectificación.');
      return;
    }

    const val = parseFloat(proposedValue);
    if (isNaN(val) || val < 0.0 || val > 5.0) {
      alert('La calificación propuesta debe estar entre 0.0 y 5.0.');
      return;
    }

    const res = GradeService.requestGradeChange({
      gradeId: requestModalGrade.grade.id,
      teacherId: isCoordinator ? 'tch-1' : teacherId,
      studentId: requestModalGrade.grade.studentId,
      courseGroupId: requestModalGrade.courseGroupId,
      component: requestComponent,
      proposedValue: val,
      justification
    });

    if (res.success) {
      setRequestModalGrade(null);
      setJustification('');
      setFeedback('Solicitud de cambio de nota remitida a Coordinación Académica.');
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleResolveRequest = (reqId: string, approved: boolean, notes: string) => {
    GradeService.resolveGradeChangeRequest(reqId, approved, notes);
    setRejectModalReqId(null);
    setRejectNotes('');
    setFeedback(`Solicitud de cambio de nota ${approved ? 'APROBADA' : 'RECHAZADA'} formalmente.`);
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            Gestión y Registro de Calificaciones (RF-08)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Ponderación reglamentaria: Parcial 1 (30%) + Parcial 2 (30%) + Examen Final (40%) = Definitiva (100%)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Exportar Planilla Excel (.xlsx)
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          {feedback}
        </div>
      )}

      {/* Group Selector & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Grupo Académico:</label>
          <select
            value={selectedGroupId}
            onChange={e => setSelectedGroupId(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {availableGroups.map(g => {
              const c = CurriculumRepository.findCourseById(g.courseId);
              return (
                <option key={g.id} value={g.id}>
                  {c?.code} - {c?.name} ({g.groupCode})
                </option>
              );
            })}
          </select>
        </div>

        <div className="flex items-center gap-2 border-t sm:border-t-0 pt-2 sm:pt-0">
          <button
            onClick={() => setActiveSubTab('grades')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeSubTab === 'grades' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Planilla de Notas ({enrollments.length} alumnos)
          </button>
          <button
            onClick={() => setActiveSubTab('requests')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeSubTab === 'requests' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Solicitudes de Rectificación
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* SUBTAB 1: GRADES ROSTER */}
      {activeSubTab === 'grades' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-800">
              {currentCourse?.code} - {currentCourse?.name} ({currentGroup?.groupCode})
            </span>
            <span className="text-slate-500">
              Escala de Calificación Oficial: 0.0 a 5.0 (Mínimo aprobatorio: 3.0)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                <tr>
                  <th className="p-3">No.</th>
                  <th className="p-3">Documento</th>
                  <th className="p-3">Estudiante</th>
                  <th className="p-3 text-center">Parcial 1 (30%)</th>
                  <th className="p-3 text-center">Parcial 2 (30%)</th>
                  <th className="p-3 text-center">Examen Final (40%)</th>
                  <th className="p-3 text-center font-bold text-slate-900">Definitiva</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {enrollments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No hay estudiantes inscritos en este grupo actualmente.
                    </td>
                  </tr>
                ) : (
                  enrollments.map((enr, idx) => {
                    const student = StudentRepository.findById(enr.studentId);
                    const grade = groupGrades.find(g => g.enrollmentId === enr.id);
                    const isEditing = editingGradeId === grade?.id;

                    const p1 = grade?.parcial1 ?? null;
                    const p2 = grade?.parcial2 ?? null;
                    const ef = grade?.examenFinal ?? null;
                    const def = grade?.definitiva ?? null;

                    const isApproved = def !== null && def >= 3.0;

                    return (
                      <tr key={enr.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-3 font-mono font-medium text-slate-600">{student?.documentNumber}</td>
                        <td className="p-3 font-semibold text-slate-900">{student?.fullName}</td>

                        {/* Parcial 1 */}
                        <td className="p-3 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="5"
                              value={tempGrades.p1}
                              onChange={e => setTempGrades({ ...tempGrades, p1: e.target.value })}
                              className="w-16 p-1 text-center border border-blue-400 rounded focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                            />
                          ) : (
                            <span className="font-mono">{p1 !== null ? p1.toFixed(1) : '-'}</span>
                          )}
                        </td>

                        {/* Parcial 2 */}
                        <td className="p-3 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="5"
                              value={tempGrades.p2}
                              onChange={e => setTempGrades({ ...tempGrades, p2: e.target.value })}
                              className="w-16 p-1 text-center border border-blue-400 rounded focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                            />
                          ) : (
                            <span className="font-mono">{p2 !== null ? p2.toFixed(1) : '-'}</span>
                          )}
                        </td>

                        {/* Examen Final */}
                        <td className="p-3 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="5"
                              value={tempGrades.ef}
                              onChange={e => setTempGrades({ ...tempGrades, ef: e.target.value })}
                              className="w-16 p-1 text-center border border-blue-400 rounded focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                            />
                          ) : (
                            <span className="font-mono">{ef !== null ? ef.toFixed(1) : '-'}</span>
                          )}
                        </td>

                        {/* Definitiva */}
                        <td className="p-3 text-center font-bold text-sm font-mono">
                          {def !== null ? (
                            <span className={def >= 3.0 ? 'text-emerald-600' : 'text-red-600'}>
                              {def.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Estado */}
                        <td className="p-3 text-center">
                          {def !== null ? (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {isApproved ? 'APROBADO' : 'REPROBADO'}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">EN CURSO</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleSaveGrade(grade!.id)}
                                  className="p-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                                  title="Guardar calificación"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingGradeId(null)}
                                  className="p-1.5 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors"
                                  title="Cancelar edición"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                {grade && (
                                  <>
                                    <button
                                      onClick={() => handleStartEdit(grade)}
                                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                      title="Editar notas"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        setRequestModalGrade({
                                          grade,
                                          studentName: student?.fullName || 'Estudiante',
                                          courseGroupId: selectedGroupId
                                        })
                                      }
                                      className="px-2 py-1 text-[10px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md border border-purple-200 transition-colors"
                                      title="Solicitar rectificación formal"
                                    >
                                      Rectificación
                                    </button>
                                  </>
                                )}
                              </>
                            )}
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
      )}

      {/* SUBTAB 2: GRADE CHANGE REQUESTS (COORDINATOR APPROVAL / TEACHER TRACKING) */}
      {activeSubTab === 'requests' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                Flujo de Solicitudes de Rectificación de Calificaciones (RF-08)
              </h3>
              <p className="text-xs text-slate-500">
                Las solicitudes son radicadas por los docentes con justificación y deben ser aprobadas por la Coordinación Académica.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {pendingRequests.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
                No hay solicitudes de rectificación pendientes en este momento.
              </div>
            ) : (
              pendingRequests.map(req => {
                const student = StudentRepository.findById(req.studentId);
                const teacher = TeacherRepository.findById(req.teacherId);
                const group = CourseGroupRepository.findById(req.courseGroupId);
                const course = group ? CurriculumRepository.findCourseById(group.courseId) : undefined;

                return (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{student?.fullName}</span>
                        <span className="text-slate-500 font-mono">({student?.documentNumber})</span>
                        <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {req.component.toUpperCase()}
                        </span>
                        <span className="font-mono text-[11px] bg-slate-200 px-2 py-0.5 rounded">
                          Actual: {req.currentValue} → Propuesta: <strong>{req.proposedValue}</strong>
                        </span>
                      </div>

                      <p className="text-slate-600 text-xs italic bg-white p-2.5 rounded-lg border border-slate-200">
                        "{req.justification}"
                      </p>

                      <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-4">
                        <span>Asignatura: {course?.name} ({group?.groupCode})</span>
                        <span>Docente: {teacher?.fullName}</span>
                        <span>Fecha: {new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {isCoordinator && req.status === 'PENDIENTE' && (
                      <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                        <button
                          onClick={() => handleResolveRequest(req.id, true, 'Aprobado conforme a sustentación.')}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Aprobar
                        </button>
                        <button
                          onClick={() => {
                            setRejectModalReqId(req.id);
                            setRejectNotes('');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL: REQUEST GRADE CHANGE */}
      {requestModalGrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Radicar Solicitud de Rectificación de Calificación
              </h3>
              <button
                onClick={() => setRequestModalGrade(null)}
                className="text-slate-400 hover:text-slate-700 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3">
              <div>
                <span className="text-slate-500 block text-[11px]">Estudiante:</span>
                <strong className="text-slate-900 text-sm">{requestModalGrade.studentName}</strong>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Componente a Rectificar:</label>
                  <select
                    value={requestComponent}
                    onChange={e => setRequestComponent(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option value="parcial1">Parcial 1 (30%)</option>
                    <option value="parcial2">Parcial 2 (30%)</option>
                    <option value="examenFinal">Examen Final (40%)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Nueva Calificación Propuesta:</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={proposedValue}
                    onChange={e => setProposedValue(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Justificación Académica Obligatoria:
                </label>
                <textarea
                  rows={3}
                  value={justification}
                  onChange={e => setJustification(e.target.value)}
                  placeholder="Explique el motivo del error material, sustentación supletoria o revisión de examen..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRequestModalGrade(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendGradeChangeRequest}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700"
              >
                Enviar Solicitud
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REJECT REQUEST */}
      {rejectModalReqId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-md space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Motivo del Rechazo de Rectificación</h3>
            <textarea
              rows={3}
              value={rejectNotes}
              onChange={e => setRejectNotes(e.target.value)}
              placeholder="Indique la razón institucional por la cual no procede el cambio..."
              className="w-full p-2.5 rounded-lg border border-slate-300 text-xs"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRejectModalReqId(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleResolveRequest(rejectModalReqId, false, rejectNotes || 'Rechazado por Coordinación.')}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

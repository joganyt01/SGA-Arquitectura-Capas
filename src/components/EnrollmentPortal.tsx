import React, { useState } from 'react';
import {
  EnrollmentService,
  PeriodAndGroupService,
  CurriculumService,
  StudentService,
  AuthService
} from '../services/businessServices';
import {
  CourseGroupRepository,
  EnrollmentRepository,
  StudentRepository,
  CurriculumRepository
} from '../persistence/repositories';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  ShieldAlert,
  ArrowRight,
  BookOpen,
  Trash2,
  Zap,
  Info
} from 'lucide-react';
import { ValidationResult } from '../domain/types';

interface Props {
  studentId: string;
  onEnrollmentSuccess?: () => void;
}

export const EnrollmentPortal: React.FC<Props> = ({ studentId, onEnrollmentSuccess }) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; details?: any } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const student = StudentRepository.findById(studentId);
  const activePeriod = PeriodAndGroupService.getActivePeriod();
  const availableGroups = CourseGroupRepository.findAllGroups().filter(
    g => g.periodId === activePeriod?.id
  );
  const currentEnrollments = activePeriod
    ? EnrollmentRepository.findByStudentAndPeriod(studentId, activePeriod.id)
    : [];

  // Calculate enrolled credits
  const totalEnrolledCredits = currentEnrollments.reduce((sum, enr) => {
    const grp = CourseGroupRepository.findById(enr.courseGroupId);
    if (!grp) return sum;
    const crs = CurriculumRepository.findCourseById(grp.courseId);
    return sum + (crs?.credits || 0);
  }, 0);

  const handleEnroll = () => {
    if (!selectedGroupId) return;
    setIsProcessing(true);
    setFeedback(null);

    setTimeout(() => {
      const result: ValidationResult = EnrollmentService.enrollStudentTransactional(studentId, selectedGroupId);
      setIsProcessing(false);

      if (result.isValid) {
        setFeedback({
          type: 'success',
          message: '¡Matrícula aprobada exitosamente! Se confirmó la disponibilidad de cupos, cumplimiento de prerrequisitos y no existencia de cruces de horario bajo aislamiento transaccional.'
        });
        setSelectedGroupId('');
        if (onEnrollmentSuccess) onEnrollmentSuccess();
      } else {
        setFeedback({
          type: 'error',
          message: result.error || 'No fue posible registrar la matrícula.',
          details: result.details
        });
      }
    }, 400);
  };

  const handleCancelEnrollment = (enrollmentId: string) => {
    if (confirm('¿Está seguro de cancelar esta asignatura matriculada? El cupo será liberado inmediatamente.')) {
      EnrollmentService.cancelEnrollment(enrollmentId);
      setFeedback({
        type: 'success',
        message: 'Asignatura cancelada correctamente. Se liberó el cupo en el grupo.'
      });
      if (onEnrollmentSuccess) onEnrollmentSuccess();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-lg font-bold text-slate-900">
                Portal de Matrícula Académica Transaccional (RF-07)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Periodo: <strong className="text-slate-800">{activePeriod?.name}</strong> • Estado Estudiante:{' '}
              <span className={`font-bold ${student?.status === 'ACTIVO' ? 'text-emerald-600' : 'text-red-600'}`}>
                {student?.status}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Créditos Matriculados</span>
              <span className="font-bold text-slate-900 text-sm">{totalEnrolledCredits} / 20 máx.</span>
            </div>
            <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all"
                style={{ width: `${Math.min((totalEnrolledCredits / 20) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {student?.status === 'SUSPENDIDO' && (
          <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-xs text-red-800">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <strong className="block font-bold">Bloqueo por Suspensión Académica:</strong>
              El estudiante se encuentra en estado SUSPENDIDO. Todas las transacciones de matrícula son rechazadas automáticamente por las reglas de la Capa de Dominio.
            </div>
          </div>
        )}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-xs animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <p className="font-semibold text-sm">
              {feedback.type === 'success' ? 'Transacción Aprobada (COMMIT)' : 'Fallo de Validación Transaccional (ROLLBACK)'}
            </p>
            <p className="leading-relaxed">{feedback.message}</p>
            {feedback.details && (
              <pre className="mt-2 p-2 bg-white/70 rounded border border-red-200 text-[11px] font-mono overflow-x-auto">
                {JSON.stringify(feedback.details, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* Current Enrollments */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-600" />
          Asignaturas Inscritas en este Periodo ({currentEnrollments.length})
        </h3>

        {currentEnrollments.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
            No tienes asignaturas inscritas para el periodo {activePeriod?.code}. Selecciona un grupo de la oferta académica inferior para inscribirte.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {currentEnrollments.map(enr => {
              const group = CourseGroupRepository.findById(enr.courseGroupId);
              const course = group ? CurriculumRepository.findCourseById(group.courseId) : undefined;
              const classroom = group ? CourseGroupRepository.findClassroomById(group.classroomId) : undefined;

              return (
                <div key={enr.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700">{course?.code}</span>
                      <span className="font-bold text-slate-900 text-xs">{course?.name}</span>
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {group?.groupCode}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap gap-x-4">
                      <span>Créditos: <strong>{course?.credits}</strong></span>
                      <span>Aula: <strong>{classroom?.code}</strong></span>
                      <span>Horario: {group?.schedule.map(s => `${s.day} ${s.startTime}-${s.endTime}`).join(' | ')}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCancelEnrollment(enr.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition-colors self-start md:self-auto cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Cancelar Asignatura
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Course Group Offering Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Oferta Académica Disponible para Inscripción</h3>
          <p className="text-xs text-slate-500">
            Haga clic en un grupo para seleccionarlo y someterlo al pipeline de validación transaccional (Cupos, Prerrequisitos y Choques de Horario).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableGroups.map(grp => {
            const course = CurriculumRepository.findCourseById(grp.courseId);
            const classroom = CourseGroupRepository.findClassroomById(grp.classroomId);
            const isFull = grp.enrolledCount >= grp.maxCapacity;
            const isSelected = selectedGroupId === grp.id;
            const spotsLeft = grp.maxCapacity - grp.enrolledCount;

            const isAlreadyEnrolled = currentEnrollments.some(e => e.courseGroupId === grp.id);

            return (
              <div
                key={grp.id}
                onClick={() => !isAlreadyEnrolled && setSelectedGroupId(grp.id)}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                  isAlreadyEnrolled
                    ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                    : isSelected
                    ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="font-mono text-[11px] font-bold text-slate-500">{course?.code}</span>
                    <h4 className="font-bold text-slate-900 text-xs mt-0.5">{course?.name}</h4>
                  </div>
                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-700">
                    {grp.groupCode}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1 mb-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span>Nivel: Sem {course?.semesterLevel} • {course?.credits} créditos</span>
                    <span>{classroom?.code}</span>
                  </div>

                  <div className="pt-1 font-mono text-[11px] text-slate-700">
                    {grp.schedule.map((s, i) => (
                      <span key={i} className="inline-block mr-2 bg-slate-100 px-1.5 py-0.5 rounded">
                        {s.day} {s.startTime}-{s.endTime}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Cupos Bar */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span className={`font-semibold ${isFull ? 'text-red-600' : 'text-slate-700'}`}>
                      {grp.enrolledCount} / {grp.maxCapacity} cupos
                    </span>
                  </div>

                  <div>
                    {isAlreadyEnrolled ? (
                      <span className="text-emerald-700 font-bold text-[11px]">Ya Inscrito</span>
                    ) : isFull ? (
                      <span className="text-red-600 font-bold text-[11px] bg-red-50 px-2 py-0.5 rounded">
                        0 Cupos Libres
                      </span>
                    ) : (
                      <span className="text-blue-700 font-medium text-[11px]">
                        {spotsLeft} disponible{spotsLeft > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button Bar */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {selectedGroupId ? (
              <span>Grupo seleccionado listo para procesar</span>
            ) : (
              <span>Haga clic en un grupo de arriba para continuar</span>
            )}
          </div>

          <button
            onClick={handleEnroll}
            disabled={!selectedGroupId || isProcessing || student?.status === 'SUSPENDIDO'}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>Procesando Transacción...</>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Confirmar Matrícula (Ejecutar Transacción ACID)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

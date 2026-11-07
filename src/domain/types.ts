/**
 * Domain Models for Higher Education Academic Management System (SGA)
 * Designed under strict Layered Architecture principles.
 */

export type Role = 'ADMIN' | 'COORDINATOR' | 'TEACHER' | 'STUDENT';

export type StudentStatus = 'ACTIVO' | 'SUSPENDIDO' | 'GRADUADO' | 'RETIRADO';

export type DayOfWeek = 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO';

export interface ScheduleSlot {
  day: DayOfWeek;
  startTime: string; // "07:00"
  endTime: string;   // "09:00"
}

export interface User {
  id: string;
  documentNumber: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  isActive: boolean;
  avatarUrl?: string;
  phone?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface Student {
  id: string;
  userId: string;
  documentNumber: string;
  fullName: string;
  email: string;
  phone: string;
  programId: string;
  currentSemester: number;
  status: StudentStatus;
  admissionDate: string;
  gpa: number; // Promedio acumulado (0.0 - 5.0)
  creditsApproved: number;
}

export interface Teacher {
  id: string;
  userId: string;
  documentNumber: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  academicDegree: string; // 'Magíster', 'Doctor (Ph.D.)', 'Especialista'
  contractType: 'TIEMPO_COMPLETO' | 'MEDIO_TIEMPO' | 'CATEDRA';
  isActive: boolean;
}

export interface AcademicProgram {
  id: string;
  code: string;
  name: string;
  faculty: string;
  totalCredits: number;
  totalSemesters: number;
  degreeTitle: string;
  sniesCode: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  programId: string;
  semesterLevel: number;
  credits: number;
  hoursWeekly: number;
  isMandatory: boolean;
  description: string;
  prerequisiteCourseIds: string[]; // IDs of required courses
}

export interface AcademicPeriod {
  id: string;
  code: string; // e.g. "2026-1"
  name: string;
  startDate: string;
  endDate: string;
  isEnrollmentOpen: boolean;
  isGradingOpen: boolean;
  isCurrent: boolean;
}

export interface Classroom {
  id: string;
  code: string;
  building: string;
  capacity: number;
  type: 'AULA_TEORICA' | 'LABORATORIO_COMPUTO' | 'AUDITORIO';
}

export interface CourseGroup {
  id: string;
  courseId: string;
  periodId: string;
  groupCode: string; // e.g. "GRP-01"
  teacherId: string;
  classroomId: string;
  maxCapacity: number;
  enrolledCount: number;
  schedule: ScheduleSlot[];
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseGroupId: string;
  periodId: string;
  enrolledAt: string;
  status: 'INSCRITO' | 'CANCELADO' | 'APROBADO' | 'REPROBADO';
}

export interface Grade {
  id: string;
  enrollmentId: string;
  studentId: string;
  courseGroupId: string;
  parcial1: number | null; // 30%
  parcial2: number | null; // 30%
  examenFinal: number | null; // 40%
  definitiva: number | null;
  state: 'EN_CURSO' | 'DEFINITIVA' | 'EN_REVISION';
  updatedAt: string;
}

export interface GradeChangeRequest {
  id: string;
  gradeId: string;
  teacherId: string;
  studentId: string;
  courseGroupId: string;
  component: 'parcial1' | 'parcial2' | 'examenFinal';
  currentValue: number;
  proposedValue: number;
  justification: string;
  status: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  reviewedBy?: string;
  reviewDate?: string;
  reviewNotes?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  userRole: Role;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'ENROLLMENT' | 'GRADE_SUBMIT' | 'BACKUP_CREATE' | 'BACKUP_RESTORE' | 'SUSPEND_STUDENT' | 'GRADE_CHANGE_APPROVAL';
  entity: string;
  entityId: string;
  details: string;
  ipAddress: string;
  hash: string;
  previousHash: string;
}

export interface LayerTrace {
  id: string;
  timestamp: string;
  feature: string;
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  controller: string;
  controllerMethod: string;
  service: string;
  serviceMethod: string;
  repository: string;
  repositoryMethod: string;
  sqlQuery: string;
  acidTransaction: boolean;
  isolationLevel?: string;
  status: 'SUCCESS' | 'VALIDATION_ERROR' | 'SYSTEM_ERROR';
  durationMs: number;
  details: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  errorCode?: 'CUPOS_AGOTADOS' | 'PRERREQUISITOS_NO_CUMPLIDOS' | 'CHOQUE_HORARIO' | 'ESTUDIANTE_SUSPENDIDO' | 'MAX_CREDITOS_EXCEDIDOS' | 'PERIODO_CERRADO' | 'NOTA_FUERA_DE_RANGO' | 'UNAUTHORIZED';
  details?: Record<string, unknown>;
}

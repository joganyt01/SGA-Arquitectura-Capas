/**
 * Capa de Aplicación / Controladores (Spring Boot @RestController Layer)
 * Handles REST endpoints, DTO transformation, HTTP status codes,
 * and passes calls to the @Service layer.
 */

import {
  AuthService,
  StudentService,
  TeacherService,
  CurriculumService,
  PeriodAndGroupService,
  EnrollmentService,
  GradeService,
  StudentAcademicRecordService,
  ReportService,
  SearchService,
  AuditAndBackupService
} from '../services/businessServices';
import { db } from '../persistence/DatabaseEngine';
import { Role, Student, Teacher } from '../domain/types';

export interface ApiResponse<T> {
  timestamp: string;
  status: number;
  message: string;
  data?: T;
  error?: string;
}

export const ApiController = {
  // ================= AUTH CONTROLLER =================
  auth: {
    login(email: string, passwordPlain: string): ApiResponse<any> {
      const res = AuthService.login(email, passwordPlain);
      db.addTrace({
        feature: 'Autenticación (RF-01)',
        httpMethod: 'POST',
        endpoint: '/api/v1/auth/login',
        controller: 'AuthController',
        controllerMethod: 'authenticateUser(@Valid @RequestBody LoginRequestDTO request)',
        service: 'AuthService',
        serviceMethod: 'login(email, password)',
        repository: 'UserRepository',
        repositoryMethod: 'findByEmail(email)',
        sqlQuery: `SELECT * FROM users WHERE LOWER(email) = LOWER('${email}') LIMIT 1;`,
        acidTransaction: false,
        status: res.success ? 'SUCCESS' : 'VALIDATION_ERROR',
        durationMs: 6,
        details: res.success ? `Token JWT emitido para ${email}` : (res.error || 'Fallo de autenticación')
      });

      return {
        timestamp: new Date().toISOString(),
        status: res.success ? 200 : 401,
        message: res.success ? 'Autenticación exitosa.' : 'Fallo de autenticación.',
        data: res.user,
        error: res.error
      };
    },

    switchRole(role: Role): ApiResponse<any> {
      const user = AuthService.switchRoleUser(role);
      return {
        timestamp: new Date().toISOString(),
        status: 200,
        message: `Sesión conmutada al rol ${role}`,
        data: user
      };
    },

    logout(): ApiResponse<null> {
      AuthService.logout();
      return {
        timestamp: new Date().toISOString(),
        status: 200,
        message: 'Sesión cerrada satisfactoriamente.'
      };
    }
  },

  // ================= STUDENT CONTROLLER (RF-03) =================
  students: {
    getAll(): ApiResponse<Student[]> {
      const list = StudentService.getAll();
      return {
        timestamp: new Date().toISOString(),
        status: 200,
        message: 'Lista de estudiantes recuperada.',
        data: list
      };
    },

    create(dto: { documentNumber: string; fullName: string; email: string; phone: string; programId: string; currentSemester: number }): ApiResponse<Student> {
      const res = StudentService.registerStudent(dto);
      db.addTrace({
        feature: 'Gestión de Estudiantes (RF-03)',
        httpMethod: 'POST',
        endpoint: '/api/v1/students',
        controller: 'StudentController',
        controllerMethod: 'createStudent(@Valid @RequestBody StudentCreateDTO dto)',
        service: 'StudentService',
        serviceMethod: 'registerStudent(data)',
        repository: 'StudentRepository, UserRepository',
        repositoryMethod: 'findByDocumentNumber(), save()',
        sqlQuery: `INSERT INTO users (id, document_number, name, email, role) VALUES (...);\nINSERT INTO students (id, user_id, document_number, full_name, program_id, status) VALUES (...);`,
        acidTransaction: true,
        isolationLevel: 'READ_COMMITTED',
        status: res.success ? 'SUCCESS' : 'VALIDATION_ERROR',
        durationMs: 8,
        details: res.success ? `Estudiante registrado: ${dto.fullName}` : res.error!
      });

      return {
        timestamp: new Date().toISOString(),
        status: res.success ? 201 : 400,
        message: res.success ? 'Estudiante creado exitosamente.' : 'Error al crear estudiante.',
        data: res.student,
        error: res.error
      };
    },

    update(id: string, updates: Partial<Student>): ApiResponse<Student> {
      const res = StudentService.updateStudent(id, updates);
      return {
        timestamp: new Date().toISOString(),
        status: res.success ? 200 : 400,
        message: res.success ? 'Estudiante actualizado.' : 'Error al actualizar estudiante.',
        data: res.student,
        error: res.error
      };
    },

    toggleSuspend(id: string, reason: string): ApiResponse<Student> {
      const res = StudentService.toggleSuspendStudent(id, reason);
      return {
        timestamp: new Date().toISOString(),
        status: res.success ? 200 : 400,
        message: res.success ? `Estado de estudiante modificado a ${res.student?.status}.` : 'Error al cambiar estado.',
        data: res.student,
        error: res.error
      };
    },

    delete(id: string): ApiResponse<null> {
      const res = StudentService.deleteStudent(id);
      return {
        timestamp: new Date().toISOString(),
        status: res.success ? 200 : 404,
        message: res.success ? 'Estudiante eliminado del sistema.' : 'Estudiante no encontrado.',
        error: res.error
      };
    }
  },

  // ================= ENROLLMENT CONTROLLER (RF-07) =================
  enrollment: {
    register(studentId: string, courseGroupId: string): ApiResponse<any> {
      const res = EnrollmentService.enrollStudentTransactional(studentId, courseGroupId);
      return {
        timestamp: new Date().toISOString(),
        status: res.isValid ? 201 : 409,
        message: res.isValid ? 'Matrícula completada exitosamente.' : 'Rechazo transaccional de matrícula.',
        data: res.enrollment,
        error: res.error
      };
    },

    cancel(enrollmentId: string): ApiResponse<null> {
      const res = EnrollmentService.cancelEnrollment(enrollmentId);
      return {
        timestamp: new Date().toISOString(),
        status: res.success ? 200 : 400,
        message: res.success ? 'Asignatura cancelada correctamente.' : 'Error al cancelar asignatura.',
        error: res.error
      };
    }
  },

  // ================= GRADE CONTROLLER (RF-08) =================
  grades: {
    update(gradeId: string, p1: number | null, p2: number | null, ef: number | null): ApiResponse<any> {
      const res = GradeService.updateGrades(gradeId, { parcial1: p1, parcial2: p2, examenFinal: ef });
      return {
        timestamp: new Date().toISOString(),
        status: res.success ? 200 : 400,
        message: res.success ? 'Calificaciones registradas.' : 'Error al registrar notas.',
        data: res.grade,
        error: res.error
      };
    },

    requestChange(data: any): ApiResponse<any> {
      const res = GradeService.requestGradeChange(data);
      return {
        timestamp: new Date().toISOString(),
        status: res.success ? 201 : 400,
        message: res.success ? 'Solicitud de rectificación enviada al Coordinador.' : 'Error en la solicitud.',
        data: res.request,
        error: res.error
      };
    },

    resolveChange(requestId: string, approved: boolean, notes: string): ApiResponse<any> {
      const res = GradeService.resolveGradeChangeRequest(requestId, approved, notes);
      return {
        timestamp: new Date().toISOString(),
        status: res.success ? 200 : 400,
        message: res.success ? `Solicitud ${approved ? 'APROBADA' : 'RECHAZADA'}.` : 'Error al procesar solicitud.',
        error: res.error
      };
    }
  }
};

/**
 * Persistence Layer: In-Memory / LocalStorage Relational Storage Engine
 * Emulates PostgreSQL with ACID transactional consistency, relational constraints,
 * and Hibernate JPA Repository abstractions.
 */

import {
  User,
  Student,
  Teacher,
  AcademicProgram,
  Course,
  AcademicPeriod,
  Classroom,
  CourseGroup,
  Enrollment,
  Grade,
  GradeChangeRequest,
  AuditLog,
  LayerTrace
} from '../domain/types';

const STORAGE_KEY = 'SGA_ACADEMIC_DATABASE_V1';

export interface DatabaseState {
  users: User[];
  students: Student[];
  teachers: Teacher[];
  programs: AcademicProgram[];
  courses: Course[];
  periods: AcademicPeriod[];
  classrooms: Classroom[];
  courseGroups: CourseGroup[];
  enrollments: Enrollment[];
  grades: Grade[];
  gradeChangeRequests: GradeChangeRequest[];
  auditLogs: AuditLog[];
  traces: LayerTrace[];
}

// SHA-256 / Hash simulation for immutable audit chains & bcrypt simulation
export function simulateHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0') + 'e48a19f';
}

export function simulateBcrypt(password: string): string {
  return `$2a$12$e8Y...${simulateHash(password + 'sga_salt_rounds_12')}`;
}

export function verifyBcrypt(password: string, hash: string): boolean {
  return hash === simulateBcrypt(password);
}

// Initial Seed Data
const INITIAL_PROGRAMS: AcademicProgram[] = [
  {
    id: 'prg-1',
    code: 'ING-SIS',
    name: 'Ingeniería de Sistemas y Computación',
    faculty: 'Facultad de Ingeniería y Ciencias Aplicadas',
    totalCredits: 160,
    totalSemesters: 10,
    degreeTitle: 'Ingeniero de Sistemas y Computación',
    sniesCode: '102948'
  },
  {
    id: 'prg-2',
    code: 'ING-IND',
    name: 'Ingeniería Industrial',
    faculty: 'Facultad de Ingeniería y Ciencias Aplicadas',
    totalCredits: 155,
    totalSemesters: 10,
    degreeTitle: 'Ingeniero Industrial',
    sniesCode: '103551'
  },
  {
    id: 'prg-3',
    code: 'ADM-EMP',
    name: 'Administración de Empresas',
    faculty: 'Facultad de Ciencias Económicas y Administrativas',
    totalCredits: 140,
    totalSemesters: 8,
    degreeTitle: 'Administrador de Empresas',
    sniesCode: '101822'
  }
];

const INITIAL_COURSES: Course[] = [
  // Sem 1
  {
    id: 'crs-101',
    code: 'SIS-101',
    name: 'Fundamentos de Programación',
    programId: 'prg-1',
    semesterLevel: 1,
    credits: 3,
    hoursWeekly: 4,
    isMandatory: true,
    description: 'Algoritmia, pseudocódigo, tipos de datos primitivos y estructuras de control.',
    prerequisiteCourseIds: []
  },
  {
    id: 'crs-102',
    code: 'MAT-101',
    name: 'Cálculo Diferencial',
    programId: 'prg-1',
    semesterLevel: 1,
    credits: 4,
    hoursWeekly: 4,
    isMandatory: true,
    description: 'Límites, continuidad, derivadas y aplicaciones en optimización.',
    prerequisiteCourseIds: []
  },
  // Sem 2
  {
    id: 'crs-201',
    code: 'SIS-201',
    name: 'Programación Orientada a Objetos',
    programId: 'prg-1',
    semesterLevel: 2,
    credits: 3,
    hoursWeekly: 4,
    isMandatory: true,
    description: 'Clases, herencia, polimorfismo, interfaces y principios SOLID.',
    prerequisiteCourseIds: ['crs-101'] // Prereq: Fundamentos de Programación
  },
  {
    id: 'crs-202',
    code: 'MAT-201',
    name: 'Cálculo Integral',
    programId: 'prg-1',
    semesterLevel: 2,
    credits: 4,
    hoursWeekly: 4,
    isMandatory: true,
    description: 'Antiderivadas, técnicas de integración, series y aplicaciones.',
    prerequisiteCourseIds: ['crs-102'] // Prereq: Cálculo Diferencial
  },
  // Sem 3
  {
    id: 'crs-301',
    code: 'SIS-301',
    name: 'Estructuras de Datos y Algoritmos',
    programId: 'prg-1',
    semesterLevel: 3,
    credits: 4,
    hoursWeekly: 5,
    isMandatory: true,
    description: 'Grafos, árboles binarios, tablas hash y complejidad asintótica O(n).',
    prerequisiteCourseIds: ['crs-201'] // Prereq: POO
  },
  {
    id: 'crs-302',
    code: 'MAT-301',
    name: 'Álgebra Lineal',
    programId: 'prg-1',
    semesterLevel: 3,
    credits: 3,
    hoursWeekly: 3,
    isMandatory: true,
    description: 'Espacios vectoriales, matrices, determinantes y transformaciones lineales.',
    prerequisiteCourseIds: ['crs-102']
  },
  // Sem 4
  {
    id: 'crs-401',
    code: 'SIS-401',
    name: 'Bases de Datos Relacionales',
    programId: 'prg-1',
    semesterLevel: 4,
    credits: 3,
    hoursWeekly: 4,
    isMandatory: true,
    description: 'Modelo relacional, normalización (3FN/BCNF), SQL DDL/DML y transacciones ACID.',
    prerequisiteCourseIds: ['crs-301'] // Prereq: Estructuras de Datos
  },
  {
    id: 'crs-402',
    code: 'SIS-402',
    name: 'Arquitectura de Software',
    programId: 'prg-1',
    semesterLevel: 4,
    credits: 4,
    hoursWeekly: 4,
    isMandatory: true,
    description: 'Patrones arquitectónicos en capas, microservicios, C4 Model y atributos de calidad.',
    prerequisiteCourseIds: ['crs-301'] // Prereq: Estructuras de Datos
  },
  // Sem 5
  {
    id: 'crs-501',
    code: 'SIS-501',
    name: 'Ingeniería de Software Avanzada',
    programId: 'prg-1',
    semesterLevel: 5,
    credits: 3,
    hoursWeekly: 4,
    isMandatory: true,
    description: 'Metodologías ágiles Scrum, CI/CD, pruebas automatizadas y refactorización.',
    prerequisiteCourseIds: ['crs-402'] // Prereq: Arquitectura de Software
  },
  {
    id: 'crs-502',
    code: 'SIS-502',
    name: 'Redes y Seguridad Informática',
    programId: 'prg-1',
    semesterLevel: 5,
    credits: 3,
    hoursWeekly: 4,
    isMandatory: true,
    description: 'Modelo OSI, TCP/IP, cifrado simétrico/asimétrico, TLS 1.3 y firewalls.',
    prerequisiteCourseIds: ['crs-401']
  }
];

const INITIAL_PERIODS: AcademicPeriod[] = [
  {
    id: 'per-2026-1',
    code: '2026-1',
    name: 'Periodo Académico Ordinario 2026-I',
    startDate: '2026-02-02',
    endDate: '2026-06-20',
    isEnrollmentOpen: true,
    isGradingOpen: true,
    isCurrent: true
  },
  {
    id: 'per-2025-2',
    code: '2025-2',
    name: 'Periodo Académico Ordinario 2025-II',
    startDate: '2025-08-04',
    endDate: '2025-12-15',
    isEnrollmentOpen: false,
    isGradingOpen: false,
    isCurrent: false
  }
];

const INITIAL_CLASSROOMS: Classroom[] = [
  { id: 'cls-101', code: 'AULA-301', building: 'Edificio de Ingeniería - Bloque A', capacity: 35, type: 'AULA_TEORICA' },
  { id: 'cls-102', code: 'LAB-COMP-01', building: 'Edificio de Tecnologías - Bloque B', capacity: 25, type: 'LABORATORIO_COMPUTO' },
  { id: 'cls-103', code: 'LAB-COMP-02', building: 'Edificio de Tecnologías - Bloque B', capacity: 30, type: 'LABORATORIO_COMPUTO' },
  { id: 'cls-104', code: 'AUD-MAYOR', building: 'Campus Central - Torre de Rectoría', capacity: 120, type: 'AUDITORIO' }
];

const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin',
    documentNumber: '1001200300',
    name: 'Ing. Mauricio Restrepo (Admin TI)',
    email: 'admin@universidad.edu.co',
    passwordHash: simulateBcrypt('admin123'),
    role: 'ADMIN',
    isActive: true,
    phone: '+57 310 987 6543',
    createdAt: '2025-01-10T08:00:00Z',
    lastLogin: '2026-11-06T15:30:00Z'
  },
  {
    id: 'usr-coord',
    documentNumber: '1002300400',
    name: 'Dra. Claudia Patricia Gómez',
    email: 'coordinador@universidad.edu.co',
    passwordHash: simulateBcrypt('coord123'),
    role: 'COORDINATOR',
    isActive: true,
    phone: '+57 312 456 7890',
    createdAt: '2025-01-15T09:00:00Z',
    lastLogin: '2026-11-06T16:00:00Z'
  },
  {
    id: 'usr-doc-1',
    documentNumber: '1003400500',
    name: 'Dr. Carlos Mendoza Vélez',
    email: 'carlos.mendoza@universidad.edu.co',
    passwordHash: simulateBcrypt('docente123'),
    role: 'TEACHER',
    isActive: true,
    phone: '+57 315 234 5678',
    createdAt: '2025-02-01T10:00:00Z',
    lastLogin: '2026-11-06T14:15:00Z'
  },
  {
    id: 'usr-doc-2',
    documentNumber: '1004500600',
    name: 'Dra. Elena Valencia Ospina',
    email: 'elena.valencia@universidad.edu.co',
    passwordHash: simulateBcrypt('docente123'),
    role: 'TEACHER',
    isActive: true,
    phone: '+57 318 345 6789',
    createdAt: '2025-02-01T11:00:00Z',
    lastLogin: '2026-11-05T09:40:00Z'
  },
  {
    id: 'usr-doc-3',
    documentNumber: '1005600700',
    name: 'Ing. Roberto Silva Henao',
    email: 'roberto.silva@universidad.edu.co',
    passwordHash: simulateBcrypt('docente123'),
    role: 'TEACHER',
    isActive: true,
    phone: '+57 317 654 3210',
    createdAt: '2025-02-01T12:00:00Z',
    lastLogin: '2026-11-04T11:20:00Z'
  },
  {
    id: 'usr-stu-1',
    documentNumber: '1020304050',
    name: 'Juan Camilo Pérez Salazar',
    email: 'juan.perez@universidad.edu.co',
    passwordHash: simulateBcrypt('estudiante123'),
    role: 'STUDENT',
    isActive: true,
    phone: '+57 300 111 2233',
    createdAt: '2025-02-05T14:00:00Z',
    lastLogin: '2026-11-06T17:00:00Z'
  },
  {
    id: 'usr-stu-2',
    documentNumber: '1098765432',
    name: 'Sofía Martínez Rentería',
    email: 'sofia.martinez@universidad.edu.co',
    passwordHash: simulateBcrypt('estudiante123'),
    role: 'STUDENT',
    isActive: true,
    phone: '+57 301 222 3344',
    createdAt: '2025-02-05T15:00:00Z',
    lastLogin: '2026-11-03T10:10:00Z'
  },
  {
    id: 'usr-stu-3',
    documentNumber: '1045678901',
    name: 'Andrés Felipe Torres Cuervo',
    email: 'andres.torres@universidad.edu.co',
    passwordHash: simulateBcrypt('estudiante123'),
    role: 'STUDENT',
    isActive: false, // SUSPENDIDO
    phone: '+57 302 333 4455',
    createdAt: '2025-02-05T16:00:00Z',
    lastLogin: '2026-10-15T08:00:00Z'
  },
  {
    id: 'usr-stu-4',
    documentNumber: '1032145698',
    name: 'Valentina Castro Morales',
    email: 'valentina.castro@universidad.edu.co',
    passwordHash: simulateBcrypt('estudiante123'),
    role: 'STUDENT',
    isActive: true,
    phone: '+57 304 444 5566',
    createdAt: '2026-01-20T08:30:00Z',
    lastLogin: '2026-11-05T16:45:00Z'
  }
];

const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'tch-1',
    userId: 'usr-doc-1',
    documentNumber: '1003400500',
    fullName: 'Dr. Carlos Mendoza Vélez',
    email: 'carlos.mendoza@universidad.edu.co',
    phone: '+57 315 234 5678',
    department: 'Departamento de Ingeniería de Sistemas y Computación',
    academicDegree: 'Doctor (Ph.D.) en Ciencias de la Computación',
    contractType: 'TIEMPO_COMPLETO',
    isActive: true
  },
  {
    id: 'tch-2',
    userId: 'usr-doc-2',
    documentNumber: '1004500600',
    fullName: 'Dra. Elena Valencia Ospina',
    email: 'elena.valencia@universidad.edu.co',
    phone: '+57 318 345 6789',
    department: 'Departamento de Matemáticas y Estadística',
    academicDegree: 'Magíster en Ciencias Matemáticas',
    contractType: 'TIEMPO_COMPLETO',
    isActive: true
  },
  {
    id: 'tch-3',
    userId: 'usr-doc-3',
    documentNumber: '1005600700',
    fullName: 'Ing. Roberto Silva Henao',
    email: 'roberto.silva@universidad.edu.co',
    phone: '+57 317 654 3210',
    department: 'Departamento de Ingeniería de Sistemas y Computación',
    academicDegree: 'Especialista en Bases de Datos y Big Data',
    contractType: 'CATEDRA',
    isActive: true
  }
];

const INITIAL_STUDENTS: Student[] = [
  {
    id: 'stu-1',
    userId: 'usr-stu-1',
    documentNumber: '1020304050',
    fullName: 'Juan Camilo Pérez Salazar',
    email: 'juan.perez@universidad.edu.co',
    phone: '+57 300 111 2233',
    programId: 'prg-1',
    currentSemester: 4,
    status: 'ACTIVO',
    admissionDate: '2024-02-01',
    gpa: 4.45,
    creditsApproved: 21 // Sem 1, 2 and 3 approved!
  },
  {
    id: 'stu-2',
    userId: 'usr-stu-2',
    documentNumber: '1098765432',
    fullName: 'Sofía Martínez Rentería',
    email: 'sofia.martinez@universidad.edu.co',
    phone: '+57 301 222 3344',
    programId: 'prg-1',
    currentSemester: 2,
    status: 'ACTIVO',
    admissionDate: '2025-02-01',
    gpa: 4.10,
    creditsApproved: 7 // Only Sem 1 approved
  },
  {
    id: 'stu-3',
    userId: 'usr-stu-3',
    documentNumber: '1045678901',
    fullName: 'Andrés Felipe Torres Cuervo',
    email: 'andres.torres@universidad.edu.co',
    phone: '+57 302 333 4455',
    programId: 'prg-1',
    currentSemester: 3,
    status: 'SUSPENDIDO', // Suspended student for testing RF-03 and RF-07
    admissionDate: '2024-08-01',
    gpa: 2.85,
    creditsApproved: 14
  },
  {
    id: 'stu-4',
    userId: 'usr-stu-4',
    documentNumber: '1032145698',
    fullName: 'Valentina Castro Morales',
    email: 'valentina.castro@universidad.edu.co',
    phone: '+57 304 444 5566',
    programId: 'prg-1',
    currentSemester: 1,
    status: 'ACTIVO',
    admissionDate: '2026-01-20',
    gpa: 0.0,
    creditsApproved: 0
  }
];

// Historical course approval for Juan Camilo (student 1) so he satisfies prerequisites for Sem 4
const HISTORICAL_ENROLLMENTS: Enrollment[] = [
  // Juan Camilo Sem 1-3 approved in 2025-1 and 2025-2
  { id: 'enr-hist-1', studentId: 'stu-1', courseGroupId: 'grp-hist-101', periodId: 'per-2025-2', enrolledAt: '2025-02-05', status: 'APROBADO' },
  { id: 'enr-hist-2', studentId: 'stu-1', courseGroupId: 'grp-hist-102', periodId: 'per-2025-2', enrolledAt: '2025-02-05', status: 'APROBADO' },
  { id: 'enr-hist-3', studentId: 'stu-1', courseGroupId: 'grp-hist-201', periodId: 'per-2025-2', enrolledAt: '2025-08-05', status: 'APROBADO' },
  { id: 'enr-hist-4', studentId: 'stu-1', courseGroupId: 'grp-hist-301', periodId: 'per-2025-2', enrolledAt: '2025-08-05', status: 'APROBADO' },
  // Sofia (stu-2) only approved crs-101
  { id: 'enr-hist-5', studentId: 'stu-2', courseGroupId: 'grp-hist-101', periodId: 'per-2025-2', enrolledAt: '2025-08-05', status: 'APROBADO' }
];

const INITIAL_COURSE_GROUPS: CourseGroup[] = [
  {
    id: 'grp-401-01',
    courseId: 'crs-401', // Bases de Datos Relacionales (prereq: crs-301)
    periodId: 'per-2026-1',
    groupCode: 'SIS-401-G1',
    teacherId: 'tch-3', // Ing. Roberto Silva
    classroomId: 'cls-102', // Lab 01
    maxCapacity: 25,
    enrolledCount: 24, // ALMOST FULL! 1 cupo left to test capacity depletion
    schedule: [
      { day: 'LUNES', startTime: '07:00', endTime: '09:00' },
      { day: 'MIERCOLES', startTime: '07:00', endTime: '09:00' }
    ]
  },
  {
    id: 'grp-401-02',
    courseId: 'crs-401', // Bases de Datos Relacionales (Grupo 2)
    periodId: 'per-2026-1',
    groupCode: 'SIS-401-G2',
    teacherId: 'tch-3',
    classroomId: 'cls-103',
    maxCapacity: 20,
    enrolledCount: 20, // 100% FULL! To test CUPOS_AGOTADOS rejection
    schedule: [
      { day: 'MARTES', startTime: '18:00', endTime: '20:00' },
      { day: 'JUEVES', startTime: '18:00', endTime: '20:00' }
    ]
  },
  {
    id: 'grp-402-01',
    courseId: 'crs-402', // Arquitectura de Software
    periodId: 'per-2026-1',
    groupCode: 'SIS-402-G1',
    teacherId: 'tch-1', // Dr. Carlos Mendoza
    classroomId: 'cls-101',
    maxCapacity: 30,
    enrolledCount: 15,
    // Note: LUNES 07:00 - 09:00 clashes with grp-401-01! Perfect for testing schedule clash
    schedule: [
      { day: 'LUNES', startTime: '07:00', endTime: '09:00' },
      { day: 'VIERNES', startTime: '09:00', endTime: '11:00' }
    ]
  },
  {
    id: 'grp-402-02',
    courseId: 'crs-402', // Arquitectura de Software (Alternativa sin choque)
    periodId: 'per-2026-1',
    groupCode: 'SIS-402-G2',
    teacherId: 'tch-1',
    classroomId: 'cls-101',
    maxCapacity: 30,
    enrolledCount: 12,
    schedule: [
      { day: 'MARTES', startTime: '14:00', endTime: '16:00' },
      { day: 'JUEVES', startTime: '14:00', endTime: '16:00' }
    ]
  },
  {
    id: 'grp-201-01',
    courseId: 'crs-201', // POO (prereq: crs-101)
    periodId: 'per-2026-1',
    groupCode: 'SIS-201-G1',
    teacherId: 'tch-1',
    classroomId: 'cls-103',
    maxCapacity: 30,
    enrolledCount: 18,
    schedule: [
      { day: 'MIERCOLES', startTime: '10:00', endTime: '12:00' },
      { day: 'VIERNES', startTime: '10:00', endTime: '12:00' }
    ]
  },
  {
    id: 'grp-501-01',
    courseId: 'crs-501', // Ing. de Software Avanzada (prereq: crs-402)
    periodId: 'per-2026-1',
    groupCode: 'SIS-501-G1',
    teacherId: 'tch-1',
    classroomId: 'cls-102',
    maxCapacity: 25,
    enrolledCount: 10,
    schedule: [
      { day: 'SABADO', startTime: '08:00', endTime: '12:00' }
    ]
  }
];

const INITIAL_CURRENT_ENROLLMENTS: Enrollment[] = [
  {
    id: 'enr-cur-1',
    studentId: 'stu-1',
    courseGroupId: 'grp-402-02', // Juan Camilo enrolled in Arquitectura Software G2
    periodId: 'per-2026-1',
    enrolledAt: '2026-02-03T10:15:00Z',
    status: 'INSCRITO'
  },
  {
    id: 'enr-cur-2',
    studentId: 'stu-2',
    courseGroupId: 'grp-201-01', // Sofia enrolled in POO G1
    periodId: 'per-2026-1',
    enrolledAt: '2026-02-04T11:20:00Z',
    status: 'INSCRITO'
  }
];

const INITIAL_GRADES: Grade[] = [
  // Juan Camilo in Arquitectura Software
  {
    id: 'grd-1',
    enrollmentId: 'enr-cur-1',
    studentId: 'stu-1',
    courseGroupId: 'grp-402-02',
    parcial1: 4.5,
    parcial2: 4.2,
    examenFinal: null,
    definitiva: null,
    state: 'EN_CURSO',
    updatedAt: '2026-04-10T14:30:00Z'
  },
  // Sofia in POO
  {
    id: 'grd-2',
    enrollmentId: 'enr-cur-2',
    studentId: 'stu-2',
    courseGroupId: 'grp-201-01',
    parcial1: 3.8,
    parcial2: 3.5,
    examenFinal: null,
    definitiva: null,
    state: 'EN_CURSO',
    updatedAt: '2026-04-12T16:00:00Z'
  }
];

const INITIAL_GRADE_CHANGE_REQUESTS: GradeChangeRequest[] = [
  {
    id: 'gcr-1',
    gradeId: 'grd-1',
    teacherId: 'tch-1',
    studentId: 'stu-1',
    courseGroupId: 'grp-402-02',
    component: 'parcial1',
    currentValue: 4.2,
    proposedValue: 4.5,
    justification: 'Error de digitación en el acta de entrega del Parcial 1. El estudiante presentó la sustentación completa del patrón Microkernel.',
    status: 'PENDIENTE',
    createdAt: '2026-04-15T09:30:00Z'
  }
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-001',
    timestamp: '2026-02-01T08:00:00Z',
    userId: 'usr-admin',
    userEmail: 'admin@universidad.edu.co',
    userRole: 'ADMIN',
    action: 'CREATE',
    entity: 'AcademicPeriod',
    entityId: 'per-2026-1',
    details: 'Apertura del periodo lectivo 2026-I con parámetros de matrícula ordinaria.',
    ipAddress: '192.168.10.45',
    hash: simulateHash('aud-001-genesis'),
    previousHash: '00000000000000000000000000000000'
  },
  {
    id: 'aud-002',
    timestamp: '2026-02-03T10:15:00Z',
    userId: 'usr-stu-1',
    userEmail: 'juan.perez@universidad.edu.co',
    userRole: 'STUDENT',
    action: 'ENROLLMENT',
    entity: 'Enrollment',
    entityId: 'enr-cur-1',
    details: 'Inscripción confirmada en curso SIS-402 Grupo G2. Validación de prerrequisitos y cupos aprobada exitosamente.',
    ipAddress: '190.144.20.12',
    hash: simulateHash('aud-002' + simulateHash('aud-001-genesis')),
    previousHash: simulateHash('aud-001-genesis')
  }
];

export class DatabaseEngine {
  private state: DatabaseState;

  constructor() {
    this.state = this.loadFromStorage();
  }

  private loadFromStorage(): DatabaseState {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (serialized) {
        return JSON.parse(serialized);
      }
    } catch (e) {
      console.warn('Could not load database state from localStorage, initializing fresh seed.', e);
    }

    const defaultState: DatabaseState = {
      users: [...INITIAL_USERS],
      students: [...INITIAL_STUDENTS],
      teachers: [...INITIAL_TEACHERS],
      programs: [...INITIAL_PROGRAMS],
      courses: [...INITIAL_COURSES],
      periods: [...INITIAL_PERIODS],
      classrooms: [...INITIAL_CLASSROOMS],
      courseGroups: [...INITIAL_COURSE_GROUPS],
      enrollments: [...HISTORICAL_ENROLLMENTS, ...INITIAL_CURRENT_ENROLLMENTS],
      grades: [...INITIAL_GRADES],
      gradeChangeRequests: [...INITIAL_GRADE_CHANGE_REQUESTS],
      auditLogs: [...INITIAL_AUDIT_LOGS],
      traces: []
    };

    this.saveToStorage(defaultState);
    return defaultState;
  }

  public saveToStorage(customState?: DatabaseState): void {
    const s = customState || this.state;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch (e) {
      console.error('Failed to write to localStorage', e);
    }
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public resetToFactoryDefaults(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.loadFromStorage();
  }

  public replaceState(newState: DatabaseState): void {
    this.state = newState;
    this.saveToStorage();
  }

  // Record an immutable audit log entry
  public addAuditLog(
    userId: string,
    userEmail: string,
    userRole: AuditLog['userRole'],
    action: AuditLog['action'],
    entity: string,
    entityId: string,
    details: string,
    ipAddress: string = '127.0.0.1'
  ): AuditLog {
    const lastLog = this.state.auditLogs[this.state.auditLogs.length - 1];
    const previousHash = lastLog ? lastLog.hash : '00000000000000000000000000000000';
    const id = `aud-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = new Date().toISOString();
    const payload = `${id}|${timestamp}|${userId}|${action}|${entity}|${entityId}|${previousHash}`;
    const hash = simulateHash(payload);

    const log: AuditLog = {
      id,
      timestamp,
      userId,
      userEmail,
      userRole,
      action,
      entity,
      entityId,
      details,
      ipAddress,
      hash,
      previousHash
    };

    this.state.auditLogs.push(log);
    this.saveToStorage();
    return log;
  }

  // Add trace for Architectural Inspector
  public addTrace(trace: Omit<LayerTrace, 'id' | 'timestamp'>): LayerTrace {
    const fullTrace: LayerTrace = {
      id: `trc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      ...trace
    };

    this.state.traces.unshift(fullTrace);
    if (this.state.traces.length > 50) {
      this.state.traces.pop();
    }
    this.saveToStorage();
    return fullTrace;
  }
}

// Singleton database instance
export const db = new DatabaseEngine();

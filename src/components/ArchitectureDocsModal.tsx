import React, { useState } from 'react';
import {
  Layers,
  Database,
  Shield,
  FileCode,
  Network,
  Cpu,
  CheckCircle2,
  X,
  Copy,
  ExternalLink,
  BookOpen
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureDocsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'layers' | 'erd' | 'c4' | 'rbac' | 'acid' | 'rnf'>('layers');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const postgresDDL = `-- =========================================================================
-- ESQUEMA RELACIONAL DDL: SISTEMA DE GESTIÓN ACADÉMICA (SGA)
-- Dialecto: PostgreSQL 15+ / MySQL 8.0+
-- Arquitectura de Persistencia: Hibernate / Spring Data JPA
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Usuarios y Credenciales (RF-01, RF-02, RNF-01)
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    document_number VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(120) NOT NULL, -- Algoritmo bcrypt con factor de costo 12
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'COORDINATOR', 'TEACHER', 'STUDENT')),
    phone VARCHAR(25),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_doc ON users(document_number);

-- 2. Tabla de Programas Académicos (RF-05)
CREATE TABLE academic_programs (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(15) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    faculty VARCHAR(150) NOT NULL,
    total_credits INT NOT NULL CHECK (total_credits > 0),
    total_semesters INT NOT NULL CHECK (total_semesters BETWEEN 1 AND 14),
    degree_title VARCHAR(150) NOT NULL,
    snies_code VARCHAR(20) NOT NULL
);

-- 3. Tabla de Asignaturas / Malla Curricular (RF-05)
CREATE TABLE courses (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(15) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    program_id VARCHAR(36) NOT NULL REFERENCES academic_programs(id) ON DELETE RESTRICT,
    semester_level INT NOT NULL CHECK (semester_level BETWEEN 1 AND 12),
    credits INT NOT NULL CHECK (credits BETWEEN 1 AND 10),
    hours_weekly INT NOT NULL CHECK (hours_weekly > 0),
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT
);
CREATE INDEX idx_courses_program ON courses(program_id);

-- 4. Tabla de Prerrequisitos entre Asignaturas (RF-05)
CREATE TABLE course_prerequisites (
    course_id VARCHAR(36) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    prerequisite_course_id VARCHAR(36) NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    PRIMARY KEY (course_id, prerequisite_course_id),
    CONSTRAINT chk_no_self_prereq CHECK (course_id <> prerequisite_course_id)
);

-- 5. Tabla de Estudiantes (RF-03)
CREATE TABLE students (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    document_number VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(25),
    program_id VARCHAR(36) NOT NULL REFERENCES academic_programs(id) ON DELETE RESTRICT,
    current_semester INT NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVO' CHECK (status IN ('ACTIVO', 'SUSPENDIDO', 'GRADUADO', 'RETIRADO')),
    admission_date DATE NOT NULL,
    gpa NUMERIC(3,2) NOT NULL DEFAULT 0.00 CHECK (gpa BETWEEN 0.00 AND 5.00),
    credits_approved INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_students_program ON students(program_id);
CREATE INDEX idx_students_status ON students(status);

-- 6. Tabla de Docentes (RF-04)
CREATE TABLE teachers (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    document_number VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(25),
    department VARCHAR(150) NOT NULL,
    academic_degree VARCHAR(100) NOT NULL,
    contract_type VARCHAR(30) NOT NULL CHECK (contract_type IN ('TIEMPO_COMPLETO', 'MEDIO_TIEMPO', 'CATEDRA')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 7. Tabla de Periodos Académicos (RF-06)
CREATE TABLE academic_periods (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE, -- e.g. '2026-1'
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_enrollment_open BOOLEAN NOT NULL DEFAULT FALSE,
    is_grading_open BOOLEAN NOT NULL DEFAULT FALSE,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT chk_period_dates CHECK (start_date < end_date)
);

-- 8. Tabla de Aulas e Infraestructura Física (RF-06)
CREATE TABLE classrooms (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    building VARCHAR(100) NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    type VARCHAR(30) NOT NULL CHECK (type IN ('AULA_TEORICA', 'LABORATORIO_COMPUTO', 'AUDITORIO'))
);

-- 9. Oferta de Grupos Académicos (RF-06)
CREATE TABLE course_groups (
    id VARCHAR(36) PRIMARY KEY,
    course_id VARCHAR(36) NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    period_id VARCHAR(36) NOT NULL REFERENCES academic_periods(id) ON DELETE RESTRICT,
    group_code VARCHAR(15) NOT NULL,
    teacher_id VARCHAR(36) NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
    classroom_id VARCHAR(36) NOT NULL REFERENCES classrooms(id) ON DELETE RESTRICT,
    max_capacity INT NOT NULL CHECK (max_capacity > 0),
    enrolled_count INT NOT NULL DEFAULT 0 CHECK (enrolled_count >= 0 AND enrolled_count <= max_capacity),
    CONSTRAINT uq_group_period UNIQUE (course_id, period_id, group_code)
);

-- 10. Horarios Semanales de los Grupos (RF-06, RF-07)
CREATE TABLE group_schedules (
    id VARCHAR(36) PRIMARY KEY,
    course_group_id VARCHAR(36) NOT NULL REFERENCES course_groups(id) ON DELETE CASCADE,
    day_of_week VARCHAR(15) NOT NULL CHECK (day_of_week IN ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    CONSTRAINT chk_schedule_time CHECK (start_time < end_time)
);
CREATE INDEX idx_schedules_day_time ON group_schedules(day_of_week, start_time, end_time);

-- 11. Matrículas Académicas (RF-07, RNF-07)
CREATE TABLE enrollments (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    course_group_id VARCHAR(36) NOT NULL REFERENCES course_groups(id) ON DELETE RESTRICT,
    period_id VARCHAR(36) NOT NULL REFERENCES academic_periods(id) ON DELETE RESTRICT,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'INSCRITO' CHECK (status IN ('INSCRITO', 'CANCELADO', 'APROBADO', 'REPROBADO')),
    CONSTRAINT uq_student_group UNIQUE (student_id, course_group_id)
);
CREATE INDEX idx_enrollments_student ON enrollments(student_id, period_id);

-- 12. Calificaciones y Evaluaciones (RF-08, RF-09)
CREATE TABLE grades (
    id VARCHAR(36) PRIMARY KEY,
    enrollment_id VARCHAR(36) NOT NULL UNIQUE REFERENCES enrollments(id) ON DELETE CASCADE,
    student_id VARCHAR(36) NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    course_group_id VARCHAR(36) NOT NULL REFERENCES course_groups(id) ON DELETE RESTRICT,
    parcial_1 NUMERIC(3,1) CHECK (parcial_1 BETWEEN 0.0 AND 5.0),
    parcial_2 NUMERIC(3,1) CHECK (parcial_2 BETWEEN 0.0 AND 5.0),
    examen_final NUMERIC(3,1) CHECK (examen_final BETWEEN 0.0 AND 5.0),
    definitiva NUMERIC(3,1) CHECK (definitiva BETWEEN 0.0 AND 5.0),
    state VARCHAR(20) NOT NULL DEFAULT 'EN_CURSO' CHECK (state IN ('EN_CURSO', 'DEFINITIVA', 'EN_REVISION')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Solicitudes de Rectificación de Calificación (RF-08)
CREATE TABLE grade_change_requests (
    id VARCHAR(36) PRIMARY KEY,
    grade_id VARCHAR(36) NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
    teacher_id VARCHAR(36) NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
    student_id VARCHAR(36) NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    course_group_id VARCHAR(36) NOT NULL REFERENCES course_groups(id) ON DELETE RESTRICT,
    component VARCHAR(20) NOT NULL CHECK (component IN ('parcial1', 'parcial2', 'examenFinal')),
    current_value NUMERIC(3,1) NOT NULL,
    proposed_value NUMERIC(3,1) NOT NULL CHECK (proposed_value BETWEEN 0.0 AND 5.0),
    justification TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (status IN ('PENDIENTE', 'APROBADO', 'RECHAZADO')),
    reviewed_by VARCHAR(150),
    review_date TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Pista de Auditoría Inmutable (RF-12, RNF-01)
CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(36) NOT NULL,
    user_email VARCHAR(100) NOT NULL,
    user_role VARCHAR(20) NOT NULL,
    action VARCHAR(50) NOT NULL,
    entity VARCHAR(60) NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    details TEXT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    hash VARCHAR(64) NOT NULL,
    previous_hash VARCHAR(64) NOT NULL
);
CREATE INDEX idx_audit_time ON audit_logs(timestamp);
CREATE INDEX idx_audit_entity ON audit_logs(entity, entity_id);`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Documentación Técnica de la Arquitectura de Software
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Patrón en Capas (Layered)
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Especificación formal de arquitectura, modelos de dominio, reglas ACID y cumplimiento de RF-01 a RF-12 y RNF-01 a RNF-09.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 overflow-x-auto text-sm font-medium">
          <button
            onClick={() => setActiveTab('layers')}
            className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'layers'
                ? 'border-blue-600 text-blue-600 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            Arquitectura en 4 Capas
          </button>
          <button
            onClick={() => setActiveTab('erd')}
            className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'erd'
                ? 'border-blue-600 text-blue-600 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            Esquema Relacional DDL (SQL)
          </button>
          <button
            onClick={() => setActiveTab('acid')}
            className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'acid'
                ? 'border-blue-600 text-blue-600 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Integridad ACID & Concurrencia
          </button>
          <button
            onClick={() => setActiveTab('rbac')}
            className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'rbac'
                ? 'border-blue-600 text-blue-600 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            Matriz de Roles (RBAC)
          </button>
          <button
            onClick={() => setActiveTab('c4')}
            className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'c4'
                ? 'border-blue-600 text-blue-600 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Network className="w-4 h-4" />
            C4 Model & Endpoints REST
          </button>
          <button
            onClick={() => setActiveTab('rnf')}
            className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'rnf'
                ? 'border-blue-600 text-blue-600 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Matriz de RNF (01-09)
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          
          {/* TAB 1: 4 LAYERS */}
          {activeTab === 'layers' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
                  Desglose Estricto de la Arquitectura en Capas
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  El sistema implementa el patrón arquitectónico <strong>Layered Architecture</strong> con bajo acoplamiento y alta cohesión.
                  Cada capa posee una responsabilidad única y únicamente se comunica con la capa inmediatamente inferior a través de interfaces y DTOs tipados.
                </p>
              </div>

              {/* Visual Layer Diagram */}
              <div className="grid grid-cols-1 gap-4">
                {/* Layer 1: Presentation */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700 bg-blue-100 px-3 py-1 rounded-full border border-blue-200">
                      Capa 1: Presentación (Frontend SPA)
                    </span>
                    <span className="text-xs font-mono text-slate-500">React 19 + TypeScript + Tailwind CSS</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">Interfaz de Usuario, Vistas Adaptativas por Rol & Renderizado</h4>
                  <p className="text-xs text-slate-600 mb-3">
                    Gestiona la interacción del usuario, renderiza dashboards según RBAC, valida formularios en tiempo real, procesa descargas directas de informes Excel (xlsx) y PDF (jspdf), y comunica con el backend mediante clientes HTTP asíncronos.
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs font-mono">
                    <span className="bg-white px-2.5 py-1 rounded-md border border-blue-200 text-blue-900">StudentPortal.tsx</span>
                    <span className="bg-white px-2.5 py-1 rounded-md border border-blue-200 text-blue-900">EnrollmentPortal.tsx</span>
                    <span className="bg-white px-2.5 py-1 rounded-md border border-blue-200 text-blue-900">GradebookManagement.tsx</span>
                    <span className="bg-white px-2.5 py-1 rounded-md border border-blue-200 text-blue-900">CurriculumManagement.tsx</span>
                  </div>
                </div>

                {/* Connection Arrow */}
                <div className="text-center font-mono text-xs text-slate-400 font-bold -my-2 flex items-center justify-center gap-2">
                  <span>↓ DTOs & JSON Over HTTPS / REST API / JWT Bearer Tokens ↓</span>
                </div>

                {/* Layer 2: Application / Controllers */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-xl p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                      Capa 2: Aplicación / Controladores (API REST)
                    </span>
                    <span className="text-xs font-mono text-slate-500">Spring Boot @RestController + Spring Security</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">Mapeo de Endpoints, Validación de Entrada (@Valid) y Seguridad RBAC</h4>
                  <p className="text-xs text-slate-600 mb-3">
                    Expone la API RESTful, valida anotaciones @NotNull, @Size y formatos, aplica filtros de autorización con @PreAuthorize("hasRole('...')"), y delega la ejecución a los servicios de dominio sin contener reglas de negocio complejas.
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs font-mono">
                    <span className="bg-white px-2.5 py-1 rounded-md border border-emerald-200 text-emerald-900">AuthController.java</span>
                    <span className="bg-white px-2.5 py-1 rounded-md border border-emerald-200 text-emerald-900">EnrollmentController.java</span>
                    <span className="bg-white px-2.5 py-1 rounded-md border border-emerald-200 text-emerald-900">GradeController.java</span>
                    <span className="bg-white px-2.5 py-1 rounded-md border border-emerald-200 text-emerald-900">StudentController.java</span>
                  </div>
                </div>

                {/* Connection Arrow */}
                <div className="text-center font-mono text-xs text-slate-400 font-bold -my-2 flex items-center justify-center gap-2">
                  <span>↓ Inyección de Dependencias (@Autowired / IoC Container) ↓</span>
                </div>

                {/* Layer 3: Business Logic / Domain */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-purple-800 bg-purple-100 px-3 py-1 rounded-full border border-purple-200">
                      Capa 3: Lógica de Negocio / Dominio (@Service)
                    </span>
                    <span className="text-xs font-mono text-slate-500">Spring @Service + Entidades JPA + Modelos de Dominio</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">Reglas de Negocio, Validaciones Complejas y Fronteras Transaccionales ACID</h4>
                  <p className="text-xs text-slate-600 mb-3">
                    Ejecuta el núcleo del SGA: verificación de prerrequisitos mediante grafos dirigidos, prevención de choques de horario por comparación de intervalos de tiempo, verificación de límites de créditos y control transaccional @Transactional(isolation = SERIALIZABLE).
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs font-mono">
                    <span className="bg-white px-2.5 py-1 rounded-md border border-purple-200 text-purple-900">EnrollmentService.java</span>
                    <span className="bg-white px-2.5 py-1 rounded-md border border-purple-200 text-purple-900">GradeService.java</span>
                    <span className="bg-white px-2.5 py-1 rounded-md border border-purple-200 text-purple-900">CurriculumService.java</span>
                    <span className="bg-white px-2.5 py-1 rounded-md border border-purple-200 text-purple-900">AuditService.java</span>
                  </div>
                </div>

                {/* Connection Arrow */}
                <div className="text-center font-mono text-xs text-slate-400 font-bold -my-2 flex items-center justify-center gap-2">
                  <span>↓ JPQL / Hibernate ORM / Connection Pool HikariCP ↓</span>
                </div>

                {/* Layer 4: Persistence / Data */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                      Capa 4: Persistencia / Datos / Repositorios (@Repository)
                    </span>
                    <span className="text-xs font-mono text-slate-500">Spring Data JPA + Hibernate ORM + PostgreSQL / MySQL</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">Mapeo Objeto-Relacional, Repositorios e Integridad de Almacenamiento</h4>
                  <p className="text-xs text-slate-600 mb-3">
                    Encapsula el acceso físico al motor SQL relacional, gestiona transacciones y bloqueos pesimistas (SELECT FOR UPDATE) para evitar sobrecupos ante alta concurrencia (hasta 300 usuarios concurrentes), e implementa cadenas de hash inmutables para la auditoría.
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs font-mono">
                    <span className="bg-white px-2.5 py-1 rounded-md border border-amber-200 text-amber-900">EnrollmentRepository.java</span>
                    <span className="bg-white px-2.5 py-1 rounded-md border border-amber-200 text-amber-900">CourseGroupRepository.java</span>
                    <span className="bg-white px-2.5 py-1 rounded-md border border-amber-200 text-amber-900">PostgreSQL Relational DB</span>
                    <span className="bg-white px-2.5 py-1 rounded-md border border-amber-200 text-amber-900">JSON Backups (RNF-09)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ERD & SQL DDL */}
          {activeTab === 'erd' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Script DDL de Base de Datos Relacional</h4>
                  <p className="text-xs text-slate-500">14 Tablas normalizadas en 3FN/BCNF con integridad referencial, índices y triggers</p>
                </div>
                <button
                  onClick={() => copyToClipboard(postgresDDL)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? 'Copiado al portapapeles' : 'Copiar Script SQL'}
                </button>
              </div>

              <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-[500px] border border-slate-800">
                <pre>{postgresDDL}</pre>
              </div>
            </div>
          )}

          {/* TAB 3: ACID & CONCURRENCY */}
          {activeTab === 'acid' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-blue-600" />
                  Garantías Transaccionales ACID y Prevención de Condiciones de Carrera
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  En operaciones críticas como la <strong>Matrícula Académica (RF-07)</strong> y el <strong>Registro de Calificaciones (RF-08)</strong>, el sistema garantiza integridad absoluta bajo concurrencia extrema (RNF-02 y RNF-07).
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-1">A - Atomicidad (All-or-Nothing)</span>
                    <p className="text-slate-600">
                      Si la validación de cupos o choques de horario falla, se revierte toda la transacción (ROLLBACK). Ningún cupo queda decrementado si la matrícula no se consolida por completo.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-1">C - Consistencia (Invariantes de Dominio)</span>
                    <p className="text-slate-600">
                      Las restricciones CHECK de PostgreSQL y las reglas de servicio impiden que una calificación exceda 5.0 o sea inferior a 0.0, y garantizan que los cupos ocupados nunca superen la capacidad del aula.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-1">I - Aislamiento (Pessimistic Locking)</span>
                    <p className="text-slate-600">
                      Uso de <code className="bg-white px-1 py-0.5 rounded border border-slate-300">@Lock(LockModeType.PESSIMISTIC_WRITE)</code> en Hibernate con cláusula SQL <code className="bg-white px-1 py-0.5 rounded border border-slate-300">FOR UPDATE</code> para evitar lecturas sucias y sobreventa de cupos cuando 300 estudiantes intentan matricularse en el mismo milisegundo.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-1">D - Durabilidad (WAL & Cadenas de Hash)</span>
                    <p className="text-slate-600">
                      Transacciones sincronizadas a disco mediante Write-Ahead Logging (WAL) de PostgreSQL. Cada operación sensible genera un registro inmutable con hash SHA-256 encadenado a la entrada anterior.
                    </p>
                  </div>
                </div>
              </div>

              {/* Validation Engine details */}
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <h4 className="text-sm font-bold text-slate-900 mb-3">Algoritmo de Validación de Matrícula (Pipeline de 6 Etapas)</h4>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-blue-50/60 border border-blue-100">
                    <span className="font-bold text-blue-700 w-6">1.</span>
                    <span><strong>Estado del Estudiante:</strong> Verifica que el estudiante se encuentre en estado <code className="text-blue-900 font-mono">ACTIVO</code>. Si está <code className="text-red-700 font-mono">SUSPENDIDO</code> o retirado, aborta con código 403.</span>
                  </div>
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-blue-50/60 border border-blue-100">
                    <span className="font-bold text-blue-700 w-6">2.</span>
                    <span><strong>Ventana de Calendario:</strong> Comprueba que el periodo lectivo activo tenga la bandera <code className="text-blue-900 font-mono">is_enrollment_open = true</code>.</span>
                  </div>
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-blue-50/60 border border-blue-100">
                    <span className="font-bold text-blue-700 w-6">3.</span>
                    <span><strong>Grafo de Prerrequisitos:</strong> Traza el historial académico del estudiante. La matrícula se rechaza si alguna asignatura requerida no tiene estado <code className="text-emerald-700 font-mono">APROBADO</code>.</span>
                  </div>
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-blue-50/60 border border-blue-100">
                    <span className="font-bold text-blue-700 w-6">4.</span>
                    <span><strong>Detector de Choques de Horario:</strong> Compara los intervalos <code className="font-mono text-slate-800">[start1, end1]</code> contra todas las asignaturas ya inscritas en el periodo. Si <code className="font-mono">startA &lt; endB AND startB &lt; endA</code> el mismo día, genera alerta transaccional de choque.</span>
                  </div>
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-blue-50/60 border border-blue-100">
                    <span className="font-bold text-blue-700 w-6">5.</span>
                    <span><strong>Bloqueo y Disponibilidad de Cupos:</strong> Comprueba atómicamente <code className="font-mono">enrolled_count &lt; max_capacity</code>. Si está al 100%, la transacción se cancela sin admitir sobrecupo.</span>
                  </div>
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-blue-50/60 border border-blue-100">
                    <span className="font-bold text-blue-700 w-6">6.</span>
                    <span><strong>Límite de Créditos Académicos:</strong> Valida que la suma de créditos del periodo no supere el tope reglamentario (20 créditos semestrales).</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RBAC MATRIX */}
          {activeTab === 'rbac' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Matriz de Control de Acceso Basado en Roles (RBAC - RF-02)
                </h3>
                <p className="text-xs text-slate-600 mb-4">
                  Control estricto de autorizaciones en Spring Security a nivel de métodos (<code className="font-mono">@PreAuthorize</code>) y rutas de API.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700 font-semibold uppercase">
                      <tr>
                        <th className="p-3 border-b border-slate-200">Módulo / Operación del Sistema</th>
                        <th className="p-3 border-b border-slate-200 text-center text-blue-700">Administrador</th>
                        <th className="p-3 border-b border-slate-200 text-center text-purple-700">Coordinador</th>
                        <th className="p-3 border-b border-slate-200 text-center text-emerald-700">Docente</th>
                        <th className="p-3 border-b border-slate-200 text-center text-amber-700">Estudiante</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr className="hover:bg-slate-50">
                        <td className="p-3 font-medium">CRUD Estudiantes y Docentes (RF-03, RF-04)</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">Total</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">Total</td>
                        <td className="p-3 text-center text-red-400">Denegado</td>
                        <td className="p-3 text-center text-red-400">Denegado</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-3 font-medium">Planes de Estudio y Prerrequisitos (RF-05)</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">Total</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">Total</td>
                        <td className="p-3 text-center text-slate-500">Solo Lectura</td>
                        <td className="p-3 text-center text-slate-500">Solo Lectura</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-3 font-medium">Oferta de Grupos, Periodos y Aulas (RF-06)</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">Total</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">Total</td>
                        <td className="p-3 text-center text-slate-500">Ver Asignados</td>
                        <td className="p-3 text-center text-slate-500">Ver Oferta</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-3 font-medium">Inscripción y Matrícula Académica (RF-07)</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">Supervisión</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">Supervisión</td>
                        <td className="p-3 text-center text-red-400">Denegado</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">Matrícula Propia</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-3 font-medium">Digitación de Calificaciones (RF-08)</td>
                        <td className="p-3 text-center text-slate-500">Solo Lectura</td>
                        <td className="p-3 text-center text-slate-500">Solo Lectura</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">Grupos Asignados</td>
                        <td className="p-3 text-center text-red-400">Denegado</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-3 font-medium">Solicitud / Aprobación Cambio de Nota (RF-08)</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">Auditoría</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">Aprobar / Rechazar</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">Solicitar con Causa</td>
                        <td className="p-3 text-center text-red-400">Denegado</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-3 font-medium">Historial Académico y Boletines PDF (RF-09, RF-10)</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">Cualquier Alumno</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">Cualquier Alumno</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">Planillas Excel</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">Historial Propio</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-3 font-medium">Pista de Auditoría y Backups JSON (RF-12, RNF-09)</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">Total (Inmutable)</td>
                        <td className="p-3 text-center text-red-400">Denegado</td>
                        <td className="p-3 text-center text-red-400">Denegado</td>
                        <td className="p-3 text-center text-red-400">Denegado</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: C4 MODEL & ENDPOINTS */}
          {activeTab === 'c4' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Network className="w-5 h-5 text-blue-600" />
                  Arquitectura C4 Model (Nivel 2: Contenedores & Nivel 3: Componentes)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mb-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="font-bold text-blue-900 block mb-1">Frontend Container</span>
                    <p className="text-slate-600">Single Page Application en React 19 ejecutada en el navegador web del cliente. Consume API REST vía HTTPS.</p>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <span className="font-bold text-emerald-900 block mb-1">Backend API Container</span>
                    <p className="text-slate-600">Servicio Spring Boot modular en contenedor Docker (stateless) balanceado horizontalmente tras NGINX.</p>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <span className="font-bold text-amber-900 block mb-1">Database Container</span>
                    <p className="text-slate-600">Cluster PostgreSQL primario con réplicas de solo lectura para reportería pesada y copias de seguridad continuas.</p>
                  </div>
                </div>

                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Endpoints Principales de la API REST</h4>
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-md">
                    <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold">POST</span>
                    <span className="text-slate-800">/api/v1/auth/login</span>
                    <span className="text-slate-400 ml-auto font-sans text-[11px]">Autenticación con JWT</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-md">
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold">GET</span>
                    <span className="text-slate-800">/api/v1/students?doc=&programId=</span>
                    <span className="text-slate-400 ml-auto font-sans text-[11px]">Búsqueda y filtros (RF-11)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-md">
                    <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold">POST</span>
                    <span className="text-slate-800">/api/v1/enrollments/register</span>
                    <span className="text-slate-400 ml-auto font-sans text-[11px]">Matrícula Transaccional ACID (RF-07)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-md">
                    <span className="px-2 py-0.5 rounded bg-amber-600 text-white text-[10px] font-bold">PUT</span>
                    <span className="text-slate-800">/api/v1/grades/{'{gradeId}'}</span>
                    <span className="text-slate-400 ml-auto font-sans text-[11px]">Ingreso de calificaciones (RF-08)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-md">
                    <span className="px-2 py-0.5 rounded bg-purple-600 text-white text-[10px] font-bold">POST</span>
                    <span className="text-slate-800">/api/v1/admin/backups/export</span>
                    <span className="text-slate-400 ml-auto font-sans text-[11px]">Copia de respaldo JSON (RF-12, RNF-09)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: RNF COMPLIANCE */}
          {activeTab === 'rnf' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Matriz de Cumplimiento de Requerimientos No Funcionales (RNF-01 a RNF-09)
                </h3>
                <p className="text-xs text-slate-600 mb-4">
                  Criterios de calidad arquitectónica rigurosamente implementados en el diseño y en el código del sistema.
                </p>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold font-mono">RNF-01</span>
                    <div>
                      <strong className="text-slate-900 block">Seguridad Informática:</strong>
                      <span className="text-slate-600">Cifrado estricto TLS 1.3 en tránsito, algoritmo bcrypt con 12 salt rounds para contraseñas, control RBAC y sanitización de consultas contra inyecciones SQL.</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold font-mono">RNF-02</span>
                    <div>
                      <strong className="text-slate-900 block">Rendimiento y Concurrencia:</strong>
                      <span className="text-slate-600">Tiempo de respuesta &le; 3 segundos para 300 usuarios concurrentes simultáneos garantizado mediante índices B-Tree, pool de conexiones HikariCP y paginación en consultas pesadas.</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold font-mono">RNF-03</span>
                    <div>
                      <strong className="text-slate-900 block">Disponibilidad del 99.5%:</strong>
                      <span className="text-slate-600">Despliegue multi-zona con balanceadores de carga, healthchecks activos en <code className="font-mono">/actuator/health</code> y tolerancia a fallos.</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold font-mono">RNF-04</span>
                    <div>
                      <strong className="text-slate-900 block">Escalabilidad Horizontal:</strong>
                      <span className="text-slate-600">Servidores backend completamente stateless sin almacenamiento de sesión en memoria local (JWT autenticado o Redis distribuido).</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold font-mono">RNF-05</span>
                    <div>
                      <strong className="text-slate-900 block">Mantenibilidad (Patrón en Capas):</strong>
                      <span className="text-slate-600">Separación absoluta entre Controladores, Lógica de Negocio y Repositorios. Permite sustituir la base de datos o el frontend sin afectar las reglas de validación académica.</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold font-mono">RNF-06</span>
                    <div>
                      <strong className="text-slate-900 block">Usabilidad y Accesibilidad:</strong>
                      <span className="text-slate-600">Diseño responsivo adaptable a dispositivos móviles, tablets y escritorios con contraste de color WCAG AA y feedback visual inmediato.</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold font-mono">RNF-07</span>
                    <div>
                      <strong className="text-slate-900 block">Integridad de Datos (Transacciones ACID):</strong>
                      <span className="text-slate-600">Nivel de aislamiento SERIALIZABLE en la asignación de cupos y restricciones de clave foránea que impiden registros huérfanos.</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold font-mono">RNF-08</span>
                    <div>
                      <strong className="text-slate-900 block">Compatibilidad Cross-Browser:</strong>
                      <span className="text-slate-600">Soporte verificado para Chrome, Firefox, Microsoft Edge y Safari mediante transpilación estándar ES2022 y polyfills CSS modernos.</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold font-mono">RNF-09</span>
                    <div>
                      <strong className="text-slate-900 block">Respaldo y Recuperación (Backups JSON):</strong>
                      <span className="text-slate-600">Módulo autónomo para volcado de base de datos a formato JSON estructurado con checksum criptográfico y restauración con validación de esquema.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Universidad Nacional de Tecnología y Ciencias (UNTC) • Arquitectura de Software SGA</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-white font-medium hover:bg-slate-900 transition-colors"
          >
            Cerrar Documentación
          </button>
        </div>
      </div>
    </div>
  );
};

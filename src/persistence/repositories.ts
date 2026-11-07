/**
 * Spring Data JPA / Hibernate Repository Emulation Layer
 * Corresponds to @Repository interfaces in Spring Boot with JPQL / Criteria queries.
 */

import { db } from './DatabaseEngine';
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
  AuditLog
} from '../domain/types';

// ================= USER REPOSITORY =================
export const UserRepository = {
  findByEmail(email: string): User | undefined {
    return db.getState().users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },
  findById(id: string): User | undefined {
    return db.getState().users.find(u => u.id === id);
  },
  findByDocumentNumber(doc: string): User | undefined {
    return db.getState().users.find(u => u.documentNumber === doc);
  },
  save(user: User): User {
    const users = db.getState().users;
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = { ...user };
    } else {
      users.push(user);
    }
    db.saveToStorage();
    return user;
  },
  findAll(): User[] {
    return [...db.getState().users];
  }
};

// ================= STUDENT REPOSITORY =================
export const StudentRepository = {
  findAll(): Student[] {
    return [...db.getState().students];
  },
  findById(id: string): Student | undefined {
    return db.getState().students.find(s => s.id === id);
  },
  findByUserId(userId: string): Student | undefined {
    return db.getState().students.find(s => s.userId === userId);
  },
  findByDocumentNumber(doc: string): Student | undefined {
    return db.getState().students.find(s => s.documentNumber === doc);
  },
  save(student: Student): Student {
    const students = db.getState().students;
    const index = students.findIndex(s => s.id === student.id);
    if (index >= 0) {
      students[index] = { ...student };
    } else {
      students.push(student);
    }
    db.saveToStorage();
    return student;
  },
  deleteById(id: string): boolean {
    const students = db.getState().students;
    const initialLen = students.length;
    const filtered = students.filter(s => s.id !== id);
    if (filtered.length !== initialLen) {
      db.getState().students = filtered;
      db.saveToStorage();
      return true;
    }
    return false;
  }
};

// ================= TEACHER REPOSITORY =================
export const TeacherRepository = {
  findAll(): Teacher[] {
    return [...db.getState().teachers];
  },
  findById(id: string): Teacher | undefined {
    return db.getState().teachers.find(t => t.id === id);
  },
  findByUserId(userId: string): Teacher | undefined {
    return db.getState().teachers.find(t => t.userId === userId);
  },
  save(teacher: Teacher): Teacher {
    const teachers = db.getState().teachers;
    const index = teachers.findIndex(t => t.id === teacher.id);
    if (index >= 0) {
      teachers[index] = { ...teacher };
    } else {
      teachers.push(teacher);
    }
    db.saveToStorage();
    return teacher;
  },
  deleteById(id: string): boolean {
    const teachers = db.getState().teachers;
    const initialLen = teachers.length;
    const filtered = teachers.filter(t => t.id !== id);
    if (filtered.length !== initialLen) {
      db.getState().teachers = filtered;
      db.saveToStorage();
      return true;
    }
    return false;
  }
};

// ================= CURRICULUM REPOSITORY (Programs & Courses) =================
export const CurriculumRepository = {
  findAllPrograms(): AcademicProgram[] {
    return [...db.getState().programs];
  },
  findProgramById(id: string): AcademicProgram | undefined {
    return db.getState().programs.find(p => p.id === id);
  },
  findAllCourses(): Course[] {
    return [...db.getState().courses];
  },
  findCoursesByProgram(programId: string): Course[] {
    return db.getState().courses.filter(c => c.programId === programId);
  },
  findCourseById(id: string): Course | undefined {
    return db.getState().courses.find(c => c.id === id);
  },
  saveCourse(course: Course): Course {
    const courses = db.getState().courses;
    const idx = courses.findIndex(c => c.id === course.id);
    if (idx >= 0) {
      courses[idx] = { ...course };
    } else {
      courses.push(course);
    }
    db.saveToStorage();
    return course;
  },
  saveProgram(program: AcademicProgram): AcademicProgram {
    const programs = db.getState().programs;
    const idx = programs.findIndex(p => p.id === program.id);
    if (idx >= 0) {
      programs[idx] = { ...program };
    } else {
      programs.push(program);
    }
    db.saveToStorage();
    return program;
  }
};

// ================= PERIOD & GROUP REPOSITORY =================
export const CourseGroupRepository = {
  findAllPeriods(): AcademicPeriod[] {
    return [...db.getState().periods];
  },
  findActivePeriod(): AcademicPeriod | undefined {
    return db.getState().periods.find(p => p.isCurrent);
  },
  findPeriodById(id: string): AcademicPeriod | undefined {
    return db.getState().periods.find(p => p.id === id);
  },
  savePeriod(period: AcademicPeriod): AcademicPeriod {
    const periods = db.getState().periods;
    const idx = periods.findIndex(p => p.id === period.id);
    if (idx >= 0) {
      periods[idx] = { ...period };
    } else {
      periods.push(period);
    }
    db.saveToStorage();
    return period;
  },
  findAllClassrooms(): Classroom[] {
    return [...db.getState().classrooms];
  },
  findClassroomById(id: string): Classroom | undefined {
    return db.getState().classrooms.find(c => c.id === id);
  },
  findAllGroups(): CourseGroup[] {
    return [...db.getState().courseGroups];
  },
  findGroupsByPeriod(periodId: string): CourseGroup[] {
    return db.getState().courseGroups.filter(g => g.periodId === periodId);
  },
  findGroupsByTeacher(teacherId: string, periodId?: string): CourseGroup[] {
    return db.getState().courseGroups.filter(g => g.teacherId === teacherId && (!periodId || g.periodId === periodId));
  },
  findGroupsByCourse(courseId: string, periodId?: string): CourseGroup[] {
    return db.getState().courseGroups.filter(g => g.courseId === courseId && (!periodId || g.periodId === periodId));
  },
  findById(groupId: string): CourseGroup | undefined {
    return db.getState().courseGroups.find(g => g.id === groupId);
  },
  /**
   * Hibernate Pessimistic Locking Emulation:
   * SELECT * FROM course_groups WHERE id = :id FOR UPDATE;
   */
  findByIdForUpdate(groupId: string): CourseGroup | undefined {
    return this.findById(groupId);
  },
  saveGroup(group: CourseGroup): CourseGroup {
    const groups = db.getState().courseGroups;
    const idx = groups.findIndex(g => g.id === group.id);
    if (idx >= 0) {
      groups[idx] = { ...group };
    } else {
      groups.push(group);
    }
    db.saveToStorage();
    return group;
  },
  deleteGroup(id: string): boolean {
    const groups = db.getState().courseGroups;
    const initial = groups.length;
    const filtered = groups.filter(g => g.id !== id);
    if (filtered.length !== initial) {
      db.getState().courseGroups = filtered;
      db.saveToStorage();
      return true;
    }
    return false;
  }
};

// ================= ENROLLMENT REPOSITORY =================
export const EnrollmentRepository = {
  findAll(): Enrollment[] {
    return [...db.getState().enrollments];
  },
  findByStudentAndPeriod(studentId: string, periodId: string): Enrollment[] {
    return db.getState().enrollments.filter(e => e.studentId === studentId && e.periodId === periodId && e.status === 'INSCRITO');
  },
  findAllByStudent(studentId: string): Enrollment[] {
    return db.getState().enrollments.filter(e => e.studentId === studentId);
  },
  findByGroup(groupId: string): Enrollment[] {
    return db.getState().enrollments.filter(e => e.courseGroupId === groupId && e.status === 'INSCRITO');
  },
  findActiveEnrollment(studentId: string, groupId: string): Enrollment | undefined {
    return db.getState().enrollments.find(e => e.studentId === studentId && e.courseGroupId === groupId && e.status === 'INSCRITO');
  },
  save(enrollment: Enrollment): Enrollment {
    const enrollments = db.getState().enrollments;
    const idx = enrollments.findIndex(e => e.id === enrollment.id);
    if (idx >= 0) {
      enrollments[idx] = { ...enrollment };
    } else {
      enrollments.push(enrollment);
    }
    db.saveToStorage();
    return enrollment;
  },
  delete(id: string): boolean {
    const enrollments = db.getState().enrollments;
    const idx = enrollments.findIndex(e => e.id === id);
    if (idx >= 0) {
      enrollments[idx].status = 'CANCELADO';
      db.saveToStorage();
      return true;
    }
    return false;
  }
};

// ================= GRADE REPOSITORY =================
export const GradeRepository = {
  findAll(): Grade[] {
    return [...db.getState().grades];
  },
  findByEnrollmentId(enrollmentId: string): Grade | undefined {
    return db.getState().grades.find(g => g.enrollmentId === enrollmentId);
  },
  findByStudentId(studentId: string): Grade[] {
    return db.getState().grades.filter(g => g.studentId === studentId);
  },
  findByCourseGroupId(groupId: string): Grade[] {
    return db.getState().grades.filter(g => g.courseGroupId === groupId);
  },
  save(grade: Grade): Grade {
    const grades = db.getState().grades;
    const idx = grades.findIndex(g => g.id === grade.id);
    if (idx >= 0) {
      grades[idx] = { ...grade };
    } else {
      grades.push(grade);
    }
    db.saveToStorage();
    return grade;
  },
  // Grade Change Requests
  findAllChangeRequests(): GradeChangeRequest[] {
    return [...db.getState().gradeChangeRequests];
  },
  findChangeRequestById(id: string): GradeChangeRequest | undefined {
    return db.getState().gradeChangeRequests.find(r => r.id === id);
  },
  findPendingChangeRequests(): GradeChangeRequest[] {
    return db.getState().gradeChangeRequests.filter(r => r.status === 'PENDIENTE');
  },
  findChangeRequestsByTeacher(teacherId: string): GradeChangeRequest[] {
    return db.getState().gradeChangeRequests.filter(r => r.teacherId === teacherId);
  },
  saveChangeRequest(req: GradeChangeRequest): GradeChangeRequest {
    const reqs = db.getState().gradeChangeRequests;
    const idx = reqs.findIndex(r => r.id === req.id);
    if (idx >= 0) {
      reqs[idx] = { ...req };
    } else {
      reqs.push(req);
    }
    db.saveToStorage();
    return req;
  }
};

// ================= AUDIT REPOSITORY =================
export const AuditRepository = {
  findAll(): AuditLog[] {
    return [...db.getState().auditLogs].reverse(); // newest first
  },
  findByUser(userId: string): AuditLog[] {
    return db.getState().auditLogs.filter(a => a.userId === userId).reverse();
  },
  findByEntity(entity: string): AuditLog[] {
    return db.getState().auditLogs.filter(a => a.entity === entity).reverse();
  }
};

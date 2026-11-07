import React, { useState } from 'react';
import { CurriculumService } from '../services/businessServices';
import { Course, AcademicProgram } from '../domain/types';
import {
  BookOpen,
  Plus,
  GitBranch,
  Layers,
  Edit2,
  Check,
  X,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export const CurriculumManagement: React.FC = () => {
  const programs = CurriculumService.getPrograms();
  const [selectedProgramId, setSelectedProgramId] = useState<string>(programs[0]?.id || 'prg-1');
  const [selectedCourseDetail, setSelectedCourseDetail] = useState<Course | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const courses = CurriculumService.getCourses(selectedProgramId);
  const currentProgram = programs.find(p => p.id === selectedProgramId);

  // Form State
  const [formState, setFormState] = useState({
    code: '',
    name: '',
    semesterLevel: 1,
    credits: 3,
    hoursWeekly: 4,
    description: '',
    prerequisiteCourseIds: [] as string[]
  });

  const handleOpenAdd = () => {
    setEditingCourse(null);
    setFormState({
      code: '',
      name: '',
      semesterLevel: 1,
      credits: 3,
      hoursWeekly: 4,
      description: '',
      prerequisiteCourseIds: []
    });
    setIsModalOpen(true);
  };

  const handleStartEdit = (c: Course) => {
    setEditingCourse(c);
    setFormState({
      code: c.code,
      name: c.name,
      semesterLevel: c.semesterLevel,
      credits: c.credits,
      hoursWeekly: c.hoursWeekly,
      description: c.description,
      prerequisiteCourseIds: [...c.prerequisiteCourseIds]
    });
    setIsModalOpen(true);
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    CurriculumService.saveCourse({
      id: editingCourse?.id,
      code: formState.code,
      name: formState.name,
      programId: selectedProgramId,
      semesterLevel: formState.semesterLevel,
      credits: formState.credits,
      hoursWeekly: formState.hoursWeekly,
      description: formState.description,
      prerequisiteCourseIds: formState.prerequisiteCourseIds
    });
    setIsModalOpen(false);
  };

  const togglePrereq = (courseId: string) => {
    setFormState(prev => {
      const exists = prev.prerequisiteCourseIds.includes(courseId);
      return {
        ...prev,
        prerequisiteCourseIds: exists
          ? prev.prerequisiteCourseIds.filter(id => id !== courseId)
          : [...prev.prerequisiteCourseIds, courseId]
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Programas Académicos y Malla Curricular (RF-05)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Administración de planes de estudio, créditos académicos y grafo de prerrequisitos obligatorios.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer self-start md:self-auto hover:scale-102"
        >
          <Plus className="w-4 h-4" />
          Nueva Asignatura
        </button>
      </div>

      {/* Program Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <label className="font-bold text-slate-700">Plan de Estudios:</label>
          <select
            value={selectedProgramId}
            onChange={e => setSelectedProgramId(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold text-slate-900"
          >
            {programs.map(p => (
              <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4 text-slate-600 font-medium">
          <span>Total Créditos: <strong>{currentProgram?.totalCredits}</strong></span>
          <span>Duración: <strong>{currentProgram?.totalSemesters} Semestres</strong></span>
          <span>SNIES: <strong>{currentProgram?.sniesCode}</strong></span>
        </div>
      </div>

      {/* Courses by Semester */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(sem => {
          const semCourses = courses.filter(c => c.semesterLevel === sem);
          if (semCourses.length === 0) return null;

          return (
            <div key={sem} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                  Nivel Semestral {sem}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {semCourses.reduce((sum, c) => sum + c.credits, 0)} créditos acumulados
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {semCourses.map(course => {
                  const prereqs = course.prerequisiteCourseIds.map(
                    id => courses.find(c => c.id === id)?.name || id
                  );

                  return (
                    <div
                      key={course.id}
                      onClick={() => setSelectedCourseDetail(course)}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-700">{course.code}</span>
                        <span className="text-[11px] bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded">
                          {course.credits} Créditos
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-xs line-clamp-1">{course.name}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{course.description}</p>

                      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px]">
                        <div className="text-slate-600 truncate max-w-[180px]">
                          {prereqs.length > 0 ? (
                            <span className="text-amber-700 font-medium">Req: {prereqs.join(', ')}</span>
                          ) : (
                            <span className="text-slate-400">Sin prerrequisitos</span>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(course);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT COURSE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-full max-w-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingCourse ? 'Modificar Asignatura' : 'Crear Asignatura y Configurar Prerrequisitos'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Código de Materia *</label>
                  <input
                    type="text"
                    required
                    value={formState.code}
                    onChange={e => setFormState({ ...formState, code: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 font-mono"
                    placeholder="SIS-403"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nivel Semestral (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formState.semesterLevel}
                    onChange={e => setFormState({ ...formState, semesterLevel: parseInt(e.target.value) || 1 })}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nombre de la Asignatura *</label>
                <input
                  type="text"
                  required
                  value={formState.name}
                  onChange={e => setFormState({ ...formState, name: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                  placeholder="Compiladores y Lenguajes Formales"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Créditos Académicos (1-6)</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={formState.credits}
                    onChange={e => setFormState({ ...formState, credits: parseInt(e.target.value) || 3 })}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Horas Semanales Presenciales</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formState.hoursWeekly}
                    onChange={e => setFormState({ ...formState, hoursWeekly: parseInt(e.target.value) || 4 })}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Descripción del Microcurrículo</label>
                <textarea
                  rows={2}
                  value={formState.description}
                  onChange={e => setFormState({ ...formState, description: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                  placeholder="Objetivos de aprendizaje, competencias y contenidos..."
                />
              </div>

              {/* Prerequisite Multi-Selector */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-blue-600" />
                  Prerrequisitos Académicos Requeridos (Seleccione las materias previas obligatorias):
                </label>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50">
                  {courses
                    .filter(c => !editingCourse || c.id !== editingCourse.id)
                    .map(c => {
                      const isChecked = formState.prerequisiteCourseIds.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className="flex items-center gap-2 p-1.5 rounded hover:bg-white cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePrereq(c.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-mono text-slate-500">{c.code}</span>
                          <span className="text-slate-800 font-medium">{c.name}</span>
                          <span className="text-[10px] text-slate-400 ml-auto">Sem {c.semesterLevel}</span>
                        </label>
                      );
                    })}
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
                  Guardar Asignatura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

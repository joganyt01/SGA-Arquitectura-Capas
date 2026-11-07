import React, { useState } from 'react';
import { SearchService } from '../services/businessServices';
import { Search, X, User, BookOpen, GraduationCap, Users } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: string) => void;
}

export const GlobalSearchModal: React.FC<Props> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const results = SearchService.globalSearch(query);
  const totalResults =
    results.students.length + results.teachers.length + results.courses.length + results.groups.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95">
        
        {/* Search Input Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por documento de identidad, periodo, asignatura o docente (RF-11)..."
            className="w-full bg-transparent text-sm font-medium text-slate-900 focus:outline-hidden placeholder:text-slate-400"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {!query.trim() ? (
            <div className="py-12 text-center text-slate-400 space-y-1">
              <Search className="w-8 h-8 mx-auto opacity-30 mb-2" />
              <p className="font-semibold text-slate-600">Búsqueda Global Avanzada (RF-11)</p>
              <p className="text-[11px]">Escriba un número de cédula (ej. 1020304050), materia (ej. Bases de Datos) o docente.</p>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-12 text-center text-slate-400">
              No se encontraron coincidencias para "{query}".
            </div>
          ) : (
            <>
              {/* Students Results */}
              {results.students.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                    Estudiantes ({results.students.length})
                  </span>
                  <div className="space-y-1">
                    {results.students.map(s => (
                      <div
                        key={s.id}
                        onClick={() => {
                          onNavigate('students');
                          onClose();
                        }}
                        className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <strong className="text-slate-900 block">{s.fullName}</strong>
                          <span className="text-slate-500 text-[11px] font-mono">Doc: {s.documentNumber} • Sem {s.currentSemester}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'ACTIVO' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {s.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Teachers Results */}
              {results.teachers.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-purple-600" />
                    Docentes ({results.teachers.length})
                  </span>
                  <div className="space-y-1">
                    {results.teachers.map(t => (
                      <div
                        key={t.id}
                        onClick={() => {
                          onNavigate('teachers');
                          onClose();
                        }}
                        className="p-2.5 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <strong className="text-slate-900 block">{t.fullName}</strong>
                          <span className="text-slate-500 text-[11px]">{t.department}</span>
                        </div>
                        <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded">
                          Doc: {t.documentNumber}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Courses Results */}
              {results.courses.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                    Asignaturas ({results.courses.length})
                  </span>
                  <div className="space-y-1">
                    {results.courses.map(c => (
                      <div
                        key={c.id}
                        onClick={() => {
                          onNavigate('curriculum');
                          onClose();
                        }}
                        className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <span className="font-mono text-[10px] font-bold text-slate-400 block">{c.code}</span>
                          <strong className="text-slate-900">{c.name}</strong>
                        </div>
                        <span className="text-slate-500 text-[11px]">Sem {c.semesterLevel} • {c.credits} cr.</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500">
          Pulse <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono">ESC</kbd> para cerrar o haga clic en un resultado para navegar
        </div>
      </div>
    </div>
  );
};

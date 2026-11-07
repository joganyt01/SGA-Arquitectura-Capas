import React, { useState } from 'react';
import { AuthService, RolePermissions, PeriodAndGroupService } from '../services/businessServices';
import { Role, User } from '../domain/types';
import {
  GraduationCap,
  Layers,
  Search,
  Shield,
  UserCheck,
  ChevronDown,
  Terminal,
  LogOut,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { db } from '../persistence/DatabaseEngine';

interface Props {
  currentUser: User;
  onRoleChange: (newRole: Role) => void;
  onOpenDocs: () => void;
  onOpenSearch: () => void;
  onToggleTracer: () => void;
  isTracerOpen: boolean;
}

export const Navbar: React.FC<Props> = ({
  currentUser,
  onRoleChange,
  onOpenDocs,
  onOpenSearch,
  onToggleTracer,
  isTracerOpen
}) => {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const activePeriod = PeriodAndGroupService.getActivePeriod();
  const tracesCount = db.getState().traces.length;

  const roles: { role: Role; title: string; subtitle: string }[] = [
    { role: 'STUDENT', title: 'Estudiante', subtitle: 'Juan Camilo Pérez' },
    { role: 'TEACHER', title: 'Docente Titular', subtitle: 'Dr. Carlos Mendoza' },
    { role: 'COORDINATOR', title: 'Coordinador Académico', subtitle: 'Dra. Claudia Gómez' },
    { role: 'ADMIN', title: 'Administrador TI', subtitle: 'Ing. Mauricio Restrepo' }
  ];

  const handleSelectRole = (r: Role) => {
    onRoleChange(r);
    setRoleMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand & Period */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md border border-blue-400/30">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">SGA</span>
              <span className="text-[11px] text-blue-400 font-semibold tracking-wider uppercase bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/60 hidden sm:inline-block">
                Arquitectura en Capas
              </span>
            </div>
            <p className="text-[11px] text-slate-300 hidden md:block">
              Universidad Nacional de Tecnología y Ciencias (UNTC)
            </p>
          </div>
        </div>

        {/* Global Search trigger (RF-11) */}
        <button
          onClick={onOpenSearch}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs border border-slate-700 transition-colors w-64 cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Buscar por documento, materia...</span>
          <kbd className="ml-auto text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700 font-mono">
            RF-11
          </kbd>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Docs Modal Button */}
          <button
            onClick={onOpenDocs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-all cursor-pointer hover:scale-102"
            title="Ver Documentación Técnica de Arquitectura, DDL y C4"
          >
            <Layers className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Arquitectura Técnica</span>
          </button>

          {/* Live Tracer Button */}
          <button
            onClick={onToggleTracer}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isTracerOpen
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Inspeccionar llamadas de capa y consultas SQL"
          >
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="hidden lg:inline">Capas en Vivo</span>
            <span className="bg-slate-900 text-[10px] font-mono px-1.5 py-0.2 rounded-full text-slate-300">
              {tracesCount}
            </span>
          </button>

          {/* Role Switcher Dropdown (RF-02) */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 text-xs font-medium transition-all cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
                {currentUser.role.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <span className="block text-[11px] font-bold text-white leading-tight">
                  {currentUser.role}
                </span>
                <span className="block text-[10px] text-slate-400 truncate max-w-[110px]">
                  {currentUser.name}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-800 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  Simulador de Roles (RF-02 RBAC)
                </div>
                <div className="space-y-1 mt-1">
                  {roles.map(r => (
                    <button
                      key={r.role}
                      onClick={() => handleSelectRole(r.role)}
                      className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        currentUser.role === r.role
                          ? 'bg-blue-600 text-white font-bold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{r.title}</div>
                        <div className="text-[10px] opacity-75">{r.subtitle}</div>
                      </div>
                      {currentUser.role === r.role && (
                        <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">
                          ACTIVO
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};

import React from 'react';
import { Role } from '../domain/types';
import {
  GraduationCap,
  Calendar,
  Award,
  Users,
  Briefcase,
  BookOpen,
  Layers,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface Props {
  currentModule: string;
  onSelectModule: (module: string) => void;
  userRole: Role;
}

export const Sidebar: React.FC<Props> = ({ currentModule, onSelectModule, userRole }) => {
  interface NavItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    rfCode: string;
    allowedRoles: Role[];
  }

  const navItems: NavItem[] = [
    {
      id: 'portal',
      label: 'Portal Estudiantil',
      icon: GraduationCap,
      rfCode: 'RF-09',
      allowedRoles: ['STUDENT', 'COORDINATOR', 'ADMIN']
    },
    {
      id: 'enrollment',
      label: 'Matrícula Transaccional',
      icon: Calendar,
      rfCode: 'RF-07',
      allowedRoles: ['STUDENT', 'COORDINATOR', 'ADMIN']
    },
    {
      id: 'gradebook',
      label: 'Calificaciones y Notas',
      icon: Award,
      rfCode: 'RF-08',
      allowedRoles: ['TEACHER', 'COORDINATOR', 'ADMIN']
    },
    {
      id: 'students',
      label: 'Gestión de Estudiantes',
      icon: Users,
      rfCode: 'RF-03',
      allowedRoles: ['COORDINATOR', 'ADMIN']
    },
    {
      id: 'teachers',
      label: 'Gestión de Docentes',
      icon: Briefcase,
      rfCode: 'RF-04',
      allowedRoles: ['COORDINATOR', 'ADMIN']
    },
    {
      id: 'curriculum',
      label: 'Programas y Malla',
      icon: BookOpen,
      rfCode: 'RF-05',
      allowedRoles: ['COORDINATOR', 'ADMIN']
    },
    {
      id: 'groups',
      label: 'Grupos y Periodos',
      icon: Layers,
      rfCode: 'RF-06',
      allowedRoles: ['COORDINATOR', 'ADMIN']
    },
    {
      id: 'reports',
      label: 'Centro de Reportes',
      icon: BarChart3,
      rfCode: 'RF-10',
      allowedRoles: ['TEACHER', 'COORDINATOR', 'ADMIN', 'STUDENT']
    },
    {
      id: 'audit',
      label: 'Auditoría y Respaldos',
      icon: ShieldCheck,
      rfCode: 'RF-12',
      allowedRoles: ['ADMIN']
    }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Role Badge in Sidebar */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/60">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
          Perfil Activo en Sesión
        </span>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
          <span className="font-bold text-xs text-slate-900">{userRole}</span>
          <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full ml-auto">
            RBAC
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {navItems.map(item => {
          const isAllowed = item.allowedRoles.includes(userRole);
          const Icon = item.icon;
          const isSelected = currentModule === item.id;

          return (
            <button
              key={item.id}
              onClick={() => isAllowed && onSelectModule(item.id)}
              disabled={!isAllowed}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isAllowed
                  ? 'text-slate-700 hover:bg-slate-100'
                  : 'text-slate-400 opacity-50 cursor-not-allowed hover:bg-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {!isAllowed ? (
                  <Lock className="w-3 h-3 text-slate-400" />
                ) : (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.rfCode}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Architecture Tag Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500 space-y-1">
        <div className="font-bold text-slate-700 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Arquitectura en 4 Capas</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          Presentación • Controladores • Lógica de Negocio • Persistencia SQL
        </p>
      </div>
    </aside>
  );
};

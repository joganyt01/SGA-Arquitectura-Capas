/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthService } from './services/businessServices';
import { Role, User } from './domain/types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ArchitectureDocsModal } from './components/ArchitectureDocsModal';
import { LiveArchitecturalTracer } from './components/LiveArchitecturalTracer';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { StudentPortal } from './components/StudentPortal';
import { EnrollmentPortal } from './components/EnrollmentPortal';
import { GradebookManagement } from './components/GradebookManagement';
import { StudentManagement } from './components/StudentManagement';
import { TeacherManagement } from './components/TeacherManagement';
import { CurriculumManagement } from './components/CurriculumManagement';
import { GroupOfferingManagement } from './components/GroupOfferingManagement';
import { ReportsCenter } from './components/ReportsCenter';
import { AuditAndBackupView } from './components/AuditAndBackupView';
import { StudentRepository } from './persistence/repositories';
import { Layers, ShieldCheck, Terminal, BookOpen, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(AuthService.getCurrentUser());
  const [currentModule, setCurrentModule] = useState<string>('portal');
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTracerOpen, setIsTracerOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Student ID for Student Portal and Enrollment views
  const currentStudent = StudentRepository.findByUserId(currentUser.id) || StudentRepository.findAll()[0];
  const studentId = currentStudent?.id || 'stu-1';

  // Synchronize default module when role changes
  const handleRoleChange = (role: Role) => {
    const updatedUser = AuthService.switchRoleUser(role);
    setCurrentUser({ ...updatedUser });

    if (role === 'STUDENT') {
      setCurrentModule('portal');
    } else if (role === 'TEACHER') {
      setCurrentModule('gradebook');
    } else if (role === 'COORDINATOR') {
      setCurrentModule('curriculum');
    } else if (role === 'ADMIN') {
      setCurrentModule('audit');
    }
    setRefreshKey(prev => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Keyboard shortcut Ctrl+K / Cmd+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Primary Top Navigation */}
      <Navbar
        currentUser={currentUser}
        onRoleChange={handleRoleChange}
        onOpenDocs={() => setIsDocsOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onToggleTracer={() => setIsTracerOpen(!isTracerOpen)}
        isTracerOpen={isTracerOpen}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Navigation Sidebar */}
        <Sidebar
          currentModule={currentModule}
          onSelectModule={setCurrentModule}
          userRole={currentUser.role}
        />

        {/* Dynamic Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Architecture Banner Summary */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl shadow-sm border border-blue-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-blue-300 font-bold shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <strong className="block font-bold text-sm text-white">
                  Sistema de Gestión Académica (SGA) • Arquitectura en Capas
                </strong>
                <p className="text-slate-300 text-[11px]">
                  React Frontend (Presentación) + Spring Boot (Controladores & Dominio) + PostgreSQL (Persistencia ACID)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={() => setIsDocsOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-blue-500/30 hover:bg-blue-500/40 text-blue-200 border border-blue-400/30 font-semibold transition-colors cursor-pointer"
              >
                Ver Diagramas y DDL SQL
              </button>
              <button
                onClick={() => setIsTracerOpen(!isTracerOpen)}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5" />
                Flujo de Capas
              </button>
            </div>
          </div>

          {/* Module Switcher Rendering */}
          <div key={refreshKey} className="animate-in fade-in duration-150">
            {currentModule === 'portal' && (
              <StudentPortal studentId={studentId} />
            )}

            {currentModule === 'enrollment' && (
              <EnrollmentPortal studentId={studentId} onEnrollmentSuccess={handleRefresh} />
            )}

            {currentModule === 'gradebook' && (
              <GradebookManagement />
            )}

            {currentModule === 'students' && (
              <StudentManagement />
            )}

            {currentModule === 'teachers' && (
              <TeacherManagement />
            )}

            {currentModule === 'curriculum' && (
              <CurriculumManagement />
            )}

            {currentModule === 'groups' && (
              <GroupOfferingManagement />
            )}

            {currentModule === 'reports' && (
              <ReportsCenter />
            )}

            {currentModule === 'audit' && (
              <AuditAndBackupView />
            )}
          </div>
        </main>
      </div>

      {/* Technical Architecture Documentation Modal */}
      <ArchitectureDocsModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />

      {/* Global Multi-Criteria Search Modal (RF-11) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(mod) => setCurrentModule(mod)}
      />

      {/* Live Layer Tracer Dock */}
      <LiveArchitecturalTracer
        isOpen={isTracerOpen}
        onToggle={() => setIsTracerOpen(!isTracerOpen)}
      />
    </div>
  );
}

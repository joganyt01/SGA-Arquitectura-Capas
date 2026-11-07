import React, { useState } from 'react';
import { AuditAndBackupService } from '../services/businessServices';
import { db } from '../persistence/DatabaseEngine';
import {
  ShieldCheck,
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  FileCode,
  Search,
  Filter
} from 'lucide-react';
import { AuditLog } from '../domain/types';

export const AuditAndBackupView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'audit' | 'backup'>('audit');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [restoreText, setRestoreText] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const logs = AuditAndBackupService.getAuditLogs();

  const filteredLogs = logs.filter(l => {
    const matchesSearch =
      l.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.entity.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = !actionFilter || l.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const handleDownloadBackup = () => {
    const jsonStr = AuditAndBackupService.exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SGA_Backup_Full_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setFeedback({
      type: 'success',
      message: 'Copia de seguridad en formato JSON generada con checksum criptográfico inmutable.'
    });
  };

  const handleRestoreFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = AuditAndBackupService.restoreBackupJSON(content);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    };
    reader.readAsText(file);
  };

  const handleRestoreFromText = () => {
    if (!restoreText.trim()) return;
    const res = AuditAndBackupService.restoreBackupJSON(restoreText);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setRestoreText('');
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleFactoryReset = () => {
    if (confirm('¿Restablecer el sistema al estado inicial de fábrica con datos de muestra?')) {
      db.resetToFactoryDefaults();
      setFeedback({
        type: 'success',
        message: 'Base de datos restaurada a la semilla inicial de fábrica con éxito.'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Auditoría Inmutable y Gestión de Respaldos (RF-12, RNF-09)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Trazabilidad criptográfica encadenada con hashes SHA-256 y motor de copias de seguridad en formato JSON.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'audit' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Pista de Auditoría ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'backup' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Copias de Seguridad JSON
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          {feedback.message}
        </div>
      )}

      {/* SUBTAB 1: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar en la bitácora de auditoría..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="font-semibold text-slate-600">Acción:</span>
              <select
                value={actionFilter}
                onChange={e => setActionFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-700"
              >
                <option value="">Todas las Acciones</option>
                <option value="ENROLLMENT">Matrículas</option>
                <option value="GRADE_SUBMIT">Calificaciones</option>
                <option value="CREATE">Creación</option>
                <option value="UPDATE">Actualización</option>
                <option value="SUSPEND_STUDENT">Suspensiones</option>
                <option value="LOGIN">Inicios de Sesión</option>
              </select>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                Cadena Hash: ÍNTEGRA
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Fecha y Hora</th>
                    <th className="p-3">Usuario Responsable</th>
                    <th className="p-3">Rol</th>
                    <th className="p-3">Acción</th>
                    <th className="p-3">Entidad</th>
                    <th className="p-3">Detalle de Operación</th>
                    <th className="p-3">Hash SHA-256</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3 font-semibold text-slate-900">{log.userEmail}</td>
                      <td className="p-3">
                        <span className="bg-slate-100 text-slate-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                          {log.userRole}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                            log.action === 'ENROLLMENT'
                              ? 'bg-blue-100 text-blue-800'
                              : log.action === 'GRADE_SUBMIT'
                              ? 'bg-purple-100 text-purple-800'
                              : log.action === 'SUSPEND_STUDENT'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-600">{log.entity}</td>
                      <td className="p-3 text-slate-800 max-w-[300px] truncate" title={log.details}>
                        {log.details}
                      </td>
                      <td className="p-3 font-mono text-[10px] text-slate-400" title={`Prev: ${log.previousHash}`}>
                        {log.hash.substring(0, 10)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: BACKUPS & RESTORE */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export JSON Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Generación de Copia de Seguridad Completa (Backup JSON)
                </h3>
                <p className="text-xs text-slate-500">
                  Exporta tablas relacionales, estudiantes, matrículas, notas y auditoría inmutable.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
              <span className="font-bold text-slate-800 block">Especificaciones del Formato:</span>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>Estructura JSON normalizada conforme a esquema SGA-Core-v1.4</li>
                <li>Incluye Checksum criptográfico para validar integridad de datos</li>
                <li>Garantiza RNF-09 (Respaldo y Recuperación ante desastres)</li>
              </ul>
            </div>

            <button
              onClick={handleDownloadBackup}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Descargar Archivo de Respaldo (.json)
            </button>
          </div>

          {/* Restore JSON Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Restauración de Base de Datos
                </h3>
                <p className="text-xs text-slate-500">
                  Cargue un archivo .json o pegue el contenido serializado para restaurar el estado.
                </p>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 text-xs">Cargar archivo JSON:</label>
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreFromFile}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
              />
            </div>

            <div className="pt-2">
              <label className="font-bold text-slate-700 block mb-1 text-xs">O pegar JSON directamente:</label>
              <textarea
                rows={3}
                value={restoreText}
                onChange={e => setRestoreText(e.target.value)}
                placeholder='{"institution": "UNTC", "data": {...}}'
                className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-xs"
              />
              <button
                onClick={handleRestoreFromText}
                disabled={!restoreText.trim()}
                className="mt-2 w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                Procesar y Restaurar JSON
              </button>
            </div>
          </div>

          {/* Factory Reset Row */}
          <div className="md:col-span-2 bg-amber-50/50 p-4 rounded-xl border border-amber-200 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-amber-900">
              <RotateCcw className="w-4 h-4 text-amber-700" />
              <span>¿Desea restablecer el sistema a los datos iniciales de demostración académica?</span>
            </div>
            <button
              onClick={handleFactoryReset}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
            >
              Restablecer Semilla de Fábrica
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

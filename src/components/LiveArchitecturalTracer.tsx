import React, { useState } from 'react';
import { db } from '../persistence/DatabaseEngine';
import { LayerTrace } from '../domain/types';
import { Terminal, Shield, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, Trash2, Cpu } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onToggle: () => void;
}

export const LiveArchitecturalTracer: React.FC<Props> = ({ isOpen, onToggle }) => {
  const [selectedTrace, setSelectedTrace] = useState<LayerTrace | null>(null);
  const traces = db.getState().traces;

  const clearTraces = () => {
    db.getState().traces = [];
    db.saveToStorage();
    setSelectedTrace(null);
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-40 bg-slate-900 text-white px-4 py-2.5 rounded-full shadow-xl border border-slate-700 flex items-center gap-2.5 hover:bg-slate-800 transition-all text-xs font-semibold cursor-pointer hover:scale-105"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <Terminal className="w-4 h-4 text-emerald-400" />
        Inspector de Capas en Vivo
        <span className="bg-blue-600 text-[10px] font-mono px-2 py-0.5 rounded-full">
          {traces.length}
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-xl bg-slate-950 text-slate-100 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[80vh] transition-all animate-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-white tracking-wide">
            Inspector de Flujo Arquitectónico en Capas
          </span>
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">
            {traces.length} trazas
          </span>
        </div>
        <div className="flex items-center gap-2">
          {traces.length > 0 && (
            <button
              onClick={clearTraces}
              title="Limpiar trazas"
              className="p-1 text-slate-400 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onToggle}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-header instruction */}
      <div className="px-4 py-1.5 bg-slate-900/60 border-b border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
        <span>Capa Presentación → Controlador → Servicio → Repositorio → SQL</span>
        <span className="text-emerald-400">ACID Monitored</span>
      </div>

      {/* Traces List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
        {traces.length === 0 ? (
          <div className="text-center py-8 text-slate-500 font-mono text-xs">
            <Terminal className="w-6 h-6 mx-auto mb-2 opacity-40" />
            Sin transacciones recientes. Realice una acción en el sistema (matrícula, calificación, o guardado) para inspeccionar el flujo entre capas.
          </div>
        ) : (
          traces.map(trc => (
            <div
              key={trc.id}
              onClick={() => setSelectedTrace(selectedTrace?.id === trc.id ? null : trc)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                selectedTrace?.id === trc.id
                  ? 'bg-slate-900 border-blue-500/80 shadow-md ring-1 ring-blue-500/30'
                  : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                      trc.httpMethod === 'POST'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : trc.httpMethod === 'PUT'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : trc.httpMethod === 'DELETE'
                        ? 'bg-red-950 text-red-300 border border-red-800'
                        : 'bg-blue-950 text-blue-300 border border-blue-800'
                    }`}
                  >
                    {trc.httpMethod}
                  </span>
                  <span className="font-semibold text-slate-200 text-xs truncate max-w-[200px]">
                    {trc.feature}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                  <span>{trc.durationMs}ms</span>
                  {trc.acidTransaction && (
                    <span className="bg-purple-950 text-purple-300 border border-purple-800 px-1.5 py-0.2 rounded">
                      ACID
                    </span>
                  )}
                  {trc.status === 'SUCCESS' ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </div>
              </div>

              <div className="text-[11px] font-mono text-slate-400 truncate">
                {trc.endpoint}
              </div>

              {/* Expanded Layer Breakdown */}
              {selectedTrace?.id === trc.id && (
                <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 text-[11px] font-mono animate-in fade-in duration-100">
                  <div>
                    <span className="text-slate-500 block text-[10px]">1. CONTROLADOR (Spring REST):</span>
                    <span className="text-emerald-400 font-semibold">{trc.controller}</span>
                    <span className="text-slate-300 block text-[10px] pl-2">↳ {trc.controllerMethod}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px]">2. LÓGICA DE DOMINIO (@Service):</span>
                    <span className="text-purple-300 font-semibold">{trc.service}</span>
                    <span className="text-slate-300 block text-[10px] pl-2">↳ {trc.serviceMethod}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px]">3. PERSISTENCIA / REPOSITORIO (@Repository):</span>
                    <span className="text-amber-300 font-semibold">{trc.repository}</span>
                    <span className="text-slate-300 block text-[10px] pl-2">↳ {trc.repositoryMethod}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px]">4. SQL RELACIONAL GENERADO:</span>
                    <pre className="p-2 bg-slate-950 rounded border border-slate-800 text-[10px] text-blue-300 overflow-x-auto whitespace-pre-wrap">
                      {trc.sqlQuery}
                    </pre>
                  </div>

                  <div className="pt-1 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800/60">
                    <span>Aislamiento: {trc.isolationLevel || 'READ_COMMITTED'}</span>
                    <span className="text-slate-300">{trc.timestamp}</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

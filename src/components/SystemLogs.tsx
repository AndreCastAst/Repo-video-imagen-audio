import React, { useRef, useEffect } from 'react';
import { Terminal, Trash2 } from 'lucide-react';
import { LogEntry } from '../types';

interface SystemLogsProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

export const SystemLogs: React.FC<SystemLogsProps> = ({ logs, onClearLogs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLogColor = (tipo: LogEntry['tipo']) => {
    switch (tipo) {
      case 'peligro':
        return 'text-red-400 font-semibold';
      case 'alerta':
        return 'text-amber-400';
      case 'exito':
        return 'text-emerald-400';
      default:
        return 'text-slate-300';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
            <Terminal className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">
              Terminal de Salida (Python Console)
            </h2>
            <p className="text-[11px] text-slate-400">
              Logs del sistema en tiempo real
            </p>
          </div>
        </div>

        <button
          onClick={onClearLogs}
          className="text-slate-400 hover:text-slate-200 text-xs p-1 rounded hover:bg-slate-800 transition-colors"
          title="Limpiar consola"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Terminal window */}
      <div className="mt-3 bg-black/80 rounded-xl p-3 font-mono text-xs overflow-y-auto flex-1 max-h-[220px] border border-slate-800/80 space-y-1.5 selection:bg-emerald-500 selection:text-black">
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-2 leading-relaxed">
            <span className="text-slate-500 select-none text-[11px]">
              [{log.timestamp}]
            </span>
            <span className={getLogColor(log.tipo)}>{log.mensaje}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

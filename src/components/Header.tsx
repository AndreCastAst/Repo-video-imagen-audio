import React from 'react';
import { ShieldAlert, Volume2, VolumeX, BellRing, Settings, ShieldCheck, Video } from 'lucide-react';
import { RiskCategory } from '../types';

interface HeaderProps {
  tipoRiesgo: RiskCategory;
  isAlarmPlaying: boolean;
  onSilenceAlarm: () => void;
  onTestAlarm: () => void;
  onOpenSettings: () => void;
  audioEnabled: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  tipoRiesgo,
  isAlarmPlaying,
  onSilenceAlarm,
  onTestAlarm,
  onOpenSettings,
  audioEnabled,
}) => {
  const getStatusBadge = () => {
    switch (tipoRiesgo) {
      case 'accidente_confirmado':
      case 'caida':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-950/80 border border-red-500/80 text-red-400 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            EMERGENCIA: ACCIDENTE
          </span>
        );
      case 'corriendo':
      case 'celular':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/80 border border-amber-500/80 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            ALERTA: RIESGO DETECTADO
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 border border-emerald-500/50 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            SISTEMA OPERATIVO
          </span>
        );
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 sticky top-0 z-40 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Title and Branding */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-950/60 border border-red-700/60 text-red-500 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Sistema Prevención de Accidentes
              </h1>
              <span className="text-xs font-mono uppercase bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                v1.0 • CV + Audio
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Monitoreo de Video (YOLOv8 + MediaPipe Pose) & Alerta Sonora (AudioEngine)
            </p>
          </div>
        </div>

        {/* Status and Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {getStatusBadge()}

          {/* Alarm Indicator & Controller */}
          {isAlarmPlaying ? (
            <button
              onClick={onSilenceAlarm}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/50 transition-colors animate-pulse"
              title="Silenciar sirena de emergencia"
            >
              <VolumeX className="w-4 h-4" />
              <span>Silenciar Sirena</span>
            </button>
          ) : (
            <button
              onClick={onTestAlarm}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="Probar patrón sonoro de alarma (1500Hz/800Hz)"
            >
              <BellRing className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">Probar Alarma</span>
            </button>
          )}

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Ajustes y Parámetros del Sistema"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

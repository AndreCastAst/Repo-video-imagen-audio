import React from 'react';
import { AlertTriangle, Smartphone, Flame, Activity, CheckCircle2, Siren } from 'lucide-react';
import { DetectionState, SystemConfig } from '../types';

interface RiskAlertBannerProps {
  detection: DetectionState;
  config: SystemConfig;
}

export const RiskAlertBanner: React.FC<RiskAlertBannerProps> = ({ detection, config }) => {
  const { tipoRiesgo, mensaje, movimiento, inclinacion, celularDetectado, nivelSonidoActual } = detection;

  if (tipoRiesgo === 'accidente_confirmado') {
    return (
      <div className="bg-red-950/80 border-2 border-red-500 rounded-xl p-4 text-white shadow-xl shadow-red-950/40 flex items-center justify-between flex-wrap gap-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-600 rounded-xl text-white">
            <Siren className="w-8 h-8 animate-spin" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-red-300">
              🚨 CÓDIGO ROJO — PROTOCOLO DE ACCIDENTE
            </div>
            <div className="text-xl font-extrabold text-red-100">{mensaje}</div>
            <div className="text-xs text-red-200 mt-1 flex flex-wrap gap-x-4 gap-y-1">
              <span>Impacto Acústico: <b>{nivelSonidoActual}</b> (Umbral: {config.umbralSonido})</span>
              <span>Inclinación: <b>{inclinacion}</b> (Umbral: {config.umbralInclinacion})</span>
              <span>Cinética: <b>{movimiento}</b></span>
            </div>
          </div>
        </div>
        <div className="px-3 py-1.5 bg-red-800/90 text-red-100 rounded-lg text-xs font-semibold uppercase tracking-wider">
          Alarma Sonora Emitida
        </div>
      </div>
    );
  }

  if (tipoRiesgo === 'caida') {
    return (
      <div className="bg-red-950/50 border border-red-500/80 rounded-xl p-4 text-white shadow-lg flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-700/80 rounded-lg text-white">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-red-400">
              Riesgo Biomecánico Crítico
            </div>
            <div className="text-lg font-bold text-red-100">{mensaje}</div>
            <div className="text-xs text-red-300/80 mt-0.5">
              Inclinación hombro-cadera: <b className="text-red-200">{inclinacion}</b> &gt; {config.umbralInclinacion}
            </div>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-red-900/60 text-red-300 rounded border border-red-700">
          Inclinación Anómala
        </span>
      </div>
    );
  }

  if (tipoRiesgo === 'corriendo') {
    return (
      <div className="bg-amber-950/50 border border-amber-500/80 rounded-xl p-4 text-white shadow-lg flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-600 rounded-lg text-white">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Riesgo de Tránsito Peatonal
            </div>
            <div className="text-lg font-bold text-amber-100">{mensaje}</div>
            <div className="text-xs text-amber-300/80 mt-0.5">
              Velocidad desplazamiento cadera: <b className="text-amber-200">{movimiento}</b> &gt; {config.umbralMovimiento}
            </div>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-amber-900/60 text-amber-300 rounded border border-amber-700">
          Desplazamiento Acelerado
        </span>
      </div>
    );
  }

  if (tipoRiesgo === 'celular') {
    return (
      <div className="bg-amber-950/50 border border-amber-500/80 rounded-xl p-4 text-white shadow-lg flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-600 rounded-lg text-white">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Riesgo por Distracción Operativa
            </div>
            <div className="text-lg font-bold text-amber-100">{mensaje}</div>
            <div className="text-xs text-amber-300/80 mt-0.5">
              Objeto detectado en zona de trabajo: <b className="text-amber-200">cell phone (YOLOv8)</b>
            </div>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-amber-900/60 text-amber-300 rounded border border-amber-700">
          Uso Prohibido en Área
        </span>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-slate-300 flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 bg-emerald-950 text-emerald-400 rounded-lg border border-emerald-800/60">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div className="text-sm">
          <span className="text-emerald-400 font-medium">Condición segura: </span>
          <span>{mensaje}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span>Movimiento: <b className="text-slate-200">{movimiento}</b></span>
        <span>Inclinación: <b className="text-slate-200">{inclinacion}</b></span>
        <span>Sonido: <b className="text-slate-200">{nivelSonidoActual}</b></span>
      </div>
    </div>
  );
};

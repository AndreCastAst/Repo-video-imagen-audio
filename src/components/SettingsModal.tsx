import React from 'react';
import { X, Sliders, Volume2, Shield, Camera, RotateCcw } from 'lucide-react';
import { SystemConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SystemConfig;
  onUpdateConfig: (newConfig: SystemConfig) => void;
}

const DEFAULT_CONFIG: SystemConfig = {
  umbralSonido: 16.0,
  umbralMovimiento: 0.03,
  umbralInclinacion: 0.18,
  cooldownSegundos: 10,
  audioAlarmaHabilitado: true,
  autoCapturaHabilitada: true,
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
}) => {
  if (!isOpen) return null;

  const handleChange = <K extends keyof SystemConfig>(key: K, value: SystemConfig[K]) => {
    onUpdateConfig({
      ...config,
      [key]: value,
    });
  };

  const resetDefaults = () => {
    onUpdateConfig({ ...DEFAULT_CONFIG });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
              <Sliders className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Parámetros de Calibración
              </h2>
              <p className="text-xs text-slate-400">
                Ajuste de umbrales YOLOv8, MediaPipe y Audio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-xs">
          {/* Umbral de Sonido */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-sky-400" />
                <span>Umbral de Detección de Sonido (modulo_audio.py)</span>
              </label>
              <span className="font-mono text-sky-400 font-bold text-sm bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {config.umbralSonido.toFixed(1)}
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Nivel de volumen acústico requerido para clasificar un ruido como impacto o choque accidental (Original: 16).
            </p>
            <input
              type="range"
              min="5"
              max="35"
              step="0.5"
              value={config.umbralSonido}
              onChange={(e) => handleChange('umbralSonido', parseFloat(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>

          {/* Umbral de Movimiento */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Sensibilidad de Movimiento / Carrera (MediaPipe Pose)</span>
              </label>
              <span className="font-mono text-amber-400 font-bold text-sm bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {config.umbralMovimiento.toFixed(3)}
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Diferencia de posición euclídea de cadera para alertar persona corriendo en zona de riesgo (Original: 0.030).
            </p>
            <input
              type="range"
              min="0.01"
              max="0.08"
              step="0.005"
              value={config.umbralMovimiento}
              onChange={(e) => handleChange('umbralMovimiento', parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Umbral de Inclinación */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-red-400" />
                <span>Umbral de Inclinación de Caída (hombro vs cadera)</span>
              </label>
              <span className="font-mono text-red-400 font-bold text-sm bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {config.umbralInclinacion.toFixed(2)}
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Desfase horizontal entre hombro y cadera para disparar alerta de caída (Original: 0.18).
            </p>
            <input
              type="range"
              min="0.08"
              max="0.35"
              step="0.01"
              value={config.umbralInclinacion}
              onChange={(e) => handleChange('umbralInclinacion', parseFloat(e.target.value))}
              className="w-full accent-red-500 cursor-pointer"
            />
          </div>

          {/* Cooldown entre capturas */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-slate-300" />
                <span>Cooldown entre Capturas de Evidencia</span>
              </label>
              <span className="font-mono text-slate-200 font-bold text-sm bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {config.cooldownSegundos}s
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Intervalo mínimo para evitar duplicación de capturas de un mismo incidente (Original: 10 seg).
            </p>
            <input
              type="range"
              min="3"
              max="30"
              step="1"
              value={config.cooldownSegundos}
              onChange={(e) => handleChange('cooldownSegundos', parseInt(e.target.value, 10))}
              className="w-full accent-slate-400 cursor-pointer"
            />
          </div>

          {/* Toggles */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-medium text-slate-300">
                Reproducir Sirena Acústica Automática (1500Hz / 800Hz)
              </span>
              <input
                type="checkbox"
                checked={config.audioAlarmaHabilitado}
                onChange={(e) => handleChange('audioAlarmaHabilitado', e.target.checked)}
                className="w-4 h-4 accent-red-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-medium text-slate-300">
                Captura Automática de Evidencias de Riesgo
              </span>
              <input
                type="checkbox"
                checked={config.autoCapturaHabilitada}
                onChange={(e) => handleChange('autoCapturaHabilitada', e.target.checked)}
                className="w-4 h-4 accent-red-600 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={resetDefaults}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer valores originales</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Guardar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Zap, Activity } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';
import { SystemConfig } from '../types';

interface AudioMonitorProps {
  config: SystemConfig;
  onSoundTriggered: (volume: number) => void;
  onVolumeUpdate: (volume: number) => void;
  onLog: (tipo: 'info' | 'alerta' | 'peligro' | 'exito', msg: string) => void;
}

export const AudioMonitor: React.FC<AudioMonitorProps> = ({
  config,
  onSoundTriggered,
  onVolumeUpdate,
  onLog,
}) => {
  const [micActive, setMicActive] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(0);
  const [peakVolume, setPeakVolume] = useState(0);
  const [simulatedCrash, setSimulatedCrash] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<number | null>(null);

  const startMic = async () => {
    const success = await audioEngine.startMicrophone();
    if (success) {
      setMicActive(true);
      onLog('info', 'Micrófono inicializado. Analizando sonido ambiente...');
    } else {
      onLog('alerta', 'No se concedió acceso al micrófono. Puede usar el simulador de impacto acústico.');
    }
  };

  const stopMic = () => {
    audioEngine.stopMicrophone();
    setMicActive(false);
    setCurrentVolume(0);
    onLog('info', 'Micrófono pausado.');
  };

  // Continuous sound monitoring loop (matching detectar_sonido_accidente)
  useEffect(() => {
    let history: number[] = new Array(30).fill(0);

    intervalRef.current = window.setInterval(() => {
      let vol = 0;
      if (micActive) {
        vol = audioEngine.getSoundLevel();
      } else if (simulatedCrash) {
        // High spike for crash
        vol = 24.5 + Math.random() * 8;
      } else {
        // Ambient room murmur
        vol = Math.round((2.0 + Math.random() * 2.5) * 10) / 10;
      }

      setCurrentVolume(vol);
      onVolumeUpdate(vol);

      if (vol > peakVolume) {
        setPeakVolume(vol);
      }

      // Check against UMBRAL_SONIDO (default: 16)
      if (vol >= config.umbralSonido) {
        onLog('peligro', `🚨 Nivel sonido: ${vol.toFixed(1)} > Umbral (${config.umbralSonido}) — Sonido asociado a posible accidente`);
        onSoundTriggered(vol);
      }

      // Draw mini oscilloscope waveform
      history.push(vol);
      if (history.length > 30) history.shift();

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          // Threshold line
          const thresholdY = h - (config.umbralSonido / 40) * h;
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(0, thresholdY);
          ctx.lineTo(w, thresholdY);
          ctx.stroke();
          ctx.setLineDash([]);

          // Bars
          const barWidth = w / history.length;
          for (let i = 0; i < history.length; i++) {
            const v = history[i];
            const barH = Math.min(h, (v / 40) * h);
            const isOver = v >= config.umbralSonido;
            ctx.fillStyle = isOver ? '#ef4444' : '#0ea5e9';
            ctx.fillRect(i * barWidth, h - barH, barWidth - 2, barH);
          }
        }
      }
    }, 150);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [micActive, simulatedCrash, config.umbralSonido, peakVolume, onSoundTriggered, onVolumeUpdate, onLog]);

  // Trigger high crash noise test
  const triggerCrashSpike = () => {
    setSimulatedCrash(true);
    // Play crash sound synthesizer
    audioEngine.beep(250, 300, 'square');
    setTimeout(() => {
      setSimulatedCrash(false);
    }, 800);
  };

  const isOverThreshold = currentVolume >= config.umbralSonido;
  const progressPercent = Math.min(100, (currentVolume / 35) * 100);
  const thresholdPercent = Math.min(100, (config.umbralSonido / 35) * 100);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg border ${
              isOverThreshold
                ? 'bg-red-950/80 border-red-600 text-red-400 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-sky-400'
            }`}>
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Módulo de Detección Acústica
              </h2>
              <p className="text-[11px] text-slate-400">
                modulo_audio.py • Umbral impacto: {config.umbralSonido}
              </p>
            </div>
          </div>

          {/* Toggle Mic */}
          <button
            onClick={micActive ? stopMic : startMic}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              micActive
                ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {micActive ? <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> : <MicOff className="w-3.5 h-3.5 text-slate-400" />}
            <span>{micActive ? 'Micrófono Activo' : 'Activar Mic'}</span>
          </button>
        </div>

        {/* Level Display */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] uppercase font-semibold text-slate-400">
              Nivel Sonoro Actual
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-2xl font-mono font-extrabold ${
                isOverThreshold ? 'text-red-400' : 'text-sky-400'
              }`}>
                {currentVolume.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500 font-mono">/ 40.0</span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] uppercase font-semibold text-slate-400">
              Umbral de Alarma
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-mono font-extrabold text-amber-400">
                {config.umbralSonido.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500 font-mono">puntos</span>
            </div>
          </div>
        </div>

        {/* Progress bar with threshold marker */}
        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Espectro Acústico</span>
            <span className={isOverThreshold ? 'text-red-400 font-bold' : ''}>
              {isOverThreshold ? '⚠️ RUIDO CRÍTICO' : 'Normal'}
            </span>
          </div>

          <div className="relative h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-150 rounded-full ${
                isOverThreshold ? 'bg-red-500' : 'bg-sky-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
            {/* Marker for threshold */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
              style={{ left: `${thresholdPercent}%` }}
              title={`Umbral: ${config.umbralSonido}`}
            />
          </div>
        </div>

        {/* Live Mini Spectrum Canvas */}
        <div className="mt-3 bg-slate-950/80 rounded-xl p-2 border border-slate-800">
          <div className="text-[10px] text-slate-400 font-mono uppercase mb-1">
            Historial de señal acústica (últimos 4.5 seg)
          </div>
          <canvas
            ref={canvasRef}
            width={300}
            height={46}
            className="w-full h-11 block rounded"
          />
        </div>
      </div>

      {/* Quick Test / Impact Simulator Button */}
      <div className="mt-4 pt-3 border-t border-slate-800">
        <button
          onClick={triggerCrashSpike}
          className="w-full py-2 px-3 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-600/50 text-amber-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Simular Impacto Fuerte / Golpe Acústico (&gt; 16)</span>
        </button>
      </div>
    </div>
  );
};

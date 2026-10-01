import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { RiskAlertBanner } from './components/RiskAlertBanner';
import { VideoFeed } from './components/VideoFeed';
import { AudioMonitor } from './components/AudioMonitor';
import { EvidenceGallery } from './components/EvidenceGallery';
import { SystemLogs } from './components/SystemLogs';
import { SettingsModal } from './components/SettingsModal';
import { ImageAnalysisDashboard } from './components/ImageAnalysisModule/ImageAnalysisDashboard';
import { DetectionState, EvidenceRecord, LogEntry, SystemConfig, RiskCategory } from './types';
import { audioEngine } from './utils/audioEngine';
import { ShieldCheck, AlertTriangle, Smartphone, Flame, Activity } from 'lucide-react';

const INITIAL_CONFIG: SystemConfig = {
  umbralSonido: 16.0,
  umbralMovimiento: 0.03,
  umbralInclinacion: 0.18,
  cooldownSegundos: 10,
  audioAlarmaHabilitado: true,
  autoCapturaHabilitada: true,
};

export const App: React.FC = () => {
  const [activeMainTab, setActiveMainTab] = useState<'monitoring' | 'image_analysis'>('monitoring');
  const [config, setConfig] = useState<SystemConfig>(INITIAL_CONFIG);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const [soundLevel, setSoundLevel] = useState<number>(0);

  const [detection, setDetection] = useState<DetectionState>({
    personaDetectada: true,
    celularDetectado: false,
    movimiento: 0.01,
    inclinacion: 0.04,
    riesgoActivo: false,
    tipoRiesgo: 'normal',
    mensaje: 'Movimiento normal',
    fps: 30,
    sonidoAccidenteDetectado: false,
    nivelSonidoActual: 0,
  });

  // Pre-load with evidence from original repo if available
  const [evidences, setEvidences] = useState<EvidenceRecord[]>([
    {
      id: 'repo-sample-1',
      motivo: 'celular',
      timestamp: '2026-09-30 18:52:08',
      imageSrc: '/capturas_riesgo/prueba_camara_20260930_185208_177085.jpg',
      detalles: {
        movimiento: 0.012,
        inclinacion: 0.05,
        nivelSonido: 4.8,
        descripcion: 'Registro preliminar de validación de cámara (capturas_riesgo)',
      },
    },
  ]);

  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: '1',
      timestamp: new Date().toLocaleTimeString(),
      tipo: 'info',
      mensaje: 'Sistema de Prevención de Accidentes iniciado.',
    },
    {
      id: '2',
      timestamp: new Date().toLocaleTimeString(),
      tipo: 'info',
      mensaje: 'Modelos cargados: YOLOv8n oficial + MediaPipe Pose Landmarker.',
    },
    {
      id: '3',
      timestamp: new Date().toLocaleTimeString(),
      tipo: 'info',
      mensaje: 'Módulo de audio preparado (Umbral de impacto: 16.0).',
    },
  ]);

  const lastCaptureTimeRef = useRef<number>(0);
  const lastAlarmTimeRef = useRef<number>(0);

  const addLog = useCallback((tipo: LogEntry['tipo'], mensaje: string) => {
    setLogs((prev) => [
      ...prev.slice(-90), // keep last 90 logs
      {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        tipo,
        mensaje,
      },
    ]);
  }, []);

  // Alarm controller
  const handleTestAlarm = async () => {
    setIsAlarmPlaying(true);
    addLog('alerta', 'Probando patrón de sirena de emergencia (1500Hz / 800Hz x 5 ciclos)...');
    await audioEngine.activarAlarma();
    setIsAlarmPlaying(false);
    addLog('info', 'Fin de prueba de alarma acústica.');
  };

  const handleSilenceAlarm = () => {
    audioEngine.detenerAlarma();
    setIsAlarmPlaying(false);
    addLog('info', 'Sirena silenciada por el operador.');
  };

  // Capture evidence helper
  const saveEvidence = useCallback(
    (canvas: HTMLCanvasElement, motivo: RiskCategory, descripcion: string) => {
      try {
        const imageSrc = canvas.toDataURL('image/jpeg', 0.85);
        const now = new Date();
        const timestampStr = now.toISOString().replace('T', ' ').substring(0, 19);

        const newRecord: EvidenceRecord = {
          id: Math.random().toString(36).substring(2, 9),
          motivo,
          timestamp: timestampStr,
          imageSrc,
          detalles: {
            movimiento: detection.movimiento,
            inclinacion: detection.inclinacion,
            nivelSonido: soundLevel,
            descripcion,
          },
        };

        setEvidences((prev) => [newRecord, ...prev]);
        audioEngine.playEvidenceSavedBeep(); // winsound.Beep(1000, 1000)
        addLog(
          'exito',
          `Evidencia guardada: capturas_riesgo/${motivo}_${now.toISOString().replace(/[:.]/g, '-')}.jpg`
        );
      } catch (err) {
        console.error('Error saving evidence:', err);
      }
    },
    [detection.movimiento, detection.inclinacion, soundLevel, addLog]
  );

  // Reaction to detection updates
  const handleDetectionUpdate = useCallback(
    (newState: DetectionState) => {
      setDetection(newState);

      // Automated risk evaluation and alarm logic matching prueba_integracion_final.py
      const now = Date.now();
      const cooldownMs = config.cooldownSegundos * 1000;

      if (newState.riesgoActivo && config.autoCapturaHabilitada) {
        if (now - lastCaptureTimeRef.current > cooldownMs) {
          lastCaptureTimeRef.current = now;

          // If accident confirmed or high movement with sound
          if (newState.tipoRiesgo === 'accidente_confirmado') {
            addLog('peligro', '🚨 SONIDO CONFIRMADO - ACCIDENTE DETECTADO');
            if (config.audioAlarmaHabilitado && !audioEngine.getAlarmState()) {
              setIsAlarmPlaying(true);
              audioEngine.activarAlarma().then(() => setIsAlarmPlaying(false));
            }
          } else if (newState.tipoRiesgo === 'corriendo') {
            addLog('alerta', `⚠️ MOVIMIENTO DETECTADO: ${newState.movimiento} > ${config.umbralMovimiento}`);
          } else if (newState.tipoRiesgo === 'caida') {
            addLog('peligro', `⚠️ CAÍDA / INCLINACIÓN CRÍTICA DETECTADA: ${newState.inclinacion} > ${config.umbralInclinacion}`);
          } else if (newState.tipoRiesgo === 'celular') {
            addLog('alerta', '⚠️ RIESGO: USO INDEBIDO DE CELULAR DETECTADO');
          }
        }
      }
    },
    [config, addLog]
  );

  const handleManualCapture = (canvas: HTMLCanvasElement) => {
    saveEvidence(canvas, detection.tipoRiesgo, `Captura manual de operador (${detection.mensaje})`);
  };

  const handleSoundTriggered = (vol: number) => {
    // If there is active motion or inclination, upgrade risk to confirmed accident
    if (detection.riesgoActivo && (detection.tipoRiesgo === 'corriendo' || detection.tipoRiesgo === 'caida')) {
      addLog('peligro', `🚨 IMPACTO ACÚSTICO (${vol.toFixed(1)}) CORRELACIONADO CON EVENTO CINÉTICO`);
      if (config.audioAlarmaHabilitado && !audioEngine.getAlarmState()) {
        setIsAlarmPlaying(true);
        audioEngine.activarAlarma().then(() => setIsAlarmPlaying(false));
      }
    }
  };

  // Quick stats
  const totalEvidencias = evidences.length;
  const celularesCount = evidences.filter((e) => e.motivo === 'celular').length;
  const carrerasCount = evidences.filter((e) => e.motivo === 'corriendo').length;
  const caidasCount = evidences.filter((e) => e.motivo === 'caida').length;
  const accidentesCount = evidences.filter((e) => e.motivo === 'accidente_confirmado').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Header
        tipoRiesgo={detection.tipoRiesgo}
        isAlarmPlaying={isAlarmPlaying}
        onSilenceAlarm={handleSilenceAlarm}
        onTestAlarm={handleTestAlarm}
        onOpenSettings={() => setIsSettingsOpen(true)}
        audioEnabled={config.audioAlarmaHabilitado}
        activeTab={activeMainTab}
        onSelectTab={setActiveMainTab}
        evidenceCount={evidences.length}
      />

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-4 flex-1">
        {activeMainTab === 'image_analysis' ? (
          <ImageAnalysisDashboard
            evidences={evidences}
            onAddNewEvidence={(newEv) => setEvidences((prev) => [newEv, ...prev])}
          />
        ) : (
          <>
            {/* Risk Banner */}
            <RiskAlertBanner detection={detection} config={config} />

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 bg-slate-800 text-slate-300 rounded-lg">
              <Activity className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Total Capturas</div>
              <div className="text-xl font-bold font-mono text-white">{totalEvidencias}</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 bg-slate-800 text-slate-300 rounded-lg">
              <Smartphone className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Uso Celular</div>
              <div className="text-xl font-bold font-mono text-amber-400">{celularesCount}</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 bg-slate-800 text-slate-300 rounded-lg">
              <Flame className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Corriendo</div>
              <div className="text-xl font-bold font-mono text-amber-500">{carrerasCount}</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 bg-slate-800 text-slate-300 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Caídas</div>
              <div className="text-xl font-bold font-mono text-red-400">{caidasCount}</div>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <div className="p-2 bg-red-950 text-red-400 border border-red-800/80 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Accidentes</div>
              <div className="text-xl font-bold font-mono text-red-400">{accidentesCount}</div>
            </div>
          </div>
        </div>

        {/* Primary Viewport: Video Feed & Audio Monitor */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <VideoFeed
              config={config}
              soundLevel={soundLevel}
              onDetectionUpdate={handleDetectionUpdate}
              onManualCapture={handleManualCapture}
            />
          </div>

          <div className="space-y-4 flex flex-col">
            <AudioMonitor
              config={config}
              onSoundTriggered={handleSoundTriggered}
              onVolumeUpdate={setSoundLevel}
              onLog={addLog}
            />

            <div className="flex-1 min-h-[220px]">
              <SystemLogs
                logs={logs}
                onClearLogs={() => setLogs([])}
              />
            </div>
          </div>
        </div>

        {/* Bottom Section: Evidence Gallery */}
        <EvidenceGallery
          evidences={evidences}
          onClear={() => setEvidences([])}
          onDeleteRecord={(id) => setEvidences((prev) => prev.filter((e) => e.id !== id))}
          onOpenInAnalyzer={(record) => {
            setActiveMainTab('image_analysis');
          }}
        />
          </>
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onUpdateConfig={setConfig}
      />
    </div>
  );
};

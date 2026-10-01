import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CameraOff, Play, RefreshCw, AlertCircle, Scan, Maximize2 } from 'lucide-react';
import { DetectionState, SystemConfig, RiskCategory } from '../types';
import { SimulationController, VisionFrameResult } from '../utils/visionEngine';

interface VideoFeedProps {
  config: SystemConfig;
  soundLevel: number;
  onDetectionUpdate: (state: DetectionState, frameDataUrl?: string) => void;
  onManualCapture: (canvas: HTMLCanvasElement) => void;
}

export const VideoFeed: React.FC<VideoFeedProps> = ({
  config,
  soundLevel,
  onDetectionUpdate,
  onManualCapture,
}) => {
  const [sourceMode, setSourceMode] = useState<'simulation' | 'webcam'>('simulation');
  const [activeScenario, setActiveScenario] = useState<'normal' | 'corriendo' | 'celular' | 'caida' | 'accidente_sonido'>('normal');
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const simControllerRef = useRef(new SimulationController());
  const prevFrameDataRef = useRef<Uint8Array | null>(null);
  const prevHipPosRef = useRef<{ x: number; y: number } | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const fpsRef = useRef<number>(30);

  // Iniciar webcam
  const startWebcam = async () => {
    setWebcamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setWebcamActive(true);
        setSourceMode('webcam');
      }
    } catch (err: unknown) {
      console.error('Error webcam:', err);
      setWebcamError('No se pudo acceder a la cámara. Usando modo de simulación interactiva.');
      setSourceMode('simulation');
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setWebcamActive(false);
  };

  // Switch between webcam and simulation
  const handleToggleSource = (mode: 'simulation' | 'webcam') => {
    if (mode === 'webcam') {
      startWebcam();
    } else {
      stopWebcam();
      setSourceMode('simulation');
    }
  };

  // Main rendering loop (replicating OpenCV loop from prueba_integracion_final.py)
  useEffect(() => {
    let isCancelled = false;

    const renderLoop = () => {
      if (isCancelled) return;

      const now = performance.now();
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      if (delta > 0) {
        fpsRef.current = Math.round(1 / delta);
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        animFrameRef.current = requestAnimationFrame(renderLoop);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      let frameResult: VisionFrameResult;

      if (sourceMode === 'webcam' && webcamActive && videoRef.current && videoRef.current.readyState >= 2) {
        // Draw video frame to canvas
        ctx.drawImage(videoRef.current, 0, 0, width, height);

        // Simple frame motion detector via grayscale differences (matching opencv motion)
        const frameData = ctx.getImageData(0, 0, width, height);
        let motionScore = 0.008;

        if (prevFrameDataRef.current && prevFrameDataRef.current.length === frameData.data.length) {
          let diffSum = 0;
          const step = 8; // downsample for performance
          for (let i = 0; i < frameData.data.length; i += 4 * step) {
            const diff = Math.abs(frameData.data[i] - prevFrameDataRef.current[i]);
            if (diff > 25) diffSum++;
          }
          const totalSampled = frameData.data.length / (4 * step);
          motionScore = Math.min(0.09, diffSum / totalSampled * 0.12);
        }
        prevFrameDataRef.current = new Uint8Array(frameData.data);

        // Evaluate motion against config threshold
        const isRunning = motionScore > config.umbralMovimiento;
        let riskCategory: RiskCategory = 'normal';
        let msg = 'Movimiento normal';

        if (isRunning) {
          riskCategory = 'corriendo';
          msg = 'RIESGO: PERSONA CORRIENDO';
        }

        // Bounding box for webcam person
        frameResult = {
          mensaje: msg,
          personaDetectada: true,
          celularDetectado: false,
          movimiento: Math.round(motionScore * 1000) / 1000,
          inclinacion: 0.05,
          riesgo: isRunning,
          tipoRiesgo: riskCategory,
          boundingBoxes: [
            {
              label: 'person',
              confidence: 0.92,
              x: 0.25,
              y: 0.15,
              width: 0.5,
              height: 0.75,
              color: isRunning ? '#ef4444' : '#10b981',
            },
          ],
          landmarks: {
            nariz: { x: 0.5, y: 0.25, confidence: 0.95 },
            hombroIzquierdo: { x: 0.42, y: 0.35, confidence: 0.9 },
            hombroDerecho: { x: 0.58, y: 0.35, confidence: 0.9 },
            caderaIzquierda: { x: 0.44, y: 0.60, confidence: 0.88 },
            caderaDerecha: { x: 0.56, y: 0.60, confidence: 0.88 },
          },
        };
      } else {
        // Simulation Frame
        frameResult = simControllerRef.current.getSimulationFrame(activeScenario, config, soundLevel);

        // Draw animated background representing an industrial warehouse / work zone
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);

        // Grid lines (warehouse perspective floor)
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        for (let i = 0; i <= height; i += 30) {
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(width, i);
          ctx.stroke();
        }
        for (let i = 0; i <= width; i += 40) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, height);
          ctx.stroke();
        }

        // Industrial hazard line pattern at bottom
        const barH = 16;
        for (let x = 0; x < width; x += 24) {
          ctx.fillStyle = (x / 24) % 2 === 0 ? '#eab308' : '#1e293b';
          ctx.fillRect(x, height - barH, 24, barH);
        }

        // Draw simulated worker figure (geometric avatar with realistic joint movement)
        const lm = frameResult.landmarks;
        if (lm.nariz && lm.hombroIzquierdo && lm.hombroDerecho && lm.caderaIzquierda && lm.caderaDerecha) {
          // Head
          const headX = lm.nariz.x * width;
          const headY = lm.nariz.y * height;
          ctx.fillStyle = frameResult.riesgo ? '#f87171' : '#38bdf8';
          ctx.beginPath();
          ctx.arc(headX, headY, 18, 0, Math.PI * 2);
          ctx.fill();

          // Safety helmet
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(headX, headY - 4, 19, Math.PI, 0);
          ctx.fill();

          // Body skeleton line
          const sX = ((lm.hombroIzquierdo.x + lm.hombroDerecho.x) / 2) * width;
          const sY = ((lm.hombroIzquierdo.y + lm.hombroDerecho.y) / 2) * height;
          const hX = ((lm.caderaIzquierda.x + lm.caderaDerecha.x) / 2) * width;
          const hY = ((lm.caderaIzquierda.y + lm.caderaDerecha.y) / 2) * height;

          ctx.strokeStyle = frameResult.riesgo ? '#ef4444' : '#10b981';
          ctx.lineWidth = 6;
          ctx.lineCap = 'round';

          // Spine
          ctx.beginPath();
          ctx.moveTo(sX, sY);
          ctx.lineTo(hX, hY);
          ctx.stroke();

          // Shoulder bar
          ctx.beginPath();
          ctx.moveTo(lm.hombroIzquierdo.x * width, lm.hombroIzquierdo.y * height);
          ctx.lineTo(lm.hombroDerecho.x * width, lm.hombroDerecho.y * height);
          ctx.stroke();

          // Hip bar
          ctx.beginPath();
          ctx.moveTo(lm.caderaIzquierda.x * width, lm.caderaIzquierda.y * height);
          ctx.lineTo(lm.caderaDerecha.x * width, lm.caderaDerecha.y * height);
          ctx.stroke();

          // Legs
          if (lm.rodilla && lm.tobillo) {
            ctx.beginPath();
            ctx.moveTo(hX, hY);
            ctx.lineTo(lm.rodilla.x * width, lm.rodilla.y * height);
            ctx.lineTo(lm.tobillo.x * width, lm.tobillo.y * height);
            ctx.stroke();
          }

          // Inclinometer / Fall vector indicator line
          if (activeScenario === 'caida' || activeScenario === 'accidente_sonido') {
            ctx.strokeStyle = '#f87171';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(sX, sY);
            ctx.lineTo(sX, hY);
            ctx.lineTo(hX, hY);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#fca5a5';
            ctx.font = '11px monospace';
            ctx.fillText(`ΔX=${frameResult.inclinacion}`, Math.min(sX, hX) + 5, hY - 6);
          }
        }
      }

      // -------------------------------------------------------------
      // DRAW YOLO BOUNDING BOXES (Identical to Ultralytics overlay)
      // -------------------------------------------------------------
      for (const box of frameResult.boundingBoxes) {
        const bx = box.x * width;
        const by = box.y * height;
        const bw = box.width * width;
        const bh = box.height * height;

        ctx.strokeStyle = box.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, bh);

        // Label banner
        const tagText = `${box.label} ${(box.confidence * 100).toFixed(0)}%`;
        ctx.font = 'bold 12px monospace';
        const textWidth = ctx.measureText(tagText).width;

        ctx.fillStyle = box.color;
        ctx.fillRect(bx, by - 20, textWidth + 8, 20);

        ctx.fillStyle = '#0f172a';
        ctx.fillText(tagText, bx + 4, by - 5);
      }

      // -------------------------------------------------------------
      // OPENCV OSD OVERLAYS (Faithfully matching cv2.putText in Python)
      // cv2.putText(frame, mensaje, (30,50), FONT, 1, (0,0,255), 2)
      // cv2.putText(frame, f"FPS: {int(fps)}", (30,90), FONT, 0.8, (0,255,0), 2)
      // -------------------------------------------------------------
      const textX = 24;
      const textY = 40;

      // Status Message Box (Red if risk, Green if normal)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(textX - 8, textY - 26, Math.max(340, ctx.measureText(frameResult.mensaje).width + 20), 40);

      ctx.fillStyle = frameResult.riesgo ? '#ef4444' : '#10b981';
      ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(frameResult.mensaje, textX, textY);

      // FPS Box (cv2.putText green)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(textX - 8, textY + 20, 100, 26);
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`FPS: ${fpsRef.current}`, textX, textY + 38);

      // Audio Level indicator on screen
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(width - 150, textY - 26, 134, 30);
      ctx.fillStyle = soundLevel > config.umbralSonido ? '#ef4444' : '#94a3b8';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`AUDIO: ${soundLevel.toFixed(1)} / ${config.umbralSonido}`, width - 140, textY - 6);

      // Timestamp watermark in OpenCV style
      const timestampStr = new Date().toLocaleTimeString();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px monospace';
      ctx.fillText(`CAM_01 • ${timestampStr}`, width - 160, height - 24);

      // Report state to parent
      onDetectionUpdate({
        personaDetectada: frameResult.personaDetectada,
        celularDetectado: frameResult.celularDetectado,
        movimiento: frameResult.movimiento,
        inclinacion: frameResult.inclinacion,
        riesgoActivo: frameResult.riesgo,
        tipoRiesgo: frameResult.tipoRiesgo,
        mensaje: frameResult.mensaje,
        fps: fpsRef.current,
        sonidoAccidenteDetectado: soundLevel >= config.umbralSonido,
        nivelSonidoActual: soundLevel,
      });

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      isCancelled = true;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [sourceMode, activeScenario, webcamActive, config, soundLevel, onDetectionUpdate]);

  const handleManualCaptureClick = () => {
    if (canvasRef.current) {
      onManualCapture(canvasRef.current);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* Top Video Toolbar */}
      <div className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Feed de Cámara Principal (YOLOv8 + MediaPipe Pose)
          </span>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            480x360 @ 30fps
          </span>
        </div>

        {/* Source Toggle */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-800 p-0.5 rounded-lg border border-slate-700 flex items-center text-xs">
            <button
              onClick={() => handleToggleSource('simulation')}
              className={`px-3 py-1 rounded-md transition-colors ${
                sourceMode === 'simulation'
                  ? 'bg-red-600 text-white font-medium shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Simulador
            </button>
            <button
              onClick={() => handleToggleSource('webcam')}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                sourceMode === 'webcam'
                  ? 'bg-red-600 text-white font-medium shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Cámara Web</span>
            </button>
          </div>

          <button
            onClick={handleManualCaptureClick}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
            title="Guardar evidencia manualmente (guardar_evidencia)"
          >
            <Scan className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Capturar Evidencia</span>
          </button>
        </div>
      </div>

      {webcamError && (
        <div className="px-4 py-2 bg-amber-950/60 border-b border-amber-800/80 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{webcamError}</span>
        </div>
      )}

      {/* Main Canvas Container */}
      <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
        {/* Hidden video element for webcam streaming */}
        <video
          ref={videoRef}
          className="hidden"
          playsInline
          muted
          autoPlay
        />

        {/* Primary Screen Canvas */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="w-full h-full object-contain"
        />

        {/* Corner HUD marks */}
        <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-slate-500 pointer-events-none opacity-40"></div>
        <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-slate-500 pointer-events-none opacity-40"></div>
        <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-slate-500 pointer-events-none opacity-40"></div>
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-slate-500 pointer-events-none opacity-40"></div>
      </div>

      {/* Interactive Scenario Buttons */}
      <div className="p-3 bg-slate-950/80 border-t border-slate-800">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Escenarios de Prueba de Riesgo (Protocolo de Validación)</span>
          <span className="text-slate-500 font-mono text-[10px]">
            {sourceMode === 'webcam' ? 'Activo en Cámara Web' : 'Control del Simulador'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <button
            onClick={() => {
              setActiveScenario('normal');
              if (sourceMode === 'webcam') handleToggleSource('simulation');
            }}
            className={`px-2.5 py-2 rounded-lg text-xs font-medium text-left border transition-all ${
              activeScenario === 'normal' && sourceMode === 'simulation'
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Normal
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">Postura segura</div>
          </button>

          <button
            onClick={() => {
              setActiveScenario('corriendo');
              if (sourceMode === 'webcam') handleToggleSource('simulation');
            }}
            className={`px-2.5 py-2 rounded-lg text-xs font-medium text-left border transition-all ${
              activeScenario === 'corriendo' && sourceMode === 'simulation'
                ? 'bg-amber-950/80 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Corriendo
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">Movimiento &gt; 0.03</div>
          </button>

          <button
            onClick={() => {
              setActiveScenario('celular');
              if (sourceMode === 'webcam') handleToggleSource('simulation');
            }}
            className={`px-2.5 py-2 rounded-lg text-xs font-medium text-left border transition-all ${
              activeScenario === 'celular' && sourceMode === 'simulation'
                ? 'bg-amber-950/80 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Uso Celular
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">Objeto cell phone</div>
          </button>

          <button
            onClick={() => {
              setActiveScenario('caida');
              if (sourceMode === 'webcam') handleToggleSource('simulation');
            }}
            className={`px-2.5 py-2 rounded-lg text-xs font-medium text-left border transition-all ${
              activeScenario === 'caida' && sourceMode === 'simulation'
                ? 'bg-red-950/80 border-red-500 text-red-300 ring-1 ring-red-500'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5 text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Caída / Desbalance
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">Inclinación &gt; 0.18</div>
          </button>

          <button
            onClick={() => {
              setActiveScenario('accidente_sonido');
              if (sourceMode === 'webcam') handleToggleSource('simulation');
            }}
            className={`col-span-2 sm:col-span-1 px-2.5 py-2 rounded-lg text-xs font-medium text-left border transition-all ${
              activeScenario === 'accidente_sonido' && sourceMode === 'simulation'
                ? 'bg-red-950/80 border-red-500 text-red-200 ring-1 ring-red-500 animate-pulse'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5 text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
              Accidente + Ruido
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">Impacto combinado</div>
          </button>
        </div>
      </div>
    </div>
  );
};

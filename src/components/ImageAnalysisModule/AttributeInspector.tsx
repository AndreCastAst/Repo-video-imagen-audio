import React, { useState, useRef, useEffect } from 'react';
import {
  ImageAttributeReport,
  DetectedEntityAttribute,
  SpatialRelationAttributes,
  BiomechanicalAttributes,
  ImageQualityMetrics,
} from '../../types/imageAnalysis';
import {
  Layers,
  Eye,
  Sliders,
  Maximize2,
  Activity,
  Smartphone,
  ShieldAlert,
  Compass,
  Zap,
  Info,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Copy,
  Check,
  Download,
  ArrowRight,
} from 'lucide-react';

interface AttributeInspectorProps {
  report: ImageAttributeReport;
  onSwitchToContract?: () => void;
}

export const AttributeInspector: React.FC<AttributeInspectorProps> = ({ report, onSwitchToContract }) => {
  const [showBoxes, setShowBoxes] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showSpatialVector, setShowSpatialVector] = useState(true);
  const [showQualityHUD, setShowQualityHUD] = useState(true);
  const [copiedJson, setCopiedJson] = useState(false);

  const jsonString = JSON.stringify(report.handshakePayload, null, 2);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonString);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.nombreArchivo}.feature_vector.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(new Image());

  // Render overlay layers onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imgRef.current;
    img.crossOrigin = 'anonymous';
    img.src = report.imagenUrl;

    img.onload = () => {
      canvas.width = img.naturalWidth || 640;
      canvas.height = img.naturalHeight || 480;
      const w = canvas.width;
      const h = canvas.height;

      // Draw base image
      ctx.drawImage(img, 0, 0, w, h);

      // Layer 1: Bounding boxes
      if (showBoxes) {
        for (const ent of report.entidades) {
          const bx = ent.bbox.xmin * w;
          const by = ent.bbox.ymin * h;
          const bw = (ent.bbox.xmax - ent.bbox.xmin) * w;
          const bh = (ent.bbox.ymax - ent.bbox.ymin) * h;

          let color = '#38bdf8';
          if (ent.clase === 'celular') color = '#f59e0b';
          if (ent.clase === 'zona_riesgo') color = '#ef4444';

          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.strokeRect(bx, by, bw, bh);

          // Tag banner
          const label = `${ent.clase.toUpperCase()} (${Math.round(ent.confianzaObservable * 100)}%)`;
          ctx.font = 'bold 12px monospace';
          const txtW = ctx.measureText(label).width;
          ctx.fillStyle = color;
          ctx.fillRect(bx, by - 22, txtW + 10, 22);
          ctx.fillStyle = '#0f172a';
          ctx.fillText(label, bx + 5, by - 6);
        }
      }

      // Layer 2: Biomechanical Spine & Inclination Angle
      if (showSkeleton) {
        const person = report.entidades.find((e) => e.clase === 'persona');
        if (person) {
          const pCenterBottomX = ((person.bbox.xmin + person.bbox.xmax) / 2) * w;
          const pCenterBottomY = person.bbox.ymax * h - 30; // cadera aprox
          const torsoAngleRad = (report.biomecanica.anguloInclinacionTorsoDeg * Math.PI) / 180;

          const spineLength = (person.bbox.ymax - person.bbox.ymin) * h * 0.45;
          const pShoulderX = pCenterBottomX + Math.sin(torsoAngleRad) * spineLength;
          const pShoulderY = pCenterBottomY - Math.cos(torsoAngleRad) * spineLength;

          // Vertical reference line
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.setLineDash([4, 4]);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(pCenterBottomX, pCenterBottomY);
          ctx.lineTo(pCenterBottomX, pCenterBottomY - spineLength);
          ctx.stroke();
          ctx.setLineDash([]);

          // Spine Vector
          ctx.strokeStyle = report.biomecanica.anguloInclinacionTorsoDeg > 20 ? '#ef4444' : '#10b981';
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(pCenterBottomX, pCenterBottomY);
          ctx.lineTo(pShoulderX, pShoulderY);
          ctx.stroke();

          // Joint points
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.arc(pCenterBottomX, pCenterBottomY, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(pShoulderX, pShoulderY, 6, 0, Math.PI * 2);
          ctx.fill();

          // Angle arc
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pCenterBottomX, pCenterBottomY, 40, -Math.PI / 2, -Math.PI / 2 + torsoAngleRad, false);
          ctx.stroke();

          // Angle text
          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 13px monospace';
          ctx.fillText(`θ = ${report.biomecanica.anguloInclinacionTorsoDeg}°`, pCenterBottomX + 45, pCenterBottomY - 20);
        }
      }

      // Layer 3: Spatial Proximity Vector
      if (showSpatialVector && report.relacionesEspaciales.distanciaNormalizada > 0) {
        const person = report.entidades.find((e) => e.clase === 'persona');
        const hazard = report.entidades.find((e) => e.clase !== 'persona');
        if (person && hazard) {
          const pX = ((person.bbox.xmin + person.bbox.xmax) / 2) * w;
          const pY = ((person.bbox.ymin + person.bbox.ymax) / 2) * h;
          const hX = ((hazard.bbox.xmin + hazard.bbox.xmax) / 2) * w;
          const hY = ((hazard.bbox.ymin + hazard.bbox.ymax) / 2) * h;

          // Proximity line
          ctx.strokeStyle = report.relacionesEspaciales.zonaProximidad === 'contacto_directo' ? '#ef4444' : '#eab308';
          ctx.setLineDash([5, 5]);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(pX, pY);
          ctx.lineTo(hX, hY);
          ctx.stroke();
          ctx.setLineDash([]);

          // Vector label
          const midX = (pX + hX) / 2;
          const midY = (pY + hY) / 2;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(midX - 45, midY - 14, 90, 24);
          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 11px monospace';
          ctx.fillText(`d = ${report.relacionesEspaciales.distanciaNormalizada}`, midX - 35, midY + 2);
        }
      }

      // Layer 4: Image Quality HUD
      if (showQualityHUD) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(16, h - 38, 380, 24);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px monospace';
        ctx.fillText(
          `LUM: ${report.calidad.luminosidadPromedio}/255 • RMS: ${report.calidad.contrasteRMS} • BLUR: ${report.calidad.desenfoqueCinetico}%`,
          26,
          h - 22
        );
      }
    };
  }, [report, showBoxes, showSkeleton, showSpatialVector, showQualityHUD]);

  const getSeverityBadge = () => {
    switch (report.severidad) {
      case 'CRITICO':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-red-950 border border-red-600 text-red-300 animate-pulse">
            SEVERIDAD CRÍTICA ({report.scoreSeveridad}/100)
          </span>
        );
      case 'ALTO':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-950 border border-amber-500 text-amber-300">
            SEVERIDAD ALTA ({report.scoreSeveridad}/100)
          </span>
        );
      case 'MEDIO':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-950 border border-blue-500 text-blue-300">
            SEVERIDAD MEDIA ({report.scoreSeveridad}/100)
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 border border-emerald-500 text-emerald-300">
            SEVERIDAD BAJA ({report.scoreSeveridad}/100)
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner of Selected Image */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-600/60 text-amber-400">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white font-mono">{report.nombreArchivo}</h3>
              <span className="text-[11px] text-slate-400 font-mono">({report.calidad.ancho}x{report.calidad.alto})</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Análisis descriptivo de atributos geométricos, espaciales y biomecánicos
            </p>
          </div>
        </div>

        <div>{getSeverityBadge()}</div>
      </div>

      {/* Main Analysis Grid: Visual Canvas on Left, Structured Attributes on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Interactive Canvas & Layer Controls */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xl flex flex-col justify-between">
          <div>
            {/* Layer Controls Toolbar */}
            <div className="flex flex-wrap items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800 text-xs gap-2">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Capas de Inspección</span>
              </span>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowBoxes(!showBoxes)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                    showBoxes
                      ? 'bg-sky-950 border-sky-500 text-sky-300'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  Cajas BBox
                </button>
                <button
                  onClick={() => setShowSkeleton(!showSkeleton)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                    showSkeleton
                      ? 'bg-amber-950 border-amber-500 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  Eje Postural θ
                </button>
                <button
                  onClick={() => setShowSpatialVector(!showSpatialVector)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                    showSpatialVector
                      ? 'bg-red-950 border-red-500 text-red-300'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  Vector Proximidad
                </button>
                <button
                  onClick={() => setShowQualityHUD(!showQualityHUD)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                    showQualityHUD
                      ? 'bg-slate-800 border-slate-700 text-slate-200'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  HUD Métricas
                </button>
              </div>
            </div>

            {/* Canvas Box */}
            <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Description Box */}
          <div className="mt-3 p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 text-xs">
            <div className="font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-sky-400" />
              <span>Descripción Factual de Atributos Observables:</span>
            </div>
            <p className="text-slate-300 leading-relaxed font-sans text-[11px]">
              {report.descripcionAtributos}
            </p>
          </div>
        </div>

        {/* Right Column: Attribute Sections */}
        <div className="lg:col-span-5 space-y-3">
          {/* Card 1: Entidades Detectadas */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span>Entidades y Objetos Observables</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {report.entidades.length} clases presentes
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {report.entidades.map((ent) => (
                <div
                  key={ent.id}
                  className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-slate-200 capitalize flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        ent.clase === 'persona' ? 'bg-sky-400' : ent.clase === 'celular' ? 'bg-amber-400' : 'bg-red-400'
                      }`} />
                      <span>{ent.clase.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {ent.ubicacionRelativa}
                    </div>
                  </div>
                  <div className="text-right font-mono text-[11px]">
                    <div className="text-slate-300 font-bold">{ent.areaRelativa}% encuadre</div>
                    <div className="text-slate-500">Conf: {Math.round(ent.confianzaObservable * 100)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Relación Espacial y Distancia Riesgo-Persona */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-sky-400" />
                <span>Relación Espacial y Distancia Riesgo-Persona</span>
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Distancia Riesgo-Persona</span>
                  <div className="font-mono text-base font-extrabold text-amber-400 mt-0.5">
                    {report.relacionesEspaciales.distanciaNormalizada}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ({report.relacionesEspaciales.distanciaRiesgoPersonaPx} px euclídeos)
                  </span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Zona de Proximidad</span>
                  <div className="font-semibold text-xs text-slate-200 mt-1 capitalize">
                    {report.relacionesEspaciales.zonaProximidad.replace(/_/g, ' ')}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Ángulo vector: {report.relacionesEspaciales.anguloVectorRiesgoDeg}°
                  </span>
                </div>
              </div>

              <div className="p-2 bg-slate-950/80 rounded-lg text-[11px] text-slate-400 border border-slate-800/80">
                {report.relacionesEspaciales.descripcionEspacial}
              </div>
            </div>
          </div>

          {/* Card 3: Biomecánica y Postura */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Biomecánica y Postura Angular</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Ángulo Inclinación (θ)</span>
                <div className={`font-mono text-base font-extrabold mt-0.5 ${
                  report.biomecanica.anguloInclinacionTorsoDeg > 20 ? 'text-red-400' : 'text-emerald-400'
                }`}>
                  {report.biomecanica.anguloInclinacionTorsoDeg}°
                </div>
                <span className="text-[10px] text-slate-400">
                  Desfase: ΔX={report.biomecanica.desviacionHombroCadera}
                </span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Postura Clasificada</span>
                <div className="font-semibold text-xs text-slate-200 mt-1 capitalize">
                  {report.biomecanica.posturaObservable.replace(/_/g, ' ')}
                </div>
                <span className="text-[10px] text-slate-400">
                  {report.biomecanica.alineacionVertical ? 'Eje vertical alineado' : 'Eje vertical desviado'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Calidad y Parámetros Técnicos */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-sky-400" />
                <span>Parámetros Ópticos y Diagnóstico de Calidad</span>
              </span>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                report.calidad.calidadDiagnostica === 'optima'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : 'bg-amber-950 text-amber-300 border border-amber-700'
              }`}>
                {report.calidad.calidadDiagnostica.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase">Luminosidad</span>
                <div className="font-mono font-bold text-slate-200 mt-0.5">
                  {report.calidad.luminosidadPromedio}<span className="text-[10px] text-slate-500">/255</span>
                </div>
              </div>

              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase">Contraste RMS</span>
                <div className="font-mono font-bold text-slate-200 mt-0.5">
                  {report.calidad.contrasteRMS}
                </div>
              </div>

              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase">Desenfoque</span>
                <div className="font-mono font-bold text-slate-200 mt-0.5">
                  {report.calidad.desenfoqueCinetico}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Direct JSON Feature Vector Output Box for Prediction Team */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-950/70 border border-amber-600/70 text-amber-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Salida Estandarizada para el Módulo de Predicción (JSON)
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Esquema v2.0.0-handshake
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Vector de características cuantitativas listo para alimentar el modelo de Machine Learning
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSwitchToContract && (
              <button
                onClick={onSwitchToContract}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Ver diccionario de datos y flujo de arquitectura"
              >
                <span>Ver Contrato Completo</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </button>
            )}

            <button
              onClick={handleCopyJson}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedJson ? '¡Copiado!' : 'Copiar JSON'}</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar .json</span>
            </button>
          </div>
        </div>

        {/* Formatted JSON Box */}
        <div className="mt-3 bg-black/90 p-4 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto max-h-[300px] text-amber-300 leading-relaxed selection:bg-amber-500 selection:text-black">
          <pre>{jsonString}</pre>
        </div>
      </div>
    </div>
  );
};

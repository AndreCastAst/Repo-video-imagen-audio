import React, { useState } from 'react';
import { ImageAttributeReport } from '../../types/imageAnalysis';
import { Code2, Copy, Check, Download, ArrowRight, Database, Cpu, Eye, FileText, CheckCircle2 } from 'lucide-react';

interface PredictionContractViewProps {
  report: ImageAttributeReport;
}

export const PredictionContractView: React.FC<PredictionContractViewProps> = ({ report }) => {
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(report.handshakePayload, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
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

  return (
    <div className="space-y-4">
      {/* Architectural Separation Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Arquitectura Desacoplada: Contrato de Integración con Módulo de Predicción
          </h3>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          Siguiendo buenas prácticas de ingeniería de software, este sistema desacopla la <b>adquisición de video/audio</b> de la <b>extracción descriptiva de atributos</b> y de la <b>inferencia predictiva de Machine Learning</b>. A continuación se detalla el flujo de responsabilidades:
        </p>

        {/* 3-Stage Pipeline Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Stage 1 */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-sky-400 mb-1">
                <span>FASE 1: ADQUISICIÓN</span>
                <span className="font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">Video & Audio</span>
              </div>
              <div className="font-bold text-xs text-slate-100 flex items-center gap-1.5 mt-1">
                <Eye className="w-4 h-4 text-sky-400" />
                <span>Módulo de Video → Imagen</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
                Detecta condiciones en vivo, dispara capturas con cooldown y almacena los fotogramas en <code>capturas_riesgo/</code> junto con telemetría de sensor.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-900 text-[10px] text-emerald-400 font-medium">
              ✓ Entrega: Archivo JPG + Metadatos
            </div>
          </div>

          {/* Stage 2 */}
          <div className="bg-slate-950 p-3.5 rounded-xl border-2 border-amber-500/80 ring-1 ring-amber-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-400 mb-1">
                <span>FASE 2: EXTRACCIÓN</span>
                <span className="font-mono text-[10px] bg-amber-950/80 px-1.5 py-0.5 rounded text-amber-300">Este Módulo</span>
              </div>
              <div className="font-bold text-xs text-white flex items-center gap-1.5 mt-1">
                <Database className="w-4 h-4 text-amber-400" />
                <span>Imagen → Vector de Atributos</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1.5 leading-snug">
                Inspecciona la imagen a fondo: mide distancias riesgo-persona, ángulos biomecánicos de torso, conteo de objetos y calidad óptica. <b>Sin realizar predicciones</b>.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-900 text-[10px] text-amber-400 font-medium">
              ✓ Entrega: Feature Vector JSON (Handshake DTO)
            </div>
          </div>

          {/* Stage 3 */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-purple-400 mb-1">
                <span>FASE 3: INFERENCIA</span>
                <span className="font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">Equipo de ML</span>
              </div>
              <div className="font-bold text-xs text-slate-100 flex items-center gap-1.5 mt-1">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span>Módulo de Predicción</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
                El modelo de Machine Learning desarrollado por tu compañero de equipo recibe el vector de características estandarizado y calcula la probabilidad de incidente.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-900 text-[10px] text-purple-400 font-medium">
              ✓ Salida: Inferencia & Probabilidad Predictiva
            </div>
          </div>
        </div>
      </div>

      {/* JSON Handshake Payload Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-amber-400">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Payload de Salida Estandarizado (Feature Vector JSON)
              </h4>
              <p className="text-[11px] text-slate-400">
                Esquema: <code>version_esquema: 2.0.0-handshake</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? '¡Copiado al Portapapeles!' : 'Copiar JSON'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar .json</span>
            </button>
          </div>
        </div>

        {/* JSON Code Box */}
        <div className="mt-3 bg-black/90 p-4 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto max-h-[380px] text-amber-200 leading-relaxed selection:bg-amber-500 selection:text-black">
          <pre>{jsonString}</pre>
        </div>
      </div>

      {/* Dictionary of Extracted Attributes for the ML Team */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-400" />
          <span>Diccionario de Datos para el Módulo de Predicción</span>
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Atributo</th>
                <th className="py-2.5 px-3">Tipo de Dato</th>
                <th className="py-2.5 px-3">Rango / Formato</th>
                <th className="py-2.5 px-3">Significado en Inferencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-sans">
              <tr>
                <td className="py-2.5 px-3 font-mono text-amber-300">conteo_celulares</td>
                <td className="py-2.5 px-3 font-mono text-slate-400">integer</td>
                <td className="py-2.5 px-3 font-mono">0, 1, 2...</td>
                <td className="py-2.5 px-3">Cantidad de dispositivos móviles detectados en el encuadre.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono text-amber-300">celular_en_contacto_mano</td>
                <td className="py-2.5 px-3 font-mono text-slate-400">boolean</td>
                <td className="py-2.5 px-3 font-mono">true / false</td>
                <td className="py-2.5 px-3">Indica si el celular está en la mano o en la zona pectoral de la persona.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono text-amber-300">distancia_minima_riesgo_normalizada</td>
                <td className="py-2.5 px-3 font-mono text-slate-400">float</td>
                <td className="py-2.5 px-3 font-mono">0.0 a 1.0</td>
                <td className="py-2.5 px-3">Distancia espacial euclídea entre el centro del operario y el objeto o zona de riesgo.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono text-amber-300">zona_proximidad</td>
                <td className="py-2.5 px-3 font-mono text-slate-400">enum (string)</td>
                <td className="py-2.5 px-3 font-mono text-[11px]">contacto_directo | zona_inmediata | distante</td>
                <td className="py-2.5 px-3">Categorización geométrica de la cercanía del peligro.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono text-amber-300">inclinacion_torso_grados</td>
                <td className="py-2.5 px-3 font-mono text-slate-400">float</td>
                <td className="py-2.5 px-3 font-mono">0° a 90°</td>
                <td className="py-2.5 px-3">Desviación angular del vector columna vertebral con respecto a la vertical.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono text-amber-300">postura_clasificada</td>
                <td className="py-2.5 px-3 font-mono text-slate-400">enum (string)</td>
                <td className="py-2.5 px-3 font-mono text-[11px]">vertical_erguido | inclinacion_critica_suelo...</td>
                <td className="py-2.5 px-3">Descripción categórica del estado postural sin asumir causa.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono text-amber-300">score_motion_blur</td>
                <td className="py-2.5 px-3 font-mono text-slate-400">integer</td>
                <td className="py-2.5 px-3 font-mono">0 a 100</td>
                <td className="py-2.5 px-3">Nivel de desenfoque por movimiento rápido estimado por gradientes.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

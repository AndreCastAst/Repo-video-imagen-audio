import React, { useState, useEffect } from 'react';
import { EvidenceRecord } from '../../types';
import { ImageAttributeReport } from '../../types/imageAnalysis';
import { ImageAttributeAnalyzer } from '../../utils/imageAnalyzer';
import { FolderExplorer } from './FolderExplorer';
import { AttributeInspector } from './AttributeInspector';
import { PredictionContractView } from './PredictionContractView';
import { Sliders, Code2, Folder, RefreshCw, AlertTriangle, Layers, Info } from 'lucide-react';

interface ImageAnalysisDashboardProps {
  evidences: EvidenceRecord[];
  onAddNewEvidence: (evidence: EvidenceRecord) => void;
}

export const ImageAnalysisDashboard: React.FC<ImageAnalysisDashboardProps> = ({
  evidences,
  onAddNewEvidence,
}) => {
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(
    evidences.length > 0 ? evidences[0].id : null
  );
  const [currentReport, setCurrentReport] = useState<ImageAttributeReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'inspector' | 'contract'>('inspector');

  // Load and analyze the selected image
  useEffect(() => {
    let isCancelled = false;

    const runAnalysis = async () => {
      const selected = evidences.find((e) => e.id === selectedEvidenceId) || evidences[0];
      if (!selected) {
        setCurrentReport(null);
        return;
      }

      setIsAnalyzing(true);
      try {
        const report = await ImageAttributeAnalyzer.analyzeImage(selected);
        if (!isCancelled) {
          setCurrentReport(report);
        }
      } catch (err) {
        console.error('Error analyzing image attributes:', err);
      } finally {
        if (!isCancelled) {
          setIsAnalyzing(false);
        }
      }
    };

    runAnalysis();

    return () => {
      isCancelled = true;
    };
  }, [selectedEvidenceId, evidences]);

  // Handle uploading an external image into the repository
  const handleUploadCustomImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const now = new Date();
      const newRecord: EvidenceRecord = {
        id: `upload_${Date.now()}`,
        motivo: 'celular', // default categorisation, analyzed right away
        timestamp: now.toISOString().replace('T', ' ').substring(0, 19),
        imageSrc: dataUrl,
        detalles: {
          descripcion: `Imagen importada externamente: ${file.name}`,
          movimiento: 0.015,
          inclinacion: 0.08,
          nivelSonido: 0,
        },
      };

      onAddNewEvidence(newRecord);
      setSelectedEvidenceId(newRecord.id);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {/* Top Module Subheader */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950 border border-amber-600/70 text-amber-400">
              MÓDULO INDEPENDIENTE 02
            </span>
            <h2 className="text-base font-bold text-white tracking-tight">
              Análisis Forense & Descriptor de Atributos de Imagen
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Exploración de <code>capturas_riesgo/</code> y descomposición en características cuantitativas (geometría, distancias, postura, óptica) para el equipo de predicción.
          </p>
        </div>

        {/* View Switcher: Inspector vs Contract */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveSubTab('inspector')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
              activeSubTab === 'inspector'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Inspección de Atributos</span>
          </button>

          <button
            onClick={() => setActiveSubTab('contract')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
              activeSubTab === 'contract'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Contrato de Predicción (JSON)</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Explorer on Left (4 cols) & Detail Workspace on Right (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Folder Explorer */}
        <div className="lg:col-span-4 min-h-[500px]">
          <FolderExplorer
            evidences={evidences}
            selectedId={selectedEvidenceId}
            onSelectEvidence={(ev) => setSelectedEvidenceId(ev.id)}
            onUploadCustomImage={handleUploadCustomImage}
          />
        </div>

        {/* Right Column: Detailed Attribute Analysis Workspace */}
        <div className="lg:col-span-8">
          {isAnalyzing ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center text-slate-400 shadow-xl flex flex-col items-center justify-center">
              <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-200">
                Extrayendo atributos de imagen...
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Calculando luminancia, contraste RMS, vectores biomecánicos y distancias espaciales
              </p>
            </div>
          ) : currentReport ? (
            activeSubTab === 'inspector' ? (
              <AttributeInspector report={currentReport} />
            ) : (
              <PredictionContractView report={currentReport} />
            )
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center text-slate-500 shadow-xl">
              <Folder className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-400" />
              <p className="text-sm font-semibold text-slate-300">
                No hay ninguna imagen seleccionada para análisis.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Selecciona una captura desde el explorador lateral o genera una nueva captura en el módulo de video.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

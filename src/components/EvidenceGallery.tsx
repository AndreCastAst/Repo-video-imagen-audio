import React, { useState } from 'react';
import { Camera, Download, Trash2, Eye, ShieldAlert, X, Filter, Sliders } from 'lucide-react';
import { EvidenceRecord, RiskCategory } from '../types';

interface EvidenceGalleryProps {
  evidences: EvidenceRecord[];
  onClear: () => void;
  onDeleteRecord: (id: string) => void;
  onOpenInAnalyzer?: (record: EvidenceRecord) => void;
}

export const EvidenceGallery: React.FC<EvidenceGalleryProps> = ({
  evidences,
  onClear,
  onDeleteRecord,
  onOpenInAnalyzer,
}) => {
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceRecord | null>(null);
  const [filter, setFilter] = useState<'all' | RiskCategory>('all');

  const filteredEvidences = evidences.filter((ev) => {
    if (filter === 'all') return true;
    return ev.motivo === filter;
  });

  const getBadge = (motivo: RiskCategory) => {
    switch (motivo) {
      case 'accidente_confirmado':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-700">ACCIDENTE CONFIRMADO</span>;
      case 'caida':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/70 text-red-400 border border-red-800">CAÍDA DETECTADA</span>;
      case 'corriendo':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700">PERSONA CORRIENDO</span>;
      case 'celular':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-700">USO DE CELULAR</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">MANUAL</span>;
    }
  };

  const handleDownload = (record: EvidenceRecord) => {
    const link = document.createElement('a');
    link.href = record.imageSrc;
    link.download = `${record.motivo}_${record.timestamp.replace(/[: ]/g, '_')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-amber-400">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100">
                Registro de Evidencias de Riesgo
              </h2>
              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full text-xs font-mono">
                {evidences.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              capturas_riesgo/ • Almacenamiento automático y manual
            </p>
          </div>
        </div>

        {/* Action and Filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-xs">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | RiskCategory)}
              className="bg-transparent text-slate-200 outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">Todos ({evidences.length})</option>
              <option value="accidente_confirmado" className="bg-slate-900">Accidentes</option>
              <option value="caida" className="bg-slate-900">Caídas</option>
              <option value="corriendo" className="bg-slate-900">Corriendo</option>
              <option value="celular" className="bg-slate-900">Celulares</option>
            </select>
          </div>

          {evidences.length > 0 && (
            <button
              onClick={onClear}
              className="px-2.5 py-1 text-slate-400 hover:text-red-400 text-xs rounded-lg hover:bg-slate-800 transition-colors"
              title="Borrar todas las capturas"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid of Evidence Cards */}
      <div className="mt-4 overflow-y-auto max-h-[380px] pr-1">
        {filteredEvidences.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <Camera className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No hay evidencias registradas en este filtro.</p>
            <p className="text-xs text-slate-600 mt-1">
              Las capturas se generarán automáticamente ante cualquier detección de riesgo o de forma manual.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredEvidences.map((record) => (
              <div
                key={record.id}
                className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden group transition-all"
              >
                {/* Thumbnail */}
                <div className="relative aspect-[4/3] bg-black overflow-hidden cursor-pointer" onClick={() => setSelectedEvidence(record)}>
                  <img
                    src={record.imageSrc}
                    alt={record.motivo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute top-2 left-2">
                    {getBadge(record.motivo)}
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <span className="p-1.5 rounded-full bg-slate-900/80 text-white">
                      <Eye className="w-4 h-4" />
                    </span>
                  </div>
                </div>

                {/* Info Card */}
                <div className="p-2.5">
                  <div className="text-[11px] font-mono text-slate-400 truncate">
                    {record.timestamp}
                  </div>
                  <div className="text-xs text-slate-300 font-medium truncate mt-0.5">
                    {record.detalles.descripcion}
                  </div>

                  {/* Actions */}
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownload(record)}
                        className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                        title="Descargar archivo JPG"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>JPG</span>
                      </button>

                      {onOpenInAnalyzer && (
                        <button
                          onClick={() => onOpenInAnalyzer(record)}
                          className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition-colors"
                          title="Analizar a fondo en Módulo de Atributos"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Analizar</span>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => onDeleteRecord(record.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Fullscreen Inspection */}
      {selectedEvidence && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getBadge(selectedEvidence.motivo)}
                <span className="text-xs font-mono text-slate-300">
                  {selectedEvidence.timestamp}
                </span>
              </div>
              <button
                onClick={() => setSelectedEvidence(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative bg-black flex items-center justify-center p-2">
              <img
                src={selectedEvidence.imageSrc}
                alt={selectedEvidence.motivo}
                className="max-h-[60vh] object-contain rounded"
              />
            </div>

            <div className="p-4 bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="text-slate-300">
                <p className="font-semibold">{selectedEvidence.detalles.descripcion}</p>
                <div className="flex gap-4 text-slate-400 mt-1 font-mono text-[11px]">
                  {selectedEvidence.detalles.movimiento !== undefined && (
                    <span>Cinética: {selectedEvidence.detalles.movimiento}</span>
                  )}
                  {selectedEvidence.detalles.inclinacion !== undefined && (
                    <span>Inclinación: {selectedEvidence.detalles.inclinacion}</span>
                  )}
                  {selectedEvidence.detalles.nivelSonido !== undefined && (
                    <span>Nivel audio: {selectedEvidence.detalles.nivelSonido}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onOpenInAnalyzer && (
                  <button
                    onClick={() => {
                      onOpenInAnalyzer(selectedEvidence);
                      setSelectedEvidence(null);
                    }}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Analizar Atributos</span>
                  </button>
                )}

                <button
                  onClick={() => handleDownload(selectedEvidence)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Evidencia (.jpg)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

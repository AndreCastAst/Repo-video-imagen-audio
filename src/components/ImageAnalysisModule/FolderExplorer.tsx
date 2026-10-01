import React, { useState } from 'react';
import { Folder, Image as ImageIcon, Upload, Filter, Calendar, HardDrive, CheckCircle2, ChevronRight, RefreshCw } from 'lucide-react';
import { EvidenceRecord, RiskCategory } from '../../types';

interface FolderExplorerProps {
  evidences: EvidenceRecord[];
  selectedId: string | null;
  onSelectEvidence: (evidence: EvidenceRecord) => void;
  onUploadCustomImage: (file: File) => void;
}

export const FolderExplorer: React.FC<FolderExplorerProps> = ({
  evidences,
  selectedId,
  onSelectEvidence,
  onUploadCustomImage,
}) => {
  const [filterMotivo, setFilterMotivo] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = evidences.filter((ev) => {
    if (filterMotivo !== 'all' && ev.motivo !== filterMotivo) return false;
    if (searchTerm) {
      const matchName = ev.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchMotivo = ev.motivo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDesc = ev.detalles.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
      return matchName || matchMotivo || matchDesc;
    }
    return true;
  });

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadCustomImage(e.target.files[0]);
    }
  };

  const getBadge = (motivo: RiskCategory) => {
    switch (motivo) {
      case 'accidente_confirmado':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-800">Accidente</span>;
      case 'caida':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/70 text-red-400 border border-red-800">Caída</span>;
      case 'corriendo':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700">Corriendo</span>;
      case 'celular':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-700">Celular</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">Manual</span>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col h-full">
      {/* Directory Path Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-950/50 border border-amber-700/60 text-amber-400">
            <Folder className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs text-amber-400 font-bold">/capturas_riesgo/</span>
              <span className="text-xs text-slate-400 font-mono">({evidences.length} archivos)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Repositorio de fotogramas generados por el módulo de video
            </p>
          </div>
        </div>

        {/* Upload Custom Image Button */}
        <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors">
          <Upload className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Cargar Imagen Externa</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInput}
          />
        </label>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <input
          type="text"
          placeholder="Buscar archivo o descripción..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-amber-500 transition-colors"
        />

        <div className="flex items-center gap-1 bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterMotivo}
            onChange={(e) => setFilterMotivo(e.target.value)}
            className="bg-transparent text-slate-200 outline-none cursor-pointer w-full"
          >
            <option value="all" className="bg-slate-900">Todos los orígenes</option>
            <option value="celular" className="bg-slate-900">Uso de Celular</option>
            <option value="corriendo" className="bg-slate-900">Persona Corriendo</option>
            <option value="caida" className="bg-slate-900">Caída / Desbalance</option>
            <option value="accidente_confirmado" className="bg-slate-900">Accidente Confirmado</option>
          </select>
        </div>
      </div>

      {/* Files List */}
      <div className="mt-3 flex-1 overflow-y-auto space-y-2 pr-1 max-h-[520px]">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <Folder className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-xs">No se encontraron capturas con este criterio.</p>
          </div>
        ) : (
          filtered.map((item) => {
            const isSelected = item.id === selectedId;
            const filename = `${item.motivo}_${item.timestamp.replace(/[: ]/g, '_')}.jpg`;

            return (
              <div
                key={item.id}
                onClick={() => onSelectEvidence(item)}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-amber-950/40 border-amber-500/80 ring-1 ring-amber-500/50'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Thumbnail */}
                  <div className="w-14 h-11 bg-black rounded-lg overflow-hidden flex-shrink-0 border border-slate-800 relative">
                    <img
                      src={item.imageSrc}
                      alt={item.motivo}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-slate-200 truncate">
                        {filename}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                      <span>{item.timestamp}</span>
                      <span>•</span>
                      {getBadge(item.motivo)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isSelected ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">En Análisis</span>
                    </span>
                  ) : (
                    <span className="p-1 rounded text-slate-500 hover:text-slate-300">
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Directory Stats Footer */}
      <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <HardDrive className="w-3.5 h-3.5 text-slate-500" />
          <span>Almacenamiento Local de Evidencias</span>
        </span>
        <span className="font-mono text-slate-300">
          {evidences.length} fotogramas disponibles
        </span>
      </div>
    </div>
  );
};

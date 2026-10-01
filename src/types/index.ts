export type RiskCategory = 'celular' | 'corriendo' | 'caida' | 'accidente_confirmado' | 'normal';

export interface EvidenceRecord {
  id: string;
  motivo: RiskCategory;
  timestamp: string;
  imageSrc: string;
  detalles: {
    movimiento?: number;
    inclinacion?: number;
    nivelSonido?: number;
    descripcion: string;
  };
}

export interface SystemConfig {
  umbralSonido: number;         // default 16 (from modulo_audio.py)
  umbralMovimiento: number;     // default 0.03 (from prueba_integracion_final.py)
  umbralInclinacion: number;    // default 0.18 (from prueba_integracion_final.py)
  cooldownSegundos: number;     // default 10s (from prueba_integracion_con_audio.py)
  audioAlarmaHabilitado: boolean;
  autoCapturaHabilitada: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  tipo: 'info' | 'alerta' | 'peligro' | 'exito';
  mensaje: string;
}

export interface DetectionState {
  personaDetectada: boolean;
  celularDetectado: boolean;
  movimiento: number;
  inclinacion: number;
  riesgoActivo: boolean;
  tipoRiesgo: RiskCategory;
  mensaje: string;
  fps: number;
  sonidoAccidenteDetectado: boolean;
  nivelSonidoActual: number;
}

export type SeverityLevel = 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';

export type ProximityZone = 'contacto_directo' | 'zona_inmediata' | 'zona_media' | 'distante';

export type PostureClassification = 
  | 'vertical_erguido' 
  | 'inclinacion_moderada' 
  | 'inclinacion_critica_suelo' 
  | 'desplazamiento_acelerado';

export interface BoundingBoxCoordinates {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface DetectedEntityAttribute {
  id: string;
  clase: 'persona' | 'celular' | 'maquinaria' | 'zona_riesgo' | 'objeto_suelo';
  confianzaObservable: number;
  bbox: BoundingBoxCoordinates;
  areaRelativa: number; // Porcentaje del encuadre ocupado
  ubicacionRelativa: string;
}

export interface ImageQualityMetrics {
  ancho: number;
  alto: number;
  relacionAspecto: string;
  luminosidadPromedio: number; // 0-255
  contrasteRMS: number;        // 0-100
  desenfoqueCinetico: number;   // Estimación de desenfoque por movimiento (0-100)
  calidadDiagnostica: 'optima' | 'aceptable' | 'degradada_por_movimiento' | 'baja_luz';
}

export interface SpatialRelationAttributes {
  distanciaRiesgoPersonaPx: number;
  distanciaNormalizada: number; // 0 a 1
  zonaProximidad: ProximityZone;
  descripcionEspacial: string;
  anguloVectorRiesgoDeg: number;
}

export interface BiomechanicalAttributes {
  anguloInclinacionTorsoDeg: number;
  desviacionHombroCadera: number;
  posturaObservable: PostureClassification;
  centroMasaEstimado: { x: number; y: number };
  alineacionVertical: boolean;
}

/**
 * Contrato de Salida DTO que este módulo entrega idealmente al Módulo de Predicción.
 * Diseñado bajo buenas prácticas para desacoplar la extracción de atributos
 * de la inferencia / predicción de ML.
 */
export interface PredictionHandshakePayload {
  version_esquema: '2.0.0-handshake';
  metadata_captura: {
    id_evidencia: string;
    nombre_archivo: string;
    timestamp_captura: string;
    origen_modulo: 'modulo_video_audio_v1';
    resolucion: { ancho: number; alto: number };
  };
  vector_caracteristicas: {
    // Entidades
    conteo_personas: number;
    conteo_celulares: number;
    celular_en_contacto_mano: boolean;
    // Métricas espaciales
    distancia_minima_riesgo_normalizada: number;
    zona_proximidad: ProximityZone;
    // Biomecánica
    inclinacion_torso_grados: number;
    desfase_horizontal_hombro_cadera: number;
    postura_clasificada: PostureClassification;
    // Calidad y contexto de imagen
    luminosidad_normalizada: number;
    score_motion_blur: number;
    // Telemetría sensorial asociada del módulo anterior
    telemetria_asociada?: {
      nivel_acustico_previo?: number;
      delta_movimiento_previo?: number;
      motivo_disparo?: string;
    };
  };
  diagnostico_descriptivo: {
    nivel_severidad_calculado: SeverityLevel;
    score_severidad_compuesto: number; // 0 a 100
    atributos_criticos_detectados: string[];
    resumen_descriptivo: string;
  };
}

export interface ImageAttributeReport {
  id: string;
  nombreArchivo: string;
  rutaLocal: string;
  tamanoBytes: number;
  fechaCreacion: string;
  imagenUrl: string;
  motivoOriginal: string;
  calidad: ImageQualityMetrics;
  entidades: DetectedEntityAttribute[];
  relacionesEspaciales: SpatialRelationAttributes;
  biomecanica: BiomechanicalAttributes;
  severidad: SeverityLevel;
  scoreSeveridad: number;
  caracteristicasDestacadas: string[];
  descripcionAtributos: string;
  handshakePayload: PredictionHandshakePayload;
}

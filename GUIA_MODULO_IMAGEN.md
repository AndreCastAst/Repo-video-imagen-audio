# Guía Técnica de Integración — Módulo de Análisis y Atributos de Imagen

**Proyecto:** Sistema de Prevención de Accidentes Laborales  
**Destinatarios:** Integrantes y Desarrolladores del Módulo de Imagen  
**Versión del Contrato:** `2.0.0-handshake`  
**Última Actualización:** 2026-09-30  

---

## 1. Propósito y Filosofía del Módulo

Este documento establece las pautas de arquitectura, responsabilidades y el contrato de datos del **Módulo de Análisis Forense y Extracción de Atributos de Imagen**.

### 🎯 Principio de Separación de Responsabilidades (SoC)

Para mantener una arquitectura limpia y desacoplada, el sistema se divide estrictamente en 3 etapas independientes:

```
┌─────────────────────────────────────────────────────────────┐
│ ETAPA 1: MÓDULO DE ADQUISICIÓN (VIDEO & AUDIO)              │
│ • Entrada: Stream de Cámara Web / Simulación + Micrófono   │
│ • Lógica: Detección en vivo (YOLOv8 + MediaPipe + Audio)    │
│ • Salida: Archivo JPG en /capturas_riesgo/ + Telemetría raw │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ ETAPA 2: MÓDULO DE IMAGEN (ESTE MÓDULO)                    │
│ • Entrada: Fotograma JPG de /capturas_riesgo/               │
│ • Lógica: Extracción determinista de atributos observables  │
│   - Geometría y distancias espaciales persona-riesgo        │
│   - Biomecánica y ángulo postural (θ)                       │
│   - Conteo de entidades y área relativa ocupada             │
│   - Calidad óptica (luminancia, contraste, motion blur)     │
│ • Salida: Feature Vector JSON (PredictionHandshakePayload)  │
│ ⚠️ REGLA DE ORO: NO REALIZA PREDICCIONES DE ACCIDENTES      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ ETAPA 3: MÓDULO DE PREDICCIÓN (EQUIPO DE ML)                │
│ • Entrada: Feature Vector JSON generado por la Etapa 2      │
│ • Lógica: Red neuronal / Modelo probabilístico de inferencia │
│ • Salida: Probabilidad predictiva de accidente o riesgo      │
└─────────────────────────────────────────────────────────────┘
```

> **Importante para el equipo de imagen:**  
> Su objetivo es **describir exhaustivamente y con precisión cuantitativa lo que hay en la imagen**. No deben intentar predecir si el sujeto sufrirá un accidente en el futuro, ya que esa tarea le corresponde exclusivamente al integrante o equipo encargado de la predicción de Machine Learning.

---

## 2. Origen y Almacenamiento de Archivos

- **Directorio de entrada:** `/capturas_riesgo/` (o `./public/capturas_riesgo/` en entorno web).
- **Convención de nomenclatura de fotogramas:**  
  `[motivo]_[YYYY-MM-DD_HH-mm-ss].jpg`  
  *Ejemplo:* `celular_2026-09-30_18-52-08.jpg`
- **Motivos de disparo válidos originados en Etapa 1:**
  - `celular`: Detección de dispositivo móvil en mano o zona de trabajo.
  - `corriendo`: Movimiento cinético anómalo de cadera ($> 0.03$).
  - `caida`: Inclinación crítica del eje corporal hombro-cadera ($> 0.18$).
  - `accidente_confirmado`: Correlación de desbalance físico con pico acústico ($> 16.0\text{ dB}$).
  - `manual`: Captura forzada por el supervisor u operador.

---

## 3. Atributos Específicos que Extrae este Módulo

El motor analítico (`src/utils/imageAnalyzer.ts`) procesa el fotograma y extrae las siguientes cuatro dimensiones de atributos:

### A. Entidades y Objetos Observables
- **Conteo de personas:** Número total de operarios en el encuadre.
- **Conteo de celulares:** Dispositivos móviles identificados.
- **Bounding Boxes (BBoxes):** Coordenadas normalizadas `[ymin, xmin, ymax, xmax]`.
- **Área relativa (%):** Porcentaje del fotograma ocupado por cada entidad detectada.
- **Ubicación en escena:** Región relativa (ej. plano superior, suelo, centro).

### B. Relación Espacial y Distancia Riesgo-Persona
- **Distancia Euclídea Normalizada ($d$):** Rango de `0.0` a `1.0`. Medida entre el centroide del operario y el objeto de riesgo (ej. celular, maquinaria, suelo).
- **Distancia en Píxeles ($d_{px}$):** Distancia calculada con la resolución real de la imagen.
- **Zona de Proximidad Categorizada:**
  - `contacto_directo`: $d < 0.14$ (celular en la mano, manipulación activa).
  - `zona_inmediata`: $0.14 \le d < 0.28$ (dentro del rango de alcance de brazos).
  - `zona_media`: $0.28 \le d < 0.50$ (en el entorno cercano del puesto de trabajo).
  - `distante`: $d \ge 0.50$ (separación física holgada).
- **Ángulo del Vector de Riesgo:** Ángulo direccional en grados ($\theta_{riesgo}$) entre el sujeto y el peligro.

### C. Biomecánica y Postura
- **Ángulo de Inclinación del Torso ($\theta_{torso}$):** Ángulo en grados respecto a la vertical ($0^\circ = \text{vertical erguido}$, $> 35^\circ = \text{desbalance severo / suelo}$).
- **Desviación Horizontal Hombro-Cadera ($\Delta X$):** Desfase medido entre articulaciones clave.
- **Postura Observable:**
  - `vertical_erguido`: Sujeto de pie en postura estándar.
  - `inclinacion_moderada`: Sujeto agachado, flexionado o cargando peso.
  - `inclinacion_critica_suelo`: Sujeto en el suelo o en ángulo de caída.
  - `desplazamiento_acelerado`: Sujeto con zancada amplia de carrera.
- **Alineación Vertical:** Booleano (`true`/`false`) que valida si el centro de gravedad está sobre la base de sustentación.

### D. Calidad Óptica de la Imagen
- **Resolución y Relación de Aspecto:** Ancho, alto y aspect ratio (ej. `640x480`, `1.33:1`).
- **Luminosidad Promedio:** Escala $0-255$ calculada con ponderación fotométrica ITU-R BT.601 ($0.299R + 0.587G + 0.114B$).
- **Contraste RMS:** Desviación estándar de luminancia ($0-100$).
- **Score de Desenfoque Cinético (*Motion Blur*):** Medición de varianza de gradientes ($0-100$). Permite al equipo de ML saber si la persona se movía a alta velocidad durante la toma.
- **Calidad Diagnóstica:** `optima`, `aceptable`, `degradada_por_movimiento`, o `baja_luz`.

---

## 4. Contrato de Datos (DTO) para el Módulo de Predicción

El Módulo de Imagen genera el siguiente esquema JSON estandarizado (`PredictionHandshakePayload`), accesible desde la interfaz con botón de copia y descarga:

```json
{
  "version_esquema": "2.0.0-handshake",
  "metadata_captura": {
    "id_evidencia": "ev_20260930_185208",
    "nombre_archivo": "celular_2026-09-30_18-52-08.jpg",
    "timestamp_captura": "2026-09-30 18:52:08",
    "origen_modulo": "modulo_video_audio_v1",
    "resolucion": {
      "ancho": 640,
      "alto": 480
    }
  },
  "vector_caracteristicas": {
    "conteo_personas": 1,
    "conteo_celulares": 1,
    "celular_en_contacto_mano": true,
    "distancia_minima_riesgo_normalizada": 0.082,
    "zona_proximidad": "contacto_directo",
    "inclinacion_torso_grados": 12.5,
    "desfase_horizontal_hombro_cadera": 0.054,
    "postura_clasificada": "vertical_erguido",
    "luminosidad_normalizada": 0.56,
    "score_motion_blur": 18,
    "telemetria_asociada": {
      "nivel_acustico_previo": 5.2,
      "delta_movimiento_previo": 0.012,
      "motivo_disparo": "celular"
    }
  },
  "diagnostico_descriptivo": {
    "nivel_severidad_calculado": "ALTO",
    "score_severidad_compuesto": 60,
    "atributos_criticos_detectados": [
      "DISPOSITIVO_MOVIL_DETECTADO",
      "MANIPULACION_ACTIVA_MANO_PECHO"
    ],
    "resumen_descriptivo": "Encuadre de 640x480 con luminosidad media 142/255. Dispositivo celular ubicado en contacto directo a 0.082 del operario con manipulación activa en extremidades superiores."
  }
}
```

### Diccionario de Datos para el Ingeniero de Machine Learning

| Campo | Tipo | Rango / Valores | Uso en el Modelo Predictivo |
| :--- | :--- | :--- | :--- |
| `conteo_personas` | `int` | $0, 1, 2, \dots$ | Densidad de trabajadores en el área. |
| `conteo_celulares` | `int` | $0, 1, \dots$ | Presencia de elementos distractores. |
| `celular_en_contacto_mano` | `bool` | `true` / `false` | Distracción cognitiva severa (interacción táctil/visual). |
| `distancia_minima_riesgo_normalizada` | `float` | $0.000 - 1.000$ | Cercanía geométrica al vector de peligro. |
| `zona_proximidad` | `string` | `contacto_directo`, `zona_inmediata`, `zona_media`, `distante` | Feature categórica de criticidad espacial. |
| `inclinacion_torso_grados` | `float` | $0^\circ - 90^\circ$ | Ángulo de estabilidad biomecánica. |
| `desfase_horizontal_hombro_cadera` | `float` | $0.000 - 0.500$ | Desplazamiento horizontal relativo de la masa corporal. |
| `postura_clasificada` | `string` | `vertical_erguido`, `inclinacion_moderada`, `inclinacion_critica_suelo`, `desplazamiento_acelerado` | Clasificación posicional estandarizada. |
| `luminosidad_normalizada` | `float` | $0.00 - 1.00$ | Ponderación de visibilidad de la escena. |
| `score_motion_blur` | `int` | $0 - 100$ | Nivel de desenfoque por velocidad del sujeto. |
| `nivel_acustico_previo` | `float` | $0.0 - 40.0$ | Registro de decibeles previo al disparo del fotograma. |

---

## 5. Estructura de Archivos del Módulo en el Código

```
src/
├── types/
│   ├── index.ts                     # Tipos generales del sistema (evidencias, logs, config)
│   └── imageAnalysis.ts             # Tipos y Contrato DTO del Módulo de Imagen
│
├── utils/
│   ├── audioEngine.ts               # Síntesis sonora y análisis de micrófono (Etapa 1)
│   ├── visionEngine.ts              # Visión de video en vivo (Etapa 1)
│   └── imageAnalyzer.ts             # MOTOR ANALÍTICO DE ATRIBUTOS DE IMAGEN (Etapa 2)
│
├── components/
│   ├── ImageAnalysisModule/         # CARPETA DEL MÓDULO DE IMAGEN
│   │   ├── ImageAnalysisDashboard.tsx  # Contenedor maestro del módulo
│   │   ├── FolderExplorer.tsx          # Explorador visual de /capturas_riesgo/
│   │   ├── AttributeInspector.tsx      # Visor con capas interactivas (BBoxes, θ, d)
│   │   └── PredictionContractView.tsx  # Visor, copiado y descarga del JSON Handshake
│   │
│   ├── Header.tsx                   # Selector de pestañas superiores (Módulo 1 vs Módulo 2)
│   ├── VideoFeed.tsx                # Cámara y simulador en vivo
│   ├── AudioMonitor.tsx             # Monitor acústico
│   └── EvidenceGallery.tsx          # Galería rápida con botón "Analizar Atributos"
│
└── App.tsx                          # Orquestador principal de estado compartido
```

---

## 6. Flujo de Trabajo para Nuevas Funcionalidades

Si van a incorporar nuevas capacidades al módulo de imagen, sigan estas recomendaciones:

1. **Si agregan un nuevo atributo observable (ej. uso de casco o chaleco):**
   - Agreguen el campo en `src/types/imageAnalysis.ts` dentro de `vector_caracteristicas`.
   - Modifiquen `extractEntities()` o `evaluateDescriptiveSeverity()` en `src/utils/imageAnalyzer.ts`.
   - Incorporen la capa visual en `src/components/ImageAnalysisModule/AttributeInspector.tsx`.
   - Notifiquen al integrante de predicción sobre la nueva clave en el JSON.

2. **Eviten introducir lógica predictiva en este módulo:**
   - Mantengan los cálculos basados en geometría, óptica y mediciones medibles.
   - Dejen que el scoring probabilístico de accidentes futuros lo decida el modelo de ML en la Etapa 3.

3. **Para probar imágenes personalizadas:**
   - Pueden usar el botón **"Cargar Imagen Externa"** en el encabezado del explorador de carpetas (`FolderExplorer.tsx`). Esto permite someter cualquier fotografía tomada fuera de la app al pipeline de extracción de atributos sin necesidad de activar la cámara web.

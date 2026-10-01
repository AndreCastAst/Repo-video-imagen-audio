# Sistema de Prevención de Accidentes Laborales

Sistema inteligente para detección temprana de riesgos laborales y prevención de accidentes mediante visión artificial, análisis de postura y detección acústica de impacto.

Migrado a Node.js + React + Vite + Tailwind CSS para su despliegue en Google AI Studio.

---

## 🚀 Características Principales

### 1. Monitoreo de Video y Detección de Riesgos (YOLOv8 + MediaPipe Pose)
- **Detección de Personas y Postura**: Monitoreo continuo de operarios en zonas de trabajo.
- **Riesgo por Distracción (Uso de Celular)**: Detección de dispositivos móviles en áreas restringidas (`label: "cell phone"`).
- **Riesgo por Desplazamiento Rápido**: Detección de persona corriendo mediante cálculo cinético de velocidad de cadera (`movimiento > 0.03`).
- **Riesgo por Caída o Desbalance**: Detección de pérdida de verticalidad analizando la desviación horizontal hombro-cadera (`inclinación > 0.18`).
- **Doble Modo de Operación**:
  - **Cámara Web Real**: Procesamiento directo desde la cámara del dispositivo con permisos web.
  - **Simulador Interactivo**: Escenarios predefinidos para pruebas de validación instantáneas (Normal, Corriendo, Celular, Caída, Impacto).

### 2. Módulo de Audio y Alerta Acústica (Web Audio API)
- **Análisis de Espectro en Tiempo Real**: Escucha activa mediante micrófono con cálculo de norma euclídea de amplitud RMS (equivalente a `np.linalg.norm(audio)`).
- **Umbral de Sonido de Impacto**: Detección de ruido fuerte/colisión (`UMBRAL_SONIDO = 16.0`).
- **Sirena Acústica de Emergencia**: Síntesis de sonido de alarma de dos tonos alternados (1500 Hz y 800 Hz en 5 ciclos) acorde al diseño original de `modulo_audio.py`.
- **Botón de Simulación de Impacto**: Permite probar la correlación cinético-acústica sin emitir ruidos externos.

### 3. Registro y Gestión de Evidencias (`capturas_riesgo`)
- **Captura Automática**: Guardado de fotograma ante eventos de riesgo con cooldown configurable de 10 segundos.
- **Captura Manual**: Permite al supervisor registrar una instantánea bajo demanda.
- **Galería de Evidencias**: Inspección detallada con zoom, filtros por tipo de riesgo y descarga en formato JPG.
- **Evidencia Histórica Incluida**: Conserva las capturas de prueba del repositorio original.

### 4. Consola y Calibración
- **Terminal de Salida**: Flujo de logs en vivo idéntico a la consola de ejecución de Python.
- **Panel de Calibración**: Ajuste fino de umbrales de audio (5 a 35), movimiento (0.01 a 0.08), ángulo de inclinación (0.08 a 0.35) y cooldown.

---

## 🛠️ Tecnologías

- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS v4, Lucide React
- **Audio**: Web Audio API (OscillatorNode, GainNode, AnalyserNode)
- **Visión y Gráficos**: HTML5 Canvas con renderizado OSD estilo OpenCV

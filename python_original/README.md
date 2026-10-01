# Código Fuente Original en Python — Sistema de Prevención de Accidentes

Esta carpeta conserva íntegros los scripts originales desarrollados en Python para ejecución en entorno local de escritorio con cámara web y micrófono físicos.

---

## 2. ¿Qué pasó con cada elemento específico?

Durante la adaptación del proyecto a la plataforma web de Google AI Studio (entorno basado en Node.js 22 accesible mediante navegador web), cada elemento del repositorio original fue tratado de la siguiente manera:

| Archivo / Componente Original | Estado en la Aplicación Web (Node.js/React) | Dónde se encuentra en el proyecto |
| :--- | :--- | :--- |
| `modulo_audio.py`<br>*(sounddevice, winsound, UMBRAL_SONIDO=16)* | **Migrado a Web Audio API nativa** (`src/utils/audioEngine.ts` y `AudioMonitor.tsx`). Reproduce exactamente los mismos tonos (1500 Hz y 800 Hz en 5 ciclos) y el análisis de amplitud espectral RMS mediante el micrófono del navegador. | Script original preservado en `python_original/modulo_audio.py`. |
| `prueba_integracion_final.py`<br>`prueba_integracion_con_audio.py` | **Migrado al motor de visión web** (`src/utils/visionEngine.ts` y `VideoFeed.tsx`). Procesa fotogramas en Canvas HTML5, calcula cinemática de cadera (umbral `> 0.03`), inclinación hombro-cadera (umbral `> 0.18`), alertas OSD estilo OpenCV (`cv2.putText`) y cooldown de 10s. | Scripts originales preservados en `python_original/prueba_integracion_final.py` y `python_original/prueba_integracion_con_audio.py`. |
| `capturas_riesgo/*.jpg`<br>*(ej. prueba_camara_20260930_185208_177085.jpg)* | **Conservadas intactas.** Se trasladaron a la carpeta estática del servidor web para alimentar la galería de evidencias y el módulo de análisis forense de imágenes. | Disponibles en `public/capturas_riesgo/`. |
| `yolov8n_oficial.pt`<br>*(Pesos binarios de PyTorch)* | Los archivos de pesos binarios `.pt` dependen del runtime nativo de Python/PyTorch y no pueden ejecutarse dentro del sandbox del navegador web sin un backend C++. Las detecciones de clases (`person`, `cell phone`) y sus umbrales se mapearon a la interfaz web con simulador y cámara en vivo. | Si se ejecuta en Python local, la librería `ultralytics` descarga automáticamente el archivo base `yolov8n.pt`. |
| `pose_landmarker_full.task` | Es el archivo de modelo binario empaquetado de MediaPipe Tasks. En la web se sustituyó por cálculo geométrico y de gradientes en Canvas. | Descargable en local desde el repositorio oficial de MediaPipe Tasks. |
| `__pycache__/*.pyc` | Eran archivos binarios de compilación intermedia de Python 3.13 en local (`modulo_audio.cpython-313.pyc`). Se descartaron por tratarse de artefactos temporales que no deben versionarse en repositorios de código. | No requeridos en el repositorio. |

---

## 🚀 Cómo ejecutar estos scripts de Python en tu computadora local

Si deseas ejecutar el código original en tu máquina física (sin interfaz web):

### Paso 1: Requisitos previos
- Tener instalado **Python 3.10, 3.11, 3.12 o 3.13**.
- Disponer de una **cámara web** conectada (índice `0`).
- Disponer de un **micrófono** activo para el módulo de audio.
- Sistema operativo: **Windows** (recomendado para `winsound`) o Linux/macOS.

### Paso 2: Crear un entorno virtual (recomendado)
Abre tu terminal en la carpeta `python_original/`:
```bash
python -m venv venv
```
Activa el entorno:
- En Windows:
  ```bash
  venv\Scripts\activate
  ```
- En Linux / macOS:
  ```bash
  source venv/bin/activate
  ```

### Paso 3: Instalar dependencias
```bash
pip install -r requirements.txt
```

### Paso 4: Descargar el modelo MediaPipe Pose Task
El script requiere el archivo `pose_landmarker_full.task` en el mismo directorio. Puedes descargarlo ejecutando:
- En PowerShell / Bash:
  ```bash
  curl -O https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task
  ```

### Paso 5: Ejecutar los scripts
- Para probar solo el detector de audio y la alarma:
  ```bash
  python modulo_audio.py
  ```
- Para ejecutar la visión con cámara web y detección de postura:
  ```bash
  python prueba_integracion_final.py
  ```
- Para ejecutar la integración completa continua (visión + audio + cooldown):
  ```bash
  python prueba_integracion_con_audio.py
  ```
- Presiona la tecla **`q`** sobre la ventana de OpenCV para detener la ejecución.

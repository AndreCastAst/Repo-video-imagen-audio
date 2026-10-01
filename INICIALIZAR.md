# Guía de Inicialización Manual del Sistema (Paso a Paso)

Esta guía está redactada para que **cualquier persona o desarrollador**, sin necesidad de utilizar asistentes o herramientas de inteligencia artificial, pueda poner en marcha este programa en su computadora desde cero.

El proyecto cuenta con **dos modalidades de ejecución**:
1. **Aplicación Web Completa (Recomendada):** Interfaz gráfica moderna con panel de control, cámara en vivo, simulador interactivo de riesgos, monitor de audio y el **Analizador Forense de Imágenes** con exportación JSON para el módulo de predicción.
2. **Scripts de Escritorio en Python:** Código original para ejecución directa en consola con OpenCV y ventanas nativas.

---

## OPCIÓN 1: Ejecutar la Aplicación Web (Node.js + React)

Esta es la versión principal del proyecto que incluye todas las funcionalidades integradas.

### 📋 Requisitos Previos
Debes tener instalado en tu computadora:
- **Node.js** (versión 18 o superior). Puedes verificarlo abriendo una terminal y escribiendo:
  ```bash
  node -v
  ```
  *(Si no lo tienes instalado, descárgalo gratis desde [nodejs.org](https://nodejs.org/))*.
- Un navegador web moderno (Google Chrome, Microsoft Edge, Firefox, Brave).

---

### 🚀 Pasos de Instalación y Ejecución

#### Paso 1: Abrir la terminal en la carpeta del proyecto
Abre la terminal (Símbolo del sistema, PowerShell o Terminal de macOS/Linux) y sitúate en la carpeta raíz del proyecto (donde se encuentra el archivo `package.json`).

#### Paso 2: Instalar las librerías del proyecto
Ejecuta el siguiente comando para descargar e instalar todas las dependencias necesarias:
```bash
npm install
```
*Espera a que finalice la descarga. Se creará una carpeta llamada `node_modules`.*

#### Paso 3: Iniciar el servidor local
Una vez terminada la instalación, inicia el servidor de desarrollo ejecutando:
```bash
npm run dev
```

Verás una salida similar a esta en tu consola:
```
  VITE v6.4.3  ready in 320 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

#### Paso 4: Abrir la aplicación en el navegador
Abre tu navegador web e ingresa a la siguiente dirección:
👉 **[http://localhost:3000](http://localhost:3000)**

---

### 🖥️ Cómo Utilizar la Aplicación Web

Una vez abierta en tu navegador, dispones de dos módulos accesibles desde la barra superior:

1. **Pestaña "1. Monitoreo en Vivo":**
   - **Modo Cámara Web:** Haz clic en *"Iniciar Cámara Web"* y concede los permisos de cámara y micrófono cuando el navegador te lo solicite.
   - **Modo Simulador Interactivo:** Si no dispones de cámara física o deseas realizar pruebas rápidas, selecciona el botón *"Simulador"* y prueba los escenarios predefinidos:
     - *Normal:* Sin alertas.
     - *Uso de Celular:* Detección de distracción en mano.
     - *Persona Corriendo:* Alerta por velocidad cinemática excesiva.
     - *Caída / Desbalance:* Detección por ángulo crítico hombro-cadera.
     - *Accidente Confirmado:* Detección de impacto cinético + sonido.
   - **Monitor de Audio:** Puedes hacer clic en *"Escuchar Micrófono"* para monitorear el ruido ambiental o pulsar *"Simular Sonido Fuerte"* para comprobar el disparo de la alarma acústica (1500 Hz / 800 Hz).
   - **Captura de Evidencias:** Cada evento de riesgo guarda un fotograma en la galería de evidencias inferior con un cooldown de 10 segundos.

2. **Pestaña "2. Analizador de Imágenes":**
   - Muestra todos los archivos guardados en la carpeta `capturas_riesgo/`.
   - Puedes hacer clic en cualquier captura para inspeccionar sus atributos:
     - **Capas Visuales:** Activa o desactiva las cajas delimitadoras (BBoxes), el vector de ángulo postural ($\theta$) y la distancia de proximidad al peligro.
     - **Métricas:** Muestra la luminosidad promedio ($0-255$), contraste RMS, desenfoque cinético (*motion blur*) y distancia normalizada.
   - **Subpestaña "Contrato de Predicción (JSON)":**
     - Genera automáticamente el vector de características en formato JSON (`version_esquema: 2.0.0-handshake`).
     - Cuenta con un botón para **Copiar JSON** y otro para **Descargar .json**, listo para ser entregado al integrante que entrena o ejecuta el modelo de Machine Learning.
   - **Cargar Imagen Externa:** Si tienes una foto guardada en tu disco duro que quieras analizar, pulsa el botón *"Cargar Imagen Externa"* en el explorador de la izquierda.

---

## OPCIÓN 2: Ejecutar los Scripts Originales en Python

Si prefieres ejecutar los scripts de consola originales usando Python local:

### 📋 Requisitos Previos
- **Python 3.10, 3.11, 3.12 o 3.13** instalado en tu sistema.
- Cámara web física conectada.
- Micrófono activo.
- Sistema operativo: **Windows** (recomendado debido a la librería nativa `winsound`) o Linux/macOS.

---

### 🚀 Pasos de Instalación en Python

#### Paso 1: Ir a la carpeta de Python
Abre tu terminal y dirígete a la subcarpeta `python_original`:
```bash
cd python_original
```

#### Paso 2: Crear un entorno virtual (muy recomendado)
```bash
python -m venv venv
```
Activa el entorno virtual:
- En **Windows (CMD o PowerShell)**:
  ```bash
  venv\Scripts\activate
  ```
- En **Linux / macOS**:
  ```bash
  source venv/bin/activate
  ```

#### Paso 3: Instalar las dependencias de Python
Ejecuta:
```bash
pip install -r requirements.txt
```

#### Paso 4: Descargar el modelo de MediaPipe Pose
Para que el detector de postura funcione, descarga el archivo `pose_landmarker_full.task` dentro de la carpeta `python_original/`:
- En Windows (PowerShell) o Linux/macOS:
  ```bash
  curl -O https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task
  ```

#### Paso 5: Ejecutar el programa deseado
- **Para probar la detección de sonido e impacto acústico:**
  ```bash
  python modulo_audio.py
  ```
- **Para ejecutar la visión por cámara con YOLOv8 y MediaPipe Pose:**
  ```bash
  python prueba_integracion_final.py
  ```
- **Para ejecutar la integración continua completa (visión + audio + cooldown):**
  ```bash
  python prueba_integracion_con_audio.py
  ```
*(Nota: Para salir de la ventana de video en cualquier momento, haz clic sobre la ventana y presiona la tecla **q**)*.

---

## 🛠️ Preguntas Frecuentes y Solución de Problemas

### 1. El navegador no me pide permiso para la cámara o el micrófono
- Verifica en la barra de direcciones de tu navegador el ícono de candado o configuración del sitio y asegúrate de que los permisos de **Cámara** y **Micrófono** estén configurados en **Permitir**.
- Si no deseas usar la cámara física, puedes usar la pestaña *"Simulador"* que no requiere hardware externo.

### 2. Error: "Port 3000 is already in use"
Si el puerto 3000 está ocupado por otra aplicación en tu computadora, puedes iniciar el servidor en otro puerto ejecutando:
```bash
npx vite --port 3005
```
Y luego abrir `http://localhost:3005` en tu navegador.

### 3. En Linux/macOS el archivo de Python arroja error con `winsound`
`winsound` es un módulo exclusivo del sistema operativo Windows. La versión web (Opción 1) soluciona esto utilizando la Web Audio API estándar, que funciona de forma idéntica en Windows, Linux, macOS y dispositivos móviles. Si necesitas correrlo en Python en Linux, puedes reemplazar `winsound.Beep` por la librería multiplataforma `playsound` o `beep`.

### 4. ¿Dónde se guardan las fotos capturadas en la versión web?
En la aplicación web, las imágenes capturadas se gestionan en memoria y se pueden descargar individualmente en formato `.jpg` haciendo clic en el botón **JPG** o **Descargar Evidencia** de cada tarjeta.

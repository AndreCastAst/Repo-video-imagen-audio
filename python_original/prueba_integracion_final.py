import cv2
from ultralytics import YOLO

import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

import datetime
import os
import winsound
import time
from modulo_audio import detectar_sonido_accidente, activar_alarma

ultimo_riesgo = 0
timestamp_mp = 0
posicion_anterior = None
tiempo = 0
# ==========================
# YOLO
# ==========================

modelo = YOLO("yolov8n.pt")

modelo.overrides["verbose"] = False

# ==========================
# MediaPipe Pose
# ==========================

base_options = python.BaseOptions(
    model_asset_path=r"pose_landmarker_full.task"
)


options = vision.PoseLandmarkerOptions(
    base_options=base_options,
    running_mode=vision.RunningMode.VIDEO
)


pose = vision.PoseLandmarker.create_from_options(
    options
)



# ==========================
# Cámara
# ==========================

camara = cv2.VideoCapture(0)


# Reducir resolución para mejorar velocidad

camara.set(
    cv2.CAP_PROP_FRAME_WIDTH,
    480
)

camara.set(
    cv2.CAP_PROP_FRAME_HEIGHT,
    360
)


contador = 0

# Guardar resultados YOLO

resultados = []

def guardar_evidencia(frame, motivo):

    carpeta = "capturas_riesgo"


    # Crear carpeta si no existe

    if not os.path.exists(carpeta):

        os.makedirs(carpeta)


    fecha = datetime.datetime.now().strftime(
        "%Y-%m-%d_%H-%M-%S"
    )


    nombre = (
        carpeta
        + "/"
        + motivo
        + "_"
        + fecha
        + ".jpg"
    )


    cv2.imwrite(
        nombre,
        frame
    )


    print(
        "Evidencia guardada:",
        nombre
    )


    winsound.Beep(
        1000,
        1000
    )

inicio = time.time()
while True:


    ret, frame = camara.read()


    if not ret:
        break



    # ==========================
    # YOLO
    # ==========================

    contador += 1


    persona = False
    celular = False
    riesgo = False
    movimiento = 0


    # Ejecutar YOLO cada 5 frames

    if contador % 5 == 0:

        resultados = modelo(frame)


        for resultado in resultados:


            for caja in resultado.boxes:


                clase = int(
                    caja.cls[0]
                )


                nombre = modelo.names[clase]


                if nombre == "person":

                    persona = True


                if nombre == "cell phone":

                    celular = True



            # ==========================
            # MediaPipe
            # ==========================


            rgb = cv2.cvtColor(
                frame,
                cv2.COLOR_BGR2RGB
            )


            mp_image = mp.Image(
                image_format=mp.ImageFormat.SRGB,
                data=rgb
            )


            resultado_pose = None


            if contador % 5 == 0:

                timestamp_mp += 33   # aproximadamente 30 FPS

                resultado_pose = pose.detect_for_video(
                    mp_image,
                    timestamp_mp
)

            else:

                resultado_pose = None


            if resultado_pose and len(resultado_pose.pose_landmarks) > 0:

                puntos = resultado_pose.pose_landmarks[0]


        if resultado_pose and len(resultado_pose.pose_landmarks) > 0:

            puntos = resultado_pose.pose_landmarks[0]

            # ------------------------------
            # Detección de movimiento
            # ------------------------------

            cadera = puntos[23]

            posicion_actual = (
                cadera.x,
                cadera.y
            )

            movimiento = 0

            if posicion_anterior is not None:

                movimiento = (
                    abs(posicion_actual[0] - posicion_anterior[0])
                    +
                    abs(posicion_actual[1] - posicion_anterior[1])
                )

            posicion_anterior = posicion_actual


            # ------------------------------
            # Detección de caída
            # ------------------------------

            hombro = puntos[11]
            cadera = puntos[23]

            inclinacion = abs(
                hombro.x - cadera.x
            )

            if inclinacion > 0.18:
                riesgo = True



                # ==========================
                # Evaluación de riesgo
                # ==========================


                tiempo = time.time()


            if celular:

                mensaje = "RIESGO: USO DE CELULAR"

                guardar_evidencia(
                    frame,
                    "celular"
                )


            elif movimiento > 0.03:

                mensaje = "RIESGO: PERSONA CORRIENDO"


                print("⚠️ MOVIMIENTO DETECTADO")


                sonido = detectar_sonido_accidente()


                print(
                    "Resultado audio:",
                    sonido
                )


                if sonido:

                    print(
                        "🚨 SONIDO CONFIRMADO"
                    )


                    activar_alarma()


                guardar_evidencia(
                    frame,
                    "corriendo"
    )

        
            else:

                mensaje = "Movimiento normal"



        cv2.putText(
            frame,
            mensaje,
            (30,50),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0,0,255),
            2
        )
        fps = 1/(time.time()-inicio)

        inicio = time.time()


        cv2.putText(
            frame,
            f"FPS: {int(fps)}",
            (30,90),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0,255,0),
            2
        )

        cv2.imshow(
            "Sistema prevencion accidentes",
            frame
        )

        if cv2.waitKey(1) & 0xFF == ord("q"):

         break



camara.release()
cv2.destroyAllWindows()

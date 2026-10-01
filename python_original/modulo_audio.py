import sounddevice as sd
import numpy as np
import time
import winsound


def activar_alarma():

    for i in range(5):

        winsound.Beep(
            1500,
            500
        )

        time.sleep(0.2)

        winsound.Beep(
            800,
            500
        )

        time.sleep(0.2)

def detectar_sonido_accidente():

    duracion = 0.5
    frecuencia = 44100

    UMBRAL_SONIDO = 16


    contador_ruido = 0


    print("Analizando sonido...")


    tiempo_inicio = time.time()


    while time.time() - tiempo_inicio < 5:
        

        audio = sd.rec(
            int(duracion * frecuencia),
            samplerate=frecuencia,
            channels=1
        )


        sd.wait()


        volumen = np.linalg.norm(audio)


        print(
            "Nivel sonido:",
            round(volumen,2)
        )


        if volumen > UMBRAL_SONIDO:

            contador_ruido += 1


        else:

            contador_ruido = 0



        if contador_ruido >= 1:


            print(
                "🚨 Sonido asociado a posible accidente"
            )

            return True



    return False


if __name__ == "__main__":


    resultado = detectar_sonido_accidente()


    if resultado:

        activar_alarma()


    else:

        print(
            "No se detectó accidente"
        )

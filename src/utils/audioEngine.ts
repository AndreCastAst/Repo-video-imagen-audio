/**
 * Modulo de Audio (Migración directa de modulo_audio.py con Web Audio API)
 *
 * En Python original:
 * - winsound.Beep(1500, 500) -> 1500 Hz durante 500ms
 * - winsound.Beep(800, 500)  -> 800 Hz durante 500ms
 * - Repetido 5 veces
 * - Umbral de sonido = 16
 */

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphoneStream: MediaStream | null = null;
  private isAlarmPlaying = false;
  private alarmTimeouts: number[] = [];

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Genera un beep con frecuencia y duración en ms (reemplaza winsound.Beep)
   */
  public beep(frequency: number, durationMs: number, type: OscillatorType = 'sine'): Promise<void> {
    return new Promise((resolve) => {
      try {
        const ctx = this.getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, ctx.currentTime);

        // Suave envolvente para evitar clics acústicos
        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + Math.max(0.06, (durationMs - 60) / 1000));
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + durationMs / 1000);

        setTimeout(() => {
          resolve();
        }, durationMs);
      } catch (err) {
        console.warn('Audio play error:', err);
        resolve();
      }
    });
  }

  /**
   * Beep para captura de evidencia: winsound.Beep(1000, 1000)
   */
  public playEvidenceSavedBeep(): void {
    this.beep(1000, 400, 'square');
  }

  /**
   * activa la alarma sonora de 5 ciclos con 1500Hz y 800Hz
   * Idéntico a activar_alarma() en modulo_audio.py
   */
  public async activarAlarma(): Promise<void> {
    if (this.isAlarmPlaying) return;
    this.isAlarmPlaying = true;

    try {
      for (let i = 0; i < 5; i++) {
        if (!this.isAlarmPlaying) break;
        // Beep alto: 1500 Hz x 500 ms
        await this.beep(1500, 450, 'sawtooth');
        if (!this.isAlarmPlaying) break;
        await new Promise((r) => setTimeout(r, 150));

        // Beep bajo: 800 Hz x 500 ms
        await this.beep(800, 450, 'sawtooth');
        if (!this.isAlarmPlaying) break;
        await new Promise((r) => setTimeout(r, 150));
      }
    } finally {
      this.isAlarmPlaying = false;
    }
  }

  public detenerAlarma(): void {
    this.isAlarmPlaying = false;
  }

  public getAlarmState(): boolean {
    return this.isAlarmPlaying;
  }

  /**
   * Inicia el análisis del micrófono en tiempo real
   */
  public async startMicrophone(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.microphoneStream = stream;
      const ctx = this.getAudioContext();
      const source = ctx.createMediaStreamSource(stream);
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.3;
      source.connect(this.analyser);
      return true;
    } catch (err) {
      console.warn('Microphone access not granted or unavailable:', err);
      return false;
    }
  }

  public stopMicrophone(): void {
    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach((track) => track.stop());
      this.microphoneStream = null;
    }
    this.analyser = null;
  }

  /**
   * Obtiene el nivel de sonido instantáneo calibrado para asemejarse
   * a np.linalg.norm(audio) con escala proporcional a UMBRAL_SONIDO (16).
   */
  public getSoundLevel(): number {
    if (!this.analyser) return 0;

    const buffer = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buffer);

    // Calcular la norma euclídea (Frobenius norm) similar a np.linalg.norm
    let sumSquares = 0;
    for (let i = 0; i < buffer.length; i++) {
      sumSquares += buffer[i] * buffer[i];
    }
    const norm = Math.sqrt(sumSquares);
    // Escalar para mapear rangos normales (habla normal ~ 2-8, aplauso/golpe ~ 16-35)
    return Math.round(norm * 1.8 * 10) / 10;
  }
}

export const audioEngine = new AudioEngine();

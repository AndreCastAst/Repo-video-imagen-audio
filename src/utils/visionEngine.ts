import { RiskCategory, SystemConfig } from '../types';

export interface BoundingBox {
  label: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface SkeletonPoint {
  x: number;
  y: number;
  confidence: number;
}

export interface VisionFrameResult {
  mensaje: string;
  personaDetectada: boolean;
  celularDetectado: boolean;
  movimiento: number;
  inclinacion: number;
  riesgo: boolean;
  tipoRiesgo: RiskCategory;
  boundingBoxes: BoundingBox[];
  landmarks: {
    nariz?: SkeletonPoint;
    hombroIzquierdo?: SkeletonPoint;
    hombroDerecho?: SkeletonPoint;
    caderaIzquierda?: SkeletonPoint;
    caderaDerecha?: SkeletonPoint;
    rodilla?: SkeletonPoint;
    tobillo?: SkeletonPoint;
  };
}

export class SimulationController {
  private tick = 0;

  public getSimulationFrame(
    scenario: 'normal' | 'corriendo' | 'celular' | 'caida' | 'accidente_sonido',
    config: SystemConfig,
    soundLevel: number
  ): VisionFrameResult {
    this.tick++;
    const t = this.tick * 0.05;

    let personaDetectada = true;
    let celularDetectado = false;
    let movimiento = 0.01;
    let inclinacion = 0.04;
    let tipoRiesgo: RiskCategory = 'normal';
    let mensaje = 'Movimiento normal';
    let riesgo = false;

    // Model landmarks normalized [0, 1]
    let shoulderX = 0.48;
    let shoulderY = 0.35;
    let hipX = 0.48;
    let hipY = 0.60;
    let boxX = 0.38;
    let boxY = 0.20;
    let boxW = 0.24;
    let boxH = 0.68;

    switch (scenario) {
      case 'normal':
        // Gentle sway
        shoulderX = 0.48 + Math.sin(t) * 0.01;
        hipX = 0.48 + Math.sin(t * 0.9) * 0.01;
        movimiento = 0.012 + Math.abs(Math.sin(t)) * 0.006;
        inclinacion = Math.abs(shoulderX - hipX);
        mensaje = 'Movimiento normal';
        break;

      case 'corriendo':
        // Fast movement across screen
        const cycle = (this.tick % 120) / 120;
        shoulderX = 0.15 + cycle * 0.70;
        hipX = shoulderX - 0.04; // leaning forward
        boxX = Math.max(0.05, shoulderX - 0.12);
        movimiento = config.umbralMovimiento + 0.025 + Math.abs(Math.sin(t * 3)) * 0.015;
        inclinacion = Math.abs(shoulderX - hipX);
        riesgo = true;
        tipoRiesgo = 'corriendo';
        mensaje = 'RIESGO: PERSONA CORRIENDO';
        break;

      case 'celular':
        celularDetectado = true;
        shoulderX = 0.50;
        hipX = 0.50;
        movimiento = 0.008;
        inclinacion = 0.03;
        riesgo = true;
        tipoRiesgo = 'celular';
        mensaje = 'RIESGO: USO DE CELULAR';
        break;

      case 'caida':
        // Person falling horizontally
        shoulderX = 0.66;
        shoulderY = 0.68;
        hipX = 0.40;
        hipY = 0.72;
        boxX = 0.30;
        boxY = 0.55;
        boxW = 0.45;
        boxH = 0.28;
        inclinacion = Math.abs(shoulderX - hipX); // ~ 0.26 > 0.18
        movimiento = 0.015;
        riesgo = true;
        tipoRiesgo = 'caida';
        mensaje = 'RIESGO: CAÍDA / INCLINACIÓN CRÍTICA';
        break;

      case 'accidente_sonido':
        // Fall combined with sound crash
        shoulderX = 0.70;
        shoulderY = 0.70;
        hipX = 0.38;
        hipY = 0.74;
        inclinacion = Math.abs(shoulderX - hipX);
        movimiento = 0.04;
        riesgo = true;
        if (soundLevel >= config.umbralSonido) {
          tipoRiesgo = 'accidente_confirmado';
          mensaje = '🚨 ACCIDENTE CONFIRMADO (CAÍDA + IMPACTO)';
        } else {
          tipoRiesgo = 'corriendo';
          mensaje = '⚠️ MOVIMIENTO DETECTADO (ESPERANDO AUDIO)';
        }
        break;
    }

    const boxes: BoundingBox[] = [
      {
        label: 'person',
        confidence: 0.89,
        x: boxX,
        y: boxY,
        width: boxW,
        height: boxH,
        color: riesgo ? '#ef4444' : '#10b981',
      },
    ];

    if (celularDetectado) {
      boxes.push({
        label: 'cell phone',
        confidence: 0.94,
        x: shoulderX + 0.03,
        y: shoulderY + 0.05,
        width: 0.08,
        height: 0.11,
        color: '#f59e0b',
      });
    }

    return {
      mensaje,
      personaDetectada,
      celularDetectado,
      movimiento: Math.round(movimiento * 1000) / 1000,
      inclinacion: Math.round(inclinacion * 1000) / 1000,
      riesgo,
      tipoRiesgo,
      boundingBoxes: boxes,
      landmarks: {
        nariz: { x: shoulderX, y: shoulderY - 0.12, confidence: 0.95 },
        hombroIzquierdo: { x: shoulderX - 0.06, y: shoulderY, confidence: 0.92 },
        hombroDerecho: { x: shoulderX + 0.06, y: shoulderY, confidence: 0.92 },
        caderaIzquierda: { x: hipX - 0.05, y: hipY, confidence: 0.90 },
        caderaDerecha: { x: hipX + 0.05, y: hipY, confidence: 0.90 },
        rodilla: { x: hipX, y: hipY + 0.16, confidence: 0.88 },
        tobillo: { x: hipX, y: hipY + 0.28, confidence: 0.85 },
      },
    };
  }
}

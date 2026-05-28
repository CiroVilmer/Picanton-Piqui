import { isAngryMode } from './mood';

/**
 * Estados de animación de Piqui. Modelo binario alineado con isAngryMode (umbral 50).
 * Cada estado tiene VARIOS idles (se ciclan al azar) + un clip de transición de entrada.
 */
export type PiquiState = 'happy' | 'angry';

export function piquiState(mood: number): PiquiState {
  return isAngryMode(mood) ? 'angry' : 'happy';
}

const BASE = '/animations';

/*
 * Idles por estado — se reproducen de a uno y al terminar se elige otro al azar
 * (sin repetir el anterior). Para sumar variedad, agregá más archivos a estos arrays.
 */
export const IDLE_CLIPS: Record<PiquiState, string[]> = {
  happy: [`${BASE}/idle.mp4`, `${BASE}/idle_mate_completo.mp4`],
  angry: [`${BASE}/enojado_idle_1.mp4`, `${BASE}/enojado_idle_2.mp4`],
};

/** Clip de transición keyed por estado DESTINO (se reproduce una vez, entero). */
export const TRANSITION_CLIP: Record<PiquiState, string> = {
  angry: `${BASE}/enojado_enter.mp4`, // happy → angry
  happy: `${BASE}/enojado_exit.mp4`, // angry → happy
};

/** Duración del fundido entre clips (ms) para suavizar el empalme. */
export const CROSSFADE_MS = 120;

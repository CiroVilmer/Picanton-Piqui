import { isAngryMode } from './mood';

/**
 * Estados de animación de Piqui. Modelo binario alineado con isAngryMode (umbral 50):
 * cada estado tiene un idle en loop, y cruzar el umbral dispara un clip de transición.
 */
export type PiquiState = 'happy' | 'angry';

export function piquiState(mood: number): PiquiState {
  return isAngryMode(mood) ? 'angry' : 'happy';
}

/*
 * Convención de archivos. Van en `public/piqui/` y se referencian desde el root del
 * bundle (WXT copia public/ al root, igual que /piqui.png). Cuando dropees los mp4
 * reales con estos nombres, PiquiVideoStage los usa automáticamente; mientras falten,
 * cae al placeholder SVG (PiquiCharacter) sin romper nada.
 *
 *   idle-happy.mp4   loop del estado feliz       (loopea)
 *   idle-angry.mp4   loop del estado enojado     (loopea)
 *   to-angry.mp4     transición happy → angry    (se reproduce una vez)
 *   to-happy.mp4     transición angry → happy    (se reproduce una vez)
 *
 * Recomendado para que el crossfade sea invisible: que el primer/último frame de cada
 * transición matchee el frame del idle correspondiente.
 */
export const IDLE_CLIP: Record<PiquiState, string> = {
  happy: '/piqui/idle-happy.mp4',
  angry: '/piqui/idle-angry.mp4',
};

/** Clip de transición keyed por estado DESTINO. */
export const TRANSITION_CLIP: Record<PiquiState, string> = {
  angry: '/piqui/to-angry.mp4', // happy → angry
  happy: '/piqui/to-happy.mp4', // angry → happy
};

/** Duración del fundido entre clips (ms). */
export const CROSSFADE_MS = 120;

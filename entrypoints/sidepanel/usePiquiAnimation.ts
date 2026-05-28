import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  IDLE_CLIP,
  TRANSITION_CLIP,
  piquiState,
  type PiquiState,
} from './piqui-anim';

export interface PiquiClip {
  src: string;
  /** true = idle (loopea); false = clip de transición (se reproduce una vez). */
  loop: boolean;
  /** estado visual al que pertenece el clip (para el fallback SVG). */
  state: PiquiState;
  /** true si es un clip de transición → dispara onClipEnded al terminar. */
  transition: boolean;
}

export interface PiquiAnimation {
  clip: PiquiClip;
  /** Llamar cuando el clip de transición termina de reproducirse. */
  onClipEnded: () => void;
}

/**
 * State machine de la animación de Piqui en base a la felicidad actual.
 *
 *   idle(actual) ──[mood cruza el umbral]──► transición(destino) ──[ended]──► idle(destino)
 *
 * Si durante una transición el mood vuelve a cruzar, al terminar el clip se re-evalúa
 * el target y se encadena la transición inversa automáticamente.
 */
export function usePiquiAnimation(mood: number): PiquiAnimation {
  const target = piquiState(mood);
  const [settled, setSettled] = useState<PiquiState>(target);
  const [phase, setPhase] = useState<'idle' | 'transition'>('idle');
  const [transTarget, setTransTarget] = useState<PiquiState>(target);

  // Arrancar transición cuando el destino difiere del estado asentado.
  useEffect(() => {
    if (phase === 'idle' && target !== settled) {
      setTransTarget(target);
      setPhase('transition');
    }
  }, [target, settled, phase]);

  const onClipEnded = useCallback(() => {
    setSettled(transTarget);
    setPhase('idle');
  }, [transTarget]);

  const clip = useMemo<PiquiClip>(
    () =>
      phase === 'transition'
        ? { src: TRANSITION_CLIP[transTarget], loop: false, state: transTarget, transition: true }
        : { src: IDLE_CLIP[settled], loop: true, state: settled, transition: false },
    [phase, transTarget, settled],
  );

  return { clip, onClipEnded };
}

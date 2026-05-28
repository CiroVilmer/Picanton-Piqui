import { useCallback, useRef, useState } from 'react';
import {
  IDLE_CLIPS,
  TRANSITION_CLIP,
  piquiState,
  type PiquiState,
} from './piqui-anim';

export interface PiquiClip {
  src: string;
  /** estado visual al que pertenece el clip (target, si es transición). */
  state: PiquiState;
  /** true = clip de transición (entra a un estado); false = idle. */
  transition: boolean;
}

export interface PiquiAnimation {
  clip: PiquiClip;
  /** Llamar cuando el clip actual termina de reproducirse (onEnded del video). */
  onClipEnded: () => void;
}

/**
 * Secuenciador de animación de Piqui. La clave: NUNCA corta un clip a la mitad.
 * Cada clip (idle o transición) se reproduce entero; recién al terminar (onClipEnded)
 * se decide el próximo:
 *
 *   - venías de una transición → asentás el estado destino.
 *   - si la felicidad ahora pide otro estado → reproducís la transición hacia él.
 *   - si no → elegís un idle al azar del estado actual (sin repetir el anterior).
 *
 * Mientras un clip corre, los cambios de mood sólo actualizan el "deseo"; se aplican
 * al terminar el clip en curso. Así el visualizador siempre se ve fluido.
 */
export function usePiquiAnimation(mood: number): PiquiAnimation {
  // Estado deseado según la felicidad actual — se lee al cerrar cada clip.
  const desiredRef = useRef<PiquiState>(piquiState(mood));
  desiredRef.current = piquiState(mood);

  // Estado en el que Piqui está realmente asentado (el de los idles que muestra).
  const settledRef = useRef<PiquiState>(piquiState(mood));
  // Último idle reproducido, para no repetirlo seguido.
  const lastIdleRef = useRef<string>('');

  const pickIdle = useCallback((state: PiquiState): PiquiClip => {
    const pool = IDLE_CLIPS[state];
    const options = pool.length > 1 ? pool.filter((s) => s !== lastIdleRef.current) : pool;
    const src = options[Math.floor(Math.random() * options.length)];
    lastIdleRef.current = src;
    return { src, state, transition: false };
  }, []);

  const [clip, setClip] = useState<PiquiClip>(() => pickIdle(settledRef.current));

  const onClipEnded = useCallback(() => {
    setClip((prev) => {
      // Si terminó una transición, ya estamos asentados en su estado destino.
      if (prev.transition) settledRef.current = prev.state;
      const current = settledRef.current;
      const want = desiredRef.current;
      if (want !== current) {
        return { src: TRANSITION_CLIP[want], state: want, transition: true };
      }
      return pickIdle(current);
    });
  }, [pickIdle]);

  return { clip, onClipEnded };
}

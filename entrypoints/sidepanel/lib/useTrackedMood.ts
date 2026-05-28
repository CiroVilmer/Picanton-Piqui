import { useEffect, useRef, useState } from 'react';
import { moodBand, type MoodBand } from '../mood';
import { recordMoodChange } from './usage-stats';

/**
 * Drop-in replacement de useState para el mood (0-100) que persiste cada
 * cambio de banda en el timeline de usage-stats. La UI sigue siendo idéntica.
 *
 * Uso:
 *   const [mood, setMood] = useTrackedMood(65);
 */
export function useTrackedMood(initial: number): [number, (n: number) => void] {
  const [value, setValueState] = useState(initial);
  const lastBandRef = useRef<MoodBand | null>(null);

  useEffect(() => {
    const band = moodBand(value);
    if (lastBandRef.current === band) return;
    lastBandRef.current = band;
    recordMoodChange(band).catch((err) =>
      console.warn('[piqui usage] recordMoodChange failed', err),
    );
  }, [value]);

  return [value, setValueState];
}

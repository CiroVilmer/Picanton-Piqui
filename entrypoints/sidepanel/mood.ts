import {
  Smiley,
  SmileyMelting,
  SmileyMeh,
  SmileyAngry,
  type Icon,
} from '@phosphor-icons/react';

export type MoodBand = 'happy' | 'calm' | 'warm' | 'angry';

/** Banda de humor a partir del valor 0–100 (manifest §8.1). */
export function moodBand(n: number): MoodBand {
  if (n >= 80) return 'happy';
  if (n >= 50) return 'calm';
  if (n >= 25) return 'warm';
  return 'angry';
}

/** Umbral del switch de action menu: < 50 => modo enojado. */
export function isAngryMode(n: number): boolean {
  return n < 50;
}

export const MOOD_LABEL: Record<MoodBand, string> = {
  happy: 'Feliz',
  calm: 'Tranquilo',
  warm: 'Ansioso',
  angry: 'Enojado',
};

export const MOOD_ICON: Record<MoodBand, Icon> = {
  happy: Smiley,
  calm: SmileyMelting,
  warm: SmileyMeh,
  angry: SmileyAngry,
};

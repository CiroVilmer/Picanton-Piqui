import type { ReactNode } from 'react';
import { BowlFood } from '@phosphor-icons/react';
import { MOOD_ICON, MOOD_LABEL, type MoodBand } from '../mood';
import PiquiVideoStage from './PiquiVideoStage';

const BORDER: Record<MoodBand, string> = {
  happy: 'border-mood-happy',
  calm: 'border-mood-calm',
  warm: 'border-mood-warm',
  angry: 'border-mood-angry',
};

interface Props {
  band: MoodBand;
  mood: number;
  hunger: number;
}

/** Card que contiene el personaje + las stats compactas (manifest §7.2). */
export default function PiquiStage({ band, mood, hunger }: Props) {
  const MoodGlyph = MOOD_ICON[band];
  return (
    <section
      className={`rounded-card border-[3px] ${BORDER[band]} bg-card p-3 shadow-soft transition-colors duration-[800ms] ease-out`}
    >
      <div className="relative flex aspect-[9/16] max-h-[280px] items-center justify-center overflow-hidden rounded-2xl bg-stage">
        <PiquiVideoStage mood={mood} band={band} />
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <Stat icon={<MoodGlyph weight="duotone" size={16} />} value={mood} label={MOOD_LABEL[band]} />
        <Stat icon={<BowlFood weight="duotone" size={16} />} value={hunger} label="Hambre" />
      </div>
    </section>
  );
}

function Stat({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  const good = value >= 50;
  return (
    <div className="flex items-center gap-2">
      <span className="text-ink-muted" title={label} aria-hidden>
        {icon}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-sunken">
        <div
          className={`h-full rounded-pill transition-[width,background-color] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
            good ? 'bg-mood-happy' : 'bg-mood-angry'
          }`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="min-w-7 text-right text-[10px] font-semibold tabular-nums">{value}%</span>
      <span className="sr-only">{label}</span>
    </div>
  );
}

import { useState } from 'react';
import { Play } from '@phosphor-icons/react';
import PreguntadosOverlay from './PreguntadosOverlay';

/**
 * Launcher del Preguntados: botón + mount condicional del overlay.
 * El overlay re-pickea 4 preguntas random cada vez que se abre.
 */
export default function PreguntadosShowcase() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 rounded-pill bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform duration-[120ms] ease-out hover:-translate-y-px"
      >
        <Play weight="fill" size={14} />
        Jugar Preguntados
      </button>
      <p className="text-center text-[11px] text-ink-muted">
        4 preguntas random sobre las startups del ecosistema.
      </p>
      {open && <PreguntadosOverlay onClose={() => setOpen(false)} />}
    </div>
  );
}

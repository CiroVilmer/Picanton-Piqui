import { useState } from 'react';
import { Sparkle } from '@phosphor-icons/react';
import WrappedOverlay from './WrappedOverlay';

/**
 * Trigger del Wrapped: botón en el accordion + overlay full-bleed cuando se
 * abre. El overlay arma sus slides desde buildWrappedSlides() en cada apertura,
 * así que siempre refleja el estado actual del storage.
 */
export default function WrappedShowcase() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 rounded-pill bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform duration-[120ms] ease-out hover:-translate-y-px"
      >
        <Sparkle weight="duotone" size={16} />
        Ver mi Wrapped
      </button>
      <p className="text-center text-[11px] text-ink-muted">
        Resumen de tus pestañas, scrapes y humor con Piqui.
      </p>
      {open && <WrappedOverlay onClose={() => setOpen(false)} />}
    </div>
  );
}

import type { ReactNode } from 'react';
import { CaretRight, Lock, type Icon } from '@phosphor-icons/react';

interface Props {
  Icon: Icon;
  title: string;
  desc: string;
  open: boolean;
  /** Piqui enojado → no se puede expandir (manifest: bloquea los botones). */
  locked?: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/** Ítem de acordeón estilo action card: header-botón + panel colapsable hacia abajo. */
export default function AccordionItem({
  Icon,
  title,
  desc,
  open,
  locked = false,
  onToggle,
  children,
}: Props) {
  const expanded = open && !locked;
  return (
    <div className="overflow-hidden rounded-btn bg-card shadow-soft">
      <button
        type="button"
        disabled={locked}
        aria-expanded={expanded}
        onClick={onToggle}
        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-transform duration-[120ms] ease-out enabled:hover:-translate-y-px enabled:active:translate-y-0 ${
          locked ? 'cursor-not-allowed opacity-60' : ''
        }`}
      >
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
            locked ? 'bg-sunken' : 'bg-accent-mint'
          }`}
        >
          <Icon weight="duotone" size={22} className={locked ? 'text-ink-muted' : 'text-ink'} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink">{title}</span>
          <span className="block truncate text-xs text-ink-muted">{desc}</span>
        </span>
        {locked ? (
          <Lock weight="duotone" size={18} className="shrink-0 text-ink-muted" />
        ) : (
          <CaretRight
            weight="bold"
            size={16}
            className={`shrink-0 text-ink-muted transition-transform duration-200 ${
              expanded ? 'rotate-90' : ''
            }`}
          />
        )}
      </button>
      {expanded && <div className="border-t border-outline px-4 py-3">{children}</div>}
    </div>
  );
}

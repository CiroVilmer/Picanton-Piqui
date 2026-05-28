import { useState } from 'react';
import { ArrowClockwise, Sparkle, SpinnerGap } from '@phosphor-icons/react';
import { DOT_CLASS } from '../lib/classifier';
import { buildWrappedSlides, type WrappedData, type WrappedSlide } from '../lib/wrapped';
import type { MoodBand } from '../mood';

const MOOD_BAR_CLASS: Record<MoodBand, string> = {
  happy: 'bg-mood-happy',
  calm: 'bg-mood-calm',
  warm: 'bg-mood-warm',
  angry: 'bg-mood-angry',
};

/**
 * Botón de test del Wrapped: dispara buildWrappedSlides() y renderiza las slides
 * en una lista vertical. Reemplazable por un carousel cuando esté el diseño final.
 */
export default function WrappedShowcase() {
  const [data, setData] = useState<WrappedData | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    try {
      setData(await buildWrappedSlides());
    } catch (err) {
      console.error('[piqui wrapped] buildWrappedSlides failed', err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={load}
        disabled={busy}
        className="flex items-center justify-center gap-2 rounded-pill bg-ink px-4 py-2 text-sm font-semibold text-white shadow-soft transition-transform duration-[120ms] ease-out enabled:hover:-translate-y-px disabled:opacity-60"
      >
        {busy ? (
          <>
            <SpinnerGap weight="bold" size={16} className="animate-spin" />
            Generando…
          </>
        ) : data ? (
          <>
            <ArrowClockwise weight="bold" size={16} />
            Re-generar Wrapped
          </>
        ) : (
          <>
            <Sparkle weight="duotone" size={16} />
            Ver mi Wrapped
          </>
        )}
      </button>

      {data && (
        <ul className="flex flex-col gap-2">
          {data.slides.map((slide, i) => (
            <li key={`${slide.kind}-${i}`}>
              <SlideCard slide={slide} />
            </li>
          ))}
        </ul>
      )}

      {data && data.slides.length <= 2 && (
        <p className="text-center text-[11px] text-ink-muted">
          Poco data por ahora — abrí algunas pestañas y movéle al mood para que el Wrapped tenga más jugo.
        </p>
      )}
    </div>
  );
}

function SlideCard({ slide }: { slide: WrappedSlide }) {
  switch (slide.kind) {
    case 'hook':
    case 'finale':
      return (
        <div className="rounded-card bg-sunken px-4 py-4 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
            {slide.kind === 'hook' ? 'intro' : 'fin'}
          </p>
          <p className="mt-1 text-base font-bold text-ink">{slide.title}</p>
          <p className="mt-1 text-xs italic text-ink-muted">{slide.subtitle}</p>
        </div>
      );

    case 'time-total':
      return (
        <BigStatCard
          label="Hace cuánto vivís con Piqui"
          big={slide.durationLabel}
          small={`${slide.days} ${slide.days === 1 ? 'día' : 'días'}`}
          subtitle={slide.subtitle}
        />
      );

    case 'tabs-total':
      return (
        <BigStatCard
          label="Pestañas abiertas"
          big={slide.total.toLocaleString('es-AR')}
          small={slide.perDay != null ? `~${slide.perDay} por día` : null}
          subtitle={slide.subtitle}
        />
      );

    case 'top-category':
      return (
        <div className="rounded-card bg-card px-4 py-3 shadow-soft">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
            tu categoría top
          </p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className={`size-2.5 rounded-full ${DOT_CLASS[slide.category]}`} />
            <span className="text-base font-bold text-ink">{slide.label}</span>
            <span className="ml-auto text-xs tabular-nums text-ink-muted">
              {slide.count} · {slide.percentOfTotal}%
            </span>
          </div>
          <p className="mt-1 text-xs italic text-ink-muted">{slide.subtitle}</p>
        </div>
      );

    case 'breakdown':
      return (
        <div className="rounded-card bg-card px-4 py-3 shadow-soft">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
            tu mix
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {slide.counts.map((c) => (
              <li
                key={c.category}
                className="flex items-center gap-2 text-xs text-ink"
              >
                <span className={`size-2 rounded-full ${DOT_CLASS[c.category]}`} />
                <span className="flex-1 truncate">{c.label}</span>
                <span className="tabular-nums text-ink-muted">{c.count}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs italic text-ink-muted">{slide.subtitle}</p>
        </div>
      );

    case 'mood-distribution': {
      const max = Math.max(...slide.slices.map((s) => s.percent), 1);
      return (
        <div className="rounded-card bg-card px-4 py-3 shadow-soft">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
            tu humor
          </p>
          <p className="mt-1 text-base font-bold text-ink">
            {slide.topPercent}% {slide.topLabel.toLowerCase()}
          </p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {slide.slices.map((s) => (
              <li key={s.band} className="flex items-center gap-2 text-[11px]">
                <span className="w-16 shrink-0 text-ink-muted">{s.label}</span>
                <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-sunken">
                  <span
                    className={`absolute inset-y-0 left-0 ${MOOD_BAR_CLASS[s.band]}`}
                    style={{ width: `${Math.max(2, (s.percent / max) * 100)}%` }}
                  />
                </span>
                <span className="w-8 shrink-0 text-right tabular-nums text-ink-muted">{s.percent}%</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs italic text-ink-muted">{slide.subtitle}</p>
        </div>
      );
    }
  }
}

function BigStatCard({
  label,
  big,
  small,
  subtitle,
}: {
  label: string;
  big: string;
  small?: string | null;
  subtitle: string;
}) {
  return (
    <div className="rounded-card bg-card px-4 py-3 shadow-soft">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold leading-tight text-ink">{big}</p>
      {small && <p className="text-[11px] text-ink-muted">{small}</p>}
      <p className="mt-1 text-xs italic text-ink-muted">{subtitle}</p>
    </div>
  );
}

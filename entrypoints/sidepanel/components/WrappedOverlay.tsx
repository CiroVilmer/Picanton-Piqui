import { useEffect, useRef, useState } from 'react';
import { SpeakerHigh, SpeakerSlash, X } from '@phosphor-icons/react';

const AUDIO_SRC = '/audio/wrapped.mp3';
const AUDIO_VOLUME = 0.45;
import { buildWrappedSlides, type WrappedData, type WrappedSlide } from '../lib/wrapped';
import type { Category } from '../lib/classifier';
import type { MoodBand } from '../mood';

type Props = {
  onClose: () => void;
};

const SLIDE_DURATION_MS = 6000;

type SlideKind = WrappedSlide['kind'];

const SLIDE_BG: Record<SlideKind, string> = {
  hook: 'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500',
  'time-total': 'bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500',
  'tabs-total': 'bg-gradient-to-br from-lime-400 via-emerald-500 to-teal-600',
  'scrapes-total': 'bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-600',
  'top-category': 'bg-gradient-to-br from-orange-400 via-red-500 to-rose-600',
  breakdown: 'bg-gradient-to-br from-yellow-400 via-orange-500 to-amber-600',
  'mood-distribution': 'bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600',
  'sessions-count': 'bg-gradient-to-br from-rose-400 via-pink-500 to-fuchsia-600',
  finale: 'bg-gradient-to-br from-zinc-900 via-amber-700 to-orange-500',
};

const KEYFRAMES = `
  @keyframes wrappedFillBar {
    from { width: 0%; }
    to { width: 100%; }
  }
  @keyframes wrappedEnter {
    from { opacity: 0; transform: translateY(24px) scale(0.96); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes wrappedBig {
    from { opacity: 0; transform: translateY(40px) scale(0.7); letter-spacing: -0.04em; }
    to { opacity: 1; transform: translateY(0) scale(1); letter-spacing: -0.02em; }
  }
  @keyframes wrappedFadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes wrappedSpinIn {
    from { opacity: 0; transform: rotate(-180deg) scale(0.5); }
    to { opacity: 1; transform: rotate(0) scale(1); }
  }
  @keyframes wrappedBarGrow {
    from { width: 0%; }
  }
`;

export default function WrappedOverlay({ onClose }: Props) {
  const [data, setData] = useState<WrappedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [muted, setMuted] = useState(false);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let cancelled = false;
    buildWrappedSlides()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        console.error('[piqui wrapped] buildWrappedSlides failed', err);
        if (!cancelled) setError('No pude armar tu Wrapped. Mirá la consola.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = AUDIO_VOLUME;
    audio.loop = true;
    audio.play().catch((err) => {
      console.debug('[piqui wrapped] audio autoplay blocked or src missing', err);
    });
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  function toggleMute() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
    if (!audio.muted && audio.paused) {
      audio.play().catch(() => undefined);
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' || e.key === ' ') advance();
      else if (e.key === 'ArrowLeft') back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, current]);

  function advance() {
    if (!data) return;
    if (current >= data.slides.length - 1) {
      onClose();
      return;
    }
    setCurrent((c) => c + 1);
  }
  function back() {
    setCurrent((c) => Math.max(0, c - 1));
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-zinc-950 text-white">
      <style>{KEYFRAMES}</style>

      <div className="absolute inset-x-0 top-0 z-20 flex flex-col items-center gap-2 px-3 pt-3">
        {data && (
          <ProgressBar
            count={data.slides.length}
            current={current}
            onComplete={advance}
          />
        )}
        <img
          src="/icon/128.png"
          alt="Piqui"
          className="size-9 rounded-full bg-white/15 p-0.5 shadow-[0_2px_8px_rgba(0,0,0,0.25)] backdrop-blur-sm"
          draggable={false}
        />
      </div>

      <audio
        ref={audioRef}
        src={AUDIO_SRC}
        preload="auto"
        onError={() => setAudioAvailable(false)}
      />

      <div className="absolute right-3 top-3 z-30 flex items-center gap-1.5">
        {audioAvailable && (
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? 'Activar audio' : 'Silenciar audio'}
            className="flex size-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50"
          >
            {muted ? <SpeakerSlash weight="bold" size={16} /> : <SpeakerHigh weight="bold" size={16} />}
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="flex size-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50"
        >
          <X weight="bold" size={16} />
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {!data && !error && (
          <div className="flex h-full items-center justify-center text-sm text-white/70">
            Armando tu Wrapped…
          </div>
        )}
        {error && (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="text-sm">{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold"
            >
              Cerrar
            </button>
          </div>
        )}

        {data && data.slides.length > 0 && (
          <SlideStage
            key={current}
            slide={data.slides[current]!}
            onPrev={back}
            onNext={advance}
          />
        )}
      </div>
    </div>
  );
}

function ProgressBar({
  count,
  current,
  onComplete,
}: {
  count: number;
  current: number;
  onComplete: () => void;
}) {
  return (
    <div className="flex w-full gap-1">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25"
        >
          <div
            className="h-full bg-white"
            style={{
              width: i < current ? '100%' : i === current ? undefined : '0%',
              animation:
                i === current
                  ? `wrappedFillBar ${SLIDE_DURATION_MS}ms linear forwards`
                  : 'none',
            }}
            onAnimationEnd={i === current ? onComplete : undefined}
          />
        </div>
      ))}
    </div>
  );
}

function SlideStage({
  slide,
  onPrev,
  onNext,
}: {
  slide: WrappedSlide;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div
      className={`absolute inset-0 flex flex-col px-6 pt-20 pb-12 ${SLIDE_BG[slide.kind]}`}
      style={{ animation: 'wrappedEnter 500ms cubic-bezier(0.16, 1, 0.3, 1) both' }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />

      <div className="relative flex flex-1 flex-col">
        <SlideContent slide={slide} />
      </div>

      <button
        type="button"
        aria-label="Anterior"
        onClick={onPrev}
        className="absolute inset-y-0 left-0 w-1/3 cursor-default"
      />
      <button
        type="button"
        aria-label="Siguiente"
        onClick={onNext}
        className="absolute inset-y-0 right-0 w-2/3 cursor-default"
      />
    </div>
  );
}

function SlideContent({ slide }: { slide: WrappedSlide }) {
  switch (slide.kind) {
    case 'hook':
      return (
        <div className="my-auto flex flex-col items-center gap-4 text-center">
          <img
            src="/piqui.png"
            alt="Piqui"
            draggable={false}
            className="w-44 max-w-[60vw] drop-shadow-[0_6px_20px_rgba(0,0,0,0.25)]"
            style={{ animation: 'wrappedBig 700ms cubic-bezier(0.16, 1, 0.3, 1) 100ms both' }}
          />
          <h2
            className="text-5xl font-black uppercase leading-[0.85] tracking-tight"
            style={{ animation: 'wrappedBig 700ms cubic-bezier(0.16, 1, 0.3, 1) 300ms both' }}
          >
            Wrapped
          </h2>
          <p
            className="text-base font-medium italic text-white/90"
            style={{ animation: 'wrappedFadeUp 600ms ease-out 700ms both' }}
          >
            {slide.subtitle}
          </p>
        </div>
      );

    case 'finale':
      return (
        <div className="my-auto flex flex-col items-center gap-3 text-center">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/80"
            style={{ animation: 'wrappedFadeUp 600ms ease-out 100ms both' }}
          >
            fin
          </p>
          <h2
            className="text-4xl font-black leading-[0.95] tracking-tight"
            style={{ animation: 'wrappedBig 700ms cubic-bezier(0.16, 1, 0.3, 1) 200ms both' }}
          >
            {slide.title}
          </h2>
          <p
            className="text-base font-medium italic text-white/90"
            style={{ animation: 'wrappedFadeUp 600ms ease-out 600ms both' }}
          >
            {slide.subtitle}
          </p>
        </div>
      );

    case 'time-total':
      return (
        <BigStatLayout
          label="Hace cuánto vivís con Piqui"
          big={slide.durationLabel}
          small={`${slide.days} ${slide.days === 1 ? 'día' : 'días'}`}
          subtitle={slide.subtitle}
        />
      );

    case 'tabs-total':
      return (
        <BigStatLayout
          label="Pestañas que abriste"
          big={<CountUp target={slide.total} />}
          small={slide.perDay != null ? `~${slide.perDay} por día` : undefined}
          subtitle={slide.subtitle}
        />
      );

    case 'scrapes-total':
      return (
        <BigStatLayout
          label="Páginas que scrapeaste"
          big={<CountUp target={slide.itemsScraped} />}
          small={
            slide.collectionsCount > 0
              ? `en ${slide.collectionsCount} ${slide.collectionsCount === 1 ? 'lista' : 'listas'}`
              : undefined
          }
          subtitle={slide.subtitle}
        />
      );

    case 'sessions-count':
      return (
        <BigStatLayout
          label="Sesiones guardadas"
          big={<CountUp target={slide.count} />}
          subtitle={slide.subtitle}
        />
      );

    case 'top-category':
      return (
        <div className="relative flex h-full flex-col">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/80"
            style={{ animation: 'wrappedFadeUp 500ms ease-out 100ms both' }}
          >
            tu categoría top
          </p>
          <div
            className="mt-auto flex flex-col gap-1"
            style={{ animation: 'wrappedBig 700ms cubic-bezier(0.16, 1, 0.3, 1) 250ms both' }}
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
              {slide.percentOfTotal}% de tus pestañas
            </span>
            <span className="text-5xl font-black leading-[0.95] tracking-tight">
              {slide.label}
            </span>
            <span className="text-sm font-semibold text-white/80">
              {slide.count} {slide.count === 1 ? 'pestaña' : 'pestañas'}
            </span>
          </div>
          <p
            className="mt-3 text-sm font-medium italic text-white/90"
            style={{ animation: 'wrappedFadeUp 600ms ease-out 700ms both' }}
          >
            {slide.subtitle}
          </p>
        </div>
      );

    case 'breakdown': {
      const total = slide.counts.reduce((sum, c) => sum + c.count, 0) || 1;
      const max = slide.counts[0]?.count ?? 1;
      return (
        <div className="flex h-full flex-col">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/80"
            style={{ animation: 'wrappedFadeUp 500ms ease-out 100ms both' }}
          >
            tu mix
          </p>
          <h3
            className="mt-1 text-3xl font-black leading-tight"
            style={{ animation: 'wrappedFadeUp 600ms ease-out 200ms both' }}
          >
            Así te repartiste
          </h3>
          <ul className="mt-5 flex flex-col gap-3">
            {slide.counts.map((c, i) => (
              <CategoryBar
                key={c.category}
                category={c.category}
                label={c.label}
                count={c.count}
                widthPercent={Math.max(8, (c.count / max) * 100)}
                share={Math.round((c.count / total) * 100)}
                delay={300 + i * 90}
              />
            ))}
          </ul>
          <p
            className="mt-auto pt-3 text-sm italic text-white/85"
            style={{ animation: 'wrappedFadeUp 600ms ease-out 900ms both' }}
          >
            {slide.subtitle}
          </p>
        </div>
      );
    }

    case 'mood-distribution': {
      const max = Math.max(...slide.slices.map((s) => s.percent), 1);
      return (
        <div className="flex h-full flex-col">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/80"
            style={{ animation: 'wrappedFadeUp 500ms ease-out 100ms both' }}
          >
            tu humor
          </p>
          <h3
            className="mt-1 text-3xl font-black leading-tight"
            style={{ animation: 'wrappedFadeUp 600ms ease-out 200ms both' }}
          >
            {slide.topPercent}% {slide.topLabel.toLowerCase()}
          </h3>
          <ul className="mt-5 flex flex-col gap-2.5">
            {slide.slices.map((s, i) => (
              <MoodBar
                key={s.band}
                band={s.band}
                label={s.label}
                percent={s.percent}
                widthPercent={Math.max(6, (s.percent / max) * 100)}
                delay={300 + i * 90}
              />
            ))}
          </ul>
          <p
            className="mt-auto pt-3 text-sm italic text-white/85"
            style={{ animation: 'wrappedFadeUp 600ms ease-out 900ms both' }}
          >
            {slide.subtitle}
          </p>
        </div>
      );
    }
  }
}

function BigStatLayout({
  label,
  big,
  small,
  subtitle,
}: {
  label: string;
  big: React.ReactNode;
  small?: string;
  subtitle: string;
}) {
  return (
    <div className="relative flex h-full flex-col">
      <p
        className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/80"
        style={{ animation: 'wrappedFadeUp 500ms ease-out 100ms both' }}
      >
        {label}
      </p>
      <div
        className="mt-auto flex flex-col gap-1"
        style={{ animation: 'wrappedBig 800ms cubic-bezier(0.16, 1, 0.3, 1) 200ms both' }}
      >
        <span className="text-[88px] font-black leading-[0.85] tracking-tighter">{big}</span>
        {small && (
          <span className="text-sm font-semibold text-white/85">{small}</span>
        )}
      </div>
      <p
        className="mt-3 text-sm font-medium italic text-white/90"
        style={{ animation: 'wrappedFadeUp 600ms ease-out 700ms both' }}
      >
        {subtitle}
      </p>
    </div>
  );
}

const CATEGORY_BAR_BG: Record<Category, string> = {
  trabajo: 'bg-blue-500',
  estudio: 'bg-emerald-500',
  compras: 'bg-orange-500',
  distracciones: 'bg-yellow-400',
  'docs-tecnicos': 'bg-purple-500',
  investigacion: 'bg-cyan-500',
  otros: 'bg-zinc-500',
};

function CategoryBar({
  category,
  label,
  count,
  widthPercent,
  share,
  delay,
}: {
  category: Category;
  label: string;
  count: number;
  widthPercent: number;
  share: number;
  delay: number;
}) {
  return (
    <li
      className="flex flex-col gap-1"
      style={{ animation: `wrappedFadeUp 500ms ease-out ${delay}ms both` }}
    >
      <div className="flex items-baseline justify-between text-xs font-semibold">
        <span>{label}</span>
        <span className="tabular-nums text-white/85">
          {count} <span className="text-white/60">· {share}%</span>
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/20">
        <div
          className={`h-full ${CATEGORY_BAR_BG[category]}`}
          style={{
            width: `${widthPercent}%`,
            animation: `wrappedBarGrow 800ms cubic-bezier(0.16, 1, 0.3, 1) ${delay + 150}ms both`,
          }}
        />
      </div>
    </li>
  );
}

const MOOD_BAR_BG: Record<MoodBand, string> = {
  happy: 'bg-mood-happy',
  calm: 'bg-mood-calm',
  warm: 'bg-mood-warm',
  angry: 'bg-mood-angry',
};

function MoodBar({
  band,
  label,
  percent,
  widthPercent,
  delay,
}: {
  band: MoodBand;
  label: string;
  percent: number;
  widthPercent: number;
  delay: number;
}) {
  return (
    <li
      className="flex flex-col gap-1"
      style={{ animation: `wrappedFadeUp 500ms ease-out ${delay}ms both` }}
    >
      <div className="flex items-baseline justify-between text-xs font-semibold">
        <span>{label}</span>
        <span className="tabular-nums text-white/85">{percent}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/20">
        <div
          className={`h-full ${MOOD_BAR_BG[band]}`}
          style={{
            width: `${widthPercent}%`,
            animation: `wrappedBarGrow 800ms cubic-bezier(0.16, 1, 0.3, 1) ${delay + 150}ms both`,
          }}
        />
      </div>
    </li>
  );
}

function CountUp({ target, duration = 1300 }: { target: number; duration?: number }) {
  const [value, setValue] = useState(target === 0 ? 0 : 0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }
    const start = performance.now();
    setValue(0);
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return <>{value.toLocaleString('es-AR')}</>;
}

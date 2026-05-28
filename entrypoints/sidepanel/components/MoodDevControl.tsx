/*
 * Control SOLO para demo: permite mover mood/hambre en vivo y ver cómo Piqui
 * cambia de color, cara, borde del stage y set de acciones. No está en el manifest.
 * Para producción: borrar este componente y su uso en App.tsx.
 */
export default function MoodDevControl({
  mood,
  hunger,
  onMood,
  onHunger,
  paused,
  onTogglePaused,
}: {
  mood: number;
  hunger: number;
  onMood: (n: number) => void;
  onHunger: (n: number) => void;
  paused: boolean;
  onTogglePaused: () => void;
}) {
  return (
    <div className="mx-4 mb-2 flex shrink-0 flex-col gap-2 rounded-btn border border-dashed border-outline p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
          dev · estados
        </span>
        <button
          type="button"
          onClick={onTogglePaused}
          aria-pressed={paused}
          className={`rounded-pill px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] transition-colors ${
            paused
              ? 'bg-mood-warm text-white'
              : 'border border-outline text-ink-muted hover:text-ink'
          }`}
        >
          {paused ? '⏸ still' : '▶ live'}
        </button>
      </div>
      <label className="flex items-center gap-2 text-[11px] font-semibold text-ink-muted">
        <span className="w-20 tabular-nums">Mood {mood}</span>
        <input
          type="range"
          min={0}
          max={100}
          value={mood}
          onChange={(e) => onMood(Number(e.target.value))}
          className="flex-1 accent-mood-happy"
        />
      </label>
      <label className="flex items-center gap-2 text-[11px] font-semibold text-ink-muted">
        <span className="w-20 tabular-nums">Hambre {hunger}</span>
        <input
          type="range"
          min={0}
          max={100}
          value={hunger}
          onChange={(e) => onHunger(Number(e.target.value))}
          className="flex-1 accent-mood-warm"
        />
      </label>
    </div>
  );
}

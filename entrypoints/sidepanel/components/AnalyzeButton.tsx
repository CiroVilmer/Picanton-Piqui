type Props = {
  tabCount: number;
  loading?: boolean;
  onAnalyze: () => void;
};

export function AnalyzeButton({ tabCount, loading, onAnalyze }: Props) {
  const disabled = loading || tabCount === 0;
  return (
    <button
      type="button"
      onClick={onAnalyze}
      disabled={disabled}
      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-100 transition hover:border-zinc-700 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? 'Analizando…' : `Analizar mis pestañas (${tabCount})`}
    </button>
  );
}

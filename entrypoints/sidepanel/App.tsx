import { useState } from 'react';
import { AnalyzeButton } from './components/AnalyzeButton';
import { ApplyGroupingButton } from './components/ApplyGroupingButton';
import { GroupedTabsCard } from './components/GroupedTabsCard';
import { SessionList } from './components/SessionList';
import { ToastHost } from './components/ToastHost';
import { analyzeTabs, type Analysis } from './lib/classifier';
import { pushToast } from './lib/toast';
import { useTabCount } from './lib/useTabCount';

export default function App() {
  const tabCount = useTabCount();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);

  const onAnalyze = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await analyzeTabs();
      setAnalysis(result);
      if (result.groups.length === 0) {
        pushToast('No clasifiqué ninguna pestaña. Abrí más tabs.');
      }
    } catch (err) {
      console.error('analyzeTabs failed', err);
      pushToast('No pude analizar. Mirá la consola.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      <header className="sticky top-0 z-10 border-b border-zinc-900/80 bg-zinc-950/80 px-5 py-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-amber-400" />
          <h1 className="text-base font-semibold tracking-tight text-zinc-50">Piqui</h1>
        </div>
        <p className="mt-1 text-xs italic text-zinc-500">
          Tu mascota de Chrome con onda.
        </p>
      </header>

      <main className="space-y-5 p-5 pb-16">
        <AnalyzeButton
          tabCount={tabCount}
          loading={loading}
          onAnalyze={onAnalyze}
        />

        {analysis && (
          <section className="space-y-3">
            <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Grupos detectados ({analysis.groups.length})
            </h2>
            {analysis.groups.length === 0 ? (
              <p className="text-xs text-zinc-600">
                No clasifiqué ninguna pestaña. Probá con más tabs abiertas.
              </p>
            ) : (
              <>
                <div className="space-y-2.5">
                  {analysis.groups.map((g) => (
                    <GroupedTabsCard
                      key={g.category}
                      category={g.category}
                      tabs={g.tabs}
                    />
                  ))}
                </div>
                <ApplyGroupingButton analysis={analysis} onReanalyze={onAnalyze} />
              </>
            )}
          </section>
        )}

        <SessionList />
      </main>

      <ToastHost />
    </div>
  );
}

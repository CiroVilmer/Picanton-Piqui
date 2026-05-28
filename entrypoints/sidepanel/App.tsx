export default function App() {
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
      <main className="space-y-4 p-5">
        {/* Acá montamos: GroupedTabsCard, CollectionsCard, SessionList, PiquiChat. */}
        {/* Ver docs/piqui-plan.md → MUST-HAVE list. */}
      </main>
    </div>
  );
}

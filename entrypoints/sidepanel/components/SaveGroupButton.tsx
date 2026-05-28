import { useEffect, useRef, useState } from 'react';
import type { Category } from '../lib/classifier';
import { saveGroupAsSession } from '../lib/sessions';
import { pushToast } from '../lib/toast';

type Props = {
  category: Category;
  tabs: ReadonlyArray<{ url: string; title: string; favIconUrl?: string }>;
};

export function SaveGroupButton({ category, tabs }: Props) {
  const [justSaved, setJustSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => () => {
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
  }, []);

  const onClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const session = await saveGroupAsSession(category, tabs);
      pushToast(`Guardé '${session.name}' (${session.tabs.length} tabs).`);
      setJustSaved(true);
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setJustSaved(false), 2000);
    } catch (err) {
      console.error('saveGroupAsSession failed', err);
      pushToast('No pude guardar. Mirá la consola.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      title="Guardar este grupo como sesión"
      className="rounded-md p-1.5 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-50"
    >
      {justSaved ? '✓' : '💾'}
    </button>
  );
}

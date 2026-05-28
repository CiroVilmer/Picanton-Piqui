import { useState } from 'react';
import { ungroupAllInCurrentWindow } from '../lib/grouping';
import { pushToast } from '../lib/toast';

export function UngroupAllButton() {
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const n = await ungroupAllInCurrentWindow();
      if (n === 0) {
        pushToast('No había nada agrupado en esta ventana.');
      } else {
        pushToast(`Desagrupé ${n} ${n === 1 ? 'tab' : 'tabs'} de Chrome.`);
      }
    } catch (err) {
      console.error('ungroupAllInCurrentWindow failed', err);
      pushToast('No pude desagrupar todo. Mirá la consola.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="w-full rounded-lg border border-zinc-900 bg-transparent px-4 py-2 text-xs font-medium text-zinc-500 transition hover:border-zinc-800 hover:bg-zinc-900/40 hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {busy ? 'Desagrupando…' : 'Desagrupar todo'}
    </button>
  );
}

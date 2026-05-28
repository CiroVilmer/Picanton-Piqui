import { useState } from 'react';
import { apiKey } from '../lib/ai';
import { pushToast } from '../lib/toast';

type Props = {
  onSaved?: () => void;
  onCancel?: () => void;
  title?: string;
};

export function ApiKeyPrompt({ onSaved, onCancel, title = 'Necesito tu API key' }: Props) {
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);

  const onSave = async () => {
    const clean = key.trim();
    if (clean.length === 0 || busy) return;
    setBusy(true);
    try {
      await apiKey.setValue(clean);
      setKey('');
      pushToast('API key guardada.');
      onSaved?.();
    } catch (err) {
      console.error('apiKey.setValue failed', err);
      pushToast('No pude guardar la key.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2 rounded-lg border border-amber-900/50 bg-amber-950/20 p-3">
      <div className="flex items-start gap-2">
        <span className="mt-0.5">🔑</span>
        <div className="flex-1 space-y-1">
          <h3 className="text-sm font-medium text-amber-200">{title}</h3>
          <p className="text-xs leading-relaxed text-zinc-400">
            Uso Gemini para extraer datos de la página. La key se guarda local en tu Chrome (storage de la extensión), no sale a ningún otro lado.
          </p>
        </div>
      </div>

      <input
        type="password"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onSave();
          }
        }}
        placeholder="AIza..."
        autoFocus
        className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-amber-500"
      />

      <div className="flex items-center justify-between gap-2">
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noreferrer"
          className="text-[11px] text-zinc-500 hover:text-zinc-300"
        >
          Conseguir una key →
        </a>
        <div className="flex items-center gap-1.5">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md px-2 py-1 text-[11px] text-zinc-500 transition hover:text-zinc-200"
            >
              Cancelar
            </button>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={busy || key.trim().length === 0}
            className="rounded-md bg-amber-500 px-2.5 py-1 text-[11px] font-medium text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Guardando…' : 'Guardar key'}
          </button>
        </div>
      </div>
    </div>
  );
}

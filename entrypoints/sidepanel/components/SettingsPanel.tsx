import { useState } from 'react';
import { Check, Key, X } from '@phosphor-icons/react';
import { apiKey } from '../lib/ai';
import { useStorageValue } from '../lib/useStorageValue';
import { pushToast } from '../lib/toast';

/** Panel de configuración (overlay). Hoy: la API key de Gemini. */
export default function SettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const key = useStorageValue(apiKey); // null = loading, '' = sin key, string = lista
  const [input, setInput] = useState('');

  if (!open) return null;
  const hasKey = !!key && key.length > 0;

  async function onSave() {
    const k = input.trim();
    if (!k) return;
    await apiKey.setValue(k);
    setInput('');
    pushToast('API key guardada.');
  }

  async function onClear() {
    await apiKey.setValue('');
    pushToast('API key borrada.');
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-canvas">
      <header className="flex h-[88px] shrink-0 items-center justify-between px-4">
        <span className="text-base font-semibold text-ink">Configuración</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar configuración"
          className="flex size-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
        >
          <X weight="bold" size={20} />
        </button>
      </header>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
        <section className="flex flex-col gap-2 rounded-card bg-card p-4 shadow-soft">
          <div className="flex items-center gap-2">
            <Key weight="duotone" size={20} className="text-ink" />
            <span className="text-sm font-semibold text-ink">API key de Gemini</span>
            {hasKey && (
              <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-mood-happy">
                <Check weight="bold" size={14} />
                configurada
              </span>
            )}
          </div>
          <p className="text-xs text-ink-muted">
            Necesaria para capturar páginas en listas. Se guarda local en tu navegador, no se
            comparte.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={hasKey ? '•••••••• (cambiar)' : 'Pegá tu API key…'}
              className="min-w-0 flex-1 rounded-pill border border-outline bg-card px-3 py-2 text-[13px] text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-mood-happy"
            />
            <button
              type="button"
              onClick={onSave}
              disabled={!input.trim()}
              className="shrink-0 rounded-pill bg-mood-happy px-4 py-2 text-[13px] font-semibold text-white transition-opacity disabled:opacity-50"
            >
              Guardar
            </button>
          </div>
          {hasKey && (
            <button
              type="button"
              onClick={onClear}
              className="self-start text-xs font-semibold text-mood-angry transition-opacity hover:opacity-80"
            >
              Borrar key
            </button>
          )}
        </section>
      </div>
    </div>
  );
}

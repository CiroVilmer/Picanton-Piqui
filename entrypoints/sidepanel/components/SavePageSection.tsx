import { useState } from 'react';
import { apiKey, type GenerateError } from '../lib/ai';
import {
  collections,
  savePageToExistingCollection,
  savePageToNewCollection,
  type SavePageResult,
} from '../lib/collections';
import { getActivePageContent } from '../lib/extractor';
import { pushToast } from '../lib/toast';
import { useActiveTabScrappable } from '../lib/useActiveTabScrappable';
import { useStorageValue } from '../lib/useStorageValue';
import { ApiKeyPrompt } from './ApiKeyPrompt';

type Props = {
  onClose: () => void;
};

type Mode = 'list' | 'new';

export function SavePageSection({ onClose }: Props) {
  const allCollections = useStorageValue(collections);
  const key = useStorageValue(apiKey);
  const active = useActiveTabScrappable();

  const [mode, setMode] = useState<Mode>('list');
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [changingKey, setChangingKey] = useState(false);

  const ready = !busy && active.scrappable;

  const messageForError = (error: GenerateError | 'invalid-schema' | 'unknown', message?: string) => {
    switch (error) {
      case 'no-key':
        return 'Falta la API key.';
      case 'auth':
        return 'La API key no funciona. Probá con otra.';
      case 'network':
        return 'Sin conexión a Gemini. Mirá tu internet.';
      case 'parse':
      case 'empty':
        return 'El modelo devolvió algo raro. Reintentá.';
      case 'invalid-schema':
        return 'El modelo no devolvió campos válidos. Reintentá.';
      default:
        return message ?? 'Algo falló. Mirá la consola.';
    }
  };

  const handleResult = (result: SavePageResult) => {
    if (result.ok) {
      pushToast(`Listo. Ya tenés ${result.collection.items.length} en '${result.collection.name}'.`);
      onClose();
    } else {
      pushToast(messageForError(result.error, result.message));
      if (result.error === 'auth') setChangingKey(true);
    }
  };

  const onSaveToExisting = async (collectionId: string) => {
    if (!ready) return;
    setBusy(true);
    try {
      const page = await getActivePageContent();
      if (!page) {
        pushToast('No pude leer la página activa.');
        return;
      }
      const result = await savePageToExistingCollection(collectionId, page);
      handleResult(result);
    } catch (err) {
      console.error('savePageToExistingCollection failed', err);
      pushToast('No pude guardar. Mirá la consola.');
    } finally {
      setBusy(false);
    }
  };

  const onSaveToNew = async () => {
    if (!ready || newName.trim().length === 0) return;
    setBusy(true);
    try {
      const page = await getActivePageContent();
      if (!page) {
        pushToast('No pude leer la página activa.');
        return;
      }
      const result = await savePageToNewCollection(newName, page);
      handleResult(result);
      if (result.ok) setNewName('');
    } catch (err) {
      console.error('savePageToNewCollection failed', err);
      pushToast('No pude guardar. Mirá la consola.');
    } finally {
      setBusy(false);
    }
  };

  if (key === null || allCollections === null) {
    return (
      <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-xs text-zinc-500">
        Cargando…
      </section>
    );
  }

  if (key.trim().length === 0 || changingKey) {
    return (
      <ApiKeyPrompt
        title={changingKey ? 'Cambiar API key' : 'Necesito tu API key'}
        onSaved={() => setChangingKey(false)}
        onCancel={changingKey ? () => setChangingKey(false) : onClose}
      />
    );
  }

  return (
    <section className="space-y-2.5 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-zinc-100">Guardar esta página</h3>
          <p className="mt-0.5 truncate text-[11px] text-zinc-500" title={active.url}>
            {active.title || active.url || '—'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
          title="Cerrar"
        >
          ✕
        </button>
      </div>

      {!active.scrappable && (
        <p className="rounded border border-zinc-800 bg-zinc-950/50 p-2 text-[11px] text-zinc-400">
          Esta página no se puede leer (URL interna del navegador o sin acceso).
        </p>
      )}

      {allCollections.length > 0 && (
        <div className="flex items-center gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => setMode('list')}
            className={`rounded px-2 py-1 transition ${
              mode === 'list'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
            }`}
          >
            Agregar a una lista
          </button>
          <button
            type="button"
            onClick={() => setMode('new')}
            className={`rounded px-2 py-1 transition ${
              mode === 'new'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
            }`}
          >
            + Nueva lista
          </button>
        </div>
      )}

      {(mode === 'list' && allCollections.length > 0) ? (
        <ul className="space-y-1">
          {allCollections.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSaveToExisting(c.id)}
                disabled={!ready}
                className="flex w-full items-center justify-between rounded-md border border-zinc-800 bg-zinc-950/40 px-2.5 py-2 text-left transition hover:border-zinc-700 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-zinc-200">{c.name}</p>
                  <p className="text-[10px] text-zinc-500">
                    {c.items.length} {c.items.length === 1 ? 'item' : 'items'} · {c.schema.length} campos
                  </p>
                </div>
                <span className="text-zinc-500">→</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSaveToNew();
              }
            }}
            placeholder="Nombre de la lista (ej: casas BA)"
            maxLength={60}
            disabled={busy}
            className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-amber-500"
          />
          <button
            type="button"
            onClick={onSaveToNew}
            disabled={!ready || newName.trim().length === 0}
            className="w-full rounded-md bg-amber-500 px-3 py-2 text-xs font-medium text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Sacando los datos…' : 'Crear y guardar página'}
          </button>
        </div>
      )}

      {busy && mode === 'list' && (
        <p className="text-center text-[11px] text-zinc-500">Sacando los datos y guardando…</p>
      )}

      <div className="flex items-center justify-end pt-1">
        <button
          type="button"
          onClick={() => setChangingKey(true)}
          className="text-[10px] text-zinc-500 transition hover:text-zinc-300"
          title="Cambiar API key"
        >
          🔑 cambiar key
        </button>
      </div>
    </section>
  );
}

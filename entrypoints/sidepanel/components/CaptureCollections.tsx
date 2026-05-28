import { useState } from 'react';
import { DownloadSimple, Key, Plus, SpinnerGap, Trash } from '@phosphor-icons/react';
import { apiKey, type GenerateError } from '../lib/ai';
import {
  collections,
  deleteCollection,
  savePageToExistingCollection,
  savePageToNewCollection,
  type Collection,
  type SaveError,
} from '../lib/collections';
import { getActivePageContent } from '../lib/extractor';
import { useActiveTabScrappable } from '../lib/useActiveTabScrappable';
import { useStorageValue } from '../lib/useStorageValue';
import { downloadCsv } from '../lib/csv';
import { pushToast } from '../lib/toast';
import { timeAgo } from '../lib/format';

function messageFor(error: SaveError | GenerateError): string {
  switch (error) {
    case 'no-key':
      return 'Falta tu API key de Gemini.';
    case 'auth':
      return 'API key inválida. Cambiala.';
    case 'network':
      return 'Error de red. Probá de nuevo.';
    case 'parse':
    case 'empty':
      return 'El modelo no devolvió datos útiles.';
    case 'invalid-schema':
      return 'No pude inferir campos de la página.';
    default:
      return 'Algo falló. Probá de nuevo.';
  }
}

function fmtVal(v: unknown): string {
  return v === null || v === undefined || v === '' ? '—' : String(v);
}

/** Feature "Capturar página": scrapea la tab activa a una lista estructurada (Gemini). */
export default function CaptureCollections({ onOpenSettings }: { onOpenSettings: () => void }) {
  const key = useStorageValue(apiKey); // null = loading, '' = sin key, string = lista
  const active = useActiveTabScrappable();
  const cols = useStorageValue(collections);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  // Gate: si no hay API key, mandamos a Configuración (se setea allá).
  if (key === '') {
    return (
      <div className="flex flex-col gap-2 text-[13px]">
        <p className="text-ink-muted">Necesitás tu API key de Gemini para capturar páginas.</p>
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex items-center justify-center gap-2 self-start rounded-pill bg-mood-happy px-4 py-2 font-semibold text-white"
        >
          <Key weight="bold" size={16} />
          Configurar API key
        </button>
      </div>
    );
  }

  const canScrape = active.scrappable && !busy;

  async function onSaveNew() {
    if (!active.scrappable || !name.trim()) return;
    setBusy(true);
    try {
      const page = await getActivePageContent();
      if (!page) {
        pushToast('No pude leer la página.');
        return;
      }
      const r = await savePageToNewCollection(name.trim(), page);
      if (!r.ok) pushToast(messageFor(r.error));
      else {
        pushToast(`Listo. ${r.collection.items.length} en '${r.collection.name}'.`);
        setName('');
      }
    } finally {
      setBusy(false);
    }
  }

  async function onAddExisting(c: Collection) {
    if (!active.scrappable) return;
    setBusy(true);
    try {
      const page = await getActivePageContent();
      if (!page) {
        pushToast('No pude leer la página.');
        return;
      }
      const r = await savePageToExistingCollection(c.id, page);
      if (!r.ok) pushToast(messageFor(r.error));
      else pushToast(`Agregado a '${r.collection.name}' (${r.collection.items.length}).`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 text-[13px]">
      <div className="rounded-xl bg-sunken px-3 py-2 text-ink-muted">
        {active.scrappable ? (
          <>
            Página: <span className="text-ink">{active.title || active.url}</span>
          </>
        ) : (
          'Andá a una página web para capturarla.'
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre de la lista nueva…"
          className="min-w-0 flex-1 rounded-pill border border-outline bg-card px-3 py-2 text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-mood-happy"
        />
        <button
          type="button"
          onClick={onSaveNew}
          disabled={!canScrape || !name.trim()}
          className="flex shrink-0 items-center justify-center rounded-pill bg-mood-happy px-4 py-2 font-semibold text-white transition-opacity disabled:opacity-50"
        >
          {busy ? <SpinnerGap weight="bold" size={16} className="animate-spin" /> : 'Crear'}
        </button>
      </div>

      {cols && cols.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
            Listas
          </span>
          {cols.map((c) => (
            <CollectionCard key={c.id} c={c} canAdd={canScrape} onAdd={() => onAddExisting(c)} />
          ))}
        </div>
      )}
    </div>
  );
}

function CollectionCard({
  c,
  canAdd,
  onAdd,
}: {
  c: Collection;
  canAdd: boolean;
  onAdd: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl bg-sunken px-3 py-2">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setOpen((o) => !o)} className="min-w-0 flex-1 text-left">
          <span className="block truncate font-semibold text-ink">{c.name}</span>
          <span className="text-[11px] text-ink-muted">
            {c.items.length} {c.items.length === 1 ? 'ítem' : 'ítems'} · {timeAgo(c.updatedAt)}
          </span>
        </button>
        <button
          type="button"
          onClick={onAdd}
          disabled={!canAdd}
          aria-label="Agregar página actual"
          className="shrink-0 text-ink-muted transition-colors hover:text-ink disabled:opacity-40"
        >
          <Plus weight="bold" size={16} />
        </button>
        <button
          type="button"
          onClick={() => downloadCsv(c)}
          aria-label="Exportar CSV"
          className="shrink-0 text-ink-muted transition-colors hover:text-ink"
        >
          <DownloadSimple weight="duotone" size={16} />
        </button>
        <button
          type="button"
          onClick={() => deleteCollection(c.id)}
          aria-label="Borrar lista"
          className="shrink-0 text-ink-muted transition-colors hover:text-mood-angry"
        >
          <Trash weight="duotone" size={16} />
        </button>
      </div>
      {open && c.items.length > 0 && (
        <div className="mt-2 flex flex-col gap-1.5 border-t border-outline pt-2">
          {c.items.map((it) => (
            <div key={it.id} className="rounded-lg bg-card px-2.5 py-1.5">
              <div className="truncate text-[12px] font-semibold text-ink">{it.source.title}</div>
              <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-ink-muted">
                {c.schema.slice(0, 4).map((f) => (
                  <span key={f.key}>
                    {f.label}: <span className="text-ink">{fmtVal(it.values[f.key])}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

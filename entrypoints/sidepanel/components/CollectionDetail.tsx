import { useState } from 'react';
import { deleteCollection, deleteItem, type Collection, type Field } from '../lib/collections';
import { downloadCsv } from '../lib/csv';
import { timeAgo } from '../lib/format';
import { pushToast } from '../lib/toast';

type Props = {
  collection: Collection;
};

export function CollectionDetail({ collection }: Props) {
  const [busy, setBusy] = useState(false);
  const [confirmDeleteList, setConfirmDeleteList] = useState(false);

  const onExport = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await downloadCsv(collection);
      pushToast(`CSV de '${collection.name}' descargado.`);
    } catch (err) {
      console.error('downloadCsv failed', err);
      pushToast('No pude exportar el CSV.');
    } finally {
      setBusy(false);
    }
  };

  const onDeleteList = async () => {
    await deleteCollection(collection.id);
    pushToast(`Borré '${collection.name}'.`);
  };

  const onDeleteItem = async (itemId: string) => {
    await deleteItem(collection.id, itemId);
  };

  return (
    <div className="space-y-2 border-t border-zinc-900 pt-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">
          {collection.items.length} {collection.items.length === 1 ? 'item' : 'items'} · {collection.schema.length} campos
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onExport}
            disabled={busy || collection.items.length === 0}
            className="rounded-md border border-zinc-800 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? '…' : 'Export CSV'}
          </button>
          {confirmDeleteList ? (
            <>
              <button
                type="button"
                onClick={onDeleteList}
                className="rounded p-1 text-[11px] text-red-400 transition hover:bg-red-950"
                title="Confirmar borrado de la lista"
              >
                ✓
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteList(false)}
                className="rounded p-1 text-[11px] text-zinc-500 transition hover:bg-zinc-800"
                title="Cancelar"
              >
                ✕
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDeleteList(true)}
              className="rounded p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-red-400"
              title="Borrar lista"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {collection.items.length === 0 ? (
        <p className="text-xs text-zinc-600">Sin items todavía.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-zinc-900">
          <table className="min-w-full text-[11px]">
            <thead className="bg-zinc-950/60 text-left text-zinc-500">
              <tr>
                <th className="whitespace-nowrap px-2 py-1.5 font-medium">Fuente</th>
                <th className="whitespace-nowrap px-2 py-1.5 font-medium">Cuando</th>
                {collection.schema.map((f) => (
                  <th key={f.key} className="whitespace-nowrap px-2 py-1.5 font-medium">
                    {f.label}
                  </th>
                ))}
                <th className="px-2 py-1.5" />
              </tr>
            </thead>
            <tbody>
              {collection.items.map((item) => (
                <tr key={item.id} className="border-t border-zinc-900 align-top">
                  <td className="max-w-[180px] px-2 py-1.5">
                    <a
                      href={item.source.url}
                      target="_blank"
                      rel="noreferrer"
                      title={item.source.url}
                      className="block truncate text-zinc-300 hover:text-amber-300"
                    >
                      {item.source.title}
                    </a>
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-zinc-500">
                    {timeAgo(item.source.capturedAt)}
                  </td>
                  {collection.schema.map((f) => (
                    <td key={f.key} className="whitespace-nowrap px-2 py-1.5 text-zinc-200">
                      {renderValue(item.values[f.key], f)}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      title="Borrar item"
                      className="rounded p-0.5 text-zinc-600 transition hover:bg-zinc-800 hover:text-red-400"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function renderValue(value: unknown, field: Field): React.ReactNode {
  if (value === null || value === undefined || value === '') {
    return <span className="text-zinc-600">—</span>;
  }
  if (field.type === 'url' && typeof value === 'string') {
    return (
      <a href={value} target="_blank" rel="noreferrer" className="underline hover:text-amber-300">
        link
      </a>
    );
  }
  if (field.type === 'number' && typeof value === 'number') {
    return value.toLocaleString('es-AR');
  }
  return String(value);
}

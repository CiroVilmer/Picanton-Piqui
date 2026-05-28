import { useState } from 'react';
import { collections, type Collection } from '../lib/collections';
import { useStorageValue } from '../lib/useStorageValue';
import { CollectionDetail } from './CollectionDetail';

export function CollectionsCard() {
  const all = useStorageValue(collections);

  if (all === null) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        Mis listas{all.length > 0 ? ` (${all.length})` : ''}
      </h2>
      {all.length === 0 ? (
        <p className="text-xs text-zinc-600">
          Guardá una página y se crea tu primera lista.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {all.map((c) => (
            <CollectionRow key={c.id} collection={c} />
          ))}
        </ul>
      )}
    </section>
  );
}

function CollectionRow({ collection }: { collection: Collection }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2.5">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-zinc-100">{collection.name}</p>
          <p className="text-[10px] text-zinc-500">
            {collection.items.length} {collection.items.length === 1 ? 'item' : 'items'} · {collection.schema.length} campos
          </p>
        </div>
        <span className="text-xs text-zinc-500">{expanded ? '▴' : '▾'}</span>
      </button>
      {expanded && (
        <div className="mt-2">
          <CollectionDetail collection={collection} />
        </div>
      )}
    </li>
  );
}

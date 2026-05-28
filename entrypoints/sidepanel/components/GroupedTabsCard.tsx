import { useState } from 'react';
import { CATEGORY_META, DOT_CLASS, type Category, type SkimTab } from '../lib/classifier';
import { SaveGroupButton } from './SaveGroupButton';

type Props = {
  category: Category;
  tabs: ReadonlyArray<SkimTab>;
};

const COLLAPSED_MAX = 4;

export function GroupedTabsCard({ category, tabs }: Props) {
  const [expanded, setExpanded] = useState(false);
  const meta = CATEGORY_META[category];
  const visible = expanded ? tabs : tabs.slice(0, COLLAPSED_MAX);
  const hidden = tabs.length - visible.length;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${DOT_CLASS[category]}`} />
          <span className="text-sm font-medium text-zinc-100">{meta.label}</span>
          <span className="text-xs text-zinc-500">({tabs.length})</span>
        </div>
        <SaveGroupButton category={category} tabs={tabs} />
      </div>

      <ul className="mt-2 space-y-1">
        {visible.map((t) => (
          <li key={t.id} className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="flex size-3.5 shrink-0 items-center justify-center">
              {t.favIconUrl ? (
                <img
                  src={t.favIconUrl}
                  alt=""
                  className="size-3.5 rounded-sm"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
                  }}
                />
              ) : null}
            </span>
            <span
              className="truncate"
              title={`${t.title}\n${t.url}`}
            >
              <span className="text-zinc-500">{hostnameOf(t.url)}</span>
              {' · '}
              <span className="text-zinc-300">{t.title}</span>
            </span>
          </li>
        ))}
      </ul>

      {hidden > 0 && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-2 text-xs text-zinc-500 transition hover:text-zinc-300"
        >
          +{hidden} más ▾
        </button>
      )}
      {expanded && tabs.length > COLLAPSED_MAX && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="mt-2 text-xs text-zinc-500 transition hover:text-zinc-300"
        >
          Mostrar menos ▴
        </button>
      )}
    </div>
  );
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

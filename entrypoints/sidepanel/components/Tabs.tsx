export type TabId = 'actions' | 'chat';

const ITEMS: { id: TabId; label: string }[] = [
  { id: 'actions', label: 'Acciones' },
  { id: 'chat', label: 'Chat' },
];

/** Pill switcher estilo iOS segmented control (manifest §7.3). */
export default function Tabs({
  value,
  onChange,
}: {
  value: TabId;
  onChange: (v: TabId) => void;
}) {
  return (
    <div role="tablist" className="flex shrink-0 gap-0.5 rounded-pill bg-sunken p-1">
      {ITEMS.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={`flex-1 rounded-pill px-3 py-2 text-[13px] font-semibold transition-colors duration-200 ${
              active ? 'bg-card text-ink shadow-soft' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

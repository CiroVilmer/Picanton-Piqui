import { CaretRight } from '@phosphor-icons/react';
import { ANGRY_ACTIONS, HAPPY_ACTIONS, type ActionItem, type ActionTone } from '../actions';
import { isAngryMode } from '../mood';

const TONE_BG: Record<ActionTone, string> = {
  mint: 'bg-accent-mint',
  peach: 'bg-accent-peach',
  coral: 'bg-accent-coral',
};

/** Stack de action cards; el set cambia según isAngryMode (manifest §7.4). */
export default function ActionMenu({ mood }: { mood: number }) {
  const actions = isAngryMode(mood) ? ANGRY_ACTIONS : HAPPY_ACTIONS;
  return (
    <div className="flex flex-col gap-2">
      {actions.map((action) => (
        <ActionCard key={action.id} action={action} />
      ))}
    </div>
  );
}

function ActionCard({ action }: { action: ActionItem }) {
  const { Icon, title, desc, tone } = action;
  return (
    <button
      type="button"
      onClick={() => console.log('action:', action.id)}
      className="flex items-center gap-3 rounded-btn bg-card px-4 py-3 text-left shadow-soft transition-transform duration-[120ms] ease-out hover:-translate-y-px active:translate-y-0 active:shadow-press"
    >
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${TONE_BG[tone]}`}>
        <Icon weight="duotone" size={22} className="text-ink" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="block truncate text-xs text-ink-muted">{desc}</span>
      </span>
      <CaretRight weight="bold" size={16} className="shrink-0 text-ink-muted" />
    </button>
  );
}

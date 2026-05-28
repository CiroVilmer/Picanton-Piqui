import { useEffect, useState } from 'react';
import { DOT_CLASS } from '../lib/classifier';
import { timeAgo } from '../lib/format';
import {
  sessions as sessionsStore,
  deleteSession,
  renameSession,
  reopenSession,
  type Session,
} from '../lib/sessions';
import { pushToast } from '../lib/toast';
import { useStorageValue } from '../lib/useStorageValue';

export function SessionList() {
  const sessions = useStorageValue(sessionsStore);

  if (sessions === null) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        Mis sesiones{sessions.length > 0 ? ` (${sessions.length})` : ''}
      </h2>
      {sessions.length === 0 ? (
        <p className="text-xs text-zinc-600">
          Cuando guardes un grupo, te aparece acá.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {sessions.map((s) => (
            <SessionItem key={s.id} session={s} />
          ))}
        </ul>
      )}
    </section>
  );
}

function SessionItem({ session }: { session: Session }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(session.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reopening, setReopening] = useState(false);

  useEffect(() => {
    setDraft(session.name);
  }, [session.name]);

  const commit = async () => {
    setEditing(false);
    const clean = draft.trim();
    if (clean.length === 0 || clean === session.name) {
      setDraft(session.name);
      return;
    }
    await renameSession(session.id, clean);
  };

  const onReopen = async () => {
    if (reopening) return;
    setReopening(true);
    try {
      const { tabsOpened } = await reopenSession(session);
      pushToast(`Reabrí ${tabsOpened} tabs en '${session.name}'.`);
    } catch (err) {
      console.error('reopenSession failed', err);
      pushToast('No pude reabrir. Mirá la consola.');
    } finally {
      setReopening(false);
    }
  };

  const onDelete = async () => {
    await deleteSession(session.id);
  };

  return (
    <li className="flex items-center gap-2 rounded-md border border-zinc-900 bg-zinc-900/40 px-2.5 py-2">
      <span className={`size-2 shrink-0 rounded-full ${DOT_CLASS[session.category]}`} />

      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commit();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                setDraft(session.name);
                setEditing(false);
              }
            }}
            maxLength={60}
            className="w-full rounded border border-zinc-700 bg-zinc-950 px-1.5 py-0.5 text-xs text-zinc-100 outline-none focus:border-amber-400"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="block w-full truncate text-left text-xs font-medium text-zinc-200 transition hover:text-zinc-50"
            title="Click para renombrar"
          >
            {session.name}
          </button>
        )}
        <p className="text-[10px] text-zinc-500">
          {session.tabs.length} tabs · {timeAgo(session.createdAt)}
        </p>
      </div>

      {confirmDelete ? (
        <>
          <button
            type="button"
            onClick={onDelete}
            className="rounded p-1 text-xs text-red-400 transition hover:bg-red-950"
            title="Confirmar borrado"
          >
            ✓
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            className="rounded p-1 text-xs text-zinc-500 transition hover:bg-zinc-800"
            title="Cancelar"
          >
            ✕
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={onReopen}
            disabled={reopening}
            className="rounded p-1 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-50"
            title="Reabrir"
          >
            {reopening ? '…' : '↩️'}
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="rounded p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-red-400"
            title="Borrar"
          >
            🗑️
          </button>
        </>
      )}
    </li>
  );
}

import { useToasts } from '../lib/toast';

export function ToastHost() {
  const toasts = useToasts();
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-50 flex flex-col items-center gap-1.5 px-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto max-w-full rounded-md border border-zinc-800 bg-zinc-900/95 px-3 py-2 text-xs text-zinc-100 shadow-lg backdrop-blur"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

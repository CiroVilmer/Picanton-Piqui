import { useToasts } from '../lib/toast';

/** Stack de toasts fijo abajo (manifest: feedback de los handlers). */
export default function ToastHost() {
  const toasts = useToasts();
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-50 flex flex-col items-center gap-1.5 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto max-w-full rounded-pill bg-ink px-4 py-2 text-center text-[12px] font-medium text-white shadow-soft"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

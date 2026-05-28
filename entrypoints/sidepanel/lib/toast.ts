import { useEffect, useState } from 'react';

export type Toast = { id: string; message: string };

const listeners = new Set<(toasts: Toast[]) => void>();
let current: Toast[] = [];
const TOAST_TTL_MS = 2800;

function emit() {
  for (const l of listeners) l(current);
}

export function pushToast(message: string): void {
  const id = crypto.randomUUID();
  current = [...current, { id, message }];
  emit();
  setTimeout(() => {
    current = current.filter((t) => t.id !== id);
    emit();
  }, TOAST_TTL_MS);
}

export function useToasts(): Toast[] {
  const [toasts, setToasts] = useState<Toast[]>(current);
  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);
  return toasts;
}

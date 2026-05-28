import { useEffect, useState } from 'react';
import type { WxtStorageItem } from 'wxt/utils/storage';

export function useStorageValue<T>(item: WxtStorageItem<T, any>): T | null {
  const [value, setValue] = useState<T | null>(null);

  useEffect(() => {
    let cancelled = false;
    item.getValue().then((v) => {
      if (!cancelled) setValue(v);
    });
    const unwatch = item.watch((newVal) => {
      if (!cancelled) setValue(newVal);
    });
    return () => {
      cancelled = true;
      unwatch();
    };
  }, [item]);

  return value;
}

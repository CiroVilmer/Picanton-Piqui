import { useEffect, useRef, useState } from 'react';
import { storage } from 'wxt/utils/storage';
import { moodBand, type MoodBand } from '../mood';
import { recordMoodChange } from './usage-stats';

/* Parámetros del loop (tuneables para el demo). */
const HUNGER_TICK_MS = 10000; // cada 10s
const HUNGER_DECAY = 10; // baja 10% por tick
const HUNGER_THRESHOLD = 30; // bajo esto, también cae el ánimo
const MOOD_DECAY = 15; // cuánto cae el ánimo por tick con hambre baja
const HUNGER_FEED_BONUS = 35; // cuánto sube el hambre al comer
const MOOD_FEED_BONUS = 25; // cuánto sube el ánimo al comer
const ANGRY_EXIT_FLOOR = 55; // comer siempre lo saca de enojo (>50)
const DEMO_MOOD = 70;
const DEMO_HUNGER = 80;

type Vitals = { mood: number; hunger: number };

/** Estado vital persistente (sobrevive cerrar/reabrir la extensión). */
const vitals = storage.defineItem<Vitals>('local:vitals', {
  fallback: { mood: DEMO_MOOD, hunger: DEMO_HUNGER },
});

const clamp = (n: number) => Math.max(0, Math.min(100, n));

export interface PiquiVitals {
  mood: number;
  hunger: number;
  setMood: (n: number) => void;
  setHunger: (n: number) => void;
  feed: () => void;
  /** true = el decay está congelado (dev "still"): no baja hambre ni ánimo. */
  paused: boolean;
  setPaused: (b: boolean) => void;
}

/**
 * Loop tamagotchi: el hambre decae sola; bajo el umbral arrastra al ánimo. Corre en el
 * side panel (los ticks de 10s no son posibles en el background MV3). Persiste mood+hunger
 * y mantiene el tracking de bandas para el Wrapped (recordMoodChange).
 */
export function usePiquiVitals(): PiquiVitals {
  const [mood, setMoodState] = useState(DEMO_MOOD);
  const [hunger, setHungerState] = useState(DEMO_HUNGER);
  const [paused, setPaused] = useState(false);

  const moodRef = useRef(mood);
  const hungerRef = useRef(hunger);
  const pausedRef = useRef(paused);
  const loadedRef = useRef(false);
  const lastBandRef = useRef<MoodBand | null>(null);

  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);
  useEffect(() => {
    hungerRef.current = hunger;
  }, [hunger]);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // Persistir (recién cuando cargó, para no pisar el storage con los valores de mount).
  function persist(m: number, h: number) {
    if (!loadedRef.current) return;
    vitals.setValue({ mood: m, hunger: h }).catch((e) => console.warn('[piqui vitals] persist', e));
  }

  // Cargar el estado guardado una vez.
  useEffect(() => {
    let cancelled = false;
    vitals.getValue().then((v) => {
      if (cancelled) return;
      setMoodState(clamp(v.mood));
      setHungerState(clamp(v.hunger));
      loadedRef.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Tracking de bandas para el Wrapped (portado de useTrackedMood).
  useEffect(() => {
    const band = moodBand(mood);
    if (lastBandRef.current === band) return;
    lastBandRef.current = band;
    recordMoodChange(band).catch((err) =>
      console.warn('[piqui usage] recordMoodChange failed', err),
    );
  }, [mood]);

  // Tick único: hambre decae; bajo el umbral arrastra el ánimo. Lee refs (no closures).
  useEffect(() => {
    const id = setInterval(() => {
      if (!loadedRef.current || pausedRef.current) return; // "still": no decae
      const nextHunger = clamp(hungerRef.current - HUNGER_DECAY);
      let nextMood = moodRef.current;
      if (nextHunger < HUNGER_THRESHOLD) nextMood = clamp(nextMood - MOOD_DECAY);
      setHungerState(nextHunger);
      setMoodState(nextMood);
      persist(nextMood, nextHunger);
    }, HUNGER_TICK_MS);
    return () => clearInterval(id);
  }, []);

  const setMood = (n: number) => {
    const v = clamp(n);
    setMoodState(v);
    persist(v, hungerRef.current);
  };
  const setHunger = (n: number) => {
    const v = clamp(n);
    setHungerState(v);
    persist(moodRef.current, v);
  };
  const feed = () => {
    const h = clamp(hungerRef.current + HUNGER_FEED_BONUS);
    const m = clamp(Math.max(moodRef.current + MOOD_FEED_BONUS, ANGRY_EXIT_FLOOR));
    setHungerState(h);
    setMoodState(m);
    persist(m, h);
  };

  return { mood, hunger, setMood, setHunger, feed, paused, setPaused };
}

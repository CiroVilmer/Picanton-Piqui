import { useEffect, useRef } from 'react';
import { isAngryMode } from '../mood';
import { shouldSkipTab } from './classifier';
import { pushToast } from './toast';

const RICKROLL_URL =
  'https://www.youtube.com/watch?v=QDia3e12czc&pp=ygUIcmlja3JvbGw%3D';
const MISCHIEF_MS = 18000; // cada ~18s mientras está enojado
const FIRST_MISCHIEF_MS = 2500; // primera maldad poco después de enojarse

async function closeRandomTab() {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    if (tabs.length <= 1) return; // nunca dejar la ventana sin pestañas
    const eligible = tabs.filter((t) => t.id != null && !t.active && !shouldSkipTab(t));
    if (eligible.length === 0) return;
    const victim = eligible[Math.floor(Math.random() * eligible.length)];
    await chrome.tabs.remove(victim.id!);
    pushToast('Piqui te cerró una pestaña 🌶️');
  } catch (e) {
    console.warn('[piqui mischief] close failed', e);
  }
}

async function openRickroll() {
  try {
    await chrome.tabs.create({ url: RICKROLL_URL, active: true });
    pushToast('Piqui te rickrolleó 😈');
  } catch (e) {
    console.warn('[piqui mischief] rickroll failed', e);
  }
}

/**
 * Cuando Piqui está enojado, cada ~18s hace una maldad al azar: cierra una pestaña
 * random o abre el rickroll. Corre en el side panel; para cuando deja de estar enojado
 * o se cierra el panel.
 */
export function usePiquiMischief(mood: number): void {
  const moodRef = useRef(mood);
  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  const angry = isAngryMode(mood);

  useEffect(() => {
    if (!angry) return;
    const doMischief = () => {
      if (!isAngryMode(moodRef.current)) return;
      if (Math.random() < 0.5) closeRandomTab();
      else openRickroll();
    };
    const first = window.setTimeout(doMischief, FIRST_MISCHIEF_MS);
    const id = window.setInterval(doMischief, MISCHIEF_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [angry]);
}

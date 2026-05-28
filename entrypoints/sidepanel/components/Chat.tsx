import { useEffect, useRef, useState } from 'react';
import { Key } from '@phosphor-icons/react';
import { apiKey, type GenerateError } from '../lib/ai';
import { chatLog, streamPiquiReply, type ChatMessage } from '../lib/chat';
import { useStorageValue } from '../lib/useStorageValue';
import { pushToast } from '../lib/toast';
import ChatBubble from './ChatMessage';
import TypingDots from './TypingDots';
import ChatInput from './ChatInput';

function messageFor(error: GenerateError): string {
  switch (error) {
    case 'no-key':
      return 'Falta tu API key de Gemini.';
    case 'auth':
      return 'API key inválida. Cambiala en Configuración.';
    case 'network':
      return 'Error de red. Probá de nuevo.';
    case 'empty':
      return 'Piqui se quedó mudo. Probá de nuevo.';
    case 'parse':
      return 'Respuesta rara del modelo. Probá de nuevo.';
    default:
      return 'Algo falló. Probá de nuevo.';
  }
}

/** Chat con Piqui: respuestas streameadas de Gemini, persistente, con su personalidad. */
export default function Chat({
  mood,
  hunger,
  onOpenSettings,
}: {
  mood: number;
  hunger: number;
  onOpenSettings: () => void;
}) {
  const key = useStorageValue(apiKey); // null = loading, '' = sin key, string = lista
  const messages = useStorageValue(chatLog); // null = loading
  const [streaming, setStreaming] = useState<string | null>(null); // texto in-flight de Piqui
  const [busy, setBusy] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const cancelled = useRef(false);

  useEffect(() => () => {
    cancelled.current = true;
  }, []);

  // auto-scroll al fondo cuando entran mensajes o llega un chunk
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  async function onSend(text: string) {
    if (busy) return;
    const history = messages ?? [];
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      createdAt: Date.now(),
    };
    const next = [...history, userMsg];
    await chatLog.setValue(next); // persistir el turno del user ya mismo
    setBusy(true);
    setStreaming('');

    const r = await streamPiquiReply(next, mood, hunger, (delta) => {
      if (!cancelled.current) setStreaming((s) => (s ?? '') + delta);
    });
    if (cancelled.current) return;

    if (r.ok) {
      const piquiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'piqui',
        text: r.data,
        createdAt: Date.now(),
      };
      await chatLog.setValue([...next, piquiMsg]); // persistir respuesta completa
    } else {
      pushToast(messageFor(r.error));
    }
    setStreaming(null);
    setBusy(false);
  }

  // Gate: sin API key → mandamos a Configuración.
  if (key === '') {
    return (
      <div className="flex flex-col gap-2 rounded-card bg-card p-4 text-[13px] shadow-soft">
        <p className="text-ink-muted">Para chatear con Piqui necesitás tu API key de Gemini.</p>
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex items-center justify-center gap-2 self-start rounded-pill bg-mood-happy px-4 py-2 font-semibold text-white"
        >
          <Key weight="bold" size={16} />
          Configurar API key
        </button>
      </div>
    );
  }

  const list = messages ?? [];

  return (
    <div className="flex min-h-60 flex-col rounded-card bg-card p-3 shadow-soft">
      {list.length > 0 && !busy && (
        <div className="mb-1 flex justify-end">
          <button
            type="button"
            onClick={() => chatLog.setValue([])}
            className="text-[11px] font-semibold text-ink-muted transition-colors hover:text-mood-angry"
          >
            Limpiar
          </button>
        </div>
      )}
      <div ref={logRef} className="flex max-h-80 flex-1 flex-col gap-2 overflow-y-auto">
        {list.map((m) => (
          <ChatBubble key={m.id} from={m.role} text={m.text} />
        ))}
        {busy &&
          (streaming ? (
            <ChatBubble from="piqui" text={streaming} />
          ) : (
            <div className="flex justify-start">
              <TypingDots />
            </div>
          ))}
      </div>
      <ChatInput onSend={onSend} disabled={busy} />
    </div>
  );
}

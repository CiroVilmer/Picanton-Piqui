import { useState } from 'react';
import { PaperPlaneTilt } from '@phosphor-icons/react';

/** Input del chat. Envía con Enter o con el botón; se bloquea mientras Piqui responde. */
export default function ChatInput({
  onSend,
  disabled = false,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t || disabled) return;
    onSend(t);
    setText('');
  }

  return (
    <form onSubmit={submit} className="mt-3 flex items-center gap-2 border-t border-outline pt-3">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        placeholder="Escribile a Piqui…"
        className="min-w-0 flex-1 rounded-pill border border-outline bg-card px-4 py-2 text-[13px] text-ink outline-none transition-colors duration-150 placeholder:text-ink-muted focus:border-mood-happy disabled:opacity-60"
      />
      <button
        type="submit"
        aria-label="Enviar"
        disabled={disabled}
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-mood-happy text-white transition-transform duration-100 hover:scale-105 active:scale-95 disabled:opacity-50"
      >
        <PaperPlaneTilt weight="fill" size={18} />
      </button>
    </form>
  );
}

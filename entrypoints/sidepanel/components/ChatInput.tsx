import { useState } from 'react';
import { PaperPlaneTilt } from '@phosphor-icons/react';

/** Input del chat (placeholder: no envía nada todavía, manifest §7.5.3). */
export default function ChatInput() {
  const [text, setText] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setText('');
      }}
      className="mt-3 flex items-center gap-2 border-t border-outline pt-3"
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escribile a Piqui…"
        className="min-w-0 flex-1 rounded-pill border border-outline bg-card px-4 py-2 text-[13px] text-ink outline-none transition-colors duration-150 placeholder:text-ink-muted focus:border-mood-happy"
      />
      <button
        type="submit"
        aria-label="Enviar"
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-mood-happy text-white transition-transform duration-100 hover:scale-105 active:scale-95"
      >
        <PaperPlaneTilt weight="fill" size={18} />
      </button>
    </form>
  );
}

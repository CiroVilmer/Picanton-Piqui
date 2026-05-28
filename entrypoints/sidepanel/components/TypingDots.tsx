/** Indicador "Piqui escribiendo…" (manifest §7.5.2). */
export default function TypingDots() {
  return (
    <div className="inline-flex items-center gap-[5px] rounded-2xl rounded-bl-md bg-sunken px-[14px] py-3">
      {[0, 0.18, 0.36].map((delay, i) => (
        <span
          key={i}
          className="size-1.5 animate-typing-bounce rounded-full bg-ink-muted"
          style={{ animationDelay: `${delay}s`, opacity: 0.4 }}
        />
      ))}
    </div>
  );
}

/** Row delgado con stats placeholder (manifest §7.6). */
export default function Footer() {
  return (
    <footer className="flex shrink-0 items-center gap-2 border-t border-outline px-4 py-3 text-xs text-ink-muted">
      <span className="size-2 rounded-full bg-mood-happy" />
      <span>3 tabs activas · 12 hoy</span>
    </footer>
  );
}

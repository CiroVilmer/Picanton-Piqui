import { Gear } from '@phosphor-icons/react';

/** Header — logo de Piqui centrado + acceso a settings (manifest §7.1). */
export default function Header() {
  return (
    <header className="relative flex h-[88px] shrink-0 items-center justify-center">
      <img
        src="/piqui.png"
        alt="Piqui"
        draggable={false}
        className="h-16 w-auto select-none [-webkit-user-drag:none]"
      />
      <button
        type="button"
        aria-label="Configuración"
        title="Configuración"
        onClick={() => console.log('settings: panel próximamente')}
        className="absolute right-4 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted transition-colors duration-150 hover:bg-sunken hover:text-ink active:shadow-press"
      >
        <Gear weight="duotone" size={22} />
      </button>
    </header>
  );
}

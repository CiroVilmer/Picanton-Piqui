import { useEffect, useRef, useState } from 'react';
import { CROSSFADE_MS } from '../piqui-anim';
import { usePiquiAnimation, type PiquiClip } from '../usePiquiAnimation';
import type { MoodBand } from '../mood';
import PiquiCharacter from './PiquiCharacter';

/**
 * Stage del personaje de Piqui. Reproduce los clips de video según la felicidad
 * (idle + transiciones) con crossfade entre clips. Si los mp4 no existen todavía,
 * cae limpio al placeholder SVG (PiquiCharacter), que ya reacciona al mood.
 *
 * Se monta dentro de un contenedor `relative` (el viewport del Stage).
 */
export default function PiquiVideoStage({ mood, band }: { mood: number; band: MoodBand }) {
  const { clip, onClipEnded } = usePiquiAnimation(mood);
  return <Crossfader clip={clip} band={band} onEnded={onClipEnded} />;
}

/**
 * Crossfade de dos capas. Cada slot lleva un `token` incremental: al cargar un clip
 * en el slot de atrás se bumpea el token, lo que cambia la `key` del <video> y fuerza
 * un remount → carga fresca → onCanPlay siempre dispara → el flip nunca se traba.
 * (Sin el token, reusar el mismo src en un slot dejaba el video congelado.)
 */
interface SlotData {
  clip: PiquiClip;
  token: number;
}
interface SlotsState {
  a: SlotData | null;
  b: SlotData | null;
  front: 'a' | 'b';
}

const SLOTS = ['a', 'b'] as const;

function Crossfader({
  clip,
  band,
  onEnded,
}: {
  clip: PiquiClip;
  band: MoodBand;
  onEnded: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const tokenRef = useRef(0);
  const [slots, setSlots] = useState<SlotsState>(() => ({
    a: { clip, token: 0 },
    b: null,
    front: 'a',
  }));

  // Clip nuevo → cargarlo en el slot de atrás con token fresco (remonta el <video>).
  useEffect(() => {
    setSlots((prev) => {
      const frontSlot = prev.front === 'a' ? prev.a : prev.b;
      if (frontSlot && frontSlot.clip.src === clip.src) {
        // Mismo src ya al frente: sólo refrescamos la referencia, sin remount.
        return prev.front === 'a'
          ? { ...prev, a: { clip, token: frontSlot.token } }
          : { ...prev, b: { clip, token: frontSlot.token } };
      }
      tokenRef.current += 1;
      const slot: SlotData = { clip, token: tokenRef.current };
      return prev.front === 'a' ? { ...prev, b: slot } : { ...prev, a: slot };
    });
  }, [clip]);

  if (failed) {
    // Sin videos: el SVG fallback sigue al `band` directamente; no necesita la máquina.
    return <PiquiCharacter band={band} />;
  }

  const handleCanPlay = (slot: 'a' | 'b') => {
    // El slot recién cargado (atrás) ya puede reproducir → traerlo al frente (crossfade).
    setSlots((prev) => (prev.front === slot ? prev : { ...prev, front: slot }));
  };

  return (
    <>
      {SLOTS.map((slot) => {
        const data = slots[slot];
        if (!data) return null;
        const visible = slots.front === slot;
        return (
          <video
            key={`${slot}-${data.token}`}
            src={data.clip.src}
            autoPlay
            muted
            playsInline
            preload="auto"
            onCanPlay={() => handleCanPlay(slot)}
            onError={() => setFailed(true)}
            onEnded={visible ? onEnded : undefined}
            className="absolute inset-0 h-full w-full object-contain"
            style={{
              // disuelve el fondo blanco del mp4 contra el viewport + cropea el borde (manifest §7.2)
              mixBlendMode: 'multiply',
              transform: 'scale(1.015)',
              opacity: visible ? 1 : 0,
              transition: `opacity ${CROSSFADE_MS}ms ease`,
              zIndex: visible ? 1 : 0,
            }}
          />
        );
      })}
    </>
  );
}

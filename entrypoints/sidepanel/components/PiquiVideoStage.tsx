import { useEffect, useState } from 'react';
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

interface Slots {
  a: PiquiClip | null;
  b: PiquiClip | null;
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
  const [slots, setSlots] = useState<Slots>({ a: clip, b: null, front: 'a' });

  // Cuando cambia el clip, lo cargamos en el slot de atrás (oculto). El flip a front
  // recién ocurre cuando ese video puede reproducir (onCanPlay) → sin frame negro.
  useEffect(() => {
    setSlots((prev) => {
      const frontClip = prev.front === 'a' ? prev.a : prev.b;
      if (frontClip && frontClip.src === clip.src) {
        // Mismo src (idle sigue loopeando): actualizamos flags en el lugar, sin reload.
        return prev.front === 'a' ? { ...prev, a: clip } : { ...prev, b: clip };
      }
      return prev.front === 'a' ? { ...prev, b: clip } : { ...prev, a: clip };
    });
  }, [clip]);

  // Sin videos disponibles: si quedamos en medio de una transición, avanzamos la
  // máquina a mano para que el SVG (que sigue al band) se asiente en el destino.
  useEffect(() => {
    if (failed && clip.transition) {
      const t = setTimeout(onEnded, 450);
      return () => clearTimeout(t);
    }
  }, [failed, clip.transition, onEnded]);

  if (failed) {
    return <PiquiCharacter band={band} />;
  }

  const handleCanPlay = (slot: 'a' | 'b') => {
    // El slot recién cargado (el de atrás) ya puede reproducir → traerlo al frente.
    setSlots((prev) => (prev.front === slot ? prev : { ...prev, front: slot }));
  };

  return (
    <>
      {SLOTS.map((slot) => {
        const c = slots[slot];
        if (!c) return null;
        const visible = slots.front === slot;
        return (
          <video
            key={slot}
            src={c.src}
            autoPlay
            muted
            playsInline
            loop={c.loop}
            preload="auto"
            onCanPlay={() => handleCanPlay(slot)}
            onError={() => setFailed(true)}
            onEnded={c.transition && visible ? onEnded : undefined}
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

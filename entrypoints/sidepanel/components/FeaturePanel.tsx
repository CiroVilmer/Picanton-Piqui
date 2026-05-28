import { useEffect, useRef, useState } from 'react';
import { BowlFood, Confetti, GameController, Stack, Table } from '@phosphor-icons/react';
import { isAngryMode } from '../mood';
import AccordionItem from './AccordionItem';
import FeedPiqui from './FeedPiqui';
import OrganizeTabs from './OrganizeTabs';
import CaptureCollections from './CaptureCollections';
import WrappedShowcase from './WrappedShowcase';
import PreguntadosShowcase from './PreguntadosShowcase';

type FeatureId = 'feed' | 'organize' | 'capture' | 'wrapped' | 'preguntados';

/**
 * Contenido de la pestaña "Acciones": acordeón de features (apertura única).
 * "Alimentar" nunca se bloquea (es como recuperás a Piqui); el resto se bloquea
 * cuando está enojado.
 */
export default function FeaturePanel({
  mood,
  feed,
  onOpenSettings,
}: {
  mood: number;
  feed: () => void;
  onOpenSettings: () => void;
}) {
  const locked = isAngryMode(mood);
  const [open, setOpen] = useState<FeatureId | null>('organize');
  const toggle = (id: FeatureId) => setOpen((prev) => (prev === id ? null : id));

  // Auto-abrir "Alimentar" al ENTRAR en enojo (flanco false→true).
  const wasAngry = useRef(locked);
  useEffect(() => {
    if (locked && !wasAngry.current) setOpen('feed');
    wasAngry.current = locked;
  }, [locked]);

  return (
    <div className="flex flex-col gap-2">
      {locked && (
        <p className="rounded-btn bg-accent-coral px-3 py-2 text-xs font-medium text-ink">
          Piqui está picado 🌶️ — dale de comer para que te ayude.
        </p>
      )}
      <AccordionItem
        Icon={BowlFood}
        title="Alimentar a Piqui"
        desc="Dale comida de tus pestañas"
        open={open === 'feed'}
        locked={false}
        onToggle={() => toggle('feed')}
      >
        <FeedPiqui onFeed={feed} />
      </AccordionItem>
      <AccordionItem
        Icon={Stack}
        title="Organizar pestañas"
        desc="Agrupa tus tabs por contexto"
        open={open === 'organize'}
        locked={locked}
        onToggle={() => toggle('organize')}
      >
        <OrganizeTabs />
      </AccordionItem>
      <AccordionItem
        Icon={Table}
        title="Capturar página"
        desc="Armá listas (precios, specs…)"
        open={open === 'capture'}
        locked={locked}
        onToggle={() => toggle('capture')}
      >
        <CaptureCollections onOpenSettings={onOpenSettings} />
      </AccordionItem>
      <AccordionItem
        Icon={Confetti}
        title="Tu Wrapped"
        desc="Resumen al estilo Spotify"
        open={open === 'wrapped'}
        locked={locked}
        onToggle={() => toggle('wrapped')}
      >
        <WrappedShowcase />
      </AccordionItem>
      <AccordionItem
        Icon={GameController}
        title="Preguntados"
        desc="Trivia del ecosistema"
        open={open === 'preguntados'}
        locked={locked}
        onToggle={() => toggle('preguntados')}
      >
        <PreguntadosShowcase />
      </AccordionItem>
    </div>
  );
}

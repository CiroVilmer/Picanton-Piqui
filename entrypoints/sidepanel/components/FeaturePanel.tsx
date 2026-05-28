import { useState } from 'react';
import { Stack, Table } from '@phosphor-icons/react';
import { isAngryMode } from '../mood';
import AccordionItem from './AccordionItem';
import OrganizeTabs from './OrganizeTabs';
import CaptureCollections from './CaptureCollections';

type FeatureId = 'organize' | 'capture';

/**
 * Contenido de la pestaña "Acciones": acordeón de features (apertura única).
 * Si Piqui está enojado, los botones quedan bloqueados (no expanden).
 */
export default function FeaturePanel({ mood }: { mood: number }) {
  const locked = isAngryMode(mood);
  const [open, setOpen] = useState<FeatureId | null>('organize');
  const toggle = (id: FeatureId) => setOpen((prev) => (prev === id ? null : id));

  return (
    <div className="flex flex-col gap-2">
      {locked && (
        <p className="rounded-btn bg-accent-coral px-3 py-2 text-xs font-medium text-ink">
          Piqui está picado 🌶️ — dale de comer para que te ayude.
        </p>
      )}
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
        <CaptureCollections />
      </AccordionItem>
    </div>
  );
}

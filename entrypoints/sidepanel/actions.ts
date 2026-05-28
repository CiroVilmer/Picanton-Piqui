import {
  ForkKnife,
  TennisBall,
  Moon,
  HandHeart,
  Wind,
  Sparkle,
  Lightning,
  Coffee,
  type Icon,
} from '@phosphor-icons/react';

export type ActionTone = 'mint' | 'peach' | 'coral';

export interface ActionItem {
  id: string;
  Icon: Icon;
  title: string;
  desc: string;
  tone: ActionTone;
}

/** mood >= 50 — Piqui contento (manifest §8.3). */
export const HAPPY_ACTIONS: ActionItem[] = [
  { id: 'feed', Icon: ForkKnife, title: 'Alimentar', desc: 'Dale una tab para comer', tone: 'mint' },
  { id: 'play', Icon: TennisBall, title: 'Jugar', desc: 'Un rato de jueguito', tone: 'mint' },
  { id: 'rest', Icon: Moon, title: 'Descansar', desc: 'Que recargue energía', tone: 'mint' },
  { id: 'pet', Icon: HandHeart, title: 'Mimar', desc: 'Un cariño rápido', tone: 'mint' },
];

/** mood < 50 — Piqui picado (manifest §8.3). */
export const ANGRY_ACTIONS: ActionItem[] = [
  { id: 'calm', Icon: Wind, title: 'Calmar', desc: 'Bajale los humos', tone: 'coral' },
  { id: 'distract', Icon: Sparkle, title: 'Distraer', desc: 'Cambiale el foco', tone: 'coral' },
  { id: 'urgent', Icon: Lightning, title: 'Comida urgente', desc: 'Alimentación express', tone: 'coral' },
  { id: 'mate', Icon: Coffee, title: 'Ofrecer mate', desc: 'Un matecito tranqui', tone: 'coral' },
];

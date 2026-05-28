export type OptionLetter = 'A' | 'B' | 'C' | 'D';

export type QuizOption = {
  letter: OptionLetter;
  text: string;
};

export type Question = {
  id: string;
  company: string;
  question: string;
  options: QuizOption[];
  correct: OptionLetter;
};

export const QUESTIONS: ReadonlyArray<Question> = [
  {
    id: 'google',
    company: 'Google / Chrome',
    question: '¿Qué problema busca resolver Google Chrome con sus herramientas de navegación e IA?',
    options: [
      { letter: 'A', text: 'Crear marketplaces inmobiliarios dentro del navegador.' },
      { letter: 'B', text: 'Ayudar a los usuarios a organizar, buscar, resumir y trabajar mejor con información en la web.' },
      { letter: 'C', text: 'Procesar pagos internacionales para freelancers.' },
      { letter: 'D', text: 'Automatizar diagnósticos médicos.' },
    ],
    correct: 'B',
  },
  {
    id: 'takenos',
    company: 'Takenos',
    question: '¿Qué problema resuelve Takenos?',
    options: [
      { letter: 'A', text: 'Organiza pestañas abiertas en Chrome.' },
      { letter: 'B', text: 'Detecta biomarcadores en biopsias.' },
      { letter: 'C', text: 'Ayuda a recibir, mover y usar dinero internacionalmente de forma más simple.' },
      { letter: 'D', text: 'Genera renders inmobiliarios.' },
    ],
    correct: 'C',
  },
  {
    id: 'talo',
    company: 'Talo',
    question: '¿Qué problema resuelve Talo?',
    options: [
      { letter: 'A', text: 'Resume papers médicos.' },
      { letter: 'B', text: 'Automatiza pagos y conciliaciones para comercios y e-commerce.' },
      { letter: 'C', text: 'Organiza pestañas por tema.' },
      { letter: 'D', text: 'Genera contenido para redes sociales.' },
    ],
    correct: 'B',
  },
  {
    id: 'fardo',
    company: 'Fardo',
    question: '¿Qué problema resuelve Fardo?',
    options: [
      { letter: 'A', text: 'Permite cobrar pagos internacionales.' },
      { letter: 'B', text: 'Cierra pestañas de Chrome automáticamente.' },
      { letter: 'C', text: 'Vende propiedades en Argentina.' },
      { letter: 'D', text: 'Ayuda a las marcas a entender cómo aparecen en respuestas generadas por IA.' },
    ],
    correct: 'D',
  },
  {
    id: 'roomix',
    company: 'Roomix',
    question: '¿Qué problema resuelve Roomix?',
    options: [
      { letter: 'A', text: 'Procesa pagos en e-commerce.' },
      { letter: 'B', text: 'Analiza visibilidad de marcas en IA.' },
      { letter: 'C', text: 'Ayuda a encontrar propiedades usando IA, más allá de los filtros inmobiliarios tradicionales.' },
      { letter: 'D', text: 'Gestiona cobros internacionales.' },
    ],
    correct: 'C',
  },
  {
    id: 'navian',
    company: 'Navian',
    question: '¿Qué problema busca resolver Navian?',
    options: [
      { letter: 'A', text: 'Automatizar pagos de e-commerce.' },
      { letter: 'B', text: 'Organizar tabs abiertas en Chrome.' },
      { letter: 'C', text: 'Crear publicaciones inmobiliarias.' },
      { letter: 'D', text: 'Ayudar a cirujanos a tomar mejores decisiones usando IA y realidad aumentada.' },
    ],
    correct: 'D',
  },
  {
    id: 'kuvia',
    company: 'Kuvia',
    question: '¿Qué problema resuelve Kuvia?',
    options: [
      { letter: 'A', text: 'Busca acelerar y mejorar el diagnóstico oncológico usando IA.' },
      { letter: 'B', text: 'Cierra pestañas de Chrome automáticamente.' },
      { letter: 'C', text: 'Automatiza pagos por transferencia.' },
      { letter: 'D', text: 'Mejora el SEO de marcas en Google.' },
    ],
    correct: 'A',
  },
  {
    id: 'picante',
    company: 'Picante',
    question: '¿Qué rol cumple Picante en la Picanthon?',
    options: [
      { letter: 'A', text: 'Procesa pagos internacionales.' },
      { letter: 'B', text: 'Organiza y articula el evento junto a Google y startups del ecosistema.' },
      { letter: 'C', text: 'Desarrolla tecnología quirúrgica.' },
      { letter: 'D', text: 'Busca propiedades con IA.' },
    ],
    correct: 'B',
  },
];

export const QUESTIONS_PER_ROUND = 4;

export function pickRandomQuestions(count: number = QUESTIONS_PER_ROUND): Question[] {
  const pool = [...QUESTIONS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool.slice(0, count);
}

export type ScoreCopy = { title: string; subtitle: string };

const SCORE_COPY_BY_BAND: Record<0 | 1 | 2 | 3 | 4, ScoreCopy[]> = {
  4: [
    { title: '¡Te las sabés todas!', subtitle: 'Cero errores. Sospechoso.' },
    { title: 'Pleno.', subtitle: 'Tirás como experto del ecosistema.' },
  ],
  3: [
    { title: 'Casi pleno.', subtitle: 'Buen rendimiento. Te falta poquito.' },
    { title: 'Tres de cuatro.', subtitle: 'La rompiste, igual.' },
  ],
  2: [
    { title: 'Mitad y mitad.', subtitle: 'Bueno, no te lleva el viento.' },
    { title: 'Empate técnico.', subtitle: 'Con la suerte, eso sí.' },
  ],
  1: [
    { title: 'Una sola.', subtitle: 'Mejor que cero, te lo concedo.' },
    { title: 'Apenas una.', subtitle: 'Pasaste rozando el cero.' },
  ],
  0: [
    { title: 'Cero.', subtitle: 'Estuvimos cerca al menos.' },
    { title: 'Ninguna.', subtitle: 'No fue lo nuestro hoy.' },
  ],
};

export function scoreCopy(score: number): ScoreCopy {
  const clamped = Math.max(0, Math.min(4, score)) as 0 | 1 | 2 | 3 | 4;
  const pool = SCORE_COPY_BY_BAND[clamped];
  return pool[Math.floor(Math.random() * pool.length)] ?? pool[0]!;
}

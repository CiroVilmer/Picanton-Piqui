import { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle,
  Play,
  Trophy,
  X,
  XCircle,
} from '@phosphor-icons/react';
import {
  pickRandomQuestions,
  QUESTIONS_PER_ROUND,
  scoreCopy,
  type OptionLetter,
  type Question,
} from '../lib/preguntados';

type Props = {
  onClose: () => void;
};

type Phase = 'intro' | 'playing' | 'results';

const KEYFRAMES = `
  @keyframes pregEnter {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pregPop {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
  }
`;

export default function PreguntadosOverlay({ onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [questions, setQuestions] = useState<Question[]>(() => pickRandomQuestions());
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<OptionLetter | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const current = questions[index];

  function start() {
    setPhase('playing');
    setIndex(0);
    setPicked(null);
    setCorrectCount(0);
  }

  function pickOption(letter: OptionLetter) {
    if (picked != null || !current) return;
    setPicked(letter);
    if (letter === current.correct) setCorrectCount((c) => c + 1);
  }

  function next() {
    if (!current) return;
    if (index + 1 >= questions.length) {
      setPhase('results');
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  }

  function playAgain() {
    setQuestions(pickRandomQuestions());
    start();
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-canvas text-ink">
      <style>{KEYFRAMES}</style>

      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute right-3 top-3 z-30 flex size-8 items-center justify-center rounded-full bg-ink/10 text-ink backdrop-blur-sm transition hover:bg-ink/25"
      >
        <X weight="bold" size={16} />
      </button>

      {phase === 'intro' && <IntroPhase onStart={start} />}
      {phase === 'playing' && current && (
        <PlayingPhase
          question={current}
          index={index}
          total={questions.length}
          score={correctCount}
          picked={picked}
          onPick={pickOption}
          onNext={next}
        />
      )}
      {phase === 'results' && (
        <ResultsPhase
          score={correctCount}
          total={questions.length}
          onPlayAgain={playAgain}
          onClose={onClose}
        />
      )}
    </div>
  );
}

function IntroPhase({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-between gap-4 px-5 pb-6 pt-12">
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-3">
        <video
          src="/animations/presentapiqui.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="aspect-square w-full max-w-[320px] rounded-card bg-stage object-cover shadow-soft"
        />
        <div className="text-center" style={{ animation: 'pregEnter 500ms ease-out 200ms both' }}>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-ink-muted">
            piqui presenta
          </p>
          <h2 className="mt-1 text-3xl font-black leading-tight tracking-tight">
            Preguntados
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {QUESTIONS_PER_ROUND} preguntas random sobre el ecosistema. Sin tiempo. Sin trampa.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="flex w-full items-center justify-center gap-2 rounded-pill bg-ink px-5 py-3 text-sm font-bold text-white shadow-soft transition-transform duration-[120ms] ease-out hover:-translate-y-px"
      >
        <Play weight="fill" size={16} />
        Empezar
      </button>
    </div>
  );
}

function PlayingPhase({
  question,
  index,
  total,
  score,
  picked,
  onPick,
  onNext,
}: {
  question: Question;
  index: number;
  total: number;
  score: number;
  picked: OptionLetter | null;
  onPick: (letter: OptionLetter) => void;
  onNext: () => void;
}) {
  const revealed = picked != null;
  const isLast = index + 1 >= total;

  return (
    <div
      key={question.id}
      className="flex flex-1 flex-col gap-4 px-5 pb-5 pt-14"
      style={{ animation: 'pregEnter 350ms ease-out both' }}
    >
      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-ink-muted">
        <span>
          Pregunta {index + 1} / {total}
        </span>
        <span className="tabular-nums">
          {score} {score === 1 ? 'acierto' : 'aciertos'}
        </span>
      </div>

      <div className="rounded-card bg-card p-4 shadow-soft">
        <span className="inline-block rounded-pill bg-accent-peach px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ink">
          {question.company}
        </span>
        <h3 className="mt-2 text-[17px] font-bold leading-snug text-ink">
          {question.question}
        </h3>
      </div>

      <video
        src="/animations/presentapiqui.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="aspect-square w-40 self-center rounded-card bg-stage object-cover shadow-soft"
      />

      <ul className="flex flex-col gap-2">
        {question.options.map((opt) => {
          const isPicked = picked === opt.letter;
          const isCorrect = opt.letter === question.correct;
          const showCorrect = revealed && isCorrect;
          const showWrong = revealed && isPicked && !isCorrect;

          let stateClass = 'border-outline bg-card hover:border-ink/30';
          if (showCorrect) stateClass = 'border-mood-happy bg-accent-mint';
          else if (showWrong) stateClass = 'border-mood-angry bg-accent-coral';
          else if (revealed) stateClass = 'border-outline bg-card opacity-60';

          return (
            <li key={opt.letter}>
              <button
                type="button"
                onClick={() => onPick(opt.letter)}
                disabled={revealed}
                className={`flex w-full items-start gap-3 rounded-btn border px-3 py-2.5 text-left text-[13px] leading-snug text-ink transition-all duration-[120ms] disabled:cursor-not-allowed ${stateClass}`}
              >
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    showCorrect
                      ? 'bg-mood-happy text-white'
                      : showWrong
                        ? 'bg-mood-angry text-white'
                        : 'bg-sunken text-ink'
                  }`}
                >
                  {showCorrect ? (
                    <CheckCircle weight="fill" size={16} />
                  ) : showWrong ? (
                    <XCircle weight="fill" size={16} />
                  ) : (
                    opt.letter
                  )}
                </span>
                <span className="flex-1 pt-1 font-medium">{opt.text}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {revealed && (
        <button
          type="button"
          onClick={onNext}
          className="mt-auto flex w-full items-center justify-center gap-2 rounded-pill bg-ink px-5 py-3 text-sm font-bold text-white shadow-soft transition-transform duration-[120ms] ease-out hover:-translate-y-px"
          style={{ animation: 'pregPop 300ms ease-out both' }}
        >
          {isLast ? 'Ver resultado' : 'Siguiente'}
          <ArrowRight weight="bold" size={16} />
        </button>
      )}
    </div>
  );
}

function ResultsPhase({
  score,
  total,
  onPlayAgain,
  onClose,
}: {
  score: number;
  total: number;
  onPlayAgain: () => void;
  onClose: () => void;
}) {
  const copy = useMemo(() => scoreCopy(score), [score]);
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <div
      className="flex flex-1 flex-col items-center justify-between gap-4 px-5 pb-6 pt-12"
      style={{ animation: 'pregEnter 400ms ease-out both' }}
    >
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 text-center">
        <span
          className="flex size-20 items-center justify-center rounded-full bg-accent-peach text-ink"
          style={{ animation: 'pregPop 500ms cubic-bezier(0.16, 1, 0.3, 1) 100ms both' }}
        >
          <Trophy weight="duotone" size={42} />
        </span>
        <div style={{ animation: 'pregEnter 500ms ease-out 250ms both' }}>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-ink-muted">
            tu score
          </p>
          <p className="mt-1 text-6xl font-black leading-none tracking-tight">
            {score}
            <span className="text-3xl text-ink-muted"> / {total}</span>
          </p>
          <p className="mt-1 text-xs font-semibold text-ink-muted tabular-nums">{percent}%</p>
        </div>
        <div className="mt-1 flex flex-col gap-1" style={{ animation: 'pregEnter 500ms ease-out 400ms both' }}>
          <h3 className="text-xl font-bold leading-tight">{copy.title}</h3>
          <p className="text-sm italic text-ink-muted">{copy.subtitle}</p>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2">
        <button
          type="button"
          onClick={onPlayAgain}
          className="flex w-full items-center justify-center gap-2 rounded-pill bg-ink px-5 py-3 text-sm font-bold text-white shadow-soft transition-transform duration-[120ms] ease-out hover:-translate-y-px"
        >
          Jugar otra vez
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-pill bg-transparent px-5 py-2 text-xs font-semibold text-ink-muted transition hover:text-ink"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle,
  Play,
  SpeakerHigh,
  SpeakerSlash,
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

const AUDIO_SRC = '/audio/kh10min.mp3';
const AUDIO_VOLUME = 0.4;

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
  const [muted, setMuted] = useState(false);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = AUDIO_VOLUME;
    audio.loop = true;
    audio.play().catch((err) => {
      console.debug('[piqui preguntados] audio autoplay blocked or src missing', err);
    });
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  function toggleMute() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
    if (!audio.muted && audio.paused) {
      audio.play().catch(() => undefined);
    }
  }

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
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-canvas">
      <style>{KEYFRAMES}</style>

      <video
        src="/animations/presentapiqui.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 size-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-black/65" />

      <audio
        ref={audioRef}
        src={AUDIO_SRC}
        preload="auto"
        onError={() => setAudioAvailable(false)}
      />

      <div className="absolute right-3 top-3 z-30 flex items-center gap-1.5">
        {audioAvailable && (
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? 'Activar audio' : 'Silenciar audio'}
            className="flex size-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/35"
          >
            {muted ? <SpeakerSlash weight="bold" size={16} /> : <SpeakerHigh weight="bold" size={16} />}
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="flex size-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/35"
        >
          <X weight="bold" size={16} />
        </button>
      </div>

      <div className="relative z-10 flex flex-1 flex-col">
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
    </div>
  );
}

function IntroPhase({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-between gap-4 px-5 pb-6 pt-12 text-white">
      <div className="flex w-full flex-1 flex-col items-center justify-end pb-4 text-center">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/85 drop-shadow"
          style={{ animation: 'pregEnter 500ms ease-out 100ms both' }}
        >
          piqui presenta
        </p>
        <h2
          className="mt-1 text-4xl font-black leading-tight tracking-tight drop-shadow-lg"
          style={{ animation: 'pregEnter 600ms ease-out 250ms both' }}
        >
          Preguntados
        </h2>
        <p
          className="mt-2 max-w-[280px] text-sm font-medium text-white/90 drop-shadow"
          style={{ animation: 'pregEnter 600ms ease-out 450ms both' }}
        >
          {QUESTIONS_PER_ROUND} preguntas random sobre el ecosistema. Sin tiempo. Sin trampa.
        </p>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="flex w-full items-center justify-center gap-2 rounded-pill bg-white px-5 py-3 text-sm font-bold text-ink shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-transform duration-[120ms] ease-out hover:-translate-y-px"
        style={{ animation: 'pregPop 500ms cubic-bezier(0.16, 1, 0.3, 1) 700ms both' }}
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
      <div className="flex items-center justify-between rounded-pill bg-black/30 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
        <span>
          Pregunta {index + 1} / {total}
        </span>
        <span className="tabular-nums">
          {score} {score === 1 ? 'acierto' : 'aciertos'}
        </span>
      </div>

      <div className="rounded-card bg-card/95 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.25)] backdrop-blur-sm">
        <span className="inline-block rounded-pill bg-accent-peach px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ink">
          {question.company}
        </span>
        <h3 className="mt-2 text-[17px] font-bold leading-snug text-ink">
          {question.question}
        </h3>
      </div>

      <ul className="mt-auto flex flex-col gap-2">
        {question.options.map((opt) => {
          const isPicked = picked === opt.letter;
          const isCorrect = opt.letter === question.correct;
          const showCorrect = revealed && isCorrect;
          const showWrong = revealed && isPicked && !isCorrect;

          let stateClass = 'border-white/30 bg-card/95 hover:bg-card hover:border-white/60';
          if (showCorrect) stateClass = 'border-mood-happy bg-accent-mint';
          else if (showWrong) stateClass = 'border-mood-angry bg-accent-coral';
          else if (revealed) stateClass = 'border-white/20 bg-card/75 opacity-70';

          return (
            <li key={opt.letter}>
              <button
                type="button"
                onClick={() => onPick(opt.letter)}
                disabled={revealed}
                className={`flex w-full items-start gap-3 rounded-btn border px-3 py-2.5 text-left text-[13px] leading-snug text-ink shadow-[0_4px_12px_rgba(0,0,0,0.15)] backdrop-blur-sm transition-all duration-[120ms] disabled:cursor-not-allowed ${stateClass}`}
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
          className="flex w-full items-center justify-center gap-2 rounded-pill bg-white px-5 py-3 text-sm font-bold text-ink shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-transform duration-[120ms] ease-out hover:-translate-y-px"
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
      className="flex flex-1 flex-col items-center justify-between gap-4 px-5 pb-6 pt-12 text-white"
      style={{ animation: 'pregEnter 400ms ease-out both' }}
    >
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 text-center">
        <span
          className="flex size-20 items-center justify-center rounded-full bg-white/95 text-ink shadow-[0_6px_24px_rgba(0,0,0,0.3)]"
          style={{ animation: 'pregPop 500ms cubic-bezier(0.16, 1, 0.3, 1) 100ms both' }}
        >
          <Trophy weight="duotone" size={42} />
        </span>
        <div style={{ animation: 'pregEnter 500ms ease-out 250ms both' }}>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/85 drop-shadow">
            tu score
          </p>
          <p className="mt-1 text-6xl font-black leading-none tracking-tight drop-shadow-lg">
            {score}
            <span className="text-3xl text-white/70"> / {total}</span>
          </p>
          <p className="mt-1 text-xs font-semibold text-white/80 tabular-nums drop-shadow">
            {percent}%
          </p>
        </div>
        <div
          className="mt-1 flex max-w-[280px] flex-col gap-1"
          style={{ animation: 'pregEnter 500ms ease-out 400ms both' }}
        >
          <h3 className="text-xl font-bold leading-tight drop-shadow">{copy.title}</h3>
          <p className="text-sm italic text-white/90 drop-shadow">{copy.subtitle}</p>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2">
        <button
          type="button"
          onClick={onPlayAgain}
          className="flex w-full items-center justify-center gap-2 rounded-pill bg-white px-5 py-3 text-sm font-bold text-ink shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-transform duration-[120ms] ease-out hover:-translate-y-px"
        >
          Jugar otra vez
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-pill bg-transparent px-5 py-2 text-xs font-semibold text-white/80 transition hover:text-white"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

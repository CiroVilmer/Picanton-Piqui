import type { MoodBand } from '../mood';

/*
 * PLACEHOLDER del personaje. El manifest usa <video> (idle.mp4 / angry.mp4) en el
 * viewport del Stage; mientras no estén los assets, dibujamos a Piqui en SVG y lo
 * hacemos reaccionar al mood (cambia color de cuerpo + cara). Para swappear por el
 * video real: reemplazar este componente por un <VideoPlayer band={band} />.
 */

const BODY: Record<MoodBand, string> = {
  happy: '#58c97a',
  calm: '#c9d964',
  warm: '#f4a65a',
  angry: '#e25c5c',
};

const HILITE: Record<MoodBand, string> = {
  happy: '#7fd89a',
  calm: '#dbe88c',
  warm: '#f9c089',
  angry: '#ee8585',
};

function Face({ band }: { band: MoodBand }) {
  const ink = '#2c2218';
  switch (band) {
    case 'happy':
      return (
        <>
          <circle cx="41" cy="59" r="5" fill={ink} />
          <circle cx="58" cy="57" r="5" fill={ink} />
          <path d="M38 71 q 10 11 21 2" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      );
    case 'calm':
      return (
        <>
          <circle cx="41" cy="59" r="5" fill={ink} />
          <circle cx="58" cy="57" r="5" fill={ink} />
          <path d="M40 72 q 9 5 18 1" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      );
    case 'warm':
      return (
        <>
          <circle cx="41" cy="60" r="4.5" fill={ink} />
          <circle cx="58" cy="58" r="4.5" fill={ink} />
          {/* boca recta, leve preocupación */}
          <path d="M40 74 h 18" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M35 50 l 8 3" stroke={ink} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M63 48 l -8 3" stroke={ink} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      );
    case 'angry':
      return (
        <>
          {/* cejas fruncidas */}
          <path d="M36 51 l 10 4" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M63 49 l -10 4" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="42" cy="61" r="4" fill={ink} />
          <circle cx="57" cy="59" r="4" fill={ink} />
          {/* boca enojada (ceño hacia abajo) */}
          <path d="M40 77 q 10 -8 19 -1" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      );
  }
}

export default function PiquiCharacter({ band }: { band: MoodBand }) {
  return (
    <div className="animate-piqui-bob" data-placeholder="piqui-character">
      <svg width="124" height="180" viewBox="0 0 90 130" role="img" aria-label="Piqui">
        {/* tallo */}
        <path d="M45 18 q 7 -13 19 -10" stroke="#3e7d4f" strokeWidth="6" fill="none" strokeLinecap="round" />
        {/* cuerpo */}
        <path
          d="M45 22 C 71 22, 79 55, 70 90 C 64 116, 39 123, 27 104 C 15 85, 18 40, 45 22 Z"
          fill={BODY[band]}
          style={{ transition: 'fill 0.7s ease' }}
        />
        {/* brillo */}
        <path
          d="M37 37 C 29 52, 30 80, 36 97"
          stroke={HILITE[band]}
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          opacity="0.75"
          style={{ transition: 'stroke 0.7s ease' }}
        />
        <Face band={band} />
      </svg>
    </div>
  );
}

import ChatMessage, { type ChatRole } from './ChatMessage';
import TypingDots from './TypingDots';
import ChatInput from './ChatInput';

/** Mensajes placeholder — el manifest los deja hardcodeados hasta cablear el backend. */
const MESSAGES: { from: ChatRole; text: string }[] = [
  { from: 'piqui', text: 'Animallll… cómo va?' },
  { from: 'user', text: 'hola piqui' },
  { from: 'piqui', text: 'Tirá, en qué andás. Te doy una mano.' },
  { from: 'user', text: 'tengo que terminar un tp' },
];

/** Card con log scrollable + input fijo abajo (manifest §7.5). */
export default function Chat() {
  return (
    <div className="flex min-h-60 flex-col rounded-card bg-card p-3 shadow-soft">
      <div className="flex max-h-80 flex-1 flex-col gap-2 overflow-y-auto">
        {MESSAGES.map((m, i) => (
          <ChatMessage key={i} from={m.from} text={m.text} />
        ))}
        <div className="flex justify-start">
          <TypingDots />
        </div>
      </div>
      <ChatInput />
    </div>
  );
}

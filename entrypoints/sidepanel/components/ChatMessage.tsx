export type ChatRole = 'piqui' | 'user';

/** Burbuja de chat con cola asimétrica (manifest §7.5.1). */
export default function ChatMessage({ from, text }: { from: ChatRole; text: string }) {
  const isUser = from === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[82%] px-[13px] py-[9px] text-[13px] leading-[1.45] ${
          isUser
            ? 'rounded-2xl rounded-br-md bg-mood-happy text-white'
            : 'rounded-2xl rounded-bl-md bg-sunken text-ink'
        }`}
      >
        {text}
      </div>
    </div>
  );
}

'use client';

import dayjs from 'dayjs';

interface MessageBubbleProps {
  body: string;
  timestamp: string | Date;
  isMine: boolean;
  showTail?: boolean;
}

export default function MessageBubble({
  body,
  timestamp,
  isMine,
  showTail = true,
}: MessageBubbleProps) {
  const time = dayjs(timestamp).format('h:mm A');

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`relative max-w-[75%] px-3.5 py-2 ${
          isMine
            ? `bg-[#E85D5D] text-white ${showTail ? 'rounded-2xl rounded-br-md' : 'rounded-2xl'}`
            : `bg-[#F0F0F0] text-gray-900 ${showTail ? 'rounded-2xl rounded-bl-md' : 'rounded-2xl'}`
        }`}
      >
        <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
          {body}
        </p>
        <p
          className={`mt-0.5 text-[11px] ${
            isMine ? 'text-white/70' : 'text-gray-400'
          } text-right`}
        >
          {time}
        </p>
      </div>
    </div>
  );
}

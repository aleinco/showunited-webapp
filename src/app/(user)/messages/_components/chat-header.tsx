'use client';

import { PiArrowLeftBold } from 'react-icons/pi';
import { Avatar } from 'rizzui';

interface ChatHeaderProps {
  name: string;
  photo: string;
  onBack: () => void;
}

export default function ChatHeader({ name, photo, onBack }: ChatHeaderProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
      <button
        onClick={onBack}
        className="rounded-lg p-1.5 text-[#E85D5D] transition-colors hover:bg-gray-100 lg:hidden"
      >
        <PiArrowLeftBold className="h-5 w-5" />
      </button>
      <Avatar
        name={name}
        src={photo || undefined}
        initials={initials}
        className="!h-10 !w-10 bg-gray-200"
      />
      <span className="text-base font-semibold text-gray-900">{name}</span>
    </header>
  );
}

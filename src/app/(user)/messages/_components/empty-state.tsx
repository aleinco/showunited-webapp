'use client';

import { PiChatCircleDots } from 'react-icons/pi';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export default function EmptyState({
  title = 'No messages yet',
  description = 'Start a conversation from a user profile',
}: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <PiChatCircleDots className="h-16 w-16 text-gray-200" />
      <p className="text-lg font-medium text-gray-400">{title}</p>
      <p className="text-sm text-gray-300">{description}</p>
    </div>
  );
}

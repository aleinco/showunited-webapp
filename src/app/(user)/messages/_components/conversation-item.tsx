'use client';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Avatar, Badge } from 'rizzui';

dayjs.extend(relativeTime);

interface ConversationItemProps {
  name: string;
  photo: string;
  lastMessage: string;
  lastMessageTime: string | Date | null;
  unreadCount: number;
  isActive: boolean;
  onClick: () => void;
}

export default function ConversationItem({
  name,
  photo,
  lastMessage,
  lastMessageTime,
  unreadCount,
  isActive,
  onClick,
}: ConversationItemProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  function formatTime(time: string | Date | null): string {
    if (!time) return '';
    const d = dayjs(time);
    const now = dayjs();
    if (d.isSame(now, 'day')) return d.format('h:mm A');
    if (d.isSame(now.subtract(1, 'day'), 'day')) return 'Yesterday';
    if (d.isSame(now, 'year')) return d.format('MMM D');
    return d.format('MM/DD/YY');
  }

  return (
    <div
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 ${
        isActive ? 'border-l-[3px] border-l-[#E85D5D] bg-gray-50' : ''
      }`}
    >
      <Avatar
        name={name}
        src={photo || undefined}
        initials={initials}
        className="!h-12 !w-12 flex-shrink-0 bg-gray-200"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="truncate text-sm font-semibold text-gray-900">
            {name}
          </span>
          <span className="ml-2 flex-shrink-0 text-xs text-gray-400">
            {formatTime(lastMessageTime)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between">
          <p className="truncate text-sm text-gray-500">{lastMessage || 'No messages yet'}</p>
          {unreadCount > 0 && (
            <Badge className="ml-2 flex-shrink-0 !bg-[#E85D5D] !text-white" size="sm">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

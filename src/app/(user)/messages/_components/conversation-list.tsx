'use client';

import { useState } from 'react';
import { PiMagnifyingGlassLight } from 'react-icons/pi';
import ConversationItem from './conversation-item';
import EmptyState from './empty-state';
import { Loader } from 'rizzui';

export interface ConversationData {
  sid: string;
  name: string;
  photo: string;
  lastMessage: string;
  lastMessageTime: string | Date | null;
  unreadCount: number;
}

interface ConversationListProps {
  conversations: ConversationData[];
  activeConversationSid: string | null;
  onSelect: (sid: string) => void;
  activeTab: 'chats' | 'support';
  onTabChange: (tab: 'chats' | 'support') => void;
  loading?: boolean;
}

export default function ConversationList({
  conversations,
  activeConversationSid,
  onSelect,
  activeTab,
  onTabChange,
  loading = false,
}: ConversationListProps) {
  const [search, setSearch] = useState('');

  const filtered = search
    ? conversations.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : conversations;

  return (
    <div className="flex h-full flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 pb-3 pt-4">
        <h1 className="mb-3 text-xl font-bold text-gray-900">Messages</h1>

        <div className="relative">
          <PiMagnifyingGlassLight className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Company, Name..."
            className="w-full rounded-lg border-0 bg-gray-50 py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-0"
          />
        </div>

        <div className="mt-3 flex gap-1 rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => onTabChange('chats')}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'chats'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Chats
          </button>
          <button
            onClick={() => onTabChange('support')}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'support'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Support
          </button>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader variant="spinner" size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={search ? 'No results' : 'No conversations'}
            description={search ? 'Try a different search' : 'Start a conversation from a user profile'}
          />
        ) : (
          filtered.map((conv) => (
            <ConversationItem
              key={conv.sid}
              name={conv.name}
              photo={conv.photo}
              lastMessage={conv.lastMessage}
              lastMessageTime={conv.lastMessageTime}
              unreadCount={conv.unreadCount}
              isActive={conv.sid === activeConversationSid}
              onClick={() => onSelect(conv.sid)}
            />
          ))
        )}
      </div>
    </div>
  );
}

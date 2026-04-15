'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import ChatHeader from './chat-header';
import MessageList, { ChatMessage } from './message-list';
import MessageInput from './message-input';
import EmptyState from './empty-state';
import { Loader } from 'rizzui';

interface AdminChatViewProps {
  token: string;
  currentIdentity: string;
  onBack: () => void;
}

export default function AdminChatView({
  token,
  currentIdentity,
  onBack,
}: AdminChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const pageRef = useRef(1);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMessages = useCallback(async (page: number, append = false) => {
    try {
      const res = await axios.get('/api/user/admin-chat', {
        params: { token, page },
      });
      const data = res.data;

      const msgs: ChatMessage[] = (data.messages || []).map((m: any) => ({
        sid: `admin-${m.id}`,
        body: m.message || '',
        author: m.isSentByAdmin ? 'admin' : currentIdentity,
        dateCreated: m.createdAt,
      }));

      if (append) {
        setMessages((prev) => [...prev, ...msgs]);
      } else {
        setMessages(msgs);
      }
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Failed to fetch admin chat:', err);
    } finally {
      setLoading(false);
    }
  }, [token, currentIdentity]);

  useEffect(() => {
    fetchMessages(1);

    pollRef.current = setInterval(() => {
      fetchMessages(1);
    }, 10000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMessages]);

  async function handleSend(text: string) {
    try {
      const formData = new FormData();
      formData.append('token', token);
      formData.append('ChatMessage', text);

      await axios.post('/api/user/admin-chat', formData);

      await fetchMessages(1);
    } catch (err) {
      console.error('Failed to send admin chat:', err);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader variant="spinner" size="xl" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ChatHeader
        name="Show United Support"
        photo="/logo-showunited.png"
        onBack={onBack}
      />

      {messages.length === 0 ? (
        <div className="flex-1">
          <EmptyState
            title="No support messages"
            description="Send a message to contact the admin team"
          />
        </div>
      ) : (
        <MessageList
          messages={messages}
          currentIdentity={currentIdentity}
        />
      )}

      <MessageInput onSend={handleSend} />
    </div>
  );
}

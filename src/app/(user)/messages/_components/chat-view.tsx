'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Conversation, Message } from '@twilio/conversations';
import axios from 'axios';
import ChatHeader from './chat-header';
import MessageList, { ChatMessage } from './message-list';
import MessageInput from './message-input';
import EmptyState from './empty-state';
import { Loader } from 'rizzui';

interface ChatViewProps {
  conversation: Conversation | null;
  currentIdentity: string;
  contactName: string;
  contactPhoto: string;
  onBack: () => void;
  loading?: boolean;
  token?: string;
}

export default function ChatView({
  conversation,
  currentIdentity,
  contactName,
  contactPhoto,
  onBack,
  loading = false,
  token = '',
}: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const pageSizeRef = useRef(30);
  const anchorRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!conversation) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    async function loadMessages() {
      setLoadingMessages(true);
      try {
        const paginator = await conversation!.getMessages(pageSizeRef.current);
        if (cancelled) return;

        const msgs: ChatMessage[] = paginator.items.map((m: Message) => ({
          sid: m.sid,
          body: m.body || '',
          author: m.author || '',
          dateCreated: m.dateCreated || new Date(),
        }));

        setMessages(msgs);
        setHasMore(paginator.hasPrevPage);
        anchorRef.current = paginator.items[0]?.index;

        await conversation!.setAllMessagesRead();
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    }

    loadMessages();

    function handleMessageAdded(message: Message) {
      setMessages((prev) => [
        ...prev,
        {
          sid: message.sid,
          body: message.body || '',
          author: message.author || '',
          dateCreated: message.dateCreated || new Date(),
        },
      ]);
      conversation!.setAllMessagesRead().catch(() => {});
    }

    conversation.on('messageAdded', handleMessageAdded);

    return () => {
      cancelled = true;
      conversation.off('messageAdded', handleMessageAdded);
    };
  }, [conversation]);

  const loadMore = useCallback(async () => {
    if (!conversation || !hasMore || loadingMessages) return;
    setLoadingMessages(true);
    try {
      const paginator = await conversation.getMessages(
        pageSizeRef.current,
        anchorRef.current ? anchorRef.current - 1 : undefined,
        'backwards'
      );

      const olderMsgs: ChatMessage[] = paginator.items.map((m: Message) => ({
        sid: m.sid,
        body: m.body || '',
        author: m.author || '',
        dateCreated: m.dateCreated || new Date(),
      }));

      setMessages((prev) => [...olderMsgs, ...prev]);
      setHasMore(paginator.hasPrevPage);
      anchorRef.current = paginator.items[0]?.index;
    } catch (err) {
      console.error('Failed to load more messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [conversation, hasMore, loadingMessages]);

  async function handleSend(text: string) {
    if (!conversation) return;
    try {
      const msgIndex = await conversation.sendMessage(text);
      // Persist to SQL as fallback (in case .NET webhook misses it)
      if (token && msgIndex !== undefined) {
        try {
          const msgs = await conversation.getMessages(1);
          const lastMsg = msgs.items[msgs.items.length - 1];
          if (lastMsg?.sid) {
            axios.post('/api/user/chat-persist', {
              token,
              conversationSid: conversation.sid,
              messageSid: lastMsg.sid,
              messageBody: text,
            }).catch(() => {}); // fire-and-forget
          }
        } catch { /* best effort */ }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  }

  async function handleAttach(file: File) {
    if (!conversation) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      await conversation.sendMessage(formData);
    } catch (err) {
      console.error('Failed to send attachment:', err);
    }
  }

  if (!conversation && !loading) {
    return (
      <div className="flex h-full flex-col">
        <EmptyState
          title="Select a conversation"
          description="Choose a conversation from the list to start chatting"
        />
      </div>
    );
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
      <ChatHeader name={contactName} photo={contactPhoto} onBack={onBack} />

      <MessageList
        messages={messages}
        currentIdentity={currentIdentity}
        loading={loadingMessages}
        onLoadMore={loadMore}
        hasMore={hasMore}
      />

      <MessageInput
        onSend={handleSend}
        onAttach={handleAttach}
      />
    </div>
  );
}

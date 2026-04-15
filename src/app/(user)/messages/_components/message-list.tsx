'use client';

import { useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import MessageBubble from './message-bubble';
import DateSeparator from './date-separator';
import { Loader } from 'rizzui';

export interface ChatMessage {
  sid: string;
  body: string;
  author: string;
  dateCreated: string | Date;
}

interface MessageListProps {
  messages: ChatMessage[];
  currentIdentity: string;
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export default function MessageList({
  messages,
  currentIdentity,
  loading = false,
  onLoadMore,
  hasMore = false,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevLengthRef.current = messages.length;
  }, [messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [currentIdentity]);

  function handleScroll() {
    if (!containerRef.current || !onLoadMore || !hasMore || loading) return;
    if (containerRef.current.scrollTop < 50) {
      onLoadMore();
    }
  }

  function renderMessages() {
    const elements: React.ReactNode[] = [];
    let lastDate = '';
    let lastAuthor = '';

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const msgDate = dayjs(msg.dateCreated).format('YYYY-MM-DD');
      const isMine = msg.author === currentIdentity;
      const isLastInGroup =
        i === messages.length - 1 || messages[i + 1].author !== msg.author;

      if (msgDate !== lastDate) {
        elements.push(<DateSeparator key={`date-${msgDate}`} date={msg.dateCreated} />);
        lastDate = msgDate;
        lastAuthor = '';
      }

      const sameAuthor = msg.author === lastAuthor;

      elements.push(
        <div key={msg.sid} className={sameAuthor ? 'mt-0.5' : 'mt-3 first:mt-0'}>
          <MessageBubble
            body={msg.body}
            timestamp={msg.dateCreated}
            isMine={isMine}
            showTail={isLastInGroup}
          />
        </div>
      );

      lastAuthor = msg.author;
    }

    return elements;
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="custom-scrollbar flex-1 overflow-y-auto px-4 py-3"
    >
      {loading && (
        <div className="flex justify-center py-4">
          <Loader variant="spinner" size="sm" />
        </div>
      )}

      {hasMore && !loading && (
        <button
          onClick={onLoadMore}
          className="mb-3 w-full text-center text-sm text-gray-400 hover:text-gray-600"
        >
          Load earlier messages
        </button>
      )}

      {renderMessages()}
      <div ref={bottomRef} />
    </div>
  );
}

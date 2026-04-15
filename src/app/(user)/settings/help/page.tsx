'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Text, Loader } from 'rizzui';
import {
  PiCaretLeftBold,
  PiCaretDownBold,
  PiCaretUpBold,
  PiPaperPlaneRightFill,
  PiChatCircleTextLight,
} from 'react-icons/pi';
import dayjs from 'dayjs';

interface FAQ {
  FAQId: number;
  FAQQuestion: string;
  FAQAnswer: string;
}

interface AdminMessage {
  id: number;
  isSentByAdmin: boolean;
  message: string;
  image: string;
  isRead: boolean;
  createdAt: string;
}

type Tab = 'faq' | 'contact';

export default function HelpPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('faq');

  // FAQ state
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [faqLoading, setFaqLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Chat state
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInitialized, setChatInitialized] = useState(false);
  const [chatText, setChatText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('su_register_token');
  }

  // Load FAQs on mount
  useEffect(() => {
    axios
      .get('/api/user/faq')
      .then((res) => {
        if (res.data?.ok) setFaqs(res.data.data || []);
      })
      .catch(() => {})
      .finally(() => setFaqLoading(false));
  }, []);

  // Fetch chat messages
  const fetchMessages = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await axios.get('/api/user/admin-chat', {
        params: { token, page: 1 },
      });
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Failed to fetch admin chat:', err);
    }
  }, []);

  // Initialize chat + polling when Contact Us tab is selected
  useEffect(() => {
    if (activeTab !== 'contact') {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    if (!chatInitialized) {
      setChatLoading(true);
      fetchMessages().finally(() => {
        setChatLoading(false);
        setChatInitialized(true);
      });
    }

    pollRef.current = setInterval(() => {
      fetchMessages();
    }, 10000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [activeTab, chatInitialized, fetchMessages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (activeTab === 'contact') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, activeTab]);

  async function handleSendMessage() {
    const trimmed = chatText.trim();
    if (!trimmed || sending) return;
    const token = getToken();
    if (!token) return;

    setSending(true);
    try {
      const formData = new FormData();
      formData.append('token', token);
      formData.append('ChatMessage', trimmed);
      await axios.post('/api/user/admin-chat', formData);
      setChatText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      await fetchMessages();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  function handleTextareaInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setChatText(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }

  // Group messages by date for separators
  function renderChatMessages() {
    const elements: React.ReactNode[] = [];
    let lastDate = '';

    for (const msg of messages) {
      const msgDate = dayjs(msg.createdAt).format('YYYY-MM-DD');

      if (msgDate !== lastDate) {
        const isToday = dayjs(msg.createdAt).isSame(dayjs(), 'day');
        const dateLabel = isToday
          ? 'Today'
          : dayjs(msg.createdAt).format('MMM D, YYYY');
        elements.push(
          <div
            key={`date-${msgDate}`}
            className="flex items-center gap-3 py-3"
          >
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-xs font-medium text-gray-400">
              {dateLabel}
            </span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>
        );
        lastDate = msgDate;
      }

      const isUser = !msg.isSentByAdmin;
      elements.push(
        <div
          key={msg.id}
          className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-1.5`}
        >
          <div
            className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${
              isUser
                ? 'rounded-br-md bg-[#F26B50] text-white'
                : 'rounded-bl-md bg-gray-100 text-gray-900'
            }`}
          >
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {msg.message}
            </p>
            <p
              className={`mt-0.5 text-right text-[10px] ${
                isUser ? 'text-white/70' : 'text-gray-400'
              }`}
            >
              {dayjs(msg.createdAt).format('h:mm A')}
            </p>
          </div>
        </div>
      );
    }

    return elements;
  }

  const hasText = chatText.trim().length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Mobile header */}
      <div className="flex items-center border-b border-gray-100 px-4 py-3 md:hidden">
        <button onClick={() => router.back()} className="mr-3 text-[#F26B50]">
          <PiCaretLeftBold className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-gray-900">
          Help & Support
        </h1>
        <div className="w-8" />
      </div>

      {/* Desktop title */}
      <div className="hidden border-b border-gray-100 px-8 py-5 md:block">
        <h1 className="text-xl font-bold text-gray-900">Help & Support</h1>
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-100">
        <div className="mx-auto flex max-w-lg">
          <button
            onClick={() => setActiveTab('faq')}
            className={`relative flex-1 py-3 text-center text-sm font-semibold transition-colors ${
              activeTab === 'faq' ? 'text-[#F26B50]' : 'text-gray-400'
            }`}
          >
            FAQ
            {activeTab === 'faq' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#F26B50]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`relative flex-1 py-3 text-center text-sm font-semibold transition-colors ${
              activeTab === 'contact' ? 'text-[#F26B50]' : 'text-gray-400'
            }`}
          >
            Contact Us
            {activeTab === 'contact' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#F26B50]" />
            )}
          </button>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'faq' && (
        <div className="mx-auto w-full max-w-lg flex-1 px-5 py-6 md:px-8">
          {faqLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
            </div>
          ) : faqs.length === 0 ? (
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-8 text-center">
              <Text className="text-sm text-gray-400">
                No FAQs available at the moment
              </Text>
            </div>
          ) : (
            <div className="space-y-2">
              {faqs.map((faq) => {
                const isOpen = openFaq === faq.FAQId;
                return (
                  <div
                    key={faq.FAQId}
                    className="overflow-hidden rounded-xl border border-gray-100 bg-gray-50"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : faq.FAQId)}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                    >
                      <span className="flex-1 text-sm font-medium text-gray-900">
                        {faq.FAQQuestion}
                      </span>
                      {isOpen ? (
                        <PiCaretUpBold className="h-4 w-4 flex-shrink-0 text-gray-400" />
                      ) : (
                        <PiCaretDownBold className="h-4 w-4 flex-shrink-0 text-gray-400" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="border-t border-gray-100 px-4 py-3">
                        <Text className="text-sm leading-relaxed text-gray-600">
                          {faq.FAQAnswer}
                        </Text>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'contact' && (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Chat messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {chatLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader variant="spinner" size="xl" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
                  <PiChatCircleTextLight className="h-8 w-8 text-gray-300" />
                </div>
                <p className="mb-1 text-sm font-semibold text-gray-900">
                  Start a conversation
                </p>
                <p className="text-sm text-gray-400">
                  Send a message to contact our support team
                </p>
              </div>
            ) : (
              <>
                {renderChatMessages()}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Message input */}
          <div className="border-t border-gray-200 bg-white px-3 py-2.5">
            <div className="mx-auto flex max-w-lg items-end gap-2">
              <div className="flex flex-1 items-end rounded-full border border-gray-200 bg-gray-50 px-4 py-2">
                <textarea
                  ref={textareaRef}
                  value={chatText}
                  onChange={handleTextareaInput}
                  onKeyDown={handleKeyDown}
                  placeholder="Message"
                  rows={1}
                  disabled={sending}
                  className="max-h-[120px] w-full resize-none border-none bg-transparent text-[15px] text-gray-900 outline-none placeholder:text-gray-400 disabled:opacity-50"
                  style={{ boxShadow: 'none' }}
                />
              </div>
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!hasText || sending}
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-all ${
                  hasText && !sending
                    ? 'bg-[#F26B50] text-white shadow-sm hover:bg-[#e05a40]'
                    : 'bg-[#F26B50]/40 text-white/70'
                }`}
              >
                <PiPaperPlaneRightFill className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

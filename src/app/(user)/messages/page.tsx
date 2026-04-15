'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Loader } from 'rizzui';
import {
  initTwilioClient,
  shutdownTwilioClient,
} from '@/lib/twilio-chat';
import type { Client, Conversation, Participant } from '@twilio/conversations';
import ConversationList, {
  ConversationData,
} from './_components/conversation-list';
import ChatView from './_components/chat-view';
import AdminChatView from './_components/admin-chat-view';

type UserInfo = { name: string; photo: string; type: string };
const userCache = new Map<string, UserInfo>();

export default function MessagesPage() {
  const [token, setToken] = useState('');
  const [identity, setIdentity] = useState('');
  const [twilioClient, setTwilioClient] = useState<Client | null>(null);
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [activeConvSid, setActiveConvSid] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [activeTab, setActiveTab] = useState<'chats' | 'support'>('chats');
  const [loading, setLoading] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhoto, setContactPhoto] = useState('');

  useEffect(() => {
    setToken(localStorage.getItem('su_register_token') || '');
  }, []);

  const fetchTwilioToken = useCallback(async (): Promise<string> => {
    const res = await axios.post('/api/user/chat-token', { token });
    return res.data.twilioToken;
  }, [token]);

  async function resolveUsers(identities: string[]): Promise<void> {
    const uncached = identities.filter((id) => !userCache.has(id));
    if (uncached.length === 0) return;

    try {
      const res = await axios.post('/api/user/chat-users', {
        token,
        identities: uncached,
      });
      const users = res.data.users || {};
      for (const [identity, info] of Object.entries(users)) {
        userCache.set(identity, info as UserInfo);
      }
    } catch (err) {
      console.error('Failed to resolve users:', err);
    }
  }

  function getContactIdentity(conv: Conversation, currentIdentity?: string): string {
    const uniqueName = conv.uniqueName || '';
    const match = uniqueName.match(
      /^chat_(Individual_\d+|Company_\d+)_(Individual_\d+|Company_\d+)$/
    );
    if (match) {
      const [, a, b] = match;
      const me = currentIdentity || identity;
      return a === me ? b : a;
    }
    return '';
  }

  async function buildConversationData(
    conv: Conversation,
    currentIdentity?: string
  ): Promise<ConversationData> {
    const contactId = getContactIdentity(conv, currentIdentity);
    const userInfo = userCache.get(contactId) || {
      name: contactId,
      photo: '',
      type: '',
    };

    let lastMessage = '';
    let lastMessageTime: Date | null = null;

    try {
      const msgs = await conv.getMessages(1);
      if (msgs.items.length > 0) {
        lastMessage = msgs.items[0].body || '';
        lastMessageTime = msgs.items[0].dateCreated || null;
      }
    } catch { /* empty conversation */ }

    const unreadCount = await conv.getUnreadMessagesCount() ?? 0;

    return {
      sid: conv.sid,
      name: userInfo.name,
      photo: userInfo.photo,
      lastMessage,
      lastMessageTime,
      unreadCount: typeof unreadCount === 'number' ? unreadCount : 0,
    };
  }

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function init() {
      try {
        const res = await axios.post('/api/user/chat-token', { token });
        const { twilioToken, identity: userIdentity } = res.data;
        setIdentity(userIdentity);

        const client = await initTwilioClient(
          twilioToken,
          userIdentity,
          fetchTwilioToken
        );
        if (cancelled) return;
        setTwilioClient(client);

        const paginator = await client.getSubscribedConversations();
        const convs = paginator.items;

        const contactIds = convs
          .map((c) => {
            const un = c.uniqueName || '';
            const match = un.match(
              /^chat_(Individual_\d+|Company_\d+)_(Individual_\d+|Company_\d+)$/
            );
            if (match) {
              const [, a, b] = match;
              return a === userIdentity ? b : a;
            }
            return '';
          })
          .filter(Boolean);

        await resolveUsers(contactIds);

        const convDataPromises = convs.map((c) => buildConversationData(c, userIdentity));
        const convData = await Promise.all(convDataPromises);

        convData.sort((a, b) => {
          const ta = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
          const tb = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
          return tb - ta;
        });

        if (!cancelled) {
          setConversations(convData);
          setLoading(false);
        }

        client.on('messageAdded', async (message) => {
          const convSid = message.conversation.sid;
          setConversations((prev) => {
            const updated = prev.map((c) => {
              if (c.sid === convSid) {
                return {
                  ...c,
                  lastMessage: message.body || '',
                  lastMessageTime: message.dateCreated || new Date(),
                  unreadCount: convSid === activeConvSid ? 0 : c.unreadCount + 1,
                };
              }
              return c;
            });
            updated.sort((a, b) => {
              const ta = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
              const tb = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
              return tb - ta;
            });
            return updated;
          });
        });

        client.on('conversationJoined', async (conv) => {
          const contactId = getContactIdentity(conv, userIdentity);
          await resolveUsers([contactId]);
          const data = await buildConversationData(conv, userIdentity);
          setConversations((prev) => [data, ...prev]);
        });
      } catch (err) {
        console.error('Failed to initialize chat:', err);
        if (!cancelled) setLoading(false);
      }
    }

    init();

    return () => {
      cancelled = true;
      shutdownTwilioClient();
    };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSelectConversation(sid: string) {
    setActiveConvSid(sid);
    setLoadingChat(true);

    try {
      const conv = await twilioClient!.getConversationBySid(sid);
      setActiveConversation(conv);

      const contactId = getContactIdentity(conv);
      const info = userCache.get(contactId);
      setContactName(info?.name || contactId);
      setContactPhoto(info?.photo || '');

      setConversations((prev) =>
        prev.map((c) => (c.sid === sid ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      console.error('Failed to open conversation:', err);
    } finally {
      setLoadingChat(false);
    }
  }

  function handleBack() {
    setActiveConvSid(null);
    setActiveConversation(null);
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-60px)] items-center justify-center">
        <Loader variant="spinner" size="xl" />
      </div>
    );
  }

  const showChatOnMobile = activeConvSid !== null || activeTab === 'support';

  return (
    <div className="flex h-[calc(100vh-60px)] overflow-hidden md:h-[calc(100vh-72px)]">
      <div
        className={`w-full flex-shrink-0 lg:block lg:w-[350px] ${
          showChatOnMobile ? 'hidden' : 'block'
        }`}
      >
        <ConversationList
          conversations={conversations}
          activeConversationSid={activeConvSid}
          onSelect={handleSelectConversation}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          loading={loading}
        />
      </div>

      <div
        className={`min-w-0 flex-1 ${
          showChatOnMobile ? 'block' : 'hidden lg:block'
        }`}
      >
        {activeTab === 'chats' ? (
          <ChatView
            conversation={activeConversation}
            currentIdentity={identity}
            contactName={contactName}
            contactPhoto={contactPhoto}
            onBack={handleBack}
            loading={loadingChat}
            token={token}
          />
        ) : (
          <AdminChatView
            token={token}
            currentIdentity={identity}
            onBack={() => setActiveTab('chats')}
          />
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Text, Badge, ActionIcon, Loader } from 'rizzui';
import {
  PiPaperPlaneTiltBold,
  PiXBold,
  PiTrashBold,
} from 'react-icons/pi';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';

const QuillEditor = dynamic(() => import('@/components/ui/quill-editor'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[200px] items-center justify-center rounded-md border">
      <Loader variant="spinner" />
    </div>
  ),
});

interface Recipient {
  name: string;
  email: string;
}

interface EmailComposeModalProps {
  recipients: Recipient[];
  onClose: () => void;
  onSent?: () => void;
  defaultSubject?: string;
  defaultBody?: string;
}

export default function EmailComposeModal({
  recipients: initialRecipients,
  onClose,
  onSent,
  defaultSubject,
  defaultBody,
}: EmailComposeModalProps) {
  const [to, setTo] = useState<Recipient[]>(
    initialRecipients.filter((r) => r.email && r.email !== '---')
  );
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [subject, setSubject] = useState(defaultSubject || '');
  const [body, setBody] = useState(defaultBody || '');
  const [sending, setSending] = useState(false);
  const [signature, setSignature] = useState('');

  // Load admin email signature from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('su_admin_email_signature');
      if (saved) setSignature(saved);
    } catch { /* ignore */ }
  }, []);

  const recipientsWithoutEmail = initialRecipients.filter(
    (r) => !r.email || r.email === '---'
  );

  function removeRecipient(email: string) {
    setTo((prev) => prev.filter((r) => r.email !== email));
  }

  function addRecipient(input: string) {
    const emails = input.split(/[,;\s]+/).map((e) => e.trim()).filter(Boolean);
    const valid = emails.filter((e) => e.includes('@') && !to.some((r) => r.email === e));
    if (valid.length === 0) return;
    setTo((prev) => [...prev, ...valid.map((e) => ({ name: '', email: e }))]);
    setNewEmail('');
  }

  async function handleSend() {
    if (to.length === 0) {
      toast.error('Add at least one recipient with email');
      return;
    }
    if (!subject.trim()) {
      toast.error('Subject is required');
      return;
    }
    if (!body.trim() || body === '<p><br></p>') {
      toast.error('Email body cannot be empty');
      return;
    }

    setSending(true);
    try {
      let finalBody = body;
      if (signature && signature !== '<p><br></p>') {
        finalBody += `<br><div style="margin-top:16px;padding-top:12px;border-top:1px solid #e5e7eb">${signature}</div>`;
      }

      const res = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: to.map((r) => ({ name: r.name, email: r.email })),
          cc: cc.split(',').map((e) => e.trim()).filter(Boolean),
          bcc: bcc.split(',').map((e) => e.trim()).filter(Boolean),
          subject,
          body_html: finalBody,
        }),
      });

      const result = await res.json();
      if (result.sent > 0) {
        toast.success(`Email sent to ${result.sent} recipient${result.sent > 1 ? 's' : ''}`);
        onSent?.();
        onClose();
      } else {
        toast.error(result.error || result.errors?.[0] || 'Failed to send email');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error sending email');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl rounded-t-xl bg-white shadow-2xl sm:rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <Text className="text-lg font-semibold">New Email</Text>
          <ActionIcon variant="text" size="sm" onClick={onClose}>
            <PiXBold className="h-5 w-5" />
          </ActionIcon>
        </div>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5">
          {/* Warning for recipients without email */}
          {recipientsWithoutEmail.length > 0 && (
            <div className="rounded-md bg-orange-50 px-3 py-2 text-xs text-orange-700">
              {recipientsWithoutEmail.length} user{recipientsWithoutEmail.length > 1 ? 's' : ''} without email
            </div>
          )}

          {/* To field */}
          <div className="flex items-start gap-2">
            <Text className="w-12 shrink-0 pt-2 text-sm font-medium text-gray-500">To:</Text>
            <div className="flex flex-1 flex-wrap items-center gap-1.5 rounded-md border px-2 py-1.5 min-h-[38px]">
              {to.map((r) => (
                <Badge key={r.email} variant="flat" color="primary" className="gap-1 pr-1">
                  <span className="max-w-[180px] truncate text-xs">
                    {r.name && r.name !== '---' ? `${r.name} <${r.email}>` : r.email}
                  </span>
                  <button
                    onClick={() => removeRecipient(r.email)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20"
                  >
                    <PiXBold className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <input
                type="text"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
                    e.preventDefault();
                    addRecipient(newEmail);
                  }
                }}
                onBlur={() => { if (newEmail.trim()) addRecipient(newEmail); }}
                placeholder={to.length === 0 ? 'Type email and press Enter...' : 'Add more...'}
                className="min-w-[120px] flex-1 border-none bg-transparent py-0.5 text-sm outline-none placeholder:text-gray-400"
              />
            </div>
            <button onClick={() => setShowCcBcc(!showCcBcc)} className="shrink-0 pt-2 text-xs text-primary hover:underline">
              CC/BCC
            </button>
          </div>

          {/* CC / BCC */}
          {showCcBcc && (
            <div className="space-y-2 pl-14">
              <Input size="sm" placeholder="CC (comma separated)" value={cc} onChange={(e) => setCc(e.target.value)} />
              <Input size="sm" placeholder="BCC (comma separated)" value={bcc} onChange={(e) => setBcc(e.target.value)} />
            </div>
          )}

          {/* Subject */}
          <div className="flex items-center gap-2">
            <Text className="w-12 shrink-0 text-sm font-medium text-gray-500">Subject:</Text>
            <Input
              size="sm"
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1"
            />
          </div>

          {/* Body */}
          <QuillEditor
            value={body}
            onChange={setBody}
            placeholder="Write your message here..."
            className="[&_.ql-editor]:min-h-[200px]"
          />

          {/* Signature preview */}
          {signature && signature !== '<p><br></p>' && (
            <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-3">
              <Text className="mb-1 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                Signature (auto-included)
              </Text>
              <div className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: signature }} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-5 py-3">
          <Button variant="text" color="danger" size="sm" className="gap-1.5" onClick={onClose}>
            <PiTrashBold className="h-4 w-4" /> Discard
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={handleSend}
            isLoading={sending}
            disabled={sending || to.length === 0}
          >
            <PiPaperPlaneTiltBold className="h-4 w-4" /> Send
          </Button>
        </div>
      </div>
    </div>
  );
}

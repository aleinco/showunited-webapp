'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Input, Button, Text } from 'rizzui';
import {
  PiCaretLeftBold,
  PiCaretDownBold,
  PiCaretUpBold,
  PiEnvelopeLight,
  PiPaperPlaneRightFill,
} from 'react-icons/pi';
import toast from 'react-hot-toast';

interface FAQ {
  FAQId: number;
  FAQQuestion: string;
  FAQAnswer: string;
}

export default function HelpPage() {
  const router = useRouter();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Contact form
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    axios
      .get('/api/user/faq')
      .then((res) => {
        if (res.data?.ok) setFaqs(res.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contactEmail || !contactMessage) {
      toast.error('Please fill in all fields');
      return;
    }
    setSending(true);
    // Simulated send — in production, wire to an email API
    setTimeout(() => {
      toast.success('Message sent! We will get back to you soon.');
      setContactName('');
      setContactEmail('');
      setContactMessage('');
      setSending(false);
    }, 800);
  }

  return (
    <div className="min-h-screen bg-white">
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

      <div className="mx-auto max-w-lg px-5 py-6 md:px-8">
        {/* ── FAQ Section ── */}
        <div className="mb-8">
          <h2 className="mb-4 text-base font-bold text-gray-900">
            Frequently Asked Questions
          </h2>

          {loading ? (
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
                    className="rounded-xl border border-gray-100 bg-gray-50 overflow-hidden"
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

        {/* ── Contact Us Section ── */}
        <div>
          <h2 className="mb-4 text-base font-bold text-gray-900">
            Contact Us
          </h2>

          <div className="mb-5 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <PiEnvelopeLight className="h-5 w-5 flex-shrink-0 text-gray-500" />
            <div>
              <Text className="text-sm font-medium text-gray-900">
                Email Support
              </Text>
              <a
                href="mailto:app@showunited.com"
                className="text-sm text-[#F26B50] underline"
              >
                app@showunited.com
              </a>
            </div>
          </div>

          <form onSubmit={handleContactSubmit} className="space-y-4">
            <Input
              size="lg"
              label="Name"
              placeholder="Your name"
              inputClassName="text-sm"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
            <Input
              type="email"
              size="lg"
              label="Email"
              placeholder="your@email.com"
              inputClassName="text-sm"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-900">
                Message
              </label>
              <textarea
                rows={4}
                placeholder="How can we help you?"
                className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-400 focus:ring-0"
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full rounded-lg text-sm font-semibold"
              style={{ backgroundColor: '#F26B50', color: 'white' }}
              isLoading={sending}
            >
              <PiPaperPlaneRightFill className="mr-2 h-4 w-4" />
              Send Message
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

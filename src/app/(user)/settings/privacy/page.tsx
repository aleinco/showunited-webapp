'use client';

import { useRouter } from 'next/navigation';
import { PiCaretLeftBold } from 'react-icons/pi';

const LAST_UPDATED = 'April 15, 2026';

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile header */}
      <div className="flex items-center border-b border-gray-100 px-4 py-3 md:hidden">
        <button onClick={() => router.back()} className="mr-3 text-[#F26B50]">
          <PiCaretLeftBold className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-gray-900">
          Privacy Policy
        </h1>
        <div className="w-8" />
      </div>

      {/* Desktop title */}
      <div className="hidden border-b border-gray-100 px-8 py-5 md:block">
        <h1 className="text-xl font-bold text-gray-900">Privacy Policy</h1>
      </div>

      <div className="mx-auto max-w-lg px-5 py-6 md:px-8">
        <p className="mb-6 text-xs text-gray-400">
          Last updated: {LAST_UPDATED}
        </p>

        <Section title="1. Introduction">
          Show United (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is
          committed to protecting your privacy. This Privacy Policy explains how
          we collect, use, disclose, and safeguard your personal information when
          you use our mobile application and web platform. By using Show United,
          you consent to the data practices described in this policy.
        </Section>

        <Section title="2. Information We Collect">
          <strong>Account Information:</strong> When you create an account, we
          collect your name, email address, phone number, date of birth, gender,
          country, and city. For performers, we also collect professional details
          such as category, skills, and portfolio media.
          <br /><br />
          <strong>Profile Content:</strong> Photos, videos, audio files, and text
          descriptions you upload to your profile.
          <br /><br />
          <strong>Usage Data:</strong> Information about how you interact with the
          platform, including pages visited, features used, search queries, and
          interaction with other users&apos; profiles.
          <br /><br />
          <strong>Device Information:</strong> Device type, operating system,
          browser type, IP address, and unique device identifiers.
        </Section>

        <Section title="3. How We Use Your Information">
          We use your personal information to: provide and maintain the platform;
          create and manage your account; enable connections between users and
          industry professionals; personalize your experience and show relevant
          content; send notifications about activity on your profile; process
          subscription payments; improve our services and develop new features;
          ensure platform security and prevent fraud; and comply with legal
          obligations.
        </Section>

        <Section title="4. Information Sharing">
          We do not sell your personal information to third parties. We may share
          your information with: other users as part of normal platform
          functionality (your public profile); service providers who help us
          operate the platform (hosting, analytics, payment processing);
          law enforcement when required by law or to protect our rights; and
          business partners in the event of a merger, acquisition, or asset sale,
          with prior notice to users.
        </Section>

        <Section title="5. Data Security">
          We implement industry-standard security measures to protect your
          personal information, including encrypted data transmission (TLS/SSL),
          secure server infrastructure, and access controls. However, no method of
          electronic transmission or storage is 100% secure, and we cannot
          guarantee absolute security.
        </Section>

        <Section title="6. Cookies & Tracking">
          We use cookies and similar tracking technologies to maintain your
          session, remember your preferences, and analyze platform usage. You can
          control cookie settings through your browser. Essential cookies are
          required for the platform to function. Analytics cookies help us
          understand usage patterns and improve our services.
        </Section>

        <Section title="7. Data Retention">
          We retain your personal information for as long as your account is
          active or as needed to provide our services. If you delete your account,
          we will remove your personal data within 30 days, except where retention
          is required for legal, accounting, or regulatory purposes.
        </Section>

        <Section title="8. Your Rights">
          Depending on your location, you may have the following rights regarding
          your personal data: the right to access your data; the right to correct
          inaccurate information; the right to delete your account and associated
          data; the right to data portability; the right to restrict or object to
          certain processing; and the right to withdraw consent. To exercise any
          of these rights, contact us at the email below.
        </Section>

        <Section title="9. Children's Privacy">
          Show United is not intended for users under the age of 16. We do not
          knowingly collect personal information from children under 16. If we
          become aware that we have collected data from a child under 16, we will
          take steps to delete that information promptly.
        </Section>

        <Section title="10. International Data Transfers">
          Your information may be transferred to and stored on servers located
          outside your country of residence. We ensure that appropriate safeguards
          are in place to protect your data in compliance with applicable data
          protection laws, including the EU General Data Protection Regulation
          (GDPR).
        </Section>

        <Section title="11. Changes to This Policy">
          We may update this Privacy Policy from time to time. We will notify you
          of significant changes through the app or by email. Your continued use
          of the platform after changes are posted constitutes your acceptance of
          the updated policy.
        </Section>

        <Section title="12. Contact Us">
          If you have questions or concerns about this Privacy Policy or our data
          practices, please contact us at{' '}
          <a
            href="mailto:app@showunited.com"
            className="text-[#F26B50] underline"
          >
            app@showunited.com
          </a>
          .
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h2 className="mb-2 text-sm font-bold text-gray-900">{title}</h2>
      <div className="text-sm leading-relaxed text-gray-600">{children}</div>
    </div>
  );
}

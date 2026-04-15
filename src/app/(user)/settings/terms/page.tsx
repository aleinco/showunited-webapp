'use client';

import { useRouter } from 'next/navigation';
import { PiCaretLeftBold } from 'react-icons/pi';

const LAST_UPDATED = 'April 15, 2026';

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile header */}
      <div className="flex items-center border-b border-gray-100 px-4 py-3 md:hidden">
        <button onClick={() => router.back()} className="mr-3 text-[#F26B50]">
          <PiCaretLeftBold className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-gray-900">
          Terms & Conditions
        </h1>
        <div className="w-8" />
      </div>

      {/* Desktop title */}
      <div className="hidden border-b border-gray-100 px-8 py-5 md:block">
        <h1 className="text-xl font-bold text-gray-900">Terms & Conditions</h1>
      </div>

      <div className="mx-auto max-w-lg px-5 py-6 md:px-8">
        <p className="mb-6 text-xs text-gray-400">
          Last updated: {LAST_UPDATED}
        </p>

        <Section title="1. Acceptance of Terms">
          By accessing or using the Show United application and related services,
          you agree to be bound by these Terms and Conditions. If you do not agree
          to all of these terms, you may not use our services. Show United reserves
          the right to modify these terms at any time, and your continued use of
          the platform constitutes acceptance of any changes.
        </Section>

        <Section title="2. Description of Service">
          Show United is a social networking platform designed for performers,
          artists, and entertainment industry professionals. The platform enables
          users to create professional profiles, showcase their talents, connect
          with other industry professionals, and discover opportunities. Some
          features may require a paid subscription.
        </Section>

        <Section title="3. User Accounts">
          You must be at least 16 years of age to create an account. You are
          responsible for maintaining the confidentiality of your login credentials
          and for all activities that occur under your account. You agree to
          provide accurate and complete information during registration and to keep
          your account information up to date. You must notify us immediately of
          any unauthorized access to your account.
        </Section>

        <Section title="4. User Conduct">
          You agree not to use the platform to: post false, misleading, or
          deceptive content; harass, threaten, or intimidate other users; upload
          content that infringes on intellectual property rights; attempt to gain
          unauthorized access to the platform or other users' accounts; use the
          platform for any illegal purpose; create multiple accounts for abusive
          purposes; or engage in any activity that disrupts the platform's
          functionality.
        </Section>

        <Section title="5. Content & Intellectual Property">
          You retain ownership of the content you post on Show United. By
          uploading content, you grant Show United a non-exclusive, worldwide,
          royalty-free license to use, display, reproduce, and distribute your
          content within the platform for the purpose of providing our services.
          You represent that you have all necessary rights to the content you
          upload. Show United's logo, brand, and proprietary features are protected
          by intellectual property laws.
        </Section>

        <Section title="6. Subscriptions & Payments">
          Certain features of Show United require a paid subscription. Subscription
          fees are billed in advance on a recurring basis depending on the plan
          selected. You may cancel your subscription at any time, but no refunds
          will be issued for the current billing period. Prices are subject to
          change with prior notice.
        </Section>

        <Section title="7. Privacy">
          Your use of Show United is also governed by our Privacy Policy, which
          describes how we collect, use, and protect your personal information.
          By using the platform, you consent to the practices described in the
          Privacy Policy.
        </Section>

        <Section title="8. Termination">
          Show United may suspend or terminate your account at any time for
          violations of these terms, abusive behavior, or any reason deemed
          appropriate by our team. You may delete your account at any time through
          the Account settings. Upon termination, your right to use the platform
          ceases immediately, though certain provisions of these terms will survive
          termination.
        </Section>

        <Section title="9. Disclaimers">
          Show United is provided on an &quot;as is&quot; and &quot;as
          available&quot; basis. We do not guarantee that the platform will be
          uninterrupted, secure, or error-free. We are not responsible for the
          accuracy or reliability of content posted by users. Show United does not
          endorse or verify the credentials of any user or performer.
        </Section>

        <Section title="10. Limitation of Liability">
          To the fullest extent permitted by applicable law, Show United shall not
          be liable for any indirect, incidental, special, consequential, or
          punitive damages arising from your use of the platform, including but not
          limited to loss of revenue, data, or business opportunities.
        </Section>

        <Section title="11. Governing Law">
          These terms shall be governed by and construed in accordance with the
          laws of the European Union and the applicable jurisdiction where Show
          United operates. Any disputes arising from these terms shall be resolved
          through binding arbitration or in the competent courts of that
          jurisdiction.
        </Section>

        <Section title="12. Contact">
          If you have any questions about these Terms and Conditions, please
          contact us at{' '}
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
      <p className="text-sm leading-relaxed text-gray-600">{children}</p>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  PiUserCircleLight,
  PiIdentificationCardLight,
  PiStarLight,
  PiChatCircleLight,
  PiFileTextLight,
  PiShieldCheckLight,
  PiGearSixLight,
  PiQuestionLight,
  PiCaretRightLight,
} from 'react-icons/pi';

const MENU_ITEMS = [
  { label: 'Profile', href: '/settings/profile', icon: PiUserCircleLight },
  { label: 'Personal Info', href: '/settings/personal-info', icon: PiIdentificationCardLight },
  { label: 'Favorites', href: '/settings/favorites', icon: PiStarLight },
  { label: 'Messages', href: '/settings/messages', icon: PiChatCircleLight },
  { label: 'Terms & Conditions', href: '/settings/terms', icon: PiFileTextLight },
  { label: 'Privacy Policy', href: '/settings/privacy', icon: PiShieldCheckLight },
  { label: 'Account', href: '/settings/account', icon: PiGearSixLight },
  { label: 'Help & Support', href: '/settings/help', icon: PiQuestionLight },
];

export default function SettingsIndexPage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(true);
  const [user, setUser] = useState<{
    name: string;
    userId: number;
    planLabel: string;
    profileImage: string;
  } | null>(null);

  useEffect(() => {
    // Check viewport
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Desktop: redirect to /settings/profile
  useEffect(() => {
    if (!isMobile) {
      router.replace('/settings/profile');
    }
  }, [isMobile, router]);

  // Load user for mobile header
  useEffect(() => {
    const token = localStorage.getItem('su_register_token');
    if (!token) return;

    let userId = 0;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = Number(payload.IndividualUserId || 0);
    } catch { return; }

    axios
      .post('/api/user', {
        endpoint: 'GetUserDetailById',
        token,
        data: { IndividualUserId: userId },
      })
      .then((res) => {
        const d = res.data?.responseData;
        if (!d) return;
        const images = d.IndividualUserImageList || [];
        setUser({
          name: `${d.FirstName || ''} ${d.LastName || ''}`.trim() || 'User',
          userId,
          planLabel:
            d.SubscriptionPlanId === 4
              ? 'Free Individual'
              : 'Individual',
          profileImage:
            images[0]?.IndividualUserImage || d.ProfileImage || '',
        });
      })
      .catch(() => {});
  }, []);

  // Desktop shows nothing (redirects)
  if (!isMobile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  // Mobile: show menu list (like the app)
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 px-4 py-3 text-center">
        <h1 className="text-lg font-semibold text-gray-900">My Profile</h1>
      </div>

      {/* User card */}
      {user && (
        <div className="flex flex-col items-center border-b border-gray-100 px-4 pb-5 pt-6">
          {user.profileImage ? (
            <div className="relative">
              <img
                src={user.profileImage}
                alt={user.name}
                className="h-24 w-24 rounded-full border-2 border-gray-200 object-cover"
              />
              <div className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#F26B50] text-white shadow-md">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <circle cx="12" cy="13" r="3" />
                </svg>
              </div>
            </div>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-orange-50 text-3xl font-bold text-[#F26B50]">
              {user.name.charAt(0)}
            </div>
          )}
          <h2 className="mt-3 text-lg font-semibold text-gray-900">
            {user.name}
          </h2>
          <p className="text-sm text-gray-400">User ID : {user.userId}</p>
          <p className="mt-0.5 text-sm text-[#F26B50]">{user.planLabel}</p>
        </div>
      )}

      {/* Menu items */}
      <div className="divide-y divide-gray-50">
        {MENU_ITEMS.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 px-5 py-4 transition-colors active:bg-gray-50"
          >
            <Icon className="h-6 w-6 flex-shrink-0 text-gray-500" />
            <span className="flex-1 text-[15px] text-gray-800">{label}</span>
            <PiCaretRightLight className="h-5 w-5 text-gray-300" />
          </Link>
        ))}
      </div>
    </div>
  );
}

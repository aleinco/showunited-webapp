'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import axios from 'axios';
import cn from '@/utils/class-names';
import {
  PiUserCircleLight,
  PiIdentificationCardLight,
  PiStarLight,
  PiChatCircleLight,
  PiFileTextLight,
  PiShieldCheckLight,
  PiGearSixLight,
  PiQuestionLight,
} from 'react-icons/pi';

/* ── Menu items ── */
const MENU_ITEMS = [
  { label: 'Edit Profile', href: '/settings/profile', icon: PiUserCircleLight },
  { label: 'Personal Info', href: '/settings/personal-info', icon: PiIdentificationCardLight },
  { label: 'Favorites', href: '/settings/favorites', icon: PiStarLight },
  { label: 'Messages', href: '/settings/messages', icon: PiChatCircleLight },
  { label: 'Terms & Conditions', href: '/settings/terms', icon: PiFileTextLight },
  { label: 'Privacy Policy', href: '/settings/privacy', icon: PiShieldCheckLight },
  { label: 'Account', href: '/settings/account', icon: PiGearSixLight },
  { label: 'Help & Support', href: '/settings/help', icon: PiQuestionLight },
];

interface UserBasic {
  name: string;
  userId: number;
  planLabel: string;
  profileImage: string;
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<UserBasic | null>(null);

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
              : d.SubscriptionPlanId
                ? `Plan ${d.SubscriptionPlanId}`
                : 'Individual',
          profileImage:
            images[0]?.IndividualUserImage || d.ProfileImage || '',
        });
      })
      .catch(() => {});
  }, []);

  /* ── Sidebar content (shared between desktop sidebar & mobile index) ── */
  function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
    return (
      <div className="flex flex-col">
        {/* User header */}
        {user && (
          <div className="flex flex-col items-center border-b border-gray-100 px-6 pb-5 pt-6">
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name}
                className="h-20 w-20 rounded-full border-2 border-gray-200 object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-orange-50 text-2xl font-bold text-[#F26B50]">
                {user.name.charAt(0)}
              </div>
            )}
            <h3 className="mt-3 text-base font-semibold text-gray-900">
              {user.name}
            </h3>
            <p className="text-xs text-gray-400">
              User ID : {user.userId}
            </p>
            <p className="mt-0.5 text-xs text-[#F26B50]">
              {user.planLabel}
            </p>
          </div>
        )}

        {/* Menu items */}
        <nav className="flex flex-col py-2">
          {MENU_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive =
              pathname === href ||
              (href !== '/settings/profile' && pathname.startsWith(href));

            return (
              <Link
                key={href}
                href={href}
                onClick={onItemClick}
                className={cn(
                  'flex items-center gap-3.5 border-l-[3px] px-6 py-3.5 text-[15px] transition-all',
                  isActive
                    ? 'border-l-[#F26B50] bg-gray-50 font-semibold text-gray-900'
                    : 'border-l-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className="h-[22px] w-[22px] flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-57px)]">
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden w-[280px] flex-shrink-0 border-r border-gray-200 bg-white md:block">
        <div className="sticky top-[57px]">
          <SidebarContent />
        </div>
      </aside>

      {/* Content area */}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

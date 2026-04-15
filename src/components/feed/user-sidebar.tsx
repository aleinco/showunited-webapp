'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import axios from 'axios';
import cn from '@/utils/class-names';
import {
  PiHouseLight,
  PiHouseFill,
  PiBriefcaseLight,
  PiBriefcaseFill,
  PiMicrophoneStageLight,
  PiMicrophoneStageFill,
  PiMagnifyingGlassLight,
  PiChatCircleLight,
  PiChatCircleFill,
  PiBellLight,
  PiBellFill,
  PiPlusSquareLight,
  PiPlusSquareFill,
  PiImagesLight,
  PiImagesFill,
  PiUserCircleLight,
  PiUserCircleFill,
  PiListLight,
} from 'react-icons/pi';

/* ── Menu items ── */
const MENU_ITEMS = [
  {
    label: 'Home',
    href: '/home',
    icon: PiHouseLight,
    iconActive: PiHouseFill,
  },
  {
    label: 'Jobs',
    href: '/jobs',
    icon: PiBriefcaseLight,
    iconActive: PiBriefcaseFill,
  },
  {
    label: 'Auditions',
    href: '/auditions',
    icon: PiMicrophoneStageLight,
    iconActive: PiMicrophoneStageFill,
  },
  {
    label: 'Search',
    href: '/search',
    icon: PiMagnifyingGlassLight,
    iconActive: PiMagnifyingGlassLight,
  },
  {
    label: 'Messages',
    href: '/messages',
    icon: PiChatCircleLight,
    iconActive: PiChatCircleFill,
  },
  {
    label: 'Notifications',
    href: '/notifications',
    icon: PiBellLight,
    iconActive: PiBellFill,
  },
  {
    label: 'Create',
    href: '/create',
    icon: PiPlusSquareLight,
    iconActive: PiPlusSquareFill,
  },
  {
    label: 'Gallery',
    href: '/user-gallery',
    icon: PiImagesLight,
    iconActive: PiImagesFill,
  },
  {
    label: 'Profile',
    href: '/settings',
    icon: PiUserCircleLight,
    iconActive: PiUserCircleFill,
  },
];

/* Mobile bottom bar — 6 items matching iOS app */
const MOBILE_TAB_INDICES = [0, 1, 2, 6, 7, 8]; // Home, Jobs, Auditions, Create, Gallery, Profile

export default function UserSidebar() {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();
  const [profileImage, setProfileImage] = useState<string | null>(null);

  /* Fetch user profile image for bottom tab avatar */
  useEffect(() => {
    const token = localStorage.getItem('su_register_token');
    if (!token) return;

    let userId = 0;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = Number(payload.IndividualUserId || 0);
    } catch {
      return;
    }

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
        const img = images[0]?.IndividualUserImage || d.ProfileImage || '';
        if (img) setProfileImage(img);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="contents">
      {/* Desktop sidebar — hidden on mobile */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-in-out md:flex',
          expanded ? 'w-[220px]' : 'w-[72px]'
        )}
      >
      {/* Logo */}
      <div className="flex h-[72px] items-center px-5">
        <Link href="/home" className="flex items-center gap-3">
          <img
            src="/logo-showunited.png"
            alt="Show United"
            className={cn(
              'transition-all duration-300',
              expanded ? 'h-8 w-auto' : 'h-7 w-7 object-contain object-left'
            )}
          />
        </Link>
      </div>

      {/* Menu items */}
      <nav className="flex flex-1 flex-col gap-1 px-3 pt-2">
        {MENU_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/home' && pathname.startsWith(item.href));
          const Icon = isActive ? item.iconActive : item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-4 rounded-lg px-3 py-3 transition-all duration-200 hover:bg-gray-100',
                isActive && 'font-semibold'
              )}
              title={!expanded ? item.label : undefined}
            >
              <Icon
                className={cn(
                  'h-[26px] w-[26px] flex-shrink-0 transition-transform duration-200 group-hover:scale-105',
                  isActive ? 'text-[#F26B50]' : 'text-gray-700'
                )}
              />
              <span
                className={cn(
                  'whitespace-nowrap text-[15px] transition-all duration-300',
                  expanded
                    ? 'w-auto opacity-100'
                    : 'w-0 overflow-hidden opacity-0',
                  isActive ? 'font-semibold text-[#F26B50]' : 'text-gray-700'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* More button (toggle expand) */}
      <div className="border-t border-gray-100 px-3 py-3">
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="flex w-full items-center gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-gray-100"
        >
          <PiListLight className="h-[26px] w-[26px] flex-shrink-0 text-gray-700" />
          <span
            className={cn(
              'whitespace-nowrap text-[15px] text-gray-700 transition-all duration-300',
              expanded ? 'w-auto opacity-100' : 'w-0 overflow-hidden opacity-0'
            )}
          >
            More
          </span>
        </button>
      </div>
    </aside>

    {/* Mobile bottom tab bar — 6 tabs matching iOS app */}
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-gray-200 bg-white pb-safe md:hidden">
      {MOBILE_TAB_INDICES.map((idx) => {
        const item = MENU_ITEMS[idx];
        const isActive =
          pathname === item.href ||
          (item.href !== '/home' && pathname.startsWith(item.href));
        const Icon = isActive ? item.iconActive : item.icon;
        const isCreate = item.label === 'Create';
        const isProfile = item.label === 'Profile';

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-0.5 py-2',
              isCreate ? 'px-2' : 'px-2'
            )}
          >
            {/* Profile tab: show user avatar if available */}
            {isProfile && profileImage ? (
              <div
                className={cn(
                  'h-6 w-6 overflow-hidden rounded-full',
                  isActive && 'ring-2 ring-[#F26B50] ring-offset-1'
                )}
              >
                <img
                  src={profileImage}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <Icon
                className={cn(
                  isCreate ? 'h-7 w-7' : 'h-6 w-6',
                  isActive ? 'text-[#F26B50]' : 'text-gray-500'
                )}
              />
            )}
            <span
              className={cn(
                'text-[10px]',
                isActive ? 'font-semibold text-[#F26B50]' : 'text-gray-500'
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
    </div>
  );
}

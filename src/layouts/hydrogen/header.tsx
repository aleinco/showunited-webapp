'use client';

import Link from 'next/link';
import cn from '@/utils/class-names';
import { ActionIcon, Button } from 'rizzui';
import { PiListBold, PiMoonDuotone, PiSunDuotone, PiUserCircleDuotone } from 'react-icons/pi';
import { useTheme } from 'next-themes';
import { useIsMounted } from '@/hooks/use-is-mounted';
import { useWindowScroll } from '@/hooks/use-window-scroll';
import { useEffect, useState } from 'react';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isMounted = useIsMounted();

  if (!isMounted) return null;

  return (
    <ActionIcon
      variant="text"
      className="h-auto w-auto p-1 text-gray-600 hover:text-gray-900"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? (
        <PiSunDuotone className="h-5 w-5" />
      ) : (
        <PiMoonDuotone className="h-5 w-5" />
      )}
    </ActionIcon>
  );
}

export default function Header() {
  const windowScroll = useWindowScroll();
  const isMounted = useIsMounted();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <header
      className={cn(
        'sticky top-0 z-[990] flex items-center justify-between bg-gray-0/80 px-4 py-4 backdrop-blur-xl dark:bg-gray-50/50 md:px-5 lg:px-6 2xl:py-5 3xl:px-8 4xl:px-10',
        isMounted && (windowScroll as any)?.y > 2
          ? 'card-shadow'
          : ''
      )}
    >
      <div className="flex items-center gap-3">
        <button
          className="inline-flex xl:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <PiListBold className="h-6 w-6 text-gray-700" />
        </button>
        <Link
          href="/"
          aria-label="Site Logo"
          className="me-4 shrink-0 xl:hidden"
        >
          <img
            src="/logo-showunited.png"
            alt="Show United"
            className="h-12 w-auto"
          />
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 dark:bg-gray-200">
          <PiUserCircleDuotone className="h-5 w-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Admin</span>
        </div>
      </div>
    </header>
  );
}

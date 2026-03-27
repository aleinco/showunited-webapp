'use client';

import UserSidebar from '@/components/feed/user-sidebar';
import {
  PiMagnifyingGlassLight,
  PiBellLight,
  PiChatCircleLight,
} from 'react-icons/pi';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen overflow-x-hidden bg-white">
      {/* Sidebar (Instagram-style) */}
      <UserSidebar />

      {/* Main content — offset by sidebar width on desktop only */}
      <div className="flex min-w-0 flex-1 flex-col pb-16 md:ml-[72px] md:pb-0">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-3 py-2.5 md:gap-4 md:px-4 md:py-3">
            {/* Logo — always visible on mobile, hidden on desktop (sidebar has it) */}
            <img
              src="/logo-showunited.png"
              alt="Show United"
              className="h-7 w-auto md:hidden"
            />

            {/* Search bar */}
            <div className="relative flex-1">
              <PiMagnifyingGlassLight className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search company, name, job..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-gray-400 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Icons */}
            <div className="flex items-center gap-1">
              <button className="rounded-lg p-2.5 text-gray-700 transition-colors hover:bg-gray-100">
                <PiBellLight className="h-6 w-6" />
              </button>
              <button className="rounded-lg p-2.5 text-gray-700 transition-colors hover:bg-gray-100">
                <PiChatCircleLight className="h-6 w-6" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <div className="mx-auto max-w-5xl px-0 md:px-4">{children}</div>
        </main>
      </div>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { PiCaretLeftBold, PiShieldCheckLight } from 'react-icons/pi';

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center border-b border-gray-100 px-4 py-3 md:hidden">
        <button onClick={() => router.back()} className="mr-3 text-[#F26B50]">
          <PiCaretLeftBold className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-gray-900">Privacy Policy</h1>
        <div className="w-8" />
      </div>
      <div className="hidden border-b border-gray-100 px-8 py-5 md:block">
        <h1 className="text-xl font-bold text-gray-900">Privacy Policy</h1>
      </div>
      <div className="flex flex-col items-center justify-center py-20">
        <PiShieldCheckLight className="mb-3 h-16 w-16 text-gray-300" />
        <p className="text-sm text-gray-400">Coming soon</p>
      </div>
    </div>
  );
}

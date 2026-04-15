'use client';

import { PiPlusSquareLight, PiImageLight, PiVideoLight, PiTextAaLight } from 'react-icons/pi';
import Link from 'next/link';

const CREATE_OPTIONS = [
  {
    label: 'Photo Post',
    description: 'Share a photo with your network',
    icon: PiImageLight,
    href: '/create',
  },
  {
    label: 'Video Post',
    description: 'Upload a video clip or reel',
    icon: PiVideoLight,
    href: '/create',
  },
  {
    label: 'Text Post',
    description: 'Write an update or announcement',
    icon: PiTextAaLight,
    href: '/create',
  },
];

export default function CreatePage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Create</h1>
      <p className="mb-8 text-sm text-gray-500">
        Share something with the Show United community.
      </p>

      <div className="flex flex-col gap-3">
        {CREATE_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-[#F26B50]/30 hover:shadow-sm active:scale-[0.98]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
              <opt.icon className="h-6 w-6 text-[#F26B50]" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-gray-900">
                {opt.label}
              </p>
              <p className="text-xs text-gray-500">{opt.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

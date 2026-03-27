'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Title, Text } from 'rizzui';
import { PiUserBold, PiBuildingsBold, PiArrowLeftBold } from 'react-icons/pi';
import cn from '@/utils/class-names';

const accountTypes = [
  {
    label: 'Individual Account',
    description: 'For actors, singers, dancers, models and performers',
    value: 'IndividualUser',
    icon: PiUserBold,
  },
  {
    label: 'Company',
    description: 'For agencies, theaters, production companies',
    value: 'CompanyUser',
    icon: PiBuildingsBold,
  },
];

export default function SignUpPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  function handleContinue() {
    if (!selected) return;
    router.push(`/register?type=${selected}`);
  }

  return (
    <div className="relative min-h-screen">
      {/* Top gradient background */}
      <div className="absolute left-0 top-0 h-56 w-full bg-gradient-to-br from-[#F26B50] to-[#D84C32] md:h-[424px]" />

      {/* Top nav bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between bg-transparent px-5 py-4 md:px-10">
        <Link href="/signin">
          <img
            src="/logo-showunited-white.png"
            alt="Show United"
            className="h-10 w-auto"
          />
        </Link>
        <Link
          href="/signin"
          className="flex items-center gap-2 text-sm font-medium text-white/90 transition-colors hover:text-white"
        >
          <PiArrowLeftBold className="h-4 w-4" />
          Back to Sign In
        </Link>
      </div>

      {/* Centered card */}
      <div className="relative z-10 mx-auto max-w-2xl px-5 pb-10 pt-6 md:pt-10">
        <div className="rounded-[20px] bg-white p-5 shadow-roundedCard dark:bg-gray-0 md:p-8 lg:p-12">
          <div className="mb-6 md:mb-10">
            <div className="flex flex-wrap-reverse justify-between gap-x-5 gap-y-2 md:flex-nowrap">
              <Title as="h3" className="font-inter font-medium">
                Select your profile
              </Title>
              <Text
                as="span"
                className="w-full text-nowrap font-medium text-gray-500 md:w-auto"
              >
                Step 1 of 7
              </Text>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {accountTypes.map((type) => {
              const isSelected = selected === type.value;
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSelected(type.value)}
                  className={cn(
                    'flex items-center gap-4 rounded-xl border px-6 py-5 text-left ring-1 transition-all duration-200 md:gap-5 md:px-8 md:py-6',
                    isSelected
                      ? 'border-[#F26B50] bg-[#F26B50]/5 ring-[#F26B50]'
                      : 'border-transparent ring-gray-200 hover:ring-[#F26B50]/50'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-8 w-8 shrink-0',
                      isSelected ? 'text-[#F26B50]' : 'text-gray-900'
                    )}
                  />
                  <div>
                    <Title
                      as="h4"
                      className={cn(
                        'font-inter text-lg font-medium md:text-xl',
                        isSelected ? 'text-[#F26B50]' : 'text-gray-900'
                      )}
                    >
                      {type.label}
                    </Title>
                    <Text className="mt-1 text-sm text-gray-500">
                      {type.description}
                    </Text>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex items-center justify-between md:mt-10">
            <Text className="text-[15px] text-gray-500">
              Already have an account?{' '}
              <Link
                href="/signin"
                className="font-semibold text-gray-700 transition-colors hover:text-primary"
              >
                Sign In
              </Link>
            </Text>
            <Button
              onClick={handleContinue}
              disabled={!selected}
              size="lg"
              className="px-8"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

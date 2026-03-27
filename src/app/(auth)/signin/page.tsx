'use client';

import Link from 'next/link';
import { Button, Text } from 'rizzui';
import { PiAppleLogoFill } from 'react-icons/pi';
import { FcGoogle } from 'react-icons/fc';
import OrSeparation from '@/app/shared/auth-layout/or-separation';
import SignInForm from './sign-in-form';
import toast from 'react-hot-toast';

function handleSocialSignIn(provider: string) {
  toast.error(
    `${provider} sign-in is not yet configured. Please use username and password.`
  );
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="flex w-full flex-col items-center justify-center px-4 py-12 lg:w-5/12 2xl:pe-24">
        <div className="w-full max-w-sm md:max-w-md 2xl:max-w-lg">
          <div className="mb-7 text-center xl:mb-8 2xl:mb-10">
            <Link href="/" className="mb-6 inline-block xl:mb-8">
              <img
                src="/logo-showunited.png"
                alt="Show United"
                className="h-24 w-auto"
              />
            </Link>
          </div>

          <SignInForm />

          <OrSeparation title="OR" className="mb-5 mt-5 2xl:mb-7 2xl:mt-7" isCenter />

          {/* Social login buttons */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:gap-5">
            <Button
              onClick={() => handleSocialSignIn('Apple')}
              variant="outline"
              className="h-11 w-full"
            >
              <PiAppleLogoFill className="me-2 h-5 w-5 shrink-0" />
              <span className="truncate">Sign in with Apple</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSocialSignIn('Google')}
              className="h-11 w-full"
            >
              <FcGoogle className="me-2 h-5 w-5 shrink-0" />
              <span className="truncate">Sign in with Google</span>
            </Button>
          </div>

          <Text className="mt-6 text-center text-[15px] leading-loose text-gray-500 lg:mt-8 xl:mt-10">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="font-semibold text-gray-700 transition-colors hover:text-primary"
            >
              Sign Up
            </Link>
          </Text>
        </div>
      </div>

      {/* Right side - Banner */}
      <div className="hidden w-7/12 items-center justify-center rounded-s-[40px] bg-gradient-to-br from-[#F26B50] to-[#D84C32] px-6 lg:flex 2xl:px-16">
        <div className="max-w-lg text-center text-white">
          <img
            src="/logo-showunited-white.png"
            alt="Show United"
            className="mx-auto mb-10 h-20 w-auto opacity-90"
          />

          <div className="mt-12 grid grid-cols-3 gap-6">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <Text className="text-2xl font-bold text-white">1.2K+</Text>
              <Text className="text-sm text-white/70">Active Users</Text>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <Text className="text-2xl font-bold text-white">486</Text>
              <Text className="text-sm text-white/70">Subscriptions</Text>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <Text className="text-2xl font-bold text-white">22</Text>
              <Text className="text-sm text-white/70">Modules</Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

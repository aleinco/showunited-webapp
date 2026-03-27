'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import Link from 'next/link';
import { Button, Checkbox, Input, Text } from 'rizzui';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userType = searchParams.get('type') || 'IndividualUser';

  const [email, setEmail] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }
    if (!agreedTerms) {
      toast.error('You must agree to the Privacy Policy and Terms & Conditions');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/user', {
        endpoint: 'SignUp',
        data: {
          userType,
          email: email.trim(),
          deviceToken: 'web',
          deviceType: '3',
        },
      });

      const data = res.data;
      if (data.responseCode === '1' || data.responseCode === '200') {
        const rd = data.responseData;
        const userId = rd?.IndividualUserId || rd?.CompanyUserId || rd?.UserId || rd?.userId;
        const token = rd?.Token || rd?.token;

        if (token) {
          localStorage.setItem('su_register_token', token);
        }
        if (userId) {
          localStorage.setItem('su_register_userId', String(userId));
        }
        localStorage.setItem('su_register_email', email.trim());
        localStorage.setItem('su_register_userType', userType);

        toast.success('Verification code sent to your email');
        router.push('/register/verify-otp');
      } else {
        toast.error(data.responseMessage || 'Sign up failed. Please try again.');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.responseMessage || 'Connection error. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm md:max-w-md">
        <div className="mb-10 text-center">
          <Text className="mb-4 text-sm text-gray-500">Log in or Sign up</Text>
          <Link href="/signin" className="inline-block">
            <img
              src="/logo-showunited.png"
              alt="Show United"
              className="h-24 w-auto"
            />
          </Link>
        </div>

        <Input
          type="email"
          placeholder="Enter email"
          className="[&>label>span]:font-medium"
          inputClassName="text-sm"
          size="lg"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="mt-8 flex items-start gap-3">
          <Checkbox
            checked={agreedTerms}
            onChange={() => setAgreedTerms(!agreedTerms)}
            className="mt-0.5"
          />
          <Text className="text-sm leading-relaxed text-gray-600">
            By continuing, you agree to our{' '}
            <Link
              href="/privacy-policy"
              className="font-medium text-[#F26B50] hover:underline"
            >
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link
              href="/terms"
              className="font-medium text-[#F26B50] hover:underline"
            >
              Terms & Conditions.
            </Link>
          </Text>
        </div>

        <Button
          onClick={handleContinue}
          disabled={!email.trim() || !agreedTerms}
          isLoading={loading}
          className="mt-8 w-full"
          size="lg"
        >
          Continue
        </Button>

        <Text className="mt-6 text-center text-[15px] leading-loose text-gray-500">
          Already have an account?{' '}
          <Link
            href="/signin"
            className="font-semibold text-[#F26B50] transition-colors hover:underline"
          >
            Login
          </Link>
        </Text>
      </div>
    </div>
  );
}

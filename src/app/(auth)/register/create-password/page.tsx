'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Password, Text, Title } from 'rizzui';
import { PiCheckCircleFill, PiCircleBold } from 'react-icons/pi';
import toast from 'react-hot-toast';
import axios from 'axios';
import cn from '@/utils/class-names';

const PASSWORD_RULES = [
  { label: '8-20 characters', test: (p: string) => p.length >= 8 && p.length <= 20 },
  { label: 'At least one uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'At least one lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'At least one number', test: (p: string) => /\d/.test(p) },
  { label: 'At least one special character (!@#$%^&*)', test: (p: string) => /[!@#$%^&*]/.test(p) },
];

export default function CreatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const allRulesPass = PASSWORD_RULES.every((rule) => rule.test(password));
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const canSubmit = allRulesPass && passwordsMatch;

  async function handleContinue() {
    if (!canSubmit) return;

    const userId =
      typeof window !== 'undefined'
        ? localStorage.getItem('su_register_userId') || ''
        : '';
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('su_register_token') || ''
        : '';

    setLoading(true);
    try {
      const res = await axios.post('/api/user', {
        endpoint: 'CreatePassword',
        token,
        data: {
          userId: Number(userId),
          password,
          confirmPassword,
        },
      });

      const data = res.data;
      if (data.responseCode === '1' || data.responseCode === '200') {
        toast.success('Password created successfully');
        router.push('/register/personal-info');
      } else {
        toast.error(data.responseMessage || 'Failed to create password. Please try again.');
      }
    } catch {
      toast.error('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm md:max-w-md">
        <div className="mb-8 text-center">
          <Link href="/signin" className="inline-block">
            <img
              src="/logo-showunited.png"
              alt="Show United"
              className="h-20 w-auto"
            />
          </Link>
        </div>

        <Title as="h2" className="mb-8 text-center text-2xl font-bold md:text-3xl">
          Create a password
        </Title>

        <div className="space-y-5">
          <Password
            label="Password"
            placeholder="Enter your password"
            className="[&>label>span]:font-medium"
            inputClassName="text-sm"
            size="lg"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Password
            label="Confirm password"
            placeholder="Confirm your password"
            className="[&>label>span]:font-medium"
            inputClassName="text-sm"
            size="lg"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <div className="mt-6">
          <Text className="mb-3 font-medium text-gray-900">
            Password must include:
          </Text>
          <div className="space-y-2">
            {PASSWORD_RULES.map((rule) => {
              const passes = rule.test(password);
              return (
                <div key={rule.label} className="flex items-center gap-2">
                  {passes ? (
                    <PiCheckCircleFill className="h-5 w-5 shrink-0 text-[#F26B50]" />
                  ) : (
                    <PiCircleBold className="h-5 w-5 shrink-0 text-gray-300" />
                  )}
                  <Text
                    className={cn(
                      'text-sm',
                      passes ? 'text-[#F26B50]' : 'text-gray-500'
                    )}
                  >
                    {rule.label}
                  </Text>
                </div>
              );
            })}
          </div>
        </div>

        <Button
          onClick={handleContinue}
          disabled={!canSubmit}
          isLoading={loading}
          className="mt-8 w-full"
          size="lg"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

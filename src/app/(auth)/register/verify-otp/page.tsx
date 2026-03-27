'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Title, Text } from 'rizzui';
import toast from 'react-hot-toast';
import axios from 'axios';

const OTP_LENGTH = 4;

export default function VerifyOtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const email =
    typeof window !== 'undefined'
      ? localStorage.getItem('su_register_email') || ''
      : '';
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('su_register_token') || ''
      : '';

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  }

  async function handleVerify() {
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      toast.error('Please enter the full OTP code');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/user', {
        endpoint: 'VerifyOTP',
        token,
        data: {
          email,
          oTP: code,
        },
      });

      const data = res.data;
      if (data.responseCode === '1' || data.responseCode === '200') {
        toast.success('Email verified successfully');
        router.push('/register/create-password');
      } else {
        toast.error(data.responseMessage || 'Invalid OTP. Please try again.');
      }
    } catch {
      toast.error('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      const res = await axios.post('/api/user', {
        endpoint: 'ReSendOTP',
        token,
        data: { email },
      });

      const data = res.data;
      if (data.responseCode === '1' || data.responseCode === '200') {
        toast.success('OTP resent to your email');
      } else {
        toast.error(data.responseMessage || 'Failed to resend OTP');
      }
    } catch {
      toast.error('Connection error. Please try again.');
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

        <Title
          as="h2"
          className="mb-3 text-center text-2xl font-bold md:text-3xl"
        >
          Enter your OTP.
        </Title>
        <Text className="mb-8 text-center text-gray-500">
          We have sent you One Time Password to your email.
        </Text>

        {/* OTP Inputs */}
        <div className="mb-8 flex justify-center gap-3 md:gap-4">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="h-14 w-14 rounded-lg border border-gray-300 text-center text-xl font-semibold transition-all focus:border-[#F26B50] focus:outline-none focus:ring-2 focus:ring-[#F26B50]/30 md:h-16 md:w-16 md:text-2xl"
            />
          ))}
        </div>

        <Button
          onClick={handleVerify}
          isLoading={loading}
          disabled={otp.join('').length !== OTP_LENGTH}
          className="w-full"
          size="lg"
        >
          Verify OTP
        </Button>

        <button
          type="button"
          onClick={handleResend}
          className="mt-5 block w-full text-center text-sm font-semibold text-[#F26B50] transition-colors hover:underline"
        >
          Resend OTP
        </button>
      </div>
    </div>
  );
}

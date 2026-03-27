'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Checkbox, Input, Password, Text } from 'rizzui';
import { loginSchema, LoginSchema } from '@/validators/login.schema';
import { adminLogin } from '@/api/client';
import axios from 'axios';
import toast from 'react-hot-toast';

const initialValues: LoginSchema = {
  email: '',
  password: '',
  rememberMe: false,
};

export default function SignInForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: initialValues,
  });

  async function onSubmit(data: LoginSchema) {
    setLoading(true);
    try {
      // 1) Try user API login first (Individual / Company / Professional)
      const userRes = await axios.post('/api/user', {
        endpoint: 'Login',
        data: {
          email: data.email,
          password: data.password,
          deviceType: '3', // web
          deviceToken: '',
        },
      });

      const apiData = userRes.data;
      const rc = String(apiData?.responseCode);

      if (rc === '1' || rc === '200') {
        const rd = apiData.responseData;
        const token = rd?.Token || rd?.token || '';
        const userId =
          rd?.IndividualUserId || rd?.CompanyUserId || rd?.UserId || 0;

        // Decode JWT to get UserType
        let userType = '';
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userType = payload.UserType || '';
          } catch { /* ignore */ }
        }

        if (token) {
          // Store user session in localStorage
          localStorage.setItem('su_register_token', token);
          localStorage.setItem(
            'su_user',
            JSON.stringify({
              id: userId,
              type: userType,
              name: `${rd?.FirstName || ''} ${rd?.LastName || ''}`.trim(),
              email: rd?.Email || rd?.EmailAddress || data.email,
            })
          );

          toast.success('Welcome back!');

          // Route based on user type
          if (userType === 'ProfessionalUser') {
            router.push('/dashboard');
          } else {
            // IndividualUser or CompanyUser → web app feed
            router.push('/home');
          }
          return;
        }
      }

      // 2) If user API fails, try admin login (.NET panel)
      const adminSuccess = await adminLogin(data.email, data.password);
      if (adminSuccess) {
        toast.success('Welcome back, Admin!');
        router.push('/dashboard');
        return;
      }

      // Both failed
      toast.error('Invalid credentials. Please try again.');
    } catch {
      toast.error('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 lg:space-y-6">
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <Input
            type="text"
            label="User or Email"
            placeholder="Enter your user or email"
            className="[&>label>span]:font-medium"
            inputClassName="text-sm"
            size="lg"
            {...field}
            error={errors.email?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <Password
            label="Password"
            placeholder="Enter your password"
            className="[&>label>span]:font-medium"
            inputClassName="text-sm"
            size="lg"
            {...field}
            error={errors.password?.message}
          />
        )}
      />
      <div className="flex items-center justify-between">
        <Controller
          control={control}
          name="rememberMe"
          render={({ field: { value, onChange } }) => (
            <Checkbox
              label="Remember me"
              checked={value}
              onChange={onChange}
              className="[&>label>span]:font-medium"
            />
          )}
        />
        <Text
          as="span"
          className="text-primary cursor-pointer text-sm font-semibold hover:underline"
        >
          Forgot Password?
        </Text>
      </div>
      <Button
        className="w-full"
        type="submit"
        size="lg"
        isLoading={loading}
      >
        Sign In
      </Button>
    </form>
  );
}

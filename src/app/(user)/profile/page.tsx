'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('su_register_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.IndividualUserId || payload.CompanyUserId;
        if (userId) {
          router.replace(`/profile/${userId}`);
          return;
        }
      } catch { /* */ }
    }
    router.replace('/signin');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
    </div>
  );
}

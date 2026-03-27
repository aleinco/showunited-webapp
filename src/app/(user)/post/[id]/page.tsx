'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import {
  PiCaretLeftBold,
  PiFlagLight,
  PiCaretLeftLight,
  PiCaretRightLight,
} from 'react-icons/pi';

/* ── Types ── */
interface UserImage {
  IndividualUserImageId?: number;
  IndividualUserImage?: string;
  CompanyUserImage?: string;
}

interface UserDetail {
  IndividualUserId?: number;
  CompanyUserId?: number;
  FirstName?: string;
  LastName?: string;
  CompanyName?: string;
  CategoryId?: number;
  CategoryName?: string;
  SubCategoryName?: string;
  BithDate?: string;
  IndividualUserImageList?: UserImage[];
  CompanyUserImageList?: UserImage[];
}

/* ── Helpers ── */
function calculateAge(birthDate: string | undefined): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birth.getDate())
  ) {
    age--;
  }
  return age;
}

/* ── Page ── */
export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = Number(params.id);

  // Category info passed from feed via query params
  const qsCat = searchParams.get('cat') || '';
  const qsSub = searchParams.get('sub') || '';
  const qsTitle = searchParams.get('title') || '';

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('su_register_token') || ''
      : '';

  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      try {
        const res = await axios.post('/api/user', {
          endpoint: 'GetUserDetailById',
          token,
          data: { IndividualUserId: userId },
        });
        const data = res.data?.responseData;
        if (data) {
          setUser(data);
        }
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    }
    if (userId) loadUser();
  }, [userId, token]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white">
        <p className="text-lg">User not found</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-[#F26B50] hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const images = user.IndividualUserImageList || user.CompanyUserImageList || [];
  const currentImage =
    images[currentImageIndex]?.IndividualUserImage ||
    images[currentImageIndex]?.CompanyUserImage ||
    '';

  const name =
    qsTitle ||
    user.CompanyName ||
    `${user.FirstName || ''} ${user.LastName || ''}`.trim() ||
    'Unknown';
  const age = calculateAge(user.BithDate);
  const category = (qsCat || qsSub)
    ? [qsCat, qsSub].filter(Boolean).join(' \u2022 ')
    : '';

  function prevImage() {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }

  function nextImage() {
    setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm font-medium text-[#F26B50]"
        >
          <PiCaretLeftBold className="h-5 w-5" />
          Back
        </button>
        <img
          src="/logo-showunited.png"
          alt="Show United"
          className="h-7 brightness-0 invert"
        />
        <div className="w-16" /> {/* spacer */}
      </div>

      {/* Image dots indicator */}
      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 pb-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentImageIndex(i)}
              className={`h-[3px] rounded-full transition-all ${
                i === currentImageIndex
                  ? 'w-6 bg-white'
                  : 'w-3 bg-white/40'
              }`}
            />
          ))}
        </div>
      )}

      {/* Main image */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {currentImage ? (
          <img
            src={currentImage}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-900 text-gray-600">
            No image
          </div>
        )}

        {/* Prev/Next arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition hover:bg-black/60"
            >
              <PiCaretLeftLight className="h-5 w-5" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition hover:bg-black/60"
            >
              <PiCaretRightLight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Bottom gradient overlay */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/80 to-transparent" />

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-5 pb-5">
          {/* Name + Category */}
          <Link
            href={`/profile/${userId}`}
            className="pointer-events-auto"
          >
            <h2 className="text-xl font-bold text-white">
              {name.toUpperCase()}
              {age !== null && (
                <span className="ml-2 text-lg font-normal opacity-80">
                  {age}
                </span>
              )}
            </h2>
            {category && (
              <p className="mt-0.5 text-sm text-white/70">{category}</p>
            )}
          </Link>

          {/* Flag / report */}
          <button className="pointer-events-auto rounded-lg p-2 text-white/60 transition hover:text-white">
            <PiFlagLight className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

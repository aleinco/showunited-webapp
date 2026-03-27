'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Avatar, Button, Text, Badge, Tab } from 'rizzui';
import {
  PiMapPinLight,
  PiShareNetworkLight,
  PiChatCircleLight,
  PiHeartLight,
  PiImagesLight,
  PiFileTextLight,
  PiRulerLight,
  PiUserPlusLight,
  PiUserCheckFill,
  PiDotsThreeOutlineLight,
  PiStarLight,
  PiCalendarBlankLight,
  PiEnvelopeLight,
  PiGenderIntersexLight,
  PiGlobeLight,
  PiFlagLight,
} from 'react-icons/pi';

/* ── Types ── */
interface UserProfile {
  IndividualUserId?: number;
  CompanyUserId?: number;
  FirstName?: string;
  LastName?: string;
  CompanyName?: string;
  Email?: string;
  EmailAddress?: string;
  PhoneNumber?: string;
  CountryCallingCode?: string;
  Gender?: string;
  CountryId?: string;
  CityId?: string;
  BithDate?: string;
  CategoryId?: number;
  CategoryName?: string;
  SubCategoryId?: number;
  SubCategoryName?: string;
  ProfileImage?: string;
  CoverImage?: string;
  AboutUs?: string;
  Website?: string;
  IsInterestedInInternationalTouring?: boolean;
  SubscriptionPlanId?: number;
  Height?: string;
  Weight?: string;
  HairColorId?: number;
  HighBust?: string;
  FullBust?: string;
  Waist?: string;
  HighHip?: string;
  FullHip?: string;
  ShowSize?: string;
  IndividualUserImageList?: UserImage[];
  CompanyUserImageList?: UserImage[];
}

interface UserImage {
  IndividualUserImageId?: number;
  IndividualUserImage?: string;
  IndividualUserImageThumbnails?: string;
  CompanyUserImage?: string;
}

interface FollowData {
  totalRecords: number;
}

/* ── Helpers ── */
function calculateAge(birthDate: string | undefined): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/* ── Tab keys ── */
type TabKey = 'media' | 'cv' | 'body';

/* ── Main Component ── */
export default function ProfilePage() {
  const params = useParams();
  const userId = Number(params.userId);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('media');

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('su_register_token') || ''
      : '';

  // Determine if viewing own profile
  const [ownUserId, setOwnUserId] = useState<number>(0);
  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setOwnUserId(Number(payload.IndividualUserId || 0));
      } catch { /* */ }
    }
  }, [token]);

  const isOwnProfile = ownUserId > 0 && ownUserId === userId;

  /* ── Fetch profile ── */
  useEffect(() => {
    if (!userId || !token) return;

    async function load() {
      setLoading(true);
      try {
        const [profileRes, followersRes, followingRes] = await Promise.all([
          axios.post('/api/user', {
            endpoint: 'GetUserDetailById',
            token,
            data: { IndividualUserId: userId },
          }),
          axios.post('/api/user', {
            endpoint: 'GetUserFollowerList',
            token,
            data: { individualUserId: userId, page: 1 },
          }),
          axios.post('/api/user', {
            endpoint: 'GetUserFollowingList',
            token,
            data: { individualUserId: userId, page: 1 },
          }),
        ]);

        if (profileRes.data?.responseData) {
          setProfile(profileRes.data.responseData);
        }

        const fPaging = followersRes.data?.responsePagingData;
        setFollowers(fPaging?.totalRecords || 0);

        const gPaging = followingRes.data?.responsePagingData;
        setFollowing(gPaging?.totalRecords || 0);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId, token]);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex gap-8">
          <div className="h-36 w-36 animate-pulse rounded-full bg-gray-200" />
          <div className="flex-1 space-y-3 pt-4">
            <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-64 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Text className="text-lg text-gray-400">User not found</Text>
      </div>
    );
  }

  /* ── Derived data ── */
  const name =
    profile.CompanyName ||
    `${profile.FirstName || ''} ${profile.LastName || ''}`.trim() ||
    'Unknown';
  const age = calculateAge(profile.BithDate);
  const location = [profile.CityId, profile.CountryId].filter(Boolean).join(', ');
  const category = profile.CategoryName || profile.SubCategoryName || '';
  const images = profile.IndividualUserImageList || profile.CompanyUserImageList || [];
  const profileImage =
    images[0]?.IndividualUserImage ||
    images[0]?.CompanyUserImage ||
    profile.ProfileImage ||
    '';

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:py-10">
      {/* ── Header section (Instagram desktop style) ── */}
      <div className="flex flex-col gap-6 md:flex-row md:gap-12">
        {/* Avatar */}
        <div className="flex justify-center md:justify-start">
          <div className="relative">
            {profileImage ? (
              <img
                src={profileImage}
                alt={name}
                className="h-32 w-32 rounded-full border-2 border-gray-200 object-cover md:h-40 md:w-40"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-orange-50 text-4xl font-bold text-[#F26B50] md:h-40 md:w-40">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col items-center md:items-start">
          {/* Name row */}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
              {name}
            </h1>
            {age !== null && (
              <span className="text-lg text-gray-400">{age}</span>
            )}
            {!isOwnProfile && (
              <button className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
                <PiDotsThreeOutlineLight className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Category + Location */}
          {(category || location) && (
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              {category && (
                <span className="font-medium text-[#F26B50]">{category}</span>
              )}
              {location && (
                <span className="flex items-center gap-1">
                  <PiMapPinLight className="h-4 w-4" />
                  {location}
                </span>
              )}
            </div>
          )}

          {/* Stats row */}
          <div className="mt-4 flex items-center gap-8">
            <div className="text-center md:text-left">
              <span className="text-lg font-bold text-gray-900">
                {images.length}
              </span>
              <span className="ml-1.5 text-sm text-gray-500">posts</span>
            </div>
            <Link
              href={`/followers/${userId}?tab=followers`}
              className="text-center md:text-left"
            >
              <span className="text-lg font-bold text-gray-900">
                {formatCount(followers)}
              </span>
              <span className="ml-1.5 text-sm text-gray-500">followers</span>
            </Link>
            <Link
              href={`/followers/${userId}?tab=following`}
              className="text-center md:text-left"
            >
              <span className="text-lg font-bold text-gray-900">
                {formatCount(following)}
              </span>
              <span className="ml-1.5 text-sm text-gray-500">following</span>
            </Link>
          </div>

          {/* Bio / About */}
          {profile.AboutUs && (
            <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-700">
              {profile.AboutUs}
            </p>
          )}

          {profile.Website && (
            <a
              href={profile.Website.startsWith('http') ? profile.Website : `https://${profile.Website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
            >
              <PiGlobeLight className="h-4 w-4" />
              {profile.Website}
            </a>
          )}

          {/* Action buttons */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {isOwnProfile ? (
              <>
                <Button
                  variant="outline"
                  className="rounded-lg px-6 text-sm font-semibold"
                  size="sm"
                  onClick={() => window.location.href = '/settings/profile'}
                >
                  Edit Profile
                </Button>
                <Button
                  variant="outline"
                  className="rounded-lg px-6 text-sm font-semibold"
                  size="sm"
                >
                  <PiShareNetworkLight className="mr-1.5 h-4 w-4" />
                  Share
                </Button>
              </>
            ) : (
              <>
                <Button
                  className="rounded-lg px-8 text-sm font-semibold"
                  size="sm"
                  style={{
                    backgroundColor: isFollowing ? '#f3f4f6' : '#F26B50',
                    color: isFollowing ? '#374151' : 'white',
                  }}
                  onClick={() => setIsFollowing(!isFollowing)}
                >
                  {isFollowing ? (
                    <>
                      <PiUserCheckFill className="mr-1.5 h-4 w-4" />
                      Following
                    </>
                  ) : (
                    <>
                      <PiUserPlusLight className="mr-1.5 h-4 w-4" />
                      Follow
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="rounded-lg px-6 text-sm font-semibold"
                  size="sm"
                >
                  <PiChatCircleLight className="mr-1.5 h-4 w-4" />
                  Message
                </Button>
                <Button
                  variant="outline"
                  className="rounded-lg p-2"
                  size="sm"
                >
                  <PiShareNetworkLight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="mt-8 border-t border-gray-200">
        <div className="flex items-center justify-center gap-12">
          {([
            { key: 'media' as TabKey, icon: PiImagesLight, label: 'POSTS' },
            { key: 'cv' as TabKey, icon: PiFileTextLight, label: 'CV' },
            { key: 'body' as TabKey, icon: PiRulerLight, label: 'BODY' },
          ]).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 border-t-2 px-1 py-3 text-xs font-semibold uppercase tracking-wider transition ${
                activeTab === key
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="mt-1">
        {activeTab === 'media' && (
          <MediaTab images={images} name={name} />
        )}
        {activeTab === 'cv' && (
          <CvTab profile={profile} />
        )}
        {activeTab === 'body' && (
          <BodyTab profile={profile} />
        )}
      </div>
    </div>
  );
}

/* ── Media Tab ── */
function MediaTab({ images, name }: { images: UserImage[]; name: string }) {
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <PiImagesLight className="mb-3 h-16 w-16 text-gray-300" />
        <Text className="text-sm text-gray-400">No media available</Text>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1">
      {images.map((img, i) => {
        const src =
          img.IndividualUserImageThumbnails ||
          img.IndividualUserImage ||
          img.CompanyUserImage ||
          '';
        return (
          <div
            key={img.IndividualUserImageId || i}
            className="group relative aspect-square cursor-pointer overflow-hidden bg-gray-100"
          >
            <img
              src={src}
              alt={`${name} photo ${i + 1}`}
              className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
              <PiHeartLight className="h-6 w-6 text-white" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── CV Tab ── */
function CvTab({ profile }: { profile: UserProfile }) {
  const details = [
    { icon: PiGenderIntersexLight, label: 'Gender', value: profile.Gender },
    { icon: PiCalendarBlankLight, label: 'Birth Date', value: profile.BithDate?.split('T')[0] },
    { icon: PiMapPinLight, label: 'Location', value: [profile.CityId, profile.CountryId].filter(Boolean).join(', ') },
    { icon: PiEnvelopeLight, label: 'Email', value: profile.Email || profile.EmailAddress },
    { icon: PiGlobeLight, label: 'Touring', value: profile.IsInterestedInInternationalTouring ? 'Available for international touring' : undefined },
    { icon: PiStarLight, label: 'Subscription', value: profile.SubscriptionPlanId ? `Plan ${profile.SubscriptionPlanId}` : undefined },
  ].filter((d) => d.value);

  if (details.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <PiFileTextLight className="mb-3 h-16 w-16 text-gray-300" />
        <Text className="text-sm text-gray-400">No CV data available</Text>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg py-6">
      <div className="space-y-4">
        {details.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
            <Icon className="h-5 w-5 flex-shrink-0 text-gray-400" />
            <div>
              <Text className="text-xs font-medium uppercase tracking-wide text-gray-400">
                {label}
              </Text>
              <Text className="text-sm font-medium text-gray-800">
                {value}
              </Text>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Body Tab ── */
function BodyTab({ profile }: { profile: UserProfile }) {
  const measurements = [
    { label: 'Height', value: profile.Height },
    { label: 'Weight', value: profile.Weight },
    { label: 'High Bust', value: profile.HighBust },
    { label: 'Full Bust', value: profile.FullBust },
    { label: 'Waist', value: profile.Waist },
    { label: 'High Hip', value: profile.HighHip },
    { label: 'Full Hip', value: profile.FullHip },
    { label: 'Shoe Size', value: profile.ShowSize },
  ].filter((m) => m.value);

  if (measurements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <PiRulerLight className="mb-3 h-16 w-16 text-gray-300" />
        <Text className="text-sm text-gray-400">No measurements available</Text>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg py-6">
      <div className="grid grid-cols-2 gap-3">
        {measurements.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-center"
          >
            <Text className="text-xs font-medium uppercase tracking-wide text-gray-400">
              {label}
            </Text>
            <Text className="mt-1 text-lg font-bold text-gray-900">
              {value}
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
}

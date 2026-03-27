'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUserDetail } from '@/api/hooks/use-admin';
import { Title, Text, Badge, Avatar, Button } from 'rizzui';
import { PiArrowLeftBold, PiEnvelopeSimple, PiPhone, PiMapPin, PiCalendarBlank } from 'react-icons/pi';
import cn from '@/utils/class-names';
import OverviewTab from './tabs/overview-tab';
import PersonalInfoTab from './tabs/personal-info-tab';
import ProfessionalTab from './tabs/professional-tab';
import MeasurementsTab from './tabs/measurements-tab';
import GalleryTab from './tabs/gallery-tab';
import SubscriptionTab from './tabs/subscription-tab';
import AccountTab from './tabs/account-tab';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'personal', label: 'Personal Info' },
  { key: 'professional', label: 'Professional' },
  { key: 'measurements', label: 'Measurements' },
  { key: 'gallery', label: 'Gallery' },
  { key: 'subscription', label: 'Subscription' },
  { key: 'account', label: 'Account' },
];

export default function UserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const { data: user, isLoading, isError } = useUserDetail(id as string);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 rounded-full bg-gray-200" />
            <div className="space-y-3">
              <div className="h-6 w-48 rounded bg-gray-200" />
              <div className="h-4 w-32 rounded bg-gray-200" />
            </div>
          </div>
          <div className="h-12 w-full rounded bg-gray-200" />
          <div className="h-64 w-full rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Text className="text-lg text-gray-500">User not found</Text>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const fullName = `${user.FirstName || ''} ${user.LastName || ''}`.trim() || 'Unknown';
  const firstImage = user.IndividualUserImageList?.[0]?.IndividualUserImage || '';
  const isActive = user.StatusId === 1;

  return (
    <div className="@container">
      <div className="p-4 md:p-6">
        {/* Back button */}
        <Button
          variant="text"
          className="mb-4 gap-1.5 px-0 text-gray-500 hover:text-gray-900"
          onClick={() => router.push('/users/individual')}
        >
          <PiArrowLeftBold className="h-4 w-4" />
          Back to Users
        </Button>

        {/* Profile Header */}
        <div className="mb-6 rounded-lg border border-muted bg-white p-6">
          <div className="flex flex-col gap-6 @xl:flex-row @xl:items-center">
            <Avatar
              name={fullName}
              src={firstImage}
              size="xl"
              className="!h-[160px] !w-[160px] shrink-0 rounded-full"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Title as="h3" className="text-xl font-bold">
                  {fullName}
                </Title>
                <Badge
                  variant="flat"
                  color={isActive ? 'success' : 'danger'}
                  className="font-medium"
                >
                  {isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                {user.Email && (
                  <span className="flex items-center gap-1.5">
                    <PiEnvelopeSimple className="h-4 w-4" />
                    {user.Email}
                  </span>
                )}
                {user.PhoneNumber && (
                  <span className="flex items-center gap-1.5">
                    <PiPhone className="h-4 w-4" />
                    {user.CountryCallingCode || ''} {user.PhoneNumber}
                  </span>
                )}
                {user.CityId && (
                  <span className="flex items-center gap-1.5">
                    <PiMapPin className="h-4 w-4" />
                    {user.CityId}, {user.CountryId}
                  </span>
                )}
                {user.DTStamp && (
                  <span className="flex items-center gap-1.5">
                    <PiCalendarBlank className="h-4 w-4" />
                    Joined {new Date(user.DTStamp).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="sticky top-0 z-20 -mx-4 border-b border-muted bg-white px-4 font-medium text-gray-500 md:-mx-6 md:px-6">
          <div className="flex h-[52px] items-start overflow-x-auto">
            <div className="-mb-7 flex w-full gap-3 overflow-x-auto scroll-smooth pb-7 md:gap-5 lg:gap-8">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'group relative cursor-pointer whitespace-nowrap py-2.5 font-medium text-gray-500 before:absolute before:bottom-0 before:left-0 before:z-[1] before:h-0.5 before:bg-gray-1000 before:transition-all hover:text-gray-900',
                    activeTab === tab.key
                      ? 'text-gray-900 before:visible before:w-full before:opacity-100'
                      : 'before:invisible before:w-0 before:opacity-0'
                  )}
                >
                  <Text
                    as="span"
                    className="inline-flex rounded-md px-2.5 py-1.5 transition-all duration-200 group-hover:bg-gray-100/70"
                  >
                    {tab.label}
                  </Text>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="pt-6">
          {activeTab === 'overview' && <OverviewTab user={user} />}
          {activeTab === 'personal' && <PersonalInfoTab user={user} />}
          {activeTab === 'professional' && <ProfessionalTab user={user} />}
          {activeTab === 'measurements' && <MeasurementsTab user={user} />}
          {activeTab === 'gallery' && <GalleryTab user={user} />}
          {activeTab === 'subscription' && <SubscriptionTab user={user} />}
          {activeTab === 'account' && <AccountTab user={user} />}
        </div>
      </div>
    </div>
  );
}

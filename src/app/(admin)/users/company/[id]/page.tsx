'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Title, Text, Badge, Avatar, Button, Input } from 'rizzui';
import { PiArrowLeftBold, PiEnvelopeSimple, PiPhone, PiMapPin, PiCalendarBlank, PiGlobeSimple } from 'react-icons/pi';
import cn from '@/utils/class-names';
import HorizontalFormBlockWrapper from '@/app/shared/account-settings/horiozontal-block';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'details', label: 'Company Details' },
  { key: 'subscription', label: 'Subscription' },
  { key: 'account', label: 'Account' },
];

export default function CompanyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['company-detail', id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/user-detail?id=${id}&type=company`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="flex items-center gap-6">
            <div className="h-[160px] w-[160px] rounded-full bg-gray-200" />
            <div className="space-y-3"><div className="h-6 w-48 rounded bg-gray-200" /><div className="h-4 w-32 rounded bg-gray-200" /></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Text className="text-lg text-gray-500">Company not found</Text>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const name = user.Name || 'Unknown';
  const isActive = user.StatusId === 1;

  return (
    <div className="@container">
      <div className="p-4 md:p-6">
        <Button variant="text" className="mb-4 gap-1.5 px-0 text-gray-500 hover:text-gray-900" onClick={() => router.push('/users/company')}>
          <PiArrowLeftBold className="h-4 w-4" /> Back to Companies
        </Button>

        {/* Header */}
        <div className="mb-6 rounded-lg border border-muted bg-white p-6">
          <div className="flex flex-col gap-6 @xl:flex-row @xl:items-center">
            <Avatar name={name} src={user.CompanyLogoPath || ''} size="xl" className="!h-[160px] !w-[160px] shrink-0 rounded-full" />
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Title as="h3" className="text-xl font-bold">{name}</Title>
                <Badge variant="flat" color={isActive ? 'success' : 'danger'}>{isActive ? 'Active' : 'Inactive'}</Badge>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                {user.CompanyEmail && <span className="flex items-center gap-1.5"><PiEnvelopeSimple className="h-4 w-4" />{user.CompanyEmail}</span>}
                {user.ContactNumber && <span className="flex items-center gap-1.5"><PiPhone className="h-4 w-4" />{user.CountryCallingCode || ''} {user.ContactNumber}</span>}
                {user.City && <span className="flex items-center gap-1.5"><PiMapPin className="h-4 w-4" />{user.City}, {user.Country}</span>}
                {user.Website && <span className="flex items-center gap-1.5"><PiGlobeSimple className="h-4 w-4" />{user.Website}</span>}
                {user.DTStamp && <span className="flex items-center gap-1.5"><PiCalendarBlank className="h-4 w-4" />Joined {new Date(user.DTStamp).toLocaleDateString()}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="sticky top-0 z-20 -mx-4 border-b border-muted bg-white px-4 font-medium text-gray-500 md:-mx-6 md:px-6">
          <div className="flex h-[52px] items-start overflow-x-auto">
            <div className="-mb-7 flex w-full gap-3 overflow-x-auto scroll-smooth pb-7 md:gap-5 lg:gap-8">
              {TABS.map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'group relative cursor-pointer whitespace-nowrap py-2.5 font-medium text-gray-500 before:absolute before:bottom-0 before:left-0 before:z-[1] before:h-0.5 before:bg-gray-1000 before:transition-all hover:text-gray-900',
                    activeTab === tab.key ? 'text-gray-900 before:visible before:w-full before:opacity-100' : 'before:invisible before:w-0 before:opacity-0'
                  )}>
                  <Text as="span" className="inline-flex rounded-md px-2.5 py-1.5 transition-all duration-200 group-hover:bg-gray-100/70">{tab.label}</Text>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="pt-6">
          {activeTab === 'overview' && <CompanyOverview user={user} />}
          {activeTab === 'details' && <CompanyDetails user={user} />}
          {activeTab === 'subscription' && <CompanySubscription user={user} />}
          {activeTab === 'account' && <CompanyAccount user={user} />}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-muted bg-white p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <div>
        <Text className="text-xs font-medium uppercase tracking-wider text-gray-400">{label}</Text>
        <Text className="mt-0.5 text-sm font-medium text-gray-900">{value || '---'}</Text>
      </div>
    </div>
  );
}

function CompanyOverview({ user }: { user: any }) {
  return (
    <div className="@container space-y-6">
      <div><Title as="h5" className="mb-1 text-base font-semibold">Quick Overview</Title></div>
      <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2 @3xl:grid-cols-3">
        <InfoCard icon={<PiMapPin className="h-5 w-5" />} label="Company Name" value={user.Name} />
        <InfoCard icon={<PiEnvelopeSimple className="h-5 w-5" />} label="Email" value={user.CompanyEmail || user.Email} />
        <InfoCard icon={<PiPhone className="h-5 w-5" />} label="Phone" value={user.ContactNumber ? `${user.CountryCallingCode || ''} ${user.ContactNumber}` : ''} />
        <InfoCard icon={<PiMapPin className="h-5 w-5" />} label="Location" value={[user.City, user.State, user.Country].filter(Boolean).join(', ')} />
        <InfoCard icon={<PiGlobeSimple className="h-5 w-5" />} label="Website" value={user.Website} />
        <InfoCard icon={<PiCalendarBlank className="h-5 w-5" />} label="Member Since" value={user.DTStamp ? new Date(user.DTStamp).toLocaleDateString() : ''} />
      </div>
      {user.CompanyLogoPath && (
        <div>
          <Title as="h6" className="mb-3 text-sm font-semibold">Company Logo</Title>
          <img src={user.CompanyLogoPath} alt="Logo" className="h-32 w-32 rounded-lg object-cover" />
        </div>
      )}
    </div>
  );
}

function CompanyDetails({ user }: { user: any }) {
  return (
    <div className="@container">
      <HorizontalFormBlockWrapper title="Company Info" description="Name, website and contact.">
        <Input label="Company Name" value={user.Name || ''} readOnly className="bg-gray-50/50" />
        <Input label="Website" value={user.Website || ''} readOnly className="bg-gray-50/50" />
      </HorizontalFormBlockWrapper>
      <HorizontalFormBlockWrapper title="Contact" description="Email and phone.">
        <Input label="Email" value={user.CompanyEmail || user.Email || ''} readOnly className="bg-gray-50/50" />
        <Input label="Phone" value={`${user.CountryCallingCode || ''} ${user.ContactNumber || ''}`.trim()} readOnly className="bg-gray-50/50" />
      </HorizontalFormBlockWrapper>
      <HorizontalFormBlockWrapper title="Address" description="Company location.">
        <Input label="Address" value={user.Address1 || ''} readOnly className="bg-gray-50/50" />
        <Input label="City" value={user.City || ''} readOnly className="bg-gray-50/50" />
        <Input label="State" value={user.State || ''} readOnly className="bg-gray-50/50" />
        <Input label="Country" value={user.Country || ''} readOnly className="bg-gray-50/50" />
        <Input label="Zipcode" value={user.Zipcode || ''} readOnly className="bg-gray-50/50" />
      </HorizontalFormBlockWrapper>
      <HorizontalFormBlockWrapper title="Classification" description="Industry and category." className="border-b-0">
        <Input label="Category ID" value={String(user.CategoryId || '---')} readOnly className="bg-gray-50/50" />
        <Input label="Sub Category ID" value={String(user.SubCategoryId || '---')} readOnly className="bg-gray-50/50" />
        <Input label="Industry Type ID" value={String(user.IndustryTypeId || '---')} readOnly className="bg-gray-50/50" />
        <Input label="Industry SubType ID" value={String(user.IndustrySubTypeId || '---')} readOnly className="bg-gray-50/50" />
      </HorizontalFormBlockWrapper>
    </div>
  );
}

function CompanySubscription({ user }: { user: any }) {
  const isExpired = user.SubscriptionExpiryDate ? new Date(user.SubscriptionExpiryDate) < new Date() : false;
  return (
    <div className="@container">
      <HorizontalFormBlockWrapper title="Current Plan" description="Active subscription.">
        <Input label="Plan ID" value={String(user.SubscriptionPlanId || '---')} readOnly className="bg-gray-50/50" />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Status</label>
          <Badge variant="flat" color={isExpired ? 'danger' : 'success'}>{isExpired ? 'Expired' : 'Active'}</Badge>
        </div>
      </HorizontalFormBlockWrapper>
      <HorizontalFormBlockWrapper title="Dates" description="Start and expiry." className="border-b-0">
        <Input label="Start" value={user.SubscriptionPlanDate ? new Date(user.SubscriptionPlanDate).toLocaleDateString() : '---'} readOnly className="bg-gray-50/50" />
        <Input label="Expiry" value={user.SubscriptionExpiryDate ? new Date(user.SubscriptionExpiryDate).toLocaleDateString() : '---'} readOnly className="bg-gray-50/50" />
      </HorizontalFormBlockWrapper>
    </div>
  );
}

function CompanyAccount({ user }: { user: any }) {
  return (
    <div className="@container">
      <HorizontalFormBlockWrapper title="Account Status" description="Current state.">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Status</label>
          <Badge variant="flat" color={user.StatusId === 1 ? 'success' : 'danger'}>{user.StatusId === 1 ? 'Active' : 'Inactive'}</Badge>
        </div>
        <Input label="Register Step" value={String(user.RegisterStep || '---')} readOnly className="bg-gray-50/50" />
      </HorizontalFormBlockWrapper>
      <HorizontalFormBlockWrapper title="Device" description="Last known device.">
        <Input label="Device Type" value={user.DeviceType || '---'} readOnly className="bg-gray-50/50" />
        <Input label="Account Type" value={user.Type || 'Normal'} readOnly className="bg-gray-50/50" />
      </HorizontalFormBlockWrapper>
      <HorizontalFormBlockWrapper title="Audit" description="Timestamps." className="border-b-0">
        <Input label="Created" value={user.DTStamp ? new Date(user.DTStamp).toLocaleString() : '---'} readOnly className="bg-gray-50/50" />
        <Input label="Updated" value={user.UpdatedDTStamp ? new Date(user.UpdatedDTStamp).toLocaleString() : '---'} readOnly className="bg-gray-50/50" />
      </HorizontalFormBlockWrapper>
    </div>
  );
}

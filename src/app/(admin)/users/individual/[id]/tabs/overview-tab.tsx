'use client';

import { Title, Text, Badge } from 'rizzui';
import {
  PiUserDuotone,
  PiEnvelopeDuotone,
  PiPhoneDuotone,
  PiMapPinDuotone,
  PiCalendarDuotone,
  PiGenderIntersexDuotone,
  PiTagDuotone,
  PiCreditCardDuotone,
  PiClockDuotone,
  PiGlobeDuotone,
} from 'react-icons/pi';

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-muted bg-white p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <Text className="text-xs font-medium uppercase tracking-wider text-gray-400">{label}</Text>
        <Text className="mt-0.5 text-sm font-medium text-gray-900">{value || '---'}</Text>
      </div>
    </div>
  );
}

export default function OverviewTab({ user }: { user: any }) {
  const isActive = user.StatusId === 1;

  return (
    <div className="@container space-y-6">
      <div>
        <Title as="h5" className="mb-1 text-base font-semibold">Quick Overview</Title>
        <Text className="text-sm text-gray-500">Key information about this user</Text>
      </div>

      <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2 @3xl:grid-cols-3">
        <InfoCard
          icon={<PiUserDuotone className="h-5 w-5" />}
          label="Full Name"
          value={`${user.FirstName || ''} ${user.LastName || ''}`.trim()}
        />
        <InfoCard
          icon={<PiEnvelopeDuotone className="h-5 w-5" />}
          label="Email"
          value={user.Email}
        />
        <InfoCard
          icon={<PiPhoneDuotone className="h-5 w-5" />}
          label="Phone"
          value={user.PhoneNumber ? `${user.CountryCallingCode || ''} ${user.PhoneNumber}` : ''}
        />
        <InfoCard
          icon={<PiMapPinDuotone className="h-5 w-5" />}
          label="Location"
          value={[user.CityId, user.CountryId].filter(Boolean).join(', ')}
        />
        <InfoCard
          icon={<PiGenderIntersexDuotone className="h-5 w-5" />}
          label="Gender"
          value={user.Gender}
        />
        <InfoCard
          icon={<PiCalendarDuotone className="h-5 w-5" />}
          label="Birth Date"
          value={user.BithDate ? new Date(user.BithDate).toLocaleDateString() : ''}
        />
        <InfoCard
          icon={<PiTagDuotone className="h-5 w-5" />}
          label="Category"
          value={[user.category || user.CategoryId, user.subCategory || user.SubCategoryId].filter(Boolean).join(' / ') || '---'}
        />
        <InfoCard
          icon={<PiCreditCardDuotone className="h-5 w-5" />}
          label="Subscription Plan"
          value={user.subscriptionPlanName || (user.SubscriptionPlanId ? `Plan #${user.SubscriptionPlanId}` : '---')}
        />
        <InfoCard
          icon={<PiClockDuotone className="h-5 w-5" />}
          label="Member Since"
          value={user.DTStamp ? new Date(user.DTStamp).toLocaleDateString() : ''}
        />
        <InfoCard
          icon={<PiGlobeDuotone className="h-5 w-5" />}
          label="International Touring"
          value={user.IsInterestedInInternationalTouring ? 'Yes' : 'No'}
        />
      </div>

      {/* Status row */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-muted bg-white p-4">
        <Text className="text-sm font-medium text-gray-500">Status:</Text>
        <Badge variant="flat" color={isActive ? 'success' : 'danger'}>{isActive ? 'Active' : 'Inactive'}</Badge>
        <Text className="text-sm font-medium text-gray-500 ms-4">Profile Complete:</Text>
        <Badge variant="flat" color={user.IsProfileComplete ? 'success' : 'warning'}>{user.IsProfileComplete ? 'Yes' : 'No'}</Badge>
        <Text className="text-sm font-medium text-gray-500 ms-4">Device:</Text>
        <Badge variant="flat" color="info">{user.DeviceType || 'Unknown'}</Badge>
        <Text className="text-sm font-medium text-gray-500 ms-4">Type:</Text>
        <Badge variant="flat" color="secondary">{user.Type || 'Normal'}</Badge>
      </div>

      {/* Images preview */}
      {user.IndividualUserImageList?.length > 0 && (
        <div>
          <Title as="h6" className="mb-3 text-sm font-semibold">Photos ({user.IndividualUserImageList.length})</Title>
          <div className="flex gap-3 overflow-x-auto">
            {user.IndividualUserImageList.map((img: any) => (
              <img
                key={img.IndividualUserImageId}
                src={img.IndividualUserImage}
                alt="User photo"
                className="h-24 w-24 shrink-0 rounded-lg object-cover"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

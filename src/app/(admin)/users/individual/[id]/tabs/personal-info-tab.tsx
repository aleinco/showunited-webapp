'use client';

import { Input } from 'rizzui';
import HorizontalFormBlockWrapper from '@/app/shared/account-settings/horiozontal-block';

export default function PersonalInfoTab({ user }: { user: any }) {
  return (
    <div className="@container">
      <HorizontalFormBlockWrapper
        title="Name"
        description="User's full name and identity."
      >
        <Input label="First Name" value={user.FirstName || ''} readOnly className="bg-gray-50/50" />
        <Input label="Last Name" value={user.LastName || ''} readOnly className="bg-gray-50/50" />
      </HorizontalFormBlockWrapper>

      <HorizontalFormBlockWrapper
        title="Contact"
        description="Email and phone number."
      >
        <Input label="Email" value={user.Email || ''} readOnly className="bg-gray-50/50" />
        <Input label="Phone" value={`${user.CountryCallingCode || ''} ${user.PhoneNumber || ''}`.trim()} readOnly className="bg-gray-50/50" />
      </HorizontalFormBlockWrapper>

      <HorizontalFormBlockWrapper
        title="Personal Details"
        description="Gender, birth date, and personal info."
      >
        <Input label="Gender" value={user.Gender || ''} readOnly className="bg-gray-50/50" />
        <Input label="Birth Date" value={user.BithDate || ''} readOnly className="bg-gray-50/50" />
      </HorizontalFormBlockWrapper>

      <HorizontalFormBlockWrapper
        title="Location"
        description="Country and city of residence."
      >
        <Input label="Country" value={user.CountryId || ''} readOnly className="bg-gray-50/50" />
        <Input label="City" value={user.CityId || ''} readOnly className="bg-gray-50/50" />
      </HorizontalFormBlockWrapper>

      <HorizontalFormBlockWrapper
        title="Device Info"
        description="Last known device information."
        className="border-b-0"
      >
        <Input label="Device Type" value={user.DeviceType || '---'} readOnly className="bg-gray-50/50" />
        <Input label="Account Type" value={user.Type || 'Normal'} readOnly className="bg-gray-50/50" />
      </HorizontalFormBlockWrapper>
    </div>
  );
}

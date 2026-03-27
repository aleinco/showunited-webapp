'use client';

import { Input, Badge } from 'rizzui';
import HorizontalFormBlockWrapper from '@/app/shared/account-settings/horiozontal-block';

export default function AccountTab({ user }: { user: any }) {
  return (
    <div className="@container">
      <HorizontalFormBlockWrapper
        title="Account Status"
        description="Current account state and restrictions."
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Status</label>
          <Badge variant="flat" color={user.StatusId === 1 ? 'success' : 'danger'} className="font-medium">
            {user.StatusId === 1 ? 'Active' : 'Inactive / Suspended'}
          </Badge>
        </div>
        <Input label="Suspend Reason" value={user.SuspendReason || 'None'} readOnly className="bg-gray-50/50" />
      </HorizontalFormBlockWrapper>

      <HorizontalFormBlockWrapper
        title="Profile Completion"
        description="Registration progress and status."
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Profile Complete</label>
          <Badge variant="flat" color={user.IsProfileComplete ? 'success' : 'warning'} className="font-medium">
            {user.IsProfileComplete ? 'Complete' : 'Incomplete'}
          </Badge>
        </div>
        <Input label="Register Step" value={String(user.RegisterStep || '---')} readOnly className="bg-gray-50/50" />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Registration Complete</label>
          <Badge variant="flat" color={user.IsRegisterProfileComplete ? 'success' : 'warning'} className="font-medium">
            {user.IsRegisterProfileComplete ? 'Yes' : 'No'}
          </Badge>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Notifications Enabled</label>
          <Badge variant="flat" color={user.IsNotification ? 'success' : 'secondary'} className="font-medium">
            {user.IsNotification ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
      </HorizontalFormBlockWrapper>

      <HorizontalFormBlockWrapper
        title="Security"
        description="OTP and account block information."
      >
        <Input label="Last OTP" value={user.LastOTP || '---'} readOnly className="bg-gray-50/50" />
        <Input label="OTP Attempt Count" value={String(user.OTPAttemptCount ?? '---')} readOnly className="bg-gray-50/50" />
        <Input label="Account Block Date" value={user.AccountBlockDate ? new Date(user.AccountBlockDate).toLocaleDateString() : 'Not blocked'} readOnly className="bg-gray-50/50" />
      </HorizontalFormBlockWrapper>

      <HorizontalFormBlockWrapper
        title="Audit Trail"
        description="Creation and update timestamps."
        className="border-b-0"
      >
        <Input label="Created" value={user.DTStamp ? new Date(user.DTStamp).toLocaleString() : '---'} readOnly className="bg-gray-50/50" />
        <Input label="Last Updated" value={user.UpdatedDTStamp ? new Date(user.UpdatedDTStamp).toLocaleString() : '---'} readOnly className="bg-gray-50/50" />
      </HorizontalFormBlockWrapper>
    </div>
  );
}

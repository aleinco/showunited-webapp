'use client';

import { Input, Badge } from 'rizzui';
import HorizontalFormBlockWrapper from '@/app/shared/account-settings/horiozontal-block';

export default function SubscriptionTab({ user }: { user: any }) {
  const hasSubscription = !!user.SubscriptionPlanId;
  const isExpired = user.SubscriptionExpiryDate
    ? new Date(user.SubscriptionExpiryDate) < new Date()
    : false;

  return (
    <div className="@container">
      <HorizontalFormBlockWrapper
        title="Current Plan"
        description="Active subscription details."
      >
        <Input label="Plan ID" value={String(user.SubscriptionPlanId || '---')} readOnly className="bg-gray-50/50" />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Status</label>
          <Badge
            variant="flat"
            color={!hasSubscription ? 'warning' : isExpired ? 'danger' : 'success'}
            className="font-medium"
          >
            {!hasSubscription ? 'No Plan' : isExpired ? 'Expired' : 'Active'}
          </Badge>
        </div>
      </HorizontalFormBlockWrapper>

      <HorizontalFormBlockWrapper
        title="Dates"
        description="Subscription start and end dates."
      >
        <Input
          label="Start Date"
          value={user.SubscriptionPlanDate ? new Date(user.SubscriptionPlanDate).toLocaleDateString() : '---'}
          readOnly
          className="bg-gray-50/50"
        />
        <Input
          label="Expiry Date"
          value={user.SubscriptionExpiryDate ? new Date(user.SubscriptionExpiryDate).toLocaleDateString() : '---'}
          readOnly
          className="bg-gray-50/50"
        />
      </HorizontalFormBlockWrapper>

      <HorizontalFormBlockWrapper
        title="Payment"
        description="Stripe integration details."
        className="border-b-0"
      >
        <Input label="Stripe Customer ID" value={user.StripeCustomerId || '---'} readOnly className="bg-gray-50/50" />
        <Input label="Stripe Subscription ID" value={user.StripeSubscriptionId || '---'} readOnly className="bg-gray-50/50" />
      </HorizontalFormBlockWrapper>
    </div>
  );
}

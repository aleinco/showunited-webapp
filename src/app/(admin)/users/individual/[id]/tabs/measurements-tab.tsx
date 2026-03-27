'use client';

import { Input, Text } from 'rizzui';
import HorizontalFormBlockWrapper from '@/app/shared/account-settings/horiozontal-block';

export default function MeasurementsTab({ user }: { user: any }) {
  const unit = user.UserMeasuredUnit || 'cm';

  if (!user.IsBodyMeasurementRequired && !user.Height) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Text className="text-gray-400">No body measurements available for this user.</Text>
      </div>
    );
  }

  return (
    <div className="@container">
      <HorizontalFormBlockWrapper
        title="Basic Measurements"
        description={`Height, weight, and size. Unit: ${unit}`}
      >
        <Input label="Height" value={user.Height || '---'} readOnly className="bg-gray-50/50" />
        <Input label="Weight" value={user.Weight || '---'} readOnly className="bg-gray-50/50" />
      </HorizontalFormBlockWrapper>

      <HorizontalFormBlockWrapper
        title="Upper Body"
        description="Bust and waist measurements."
      >
        <Input label="High Bust" value={user.HighBust || '---'} readOnly className="bg-gray-50/50" />
        <Input label="Full Bust" value={user.FullBust || '---'} readOnly className="bg-gray-50/50" />
        <Input label="Waist" value={user.Waist || '---'} readOnly className="bg-gray-50/50" />
      </HorizontalFormBlockWrapper>

      <HorizontalFormBlockWrapper
        title="Lower Body"
        description="Hip and leg measurements."
      >
        <Input label="High Hip" value={user.HighHip || '---'} readOnly className="bg-gray-50/50" />
        <Input label="Full Hip" value={user.FullHip || '---'} readOnly className="bg-gray-50/50" />
        <Input label="Inseam" value={user.Inseam || '---'} readOnly className="bg-gray-50/50" />
      </HorizontalFormBlockWrapper>

      <HorizontalFormBlockWrapper
        title="Leg Details"
        description="Ankle and knee measurements."
      >
        <Input label="Ankle to Hip" value={user.AnkleToHip || '---'} readOnly className="bg-gray-50/50" />
        <Input label="Ankle to Knee" value={user.AnkleToKnee || '---'} readOnly className="bg-gray-50/50" />
        <Input label="Ankle Girth" value={user.AnkleGirth || '---'} readOnly className="bg-gray-50/50" />
        <Input label="Knee Girth" value={user.KneeGirth || '---'} readOnly className="bg-gray-50/50" />
      </HorizontalFormBlockWrapper>

      <HorizontalFormBlockWrapper
        title="Footwear"
        description="Shoe size information."
        className="border-b-0"
      >
        <Input label="Shoe Size" value={user.ShowSize || '---'} readOnly className="bg-gray-50/50" />
        <Input label="Measurement Unit" value={unit} readOnly className="bg-gray-50/50" />
      </HorizontalFormBlockWrapper>
    </div>
  );
}

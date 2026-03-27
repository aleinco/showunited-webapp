'use client';

import { Input } from 'rizzui';
import HorizontalFormBlockWrapper from '@/app/shared/account-settings/horiozontal-block';

export default function ProfessionalTab({ user }: { user: any }) {
  return (
    <div className="@container">
      <HorizontalFormBlockWrapper
        title="Main Category"
        description="Primary professional classification."
      >
        <Input label="Category ID" value={String(user.CategoryId || '---')} readOnly className="bg-gray-50/50" />
        <Input label="Sub Category ID" value={String(user.SubCategoryId || '---')} readOnly className="bg-gray-50/50" />
      </HorizontalFormBlockWrapper>

      <HorizontalFormBlockWrapper
        title="Sub-Classification"
        description="Further specialization details."
      >
        <Input label="Sub Category 1 ID" value={String(user.SubCategory1Id || '---')} readOnly className="bg-gray-50/50" />
        <Input label="Vocal Category" value={user.VocalCategoryId || '---'} readOnly className="bg-gray-50/50" />
      </HorizontalFormBlockWrapper>

      <HorizontalFormBlockWrapper
        title="Appearance"
        description="Physical appearance attributes."
        className="border-b-0"
      >
        <Input label="Hair Color ID" value={String(user.HairColorId || '---')} readOnly className="bg-gray-50/50" />
        <Input label="International Touring" value={user.IsInterestedInInternationalTouring ? 'Yes' : 'No'} readOnly className="bg-gray-50/50" />
      </HorizontalFormBlockWrapper>
    </div>
  );
}

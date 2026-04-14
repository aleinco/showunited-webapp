'use client';
import TaxonomyExpandable from '@/components/taxonomy-expandable';

export default function Page() {
  return (
    <div className="p-4 md:p-6">
      <TaxonomyExpandable
        categoryType="Company"
        title="Company Categories"
        description="Categories → Sub Categories → Sub Categories L2"
      />
    </div>
  );
}

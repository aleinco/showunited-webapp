'use client';
import TaxonomyExpandable from '@/components/taxonomy-expandable';

export default function Page() {
  return (
    <div className="p-4 md:p-6">
      <TaxonomyExpandable
        categoryType="Individual"
        title="Individual Categories"
        description="Categories → Sub Categories → Sub Categories L2"
      />
    </div>
  );
}

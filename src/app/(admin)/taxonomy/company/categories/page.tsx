'use client';
import TaxonomyTable from '@/components/taxonomy-table';

export default function Page() {
  return (
    <div className="p-4 md:p-6">
      <TaxonomyTable
        table="MasterCategory"
        title="Company Categories"
        description="Main categories for company users"
        categoryType="Company"
      />
    </div>
  );
}

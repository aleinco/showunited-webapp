'use client';
import TaxonomyTable from '@/components/taxonomy-table';

export default function Page() {
  return (
    <div className="p-4 md:p-6">
      <TaxonomyTable
        table="MasterSubCategory"
        title="Company SubCategories"
        description="Sub-categories for companies"
        parentCol="CategoryId"
        parentTable="MasterCategory"
        parentLabel="Categories"
      />
    </div>
  );
}

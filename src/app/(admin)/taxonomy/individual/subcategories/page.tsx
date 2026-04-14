'use client';
import TaxonomyTable from '@/components/taxonomy-table';

export default function Page() {
  return (
    <div className="p-4 md:p-6">
      <TaxonomyTable
        table="MasterSubCategory"
        title="Individual SubCategories"
        description="Professional sub-categories linked to main categories"
        parentCol="CategoryId"
        parentTable="MasterCategory"
        parentLabel="Categories"
      />
    </div>
  );
}

'use client';
import TaxonomyTable from '@/components/taxonomy-table';

export default function Page() {
  return (
    <div className="p-4 md:p-6">
      <TaxonomyTable
        table="MasterSubCategory"
        title="Company Sub Categories 1"
        description="Sub-categories for companies"
        parentCol="CategoryId"
        parentTable="MasterCategory"
        parentLabel="Parent Category"
      />
    </div>
  );
}

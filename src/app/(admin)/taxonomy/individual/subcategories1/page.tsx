'use client';
import TaxonomyTable from '@/components/taxonomy-table';

export default function Page() {
  return (
    <div className="p-4 md:p-6">
      <TaxonomyTable
        table="MasterSubCategory1"
        title="Sub Categories 2"
        description="Second-level sub-categories"
        parentCol="SubCategoryId"
        parentTable="MasterSubCategory"
        parentLabel="Parent SubCategory"
      />
    </div>
  );
}

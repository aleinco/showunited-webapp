'use client';
import TaxonomyTable from '@/components/taxonomy-table';

export default function Page() {
  return (
    <div className="p-4 md:p-6">
      <TaxonomyTable
        table="MasterHairColor"
        title="Hair Colors"
        description="Hair color options for individual profiles"
      />
    </div>
  );
}

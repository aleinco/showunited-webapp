'use client';
import TaxonomyTable from '@/components/taxonomy-table';

export default function Page() {
  return (
    <div className="p-4 md:p-6">
      <TaxonomyTable
        table="MasterVocalCategory"
        title="Vocal Categories"
        description="Vocal range and type classifications"
      />
    </div>
  );
}

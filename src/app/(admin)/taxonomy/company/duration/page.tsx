'use client';
import TaxonomyTable from '@/components/taxonomy-table';

export default function Page() {
  return (
    <div className="p-4 md:p-6">
      <TaxonomyTable
        table="MasterDuration"
        title="Duration"
        description="Duration options for jobs and auditions"
      />
    </div>
  );
}

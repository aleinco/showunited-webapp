'use client';
import TaxonomyTable from '@/components/taxonomy-table';

export default function Page() {
  return (
    <div className="p-4 md:p-6">
      <TaxonomyTable
        table="MasterIndustryType"
        title="Industry Types"
        description="Main industry classifications for companies"
      />
    </div>
  );
}

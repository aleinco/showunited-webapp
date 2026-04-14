'use client';
import TaxonomyTable from '@/components/taxonomy-table';

export default function Page() {
  return (
    <div className="p-4 md:p-6">
      <TaxonomyTable
        table="MasterIndustrySubType"
        title="Industry SubTypes"
        description="Industry sub-classifications"
        parentCol="IndustryTypeId"
        parentTable="MasterIndustryType"
        parentLabel="Industry Types"
      />
    </div>
  );
}

'use client';
import TaxonomyTable from '@/components/taxonomy-table';

export default function Page() {
  return (
    <div className="p-4 md:p-6">
      <TaxonomyTable
        table="MasterSkill"
        title="Skills"
        description="Professional skills taxonomy (181 skills)"
      />
    </div>
  );
}

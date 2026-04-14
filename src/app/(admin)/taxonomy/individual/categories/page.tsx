'use client';
import TaxonomyTable from '@/components/taxonomy-table';

export default function Page() {
  return (
    <div className="p-4 md:p-6">
      <TaxonomyTable
        table="MasterCategory"
        title="Individual Categories"
        description="Main professional categories for individual users"
        categoryType="Individual"
        extraBoolCols={[
          { key: 'IsBodyMeasurementRequired', label: 'Body Meas.' },
          { key: 'IsAuditionRequired', label: 'Audition' },
          { key: 'IsVocalCategory', label: 'Vocal' },
        ]}
      />
    </div>
  );
}

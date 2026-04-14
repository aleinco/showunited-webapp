'use client';
import TaxonomyTable from '@/components/taxonomy-table';

export default function Page() {
  return (
    <div className="p-4 md:p-6">
      <TaxonomyTable
        table="MasterCategory"
        title="Individual Categories"
        description="Main professional categories for individual users"
        extraSelectCol={{
          key: 'CategoryType',
          label: 'Type',
          options: [
            { label: 'Individual', value: 'Individual' },
            { label: 'Company', value: 'Company' },
          ],
        }}
        extraBoolCols={[
          { key: 'IsBodyMeasurementRequired', label: 'Body Meas.' },
          { key: 'IsAuditionRequired', label: 'Audition' },
          { key: 'IsVocalCategory', label: 'Vocal' },
        ]}
      />
    </div>
  );
}

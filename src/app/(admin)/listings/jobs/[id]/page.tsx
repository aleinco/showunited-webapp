'use client';

import { useParams } from 'next/navigation';
import JobForm from '../JobForm';

export default function EditJobPage() {
  const params = useParams();
  const id = String(params?.id || '');
  return (
    <div className="p-4 md:p-6">
      <JobForm jobId={id} />
    </div>
  );
}

'use client';
import { useParams } from 'next/navigation';
import AuditionForm from '../AuditionForm';
export default function EditAuditionPage() {
  const params = useParams();
  const id = String(params?.id || '');
  return <div className="p-4 md:p-6"><AuditionForm auditionId={id} /></div>;
}

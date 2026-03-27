'use client';

import AdminTable from '@/components/admin/admin-table';
import { ADMIN_ENDPOINTS } from '@/api/types';

const config = ADMIN_ENDPOINTS['cities'];

export default function Page() {
  return (
    <div className="p-4 md:p-6">
      <AdminTable config={config} />
    </div>
  );
}

'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Title, Text, Input, Button, ActionIcon, Badge, Select } from 'rizzui';
import {
  PiMagnifyingGlassBold,
  PiCaretLeftBold,
  PiCaretRightBold,
  PiPencilSimpleDuotone,
  PiTrashSimpleDuotone,
} from 'react-icons/pi';
import AvatarCard from '@/components/ui/avatar-card';
import cn from '@/utils/class-names';
import toast from 'react-hot-toast';

const PAGE_SIZE_OPTIONS = [
  { label: '25 per page', value: '25' },
  { label: '50 per page', value: '50' },
  { label: '100 per page', value: '100' },
];

function StatusBadge({ statusId, statusName }: { statusId: number; statusName: string }) {
  const color = statusId === 1 ? 'success' : statusId === 10 ? 'secondary' : 'warning';
  return <Badge variant="flat" color={color} className="font-medium">{statusName || '---'}</Badge>;
}

const SCHEDULE_LABEL: Record<string, string> = { upcoming: 'Upcoming', live: 'Live', finished: 'Finished', unknown: '—' };

function ScheduleBadge({ schedule }: { schedule: string }) {
  const color = schedule === 'upcoming' ? 'info' : schedule === 'live' ? 'success' : 'danger';
  if (schedule === 'unknown') return <Text className="text-sm text-gray-400">—</Text>;
  return <Badge variant="outline" color={color} className="font-medium">{SCHEDULE_LABEL[schedule]}</Badge>;
}

export default function JobsAdminPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');     // all|1|2|10
  const [scheduleFilter, setScheduleFilter] = useState('all'); // all|upcoming|live|finished
  const [originFilter, setOriginFilter] = useState('all');     // all|ours|companies

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-jobs'],
    queryFn: async () => (await fetch('/api/admin/jobs-list')).json(),
    staleTime: 60_000,
  });
  const allRows = useMemo(() => data?.jobs || [], [data]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allRows.filter((r: any) =>
      (statusFilter === 'all' || String(r.statusId) === statusFilter) &&
      (scheduleFilter === 'all' || r.schedule === scheduleFilter) &&
      (originFilter === 'all' || (originFilter === 'ours' ? r.isOurs : !r.isOurs)) &&
      (!q || r.title?.toLowerCase().includes(q) || r.companyName?.toLowerCase().includes(q))
    );
  }, [allRows, statusFilter, scheduleFilter, originFilter, search]);

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginatedRows = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );

  const handleSearch = useCallback(() => { setSearch(searchInput); setPage(1); }, [searchInput]);
  const handleClearSearch = useCallback(() => { setSearchInput(''); setSearch(''); setPage(1); }, []);

  const qc = useQueryClient();
  const onClose = useCallback(async (row: any) => {
    if (!confirm(`Close "${row.title}"?`)) return;
    const res = await fetch('/api/admin/job-status', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: row.id, newStatusId: 10 }),
    });
    if (res.ok) { toast.success('Closed'); qc.invalidateQueries({ queryKey: ['admin-jobs'] }); }
    else { const j = await res.json().catch(() => ({})); toast.error(j.error || 'Close failed'); }
  }, [qc]);

  const onDelete = useCallback(async (row: any) => {
    if (!confirm(`Delete "${row.title}" permanently?\n\nThis removes the listing, its images and ALL its applications/candidates. This cannot be undone.`)) return;
    const res = await fetch('/api/admin/delete-job', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: row.id }),
    });
    if (res.ok) { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['admin-jobs'] }); }
    else { const j = await res.json().catch(() => ({})); toast.error(j.error || 'Delete failed'); }
  }, [qc]);

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Title as="h4" className="text-lg font-semibold">Jobs</Title>
          <Text className="mt-1 text-sm text-gray-500">
            {isLoading ? 'Loading...' : `${totalCount} jobs`}
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <Input type="text" placeholder="Search jobs..." value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-64"
            prefix={<PiMagnifyingGlassBold className="h-4 w-4 text-gray-400" />}
          />
          <Button size="sm" onClick={handleSearch} className="bg-primary text-white">Search</Button>
          {search && <Button size="sm" variant="outline" onClick={handleClearSearch}>Clear</Button>}
          <Button size="sm" className="bg-primary text-white" onClick={() => router.push('/listings/jobs/create')}>Create Job</Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select size="sm" placeholder="Status" className="w-40"
          options={[{label:'All status',value:'all'},{label:'Active',value:'1'},{label:'In Active',value:'2'},{label:'Closed',value:'10'}]}
          value={statusFilter} onChange={(o:any)=>{setStatusFilter(o.value);setPage(1);}} />
        <Select size="sm" placeholder="Schedule" className="w-40"
          options={[{label:'All schedule',value:'all'},{label:'Upcoming',value:'upcoming'},{label:'Live',value:'live'},{label:'Finished',value:'finished'}]}
          value={scheduleFilter} onChange={(o:any)=>{setScheduleFilter(o.value);setPage(1);}} />
        <Select size="sm" placeholder="Origin" className="w-44"
          options={[{label:'All origins',value:'all'},{label:'ShowUnited (ours)',value:'ours'},{label:'Companies',value:'companies'}]}
          value={originFilter} onChange={(o:any)=>{setOriginFilter(o.value);setPage(1);}} />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-muted bg-transparent">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-muted bg-gray-100/40">
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Job</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Company</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Category</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Schedule</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Dates</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Apps</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="bg-white">
                    <td className="px-4 py-3.5"><div className="flex items-center gap-3"><div className="h-10 w-10 animate-pulse rounded-md bg-gray-200" /><div><div className="h-4 w-28 animate-pulse rounded bg-gray-200" /><div className="mt-1 h-3 w-20 animate-pulse rounded bg-gray-200" /></div></div></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-32 animate-pulse rounded bg-gray-200" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-24 animate-pulse rounded bg-gray-200" /></td>
                    <td className="px-4 py-3.5"><div className="h-5 w-14 animate-pulse rounded bg-gray-200" /></td>
                    <td className="px-4 py-3.5"><div className="h-5 w-14 animate-pulse rounded bg-gray-200" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-24 animate-pulse rounded bg-gray-200" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-8 animate-pulse rounded bg-gray-200" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-16 animate-pulse rounded bg-gray-200" /></td>
                  </tr>
                ))
              ) : isError ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-red-default">Error loading data</td></tr>
              ) : paginatedRows.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">No jobs found</td></tr>
              ) : (
                paginatedRows.map((row: any) => (
                  <tr key={row.id} className={cn('bg-white transition-colors hover:bg-gray-50/50')}>
                    <td className="px-4 py-3.5">
                      <button onClick={() => router.push(`/listings/jobs/${row.id}`)} className="text-left hover:opacity-80">
                        <AvatarCard src={row.thumb || ''} name={row.title}
                          description={`${row.category}${row.subCategory && row.subCategory!=='---' ? ' · '+row.subCategory : ''}`}
                          avatarProps={{ name: row.title, size: 'lg', className: 'rounded-md' }} />
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-700">
                      <span className="inline-flex items-center gap-1.5">
                        {row.companyName}
                        {row.isOurs && <Badge size="sm" color="primary" variant="flat">ShowUnited</Badge>}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-700">{row.category}</td>
                    <td className="whitespace-nowrap px-4 py-3.5"><StatusBadge statusId={row.statusId} statusName={row.statusName} /></td>
                    <td className="whitespace-nowrap px-4 py-3.5"><ScheduleBadge schedule={row.schedule} /></td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-500">
                      {row.startDate ? new Date(row.startDate).toLocaleDateString() : '—'} – {row.endDate ? new Date(row.endDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-700">{row.applications}</td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        {row.isOurs && (
                          <ActionIcon size="sm" variant="outline" aria-label="Edit" onClick={() => router.push(`/listings/jobs/${row.id}`)}>
                            <PiPencilSimpleDuotone className="h-4 w-4" />
                          </ActionIcon>
                        )}
                        {row.statusId !== 10 && (
                          <Button size="sm" variant="outline" color="danger" onClick={() => onClose(row)}>Close</Button>
                        )}
                        <ActionIcon size="sm" variant="outline" color="danger" aria-label="Delete" onClick={() => onDelete(row)}>
                          <PiTrashSimpleDuotone className="h-4 w-4" />
                        </ActionIcon>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {paginatedRows.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-muted px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <Text className="text-sm text-gray-500">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount} jobs
            </Text>
            <div className="flex items-center gap-3">
              <Select size="sm" options={PAGE_SIZE_OPTIONS} value={String(pageSize)}
                onChange={(opt: any) => { setPageSize(Number(opt.value)); setPage(1); }} className="w-36" />
              <div className="flex items-center gap-1.5">
                <ActionIcon size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-40">
                  <PiCaretLeftBold className="h-4 w-4" />
                </ActionIcon>
                <Text className="text-sm font-medium text-gray-600 min-w-[4rem] text-center">{page} / {totalPages}</Text>
                <ActionIcon size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="disabled:opacity-40">
                  <PiCaretRightBold className="h-4 w-4" />
                </ActionIcon>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

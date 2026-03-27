'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Title, Text, Input, Button, Checkbox, ActionIcon, Badge, Select } from 'rizzui';
import {
  PiMagnifyingGlassBold,
  PiTrashDuotone,
  PiEnvelopeSimpleDuotone,
  PiFileCsvDuotone,
  PiFileXlsDuotone,
  PiFilePdfDuotone,
  PiEyeDuotone,
  PiCaretLeftBold,
  PiCaretRightBold,
} from 'react-icons/pi';
import AvatarCard from '@/components/ui/avatar-card';
import DeletePopover from '@/components/core/delete-popover';
import { exportToCSV } from '@/utils/export-to-csv';
import cn from '@/utils/class-names';
import toast from 'react-hot-toast';

const PAGE_SIZE_OPTIONS = [
  { label: '25 per page', value: '25' },
  { label: '50 per page', value: '50' },
  { label: '100 per page', value: '100' },
];

function StatusBadge({ status }: { status: string }) {
  const isActive = status?.toLowerCase() === 'active';
  return (
    <Badge variant="flat" color={isActive ? 'success' : 'danger'} className="font-medium">
      {status || '---'}
    </Badge>
  );
}

export default function CompanyUsersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const { data, isLoading, isError } = useQuery({
    queryKey: ['all-company-users'],
    queryFn: async () => {
      const res = await fetch('/api/admin/company-users-list');
      return res.json();
    },
    staleTime: 120_000,
  });

  const allUsers = useMemo(() => data?.users || [], [data]);

  const filtered = useMemo(() => {
    if (!search) return allUsers;
    const q = search.toLowerCase();
    return allUsers.filter(
      (u: any) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.city?.toLowerCase().includes(q) ||
        u.country?.toLowerCase().includes(q)
    );
  }, [allUsers, search]);

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginatedRows = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );

  const allSelected = paginatedRows.length > 0 && paginatedRows.every((r: any) => selectedIds.has(r.id));
  const someSelected = selectedIds.size > 0;

  const toggleAll = useCallback(() => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginatedRows.map((r: any) => r.id)));
  }, [allSelected, paginatedRows]);

  const toggleRow = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleSearch = useCallback(() => { setSearch(searchInput); setPage(1); setSelectedIds(new Set()); }, [searchInput]);
  const handleClearSearch = useCallback(() => { setSearchInput(''); setSearch(''); setPage(1); }, []);

  const selectedRows = useMemo(() => allUsers.filter((r: any) => selectedIds.has(r.id)), [allUsers, selectedIds]);

  const handleExportCSV = useCallback(() => {
    const exportData = (selectedRows.length > 0 ? selectedRows : filtered).map((r: any) => ({
      Name: r.name, Email: r.email, Phone: `${r.countryCode} ${r.phone}`,
      Country: r.country, City: r.city, Website: r.website, Status: r.status,
      Created: r.createdDate ? new Date(r.createdDate).toLocaleDateString() : '',
    }));
    exportToCSV(exportData, 'company-users');
    toast.success(`Exported ${exportData.length} companies to CSV`);
  }, [selectedRows, filtered]);

  const handleSendEmail = useCallback(() => {
    const emails = selectedRows.map((r: any) => r.email).filter((e: string) => e && e !== '---');
    if (emails.length === 0) { toast.error('No valid emails'); return; }
    window.open(`mailto:${emails.join(',')}`, '_blank');
  }, [selectedRows]);

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Title as="h4" className="text-lg font-semibold">Company Users</Title>
          <Text className="mt-1 text-sm text-gray-500">
            {isLoading ? 'Loading...' : `${totalCount} companies`}
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <Input type="text" placeholder="Search companies..." value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-64"
            prefix={<PiMagnifyingGlassBold className="h-4 w-4 text-gray-400" />}
          />
          <Button size="sm" onClick={handleSearch} className="bg-primary text-white">Search</Button>
          {search && <Button size="sm" variant="outline" onClick={handleClearSearch}>Clear</Button>}
        </div>
      </div>

      {/* Bulk Actions */}
      {someSelected && (
        <div className="flex items-center gap-3 rounded-lg border border-muted bg-white px-4 py-3 shadow-sm">
          <Text className="text-sm font-semibold">{selectedIds.size} selected</Text>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleSendEmail} className="gap-1.5">
              <PiEnvelopeSimpleDuotone className="h-4 w-4" /> Send Email
            </Button>
            <Button size="sm" variant="outline" onClick={handleExportCSV} className="gap-1.5">
              <PiFileCsvDuotone className="h-4 w-4" /> CSV
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => toast.error('Excel export coming soon')}>
              <PiFileXlsDuotone className="h-4 w-4" /> Excel
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => toast.error('PDF export coming soon')}>
              <PiFilePdfDuotone className="h-4 w-4" /> PDF
            </Button>
            <Button size="sm" color="danger" variant="outline" className="gap-1.5 ms-2" onClick={() => toast.error('Bulk delete not yet connected')}>
              <PiTrashDuotone className="h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-muted bg-transparent">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-muted bg-gray-100/40">
                <th className="w-12 px-4 py-3.5"><Checkbox aria-label="Select all" checked={allSelected} onChange={toggleAll} /></th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Company</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Email</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Phone</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Location</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Created</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="bg-white">
                    <td className="px-4 py-3.5"><div className="h-4 w-4 animate-pulse rounded bg-gray-200" /></td>
                    <td className="px-4 py-3.5"><div className="flex items-center gap-3"><div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" /><div><div className="h-4 w-28 animate-pulse rounded bg-gray-200" /><div className="mt-1 h-3 w-20 animate-pulse rounded bg-gray-200" /></div></div></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-32 animate-pulse rounded bg-gray-200" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-24 animate-pulse rounded bg-gray-200" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-24 animate-pulse rounded bg-gray-200" /></td>
                    <td className="px-4 py-3.5"><div className="h-5 w-14 animate-pulse rounded bg-gray-200" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-20 animate-pulse rounded bg-gray-200" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-16 animate-pulse rounded bg-gray-200" /></td>
                  </tr>
                ))
              ) : isError ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-red-default">Error loading data</td></tr>
              ) : paginatedRows.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">No companies found</td></tr>
              ) : (
                paginatedRows.map((row: any) => {
                  const isSelected = selectedIds.has(row.id);
                  return (
                    <tr key={row.id} className={cn('bg-white transition-colors hover:bg-gray-50/50', isSelected && 'bg-primary-lighter/30')}>
                      <td className="px-4 py-3.5">
                        <Checkbox aria-label={`Select ${row.name}`} checked={isSelected} onChange={() => toggleRow(row.id)} />
                      </td>
                      <td className="px-4 py-3.5">
                        <button onClick={() => router.push(`/users/company/${row.id}`)} className="text-left transition-opacity hover:opacity-80">
                          <AvatarCard
                            src={row.photo || ''}
                            name={row.name || '---'}
                            description={row.city && row.country ? `${row.city}, ${row.country}` : row.country || '---'}
                            avatarProps={{ size: 'lg', className: 'rounded-full' }}
                          />
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-700">{row.email || '---'}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-700">
                        {row.phone ? `${row.countryCode} ${row.phone}` : '---'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-700">
                        {[row.city, row.country].filter(Boolean).join(', ') || '---'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5"><StatusBadge status={row.status} /></td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-500">
                        {row.createdDate ? new Date(row.createdDate).toLocaleDateString() : '---'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <ActionIcon size="sm" variant="outline" aria-label="View" className="text-gray-500 hover:text-gray-700" onClick={() => router.push(`/users/company/${row.id}`)}>
                            <PiEyeDuotone className="h-4 w-4" />
                          </ActionIcon>
                          <DeletePopover title="Delete Company" description="Are you sure?" onDelete={() => toast.success(`Delete company ${row.id} — not yet connected`)} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {paginatedRows.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-muted px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <Text className="text-sm text-gray-500">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount} companies
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

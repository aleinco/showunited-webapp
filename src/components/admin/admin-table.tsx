'use client';

import { useState, useCallback, useMemo } from 'react';
import { useAdminList, useDeleteEntity } from '@/api/hooks/use-admin';
import type { AdminEndpointConfig } from '@/api/types';
import { Input, Button, Title, Text, ActionIcon, Popover } from 'rizzui';
import {
  PiMagnifyingGlassBold,
  PiTrashDuotone,
  PiWarningCircleDuotone,
} from 'react-icons/pi';
import cn from '@/utils/class-names';
import toast from 'react-hot-toast';

interface ColumnDef {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface AdminTableProps {
  config: AdminEndpointConfig;
  columns?: ColumnDef[];
  showExport?: boolean;
}

/** Keys to hide from auto-generated columns */
const HIDDEN_KEYS = ['action', 'id'];

export default function AdminTable({ config, columns, showExport }: AdminTableProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading, isError, error } = useAdminList(config, page, search);
  const deleteMutation = useDeleteEntity();

  const handleSearch = useCallback(() => {
    setSearch(searchInput);
    setPage(1);
  }, [searchInput]);

  const handleClearSearch = useCallback(() => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  }, []);

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await deleteMutation.mutateAsync({
          Type: config.deleteType,
          TypeId: id,
        });
        toast.success('Item deleted successfully');
      } catch {
        toast.error('Failed to delete item');
      }
    },
    [deleteMutation, config.deleteType]
  );

  const rows = data?.responseData || [];
  const totalCount = data?.totalCount || rows.length;

  // Auto-generate columns from response data keys
  const displayColumns = useMemo<ColumnDef[]>(() => {
    if (columns) return columns;
    if (rows.length === 0) return [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }];

    return Object.keys(rows[0])
      .filter((key) => !HIDDEN_KEYS.includes(key))
      .map((key) => ({
        key,
        label: key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase()),
      }));
  }, [columns, rows]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Title as="h4" className="text-lg font-semibold">
            {config.title}
          </Title>
          {totalCount > 0 && (
            <Text className="mt-1 text-sm text-gray-500">
              {totalCount} total records
            </Text>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Input
              type="text"
              placeholder={config.searchPlaceholder}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-64"
              prefix={<PiMagnifyingGlassBold className="h-4 w-4 text-gray-400" />}
            />
          </div>
          <Button
            size="sm"
            onClick={handleSearch}
            className="bg-primary text-white hover:bg-primary-dark"
          >
            Search
          </Button>
          {search && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearSearch}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-300 dark:bg-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-300 dark:bg-gray-200">
                {displayColumns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    {col.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-300">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {displayColumns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="h-4 w-8 animate-pulse rounded bg-gray-200" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td
                    colSpan={displayColumns.length + 1}
                    className="px-4 py-8 text-center text-sm text-red-default"
                  >
                    Error loading data: {(error as any)?.message || 'Unknown error'}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={displayColumns.length + 1}
                    className="px-4 py-8 text-center text-sm text-gray-400"
                  >
                    No data found
                  </td>
                </tr>
              ) : (
                rows.map((row: any, idx: number) => (
                  <tr
                    key={row.id || idx}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-200"
                  >
                    {displayColumns.map((col) => (
                      <td
                        key={col.key}
                        className="whitespace-nowrap px-4 py-3 text-sm text-gray-700"
                      >
                        {col.render
                          ? col.render(row[col.key], row)
                          : row[col.key] ?? '-'}
                      </td>
                    ))}
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <DeleteButton
                        onConfirm={() => handleDelete(row.id)}
                        isLoading={deleteMutation.isPending}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with count */}
        {rows.length > 0 && (
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-300 dark:bg-gray-200">
            <Text className="text-sm text-gray-500">
              Showing {rows.length} of {totalCount} records
            </Text>
          </div>
        )}
      </div>
    </div>
  );
}

function DeleteButton({
  onConfirm,
  isLoading,
}: {
  onConfirm: () => void;
  isLoading: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Popover isOpen={isOpen} setIsOpen={setIsOpen} placement="left">
      <Popover.Trigger>
        <ActionIcon
          size="sm"
          variant="outline"
          className="text-red-default hover:bg-red-lighter hover:text-red-dark"
        >
          <PiTrashDuotone className="h-4 w-4" />
        </ActionIcon>
      </Popover.Trigger>
      <Popover.Content>
        <div className="w-56 p-2">
          <div className="flex items-center gap-2">
            <PiWarningCircleDuotone className="h-5 w-5 text-red-default" />
            <Text className="text-sm font-medium">Are you sure?</Text>
          </div>
          <Text className="mt-1 text-xs text-gray-500">
            This action cannot be undone.
          </Text>
          <div className="mt-3 flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              color="danger"
              isLoading={isLoading}
              onClick={() => {
                onConfirm();
                setIsOpen(false);
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Popover.Content>
    </Popover>
  );
}

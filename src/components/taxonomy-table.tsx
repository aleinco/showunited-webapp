'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Title, Text, Input, Button, ActionIcon, Badge, Select } from 'rizzui';
import {
  PiPlusBold,
  PiPencilSimpleDuotone,
  PiTrashDuotone,
  PiCheckBold,
  PiXBold,
  PiMagnifyingGlassBold,
} from 'react-icons/pi';
import toast from 'react-hot-toast';

interface TaxonomyTableProps {
  table: string;
  title: string;
  description?: string;
  parentCol?: string;
  parentTable?: string;
  parentLabel?: string;
  /** Extra boolean columns for MasterCategory */
  extraBoolCols?: { key: string; label: string }[];
  /** Extra select column (e.g. CategoryType) */
  extraSelectCol?: { key: string; label: string; options: { label: string; value: string }[] };
}

interface TaxItem {
  [key: string]: any;
}

async function fetchTaxonomy(table: string, parentId?: number) {
  const url = parentId
    ? `/api/admin/taxonomy?table=${table}&parentId=${parentId}`
    : `/api/admin/taxonomy?table=${table}`;
  const res = await fetch(url);
  return res.json();
}

async function mutateTaxonomy(payload: any) {
  const res = await fetch('/api/admin/taxonomy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export default function TaxonomyTable({
  table,
  title,
  description,
  parentCol,
  parentTable,
  parentLabel,
  extraBoolCols,
  extraSelectCol,
}: TaxonomyTableProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedParent, setSelectedParent] = useState<number | undefined>();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editSeq, setEditSeq] = useState(0);
  const [editExtras, setEditExtras] = useState<Record<string, any>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSeq, setNewSeq] = useState(0);
  const [newExtras, setNewExtras] = useState<Record<string, any>>({});

  // Fetch parent items for filter
  const { data: parentData } = useQuery({
    queryKey: ['taxonomy-parent', parentTable],
    queryFn: () => fetchTaxonomy(parentTable!),
    enabled: !!parentTable,
  });

  const parentOptions = parentData?.items?.map((p: TaxItem) => ({
    label: p[parentData.config.nameCol],
    value: String(p[parentData.config.idCol]),
  })) || [];

  // Fetch items
  const queryKey = ['taxonomy', table, selectedParent];
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchTaxonomy(table, selectedParent),
  });

  const items: TaxItem[] = data?.items || [];
  const config = data?.config || {};

  // Filter by search
  const filtered = search
    ? items.filter((item) =>
        String(item[config.nameCol] || '').toLowerCase().includes(search.toLowerCase())
      )
    : items;

  // Mutations
  const createMut = useMutation({
    mutationFn: (payload: any) => mutateTaxonomy(payload),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Created successfully');
        queryClient.invalidateQueries({ queryKey: ['taxonomy', table] });
        setIsCreating(false);
        setNewName('');
        setNewSeq(0);
        setNewExtras({});
      } else {
        toast.error(res.error || 'Failed to create');
      }
    },
  });

  const updateMut = useMutation({
    mutationFn: (payload: any) => mutateTaxonomy(payload),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Updated successfully');
        queryClient.invalidateQueries({ queryKey: ['taxonomy', table] });
        setEditingId(null);
      } else {
        toast.error(res.error || 'Failed to update');
      }
    },
  });

  const deleteMut = useMutation({
    mutationFn: (payload: any) => mutateTaxonomy(payload),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['taxonomy', table] });
      } else {
        toast.error(res.error || 'Failed to delete');
      }
    },
  });

  function startEdit(item: TaxItem) {
    setEditingId(item[config.idCol]);
    setEditName(item[config.nameCol] || '');
    setEditSeq(item.SequenceNumber || 0);
    const extras: Record<string, any> = {};
    extraBoolCols?.forEach((col) => { extras[col.key] = !!item[col.key]; });
    if (extraSelectCol) extras[extraSelectCol.key] = item[extraSelectCol.key] || '';
    setEditExtras(extras);
  }

  function handleCreate() {
    const createData: any = { [config.nameCol]: newName, SequenceNumber: newSeq, ...newExtras };
    if (parentCol && selectedParent) {
      createData[parentCol] = selectedParent;
    }
    createMut.mutate({ action: 'create', table, data: createData });
  }

  function handleUpdate() {
    const updateData: any = { [config.nameCol]: editName, SequenceNumber: editSeq, ...editExtras };
    updateMut.mutate({ action: 'update', table, id: editingId, data: updateData });
  }

  function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    deleteMut.mutate({ action: 'delete', table, id });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Title as="h4" className="text-lg font-semibold">{title}</Title>
          {description && <Text className="mt-0.5 text-sm text-gray-500">{description}</Text>}
        </div>
        <div className="flex items-center gap-3">
          {/* Parent filter */}
          {parentTable && parentOptions.length > 0 && (
            <Select
              size="sm"
              placeholder={`All ${parentLabel || 'Parents'}`}
              options={[{ label: `All ${parentLabel || 'Parents'}`, value: '' }, ...parentOptions]}
              value={selectedParent ? String(selectedParent) : ''}
              onChange={(opt: any) => setSelectedParent(opt.value ? Number(opt.value) : undefined)}
              className="w-48"
            />
          )}
          <Input
            size="sm"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix={<PiMagnifyingGlassBold className="h-4 w-4 text-gray-400" />}
            className="w-48"
          />
          <Button size="sm" className="gap-1.5" onClick={() => setIsCreating(true)}>
            <PiPlusBold className="h-4 w-4" /> Add New
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-muted bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-muted bg-gray-100/40">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Order</th>
              {extraSelectCol && (
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{extraSelectCol.label}</th>
              )}
              {extraBoolCols?.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{col.label}</th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-muted">
            {/* Create row */}
            {isCreating && (
              <tr className="bg-primary-lighter/10">
                <td className="px-4 py-2 text-sm text-gray-400">New</td>
                <td className="px-4 py-2">
                  <Input size="sm" placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()} autoFocus />
                </td>
                <td className="px-4 py-2">
                  <Input size="sm" type="number" value={String(newSeq)} onChange={(e) => setNewSeq(Number(e.target.value))} className="w-20" />
                </td>
                {extraSelectCol && (
                  <td className="px-4 py-2">
                    <Select size="sm" options={extraSelectCol.options}
                      value={newExtras[extraSelectCol.key] || ''}
                      onChange={(opt: any) => setNewExtras((p) => ({ ...p, [extraSelectCol.key]: opt.value }))}
                      className="w-32" />
                  </td>
                )}
                {extraBoolCols?.map((col) => (
                  <td key={col.key} className="px-4 py-2">
                    <input type="checkbox" checked={!!newExtras[col.key]}
                      onChange={(e) => setNewExtras((p) => ({ ...p, [col.key]: e.target.checked }))} />
                  </td>
                ))}
                <td className="px-4 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <ActionIcon size="sm" variant="flat" color="success" onClick={handleCreate} disabled={!newName.trim()}>
                      <PiCheckBold className="h-4 w-4" />
                    </ActionIcon>
                    <ActionIcon size="sm" variant="flat" color="danger" onClick={() => { setIsCreating(false); setNewName(''); }}>
                      <PiXBold className="h-4 w-4" />
                    </ActionIcon>
                  </div>
                </td>
              </tr>
            )}

            {/* Loading */}
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={10} className="px-4 py-3"><div className="h-4 w-full animate-pulse rounded bg-gray-200" /></td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-sm text-gray-400">No items found</td></tr>
            ) : (
              filtered.map((item) => {
                const itemId = item[config.idCol];
                const isEditing = editingId === itemId;

                return (
                  <tr key={itemId} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 text-sm text-gray-500">{itemId}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900">
                      {isEditing ? (
                        <Input size="sm" value={editName} onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleUpdate()} autoFocus />
                      ) : (
                        item[config.nameCol]
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-500">
                      {isEditing ? (
                        <Input size="sm" type="number" value={String(editSeq)} onChange={(e) => setEditSeq(Number(e.target.value))} className="w-20" />
                      ) : (
                        item.SequenceNumber ?? 0
                      )}
                    </td>
                    {extraSelectCol && (
                      <td className="px-4 py-2.5 text-sm">
                        {isEditing ? (
                          <Select size="sm" options={extraSelectCol.options}
                            value={editExtras[extraSelectCol.key] || ''}
                            onChange={(opt: any) => setEditExtras((p) => ({ ...p, [extraSelectCol.key]: opt.value }))}
                            className="w-32" />
                        ) : (
                          <Badge variant="flat" color="info" className="text-xs">{item[extraSelectCol.key] || '---'}</Badge>
                        )}
                      </td>
                    )}
                    {extraBoolCols?.map((col) => (
                      <td key={col.key} className="px-4 py-2.5 text-sm">
                        {isEditing ? (
                          <input type="checkbox" checked={!!editExtras[col.key]}
                            onChange={(e) => setEditExtras((p) => ({ ...p, [col.key]: e.target.checked }))} />
                        ) : (
                          <Badge variant="flat" color={item[col.key] ? 'success' : 'secondary'} className="text-xs">
                            {item[col.key] ? 'Yes' : 'No'}
                          </Badge>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isEditing ? (
                          <>
                            <ActionIcon size="sm" variant="flat" color="success" onClick={handleUpdate}>
                              <PiCheckBold className="h-4 w-4" />
                            </ActionIcon>
                            <ActionIcon size="sm" variant="flat" color="danger" onClick={() => setEditingId(null)}>
                              <PiXBold className="h-4 w-4" />
                            </ActionIcon>
                          </>
                        ) : (
                          <>
                            <ActionIcon size="sm" variant="outline" onClick={() => startEdit(item)}>
                              <PiPencilSimpleDuotone className="h-4 w-4" />
                            </ActionIcon>
                            <ActionIcon size="sm" variant="outline" className="text-red-500" onClick={() => handleDelete(itemId)}>
                              <PiTrashDuotone className="h-4 w-4" />
                            </ActionIcon>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Text className="text-xs text-gray-400">
        {filtered.length} item{filtered.length !== 1 ? 's' : ''} • Table: {table}
      </Text>
    </div>
  );
}

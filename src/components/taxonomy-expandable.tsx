'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Title, Text, Input, Button, ActionIcon, Badge } from 'rizzui';
import {
  PiPlusBold,
  PiPencilSimpleDuotone,
  PiTrashDuotone,
  PiCheckBold,
  PiXBold,
  PiCaretRightBold,
  PiCaretDownBold,
  PiMagnifyingGlassBold,
} from 'react-icons/pi';
import toast from 'react-hot-toast';
import cn from '@/utils/class-names';

// ─── Types ──────────────────────────────────────────────────────────
interface SubCategory1 {
  SubCategory1Id: number;
  SubCategoryId: number;
  SubCategory1Name: string;
  SequenceNumber: number;
  [key: string]: any;
}

interface SubCategory {
  SubCategoryId: number;
  CategoryId: number;
  SubCategoryName: string;
  SequenceNumber: number;
  children: SubCategory1[];
  [key: string]: any;
}

interface Category {
  CategoryId: number;
  CategoryName: string;
  CategoryType: string;
  SequenceNumber: number;
  IsBodyMeasurementRequired: boolean;
  IsAuditionRequired: boolean;
  IsVocalCategory: boolean;
  children: SubCategory[];
  [key: string]: any;
}

interface Props {
  categoryType: 'Individual' | 'Company';
  title: string;
  description?: string;
}

// ─── API helpers ────────────────────────────────────────────────────
async function fetchTree(categoryType: string) {
  const res = await fetch(`/api/admin/taxonomy-tree?categoryType=${categoryType}`);
  return res.json();
}

async function taxonomyAction(payload: any) {
  const res = await fetch('/api/admin/taxonomy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// ─── Inline Edit Row ────────────────────────────────────────────────
function InlineCreateRow({
  placeholder,
  onSave,
  onCancel,
}: {
  placeholder: string;
  onSave: (name: string, seq: number) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [seq, setSeq] = useState(0);

  return (
    <div className="flex items-center gap-2 rounded-md bg-primary/5 px-3 py-2">
      <Input
        size="sm"
        placeholder={placeholder}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && name.trim() && onSave(name, seq)}
        autoFocus
        className="flex-1"
      />
      <Input
        size="sm"
        type="number"
        placeholder="#"
        value={String(seq)}
        onChange={(e) => setSeq(Number(e.target.value))}
        className="w-16"
      />
      <ActionIcon size="sm" variant="flat" color="success" onClick={() => name.trim() && onSave(name, seq)} disabled={!name.trim()}>
        <PiCheckBold className="h-4 w-4" />
      </ActionIcon>
      <ActionIcon size="sm" variant="flat" color="danger" onClick={onCancel}>
        <PiXBold className="h-4 w-4" />
      </ActionIcon>
    </div>
  );
}

// ─── Level 3: SubCategory1 Rows ────────────────────────────────────
function SubCategory1List({
  items,
  parentSubCategoryId,
  onMutate,
}: {
  items: SubCategory1[];
  parentSubCategoryId: number;
  onMutate: () => void;
}) {
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [creating, setCreating] = useState(false);

  async function handleCreate(name: string, seq: number) {
    const res = await taxonomyAction({
      action: 'create',
      table: 'MasterSubCategory1',
      data: { SubCategory1Name: name, SequenceNumber: seq, SubCategoryId: parentSubCategoryId },
    });
    if (res.success) { toast.success('Created'); onMutate(); setCreating(false); }
    else toast.error(res.error);
  }

  async function handleUpdate(id: number) {
    const res = await taxonomyAction({
      action: 'update',
      table: 'MasterSubCategory1',
      id,
      data: { SubCategory1Name: editName },
    });
    if (res.success) { toast.success('Updated'); onMutate(); setEditId(null); }
    else toast.error(res.error);
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this sub-category L2?')) return;
    const res = await taxonomyAction({ action: 'delete', table: 'MasterSubCategory1', id });
    if (res.success) { toast.success('Deleted'); onMutate(); }
    else toast.error(res.error);
  }

  return (
    <div className="ml-10 space-y-0.5">
      {items.map((sc1) => (
        <div key={sc1.SubCategory1Id} className="flex items-center gap-2 rounded-md px-3 py-1.5 hover:bg-gray-50">
          <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
          {editId === sc1.SubCategory1Id ? (
            <>
              <Input size="sm" value={editName} onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUpdate(sc1.SubCategory1Id)} autoFocus className="flex-1" />
              <ActionIcon size="sm" variant="flat" color="success" onClick={() => handleUpdate(sc1.SubCategory1Id)}>
                <PiCheckBold className="h-3.5 w-3.5" />
              </ActionIcon>
              <ActionIcon size="sm" variant="flat" color="danger" onClick={() => setEditId(null)}>
                <PiXBold className="h-3.5 w-3.5" />
              </ActionIcon>
            </>
          ) : (
            <>
              <Text className="flex-1 text-sm text-gray-600">{sc1.SubCategory1Name}</Text>
              <Text className="text-xs text-gray-400">#{sc1.SequenceNumber}</Text>
              <ActionIcon size="sm" variant="text" onClick={() => { setEditId(sc1.SubCategory1Id); setEditName(sc1.SubCategory1Name); }}>
                <PiPencilSimpleDuotone className="h-3.5 w-3.5 text-gray-400" />
              </ActionIcon>
              <ActionIcon size="sm" variant="text" onClick={() => handleDelete(sc1.SubCategory1Id)}>
                <PiTrashDuotone className="h-3.5 w-3.5 text-gray-400" />
              </ActionIcon>
            </>
          )}
        </div>
      ))}
      {creating ? (
        <InlineCreateRow placeholder="New sub-category L2 name..." onSave={handleCreate} onCancel={() => setCreating(false)} />
      ) : (
        <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-primary hover:bg-primary/5">
          <PiPlusBold className="h-3 w-3" /> Add Sub Category L2
        </button>
      )}
    </div>
  );
}

// ─── Level 2: SubCategory Rows ─────────────────────────────────────
function SubCategoryList({
  items,
  parentCategoryId,
  onMutate,
}: {
  items: SubCategory[];
  parentCategoryId: number;
  onMutate: () => void;
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [creating, setCreating] = useState(false);

  async function handleCreate(name: string, seq: number) {
    const res = await taxonomyAction({
      action: 'create',
      table: 'MasterSubCategory',
      data: { SubCategoryName: name, SequenceNumber: seq, CategoryId: parentCategoryId },
    });
    if (res.success) { toast.success('Created'); onMutate(); setCreating(false); }
    else toast.error(res.error);
  }

  async function handleUpdate(id: number) {
    const res = await taxonomyAction({
      action: 'update',
      table: 'MasterSubCategory',
      id,
      data: { SubCategoryName: editName },
    });
    if (res.success) { toast.success('Updated'); onMutate(); setEditId(null); }
    else toast.error(res.error);
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this sub-category and all its L2 children?')) return;
    const res = await taxonomyAction({ action: 'delete', table: 'MasterSubCategory', id });
    if (res.success) { toast.success('Deleted'); onMutate(); }
    else toast.error(res.error);
  }

  return (
    <div className="ml-6 border-l border-gray-200 pl-4 space-y-0.5 py-2">
      {items.map((sc) => {
        const isExpanded = expandedId === sc.SubCategoryId;
        const hasChildren = sc.children.length > 0;

        return (
          <div key={sc.SubCategoryId}>
            <div className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-50">
              {/* Expand toggle for L2 */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : sc.SubCategoryId)}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-gray-400 hover:text-gray-600"
              >
                {isExpanded ? <PiCaretDownBold className="h-3 w-3" /> : <PiCaretRightBold className="h-3 w-3" />}
              </button>

              {editId === sc.SubCategoryId ? (
                <>
                  <Input size="sm" value={editName} onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate(sc.SubCategoryId)} autoFocus className="flex-1" />
                  <ActionIcon size="sm" variant="flat" color="success" onClick={() => handleUpdate(sc.SubCategoryId)}>
                    <PiCheckBold className="h-3.5 w-3.5" />
                  </ActionIcon>
                  <ActionIcon size="sm" variant="flat" color="danger" onClick={() => setEditId(null)}>
                    <PiXBold className="h-3.5 w-3.5" />
                  </ActionIcon>
                </>
              ) : (
                <>
                  <Text className="flex-1 text-sm font-medium text-gray-700">{sc.SubCategoryName}</Text>
                  {hasChildren && (
                    <Badge variant="flat" color="secondary" className="text-[10px]">{sc.children.length}</Badge>
                  )}
                  <Text className="text-xs text-gray-400">#{sc.SequenceNumber}</Text>
                  <ActionIcon size="sm" variant="text" onClick={() => { setEditId(sc.SubCategoryId); setEditName(sc.SubCategoryName); }}>
                    <PiPencilSimpleDuotone className="h-3.5 w-3.5 text-gray-400" />
                  </ActionIcon>
                  <ActionIcon size="sm" variant="text" onClick={() => handleDelete(sc.SubCategoryId)}>
                    <PiTrashDuotone className="h-3.5 w-3.5 text-gray-400" />
                  </ActionIcon>
                </>
              )}
            </div>

            {/* Level 3 */}
            {isExpanded && (
              <SubCategory1List items={sc.children} parentSubCategoryId={sc.SubCategoryId} onMutate={onMutate} />
            )}
          </div>
        );
      })}

      {creating ? (
        <InlineCreateRow placeholder="New sub-category name..." onSave={handleCreate} onCancel={() => setCreating(false)} />
      ) : (
        <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-primary hover:bg-primary/5">
          <PiPlusBold className="h-3 w-3" /> Add Sub Category
        </button>
      )}
    </div>
  );
}

// ─── Level 1: Category Table ───────────────────────────────────────
export default function TaxonomyExpandable({ categoryType, title, description }: Props) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [creating, setCreating] = useState(false);

  const queryKey = ['taxonomy-tree', categoryType];
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchTree(categoryType),
  });

  const tree: Category[] = data?.tree || [];
  const filtered = search
    ? tree.filter((c) => c.CategoryName.toLowerCase().includes(search.toLowerCase()))
    : tree;

  function invalidate() {
    queryClient.invalidateQueries({ queryKey });
  }

  async function handleCreateCategory(name: string, seq: number) {
    const res = await taxonomyAction({
      action: 'create',
      table: 'MasterCategory',
      data: { CategoryName: name, SequenceNumber: seq, CategoryType: categoryType },
    });
    if (res.success) { toast.success('Category created'); invalidate(); setCreating(false); }
    else toast.error(res.error);
  }

  async function handleUpdateCategory(id: number) {
    const res = await taxonomyAction({
      action: 'update',
      table: 'MasterCategory',
      id,
      data: { CategoryName: editName },
    });
    if (res.success) { toast.success('Updated'); invalidate(); setEditId(null); }
    else toast.error(res.error);
  }

  async function handleDeleteCategory(id: number) {
    if (!confirm('Delete this category and all its sub-categories?')) return;
    const res = await taxonomyAction({ action: 'delete', table: 'MasterCategory', id });
    if (res.success) { toast.success('Deleted'); invalidate(); }
    else toast.error(res.error);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Title as="h4" className="text-lg font-semibold">{title}</Title>
          {description && <Text className="mt-0.5 text-sm text-gray-500">{description}</Text>}
        </div>
        <div className="flex items-center gap-3">
          <Input
            size="sm"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix={<PiMagnifyingGlassBold className="h-4 w-4 text-gray-400" />}
            className="w-56"
          />
          <Button size="sm" className="gap-1.5" onClick={() => setCreating(true)}>
            <PiPlusBold className="h-4 w-4" /> New Category
          </Button>
        </div>
      </div>

      {/* Tree view */}
      <div className="overflow-hidden rounded-lg border border-muted bg-white">
        {/* Header row */}
        <div className="flex items-center gap-3 border-b border-muted bg-gray-100/40 px-4 py-3">
          <div className="w-5" />
          <Text className="flex-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Category</Text>
          <Text className="w-24 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Subs</Text>
          <Text className="w-16 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Order</Text>
          <Text className="w-24 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Flags</Text>
          <Text className="w-20 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</Text>
        </div>

        {/* Create row */}
        {creating && (
          <div className="border-b border-muted px-4 py-2">
            <InlineCreateRow placeholder="New category name..." onSave={handleCreateCategory} onCancel={() => setCreating(false)} />
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-muted px-4 py-3">
              <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">No categories found</div>
        ) : (
          filtered.map((cat) => {
            const isExpanded = expandedId === cat.CategoryId;
            const totalSubs = cat.children.length;

            return (
              <div key={cat.CategoryId} className="border-b border-muted last:border-b-0">
                {/* Category row */}
                <div className={cn(
                  'flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50',
                  isExpanded && 'bg-gray-50/50'
                )}>
                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : cat.CategoryId)}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-gray-400 hover:text-gray-700"
                  >
                    {isExpanded
                      ? <PiCaretDownBold className="h-3.5 w-3.5" />
                      : <PiCaretRightBold className="h-3.5 w-3.5" />}
                  </button>

                  {/* Name */}
                  {editId === cat.CategoryId ? (
                    <div className="flex flex-1 items-center gap-2">
                      <Input size="sm" value={editName} onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateCategory(cat.CategoryId)} autoFocus className="flex-1" />
                      <ActionIcon size="sm" variant="flat" color="success" onClick={() => handleUpdateCategory(cat.CategoryId)}>
                        <PiCheckBold className="h-4 w-4" />
                      </ActionIcon>
                      <ActionIcon size="sm" variant="flat" color="danger" onClick={() => setEditId(null)}>
                        <PiXBold className="h-4 w-4" />
                      </ActionIcon>
                    </div>
                  ) : (
                    <>
                      <Text className="flex-1 text-sm font-semibold text-gray-900">{cat.CategoryName}</Text>
                      <div className="w-24 text-center">
                        <Badge variant="flat" color="secondary" className="text-xs">{totalSubs}</Badge>
                      </div>
                      <Text className="w-16 text-center text-xs text-gray-400">#{cat.SequenceNumber}</Text>
                      <div className="flex w-24 items-center justify-center gap-1">
                        {cat.IsBodyMeasurementRequired && <Badge variant="flat" color="info" className="text-[9px] px-1">Body</Badge>}
                        {cat.IsAuditionRequired && <Badge variant="flat" color="warning" className="text-[9px] px-1">Aud.</Badge>}
                        {cat.IsVocalCategory && <Badge variant="flat" color="success" className="text-[9px] px-1">Vocal</Badge>}
                      </div>
                      <div className="flex w-20 items-center justify-end gap-1">
                        <ActionIcon size="sm" variant="outline"
                          onClick={() => { setEditId(cat.CategoryId); setEditName(cat.CategoryName); }}>
                          <PiPencilSimpleDuotone className="h-4 w-4" />
                        </ActionIcon>
                        <ActionIcon size="sm" variant="outline" className="text-red-500"
                          onClick={() => handleDeleteCategory(cat.CategoryId)}>
                          <PiTrashDuotone className="h-4 w-4" />
                        </ActionIcon>
                      </div>
                    </>
                  )}
                </div>

                {/* Expanded: SubCategories */}
                {isExpanded && (
                  <div className="bg-gray-50/30 pb-3">
                    <SubCategoryList
                      items={cat.children}
                      parentCategoryId={cat.CategoryId}
                      onMutate={invalidate}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Text className="text-xs text-gray-400">
        {filtered.length} categor{filtered.length !== 1 ? 'ies' : 'y'} • {categoryType}
      </Text>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import cn from '@/utils/class-names';
import { PiXBold } from 'react-icons/pi';

/* ── Types ── */
interface Category {
  id: number;
  name: string;
}

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: {
    type: string;
    categoryId?: number;
    subCategoryId?: number;
    selectedCategoryIds?: number[];
  }) => void;
}

export default function FilterModal({ open, onClose, onApply }: FilterModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  // Load categories from our direct DB API
  useEffect(() => {
    if (open && categories.length === 0) {
      loadCategories();
    }
  }, [open]);

  async function loadCategories() {
    setLoading(true);
    try {
      const res = await axios.get('/api/user/categories');
      if (res.data?.ok && Array.isArray(res.data.data)) {
        setCategories(res.data.data);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }

  function toggleCategory(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleReset() {
    setSelectedIds(new Set());
  }

  function handleApply() {
    const ids = Array.from(selectedIds);
    if (ids.length === 1) {
      onApply({ type: 'All', categoryId: ids[0], selectedCategoryIds: ids });
    } else if (ids.length > 1) {
      onApply({ type: 'All', selectedCategoryIds: ids });
    } else {
      onApply({ type: 'All' });
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[99] bg-black/40 transition-opacity"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div className="fixed inset-x-0 bottom-0 z-[100] flex flex-col rounded-t-2xl bg-white shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] md:inset-x-auto md:left-1/2 md:w-[440px] md:-translate-x-1/2">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              Reset
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <PiXBold className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Category grid */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-[#F26B50]" />
            </div>
          ) : categories.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              No categories available
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => {
                const isSelected = selectedIds.has(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={cn(
                      'rounded-full border px-4 py-2.5 text-sm font-medium transition-all',
                      isSelected
                        ? 'border-[#F26B50] bg-[#F26B50] text-white shadow-sm'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Apply button */}
        <div className="border-t border-gray-100 px-5 pb-8 pt-4">
          <button
            onClick={handleApply}
            className="w-full rounded-full bg-[#F26B50] py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#e55d43] active:bg-[#d4533a]"
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
}

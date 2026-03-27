'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import cn from '@/utils/class-names';
import {
  PiArrowLeftBold,
  PiCrosshairLight,
} from 'react-icons/pi';

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
  }) => void;
}

/* ── Duration options (from API master data) ── */
const DURATION_OPTIONS = [
  { id: 1, name: '15 min' },
  { id: 2, name: 'Less than a Week' },
  { id: 3, name: '1 Hour' },
  { id: 4, name: '30 min' },
  { id: 5, name: 'Less than 15 Days' },
  { id: 6, name: 'More than a Month' },
];

export default function FilterModal({ open, onClose, onApply }: FilterModalProps) {
  const [location, setLocation] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [companyCategories, setCompanyCategories] = useState<Category[]>([]);
  const [individualCategories, setIndividualCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<{
    type: 'Company' | 'Individual';
    id: number;
  } | null>(null);
  const [loadingCats, setLoadingCats] = useState(false);

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('su_register_token') || ''
      : '';

  // Load categories when modal opens
  useEffect(() => {
    if (open && companyCategories.length === 0) {
      loadAllCategories();
    }
  }, [open]);

  async function loadAllCategories() {
    setLoadingCats(true);
    try {
      const [compRes, indRes] = await Promise.all([
        axios.post('/api/user', {
          endpoint: 'GetListByTypeName',
          token,
          data: { typeName: 'CompanyCategory' },
        }),
        axios.post('/api/user', {
          endpoint: 'GetListByTypeName',
          token,
          data: { typeName: 'IndividualCategory' },
        }),
      ]);

      const compRd = compRes.data?.responseData;
      if (Array.isArray(compRd)) {
        setCompanyCategories(
          compRd.map((c: { Value: number; Name: string }) => ({
            id: c.Value,
            name: c.Name.trim(),
          }))
        );
      }

      const indRd = indRes.data?.responseData;
      if (Array.isArray(indRd)) {
        setIndividualCategories(
          indRd.map((c: { Value: number; Name: string }) => ({
            id: c.Value,
            name: c.Name.trim(),
          }))
        );
      }
    } catch {
      /* silent */
    } finally {
      setLoadingCats(false);
    }
  }

  function handleReset() {
    setLocation('');
    setSelectedDuration(null);
    setSelectedCategory(null);
  }

  function handleApply() {
    if (selectedCategory) {
      onApply({
        type: selectedCategory.type,
        categoryId: selectedCategory.id,
      });
    } else {
      onApply({ type: 'All' });
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-[15px] font-medium text-red-500"
        >
          <PiArrowLeftBold className="h-4 w-4" />
          Back
        </button>
        <h2 className="text-[17px] font-semibold text-gray-900">Filter</h2>
        <button
          onClick={handleReset}
          className="text-[15px] font-medium text-red-500"
        >
          Reset
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 pb-28">
        {/* Location search */}
        <div className="mt-5">
          <input
            type="text"
            placeholder="Search location..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[15px] text-gray-900 outline-none placeholder:text-gray-400 focus:border-gray-300 focus:bg-white"
          />
          <button className="mt-2.5 flex items-center gap-2 text-[14px] font-medium text-red-500">
            <PiCrosshairLight className="h-4 w-4" />
            Use my current location
          </button>
        </div>

        {/* Duration */}
        <div className="mt-7">
          <h3 className="text-[17px] font-semibold text-gray-900">Duration</h3>
          <div className="mt-3 flex flex-col gap-1">
            {DURATION_OPTIONS.map((dur) => (
              <button
                key={dur.id}
                onClick={() =>
                  setSelectedDuration(
                    selectedDuration === dur.id ? null : dur.id
                  )
                }
                className="flex items-center gap-3 py-2.5"
              >
                <div
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors',
                    selectedDuration === dur.id
                      ? 'border-red-500 bg-red-500'
                      : 'border-gray-300'
                  )}
                >
                  {selectedDuration === dur.id && (
                    <div className="h-2 w-2 rounded-full bg-white" />
                  )}
                </div>
                <span className="text-[15px] text-gray-700">{dur.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="mt-7">
          <h3 className="text-[17px] font-semibold text-gray-900">
            Categories
          </h3>

          {loadingCats ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
            </div>
          ) : (
            <>
              {/* Company categories */}
              {companyCategories.length > 0 && (
                <div className="mt-4">
                  <p className="text-[13px] font-medium text-gray-500">
                    Company
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {companyCategories.map((cat) => (
                      <button
                        key={`comp-${cat.id}`}
                        onClick={() =>
                          setSelectedCategory(
                            selectedCategory?.id === cat.id &&
                              selectedCategory?.type === 'Company'
                              ? null
                              : { type: 'Company', id: cat.id }
                          )
                        }
                        className={cn(
                          'rounded-full border px-4 py-2 text-[13px] font-medium transition-colors',
                          selectedCategory?.id === cat.id &&
                            selectedCategory?.type === 'Company'
                            ? 'border-red-500 bg-red-500 text-white'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        )}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Individual categories */}
              {individualCategories.length > 0 && (
                <div className="mt-5">
                  <p className="text-[13px] font-medium text-gray-500">
                    Individual
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {individualCategories.map((cat) => (
                      <button
                        key={`ind-${cat.id}`}
                        onClick={() =>
                          setSelectedCategory(
                            selectedCategory?.id === cat.id &&
                              selectedCategory?.type === 'Individual'
                              ? null
                              : { type: 'Individual', id: cat.id }
                          )
                        }
                        className={cn(
                          'rounded-full border px-4 py-2 text-[13px] font-medium transition-colors',
                          selectedCategory?.id === cat.id &&
                            selectedCategory?.type === 'Individual'
                            ? 'border-red-500 bg-red-500 text-white'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        )}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Fixed Apply button at bottom */}
      <div className="fixed inset-x-0 bottom-0 bg-white px-5 pb-8 pt-3">
        <button
          onClick={handleApply}
          className="w-full rounded-full bg-[#F4613C] py-4 text-[16px] font-semibold text-white transition-colors hover:bg-[#e5532e] active:bg-[#d44a27]"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

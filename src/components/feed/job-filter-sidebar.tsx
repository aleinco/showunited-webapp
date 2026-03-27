'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import cn from '@/utils/class-names';
import { PiMagnifyingGlassLight, PiCaretDownBold } from 'react-icons/pi';

interface Category {
  id: number;
  name: string;
}

interface SubCategory {
  id: number;
  categoryId: number;
  name: string;
}

interface JobFilterSidebarProps {
  /** 'Job' | 'Audition' — determines which category type to load */
  recordType: string;
  /** Current category filter */
  selectedCategoryId?: number;
  /** Current subcategory filter */
  selectedSubCategoryId?: number;
  onFilterChange: (filter: {
    categoryId?: number;
    subCategoryId?: number;
  }) => void;
}

/* Static subcategory data (shared with filter-bar) */
const SUB_CATEGORIES: SubCategory[] = [
  { id: 18, categoryId: 36, name: 'Producer' },
  { id: 19, categoryId: 36, name: 'Executive Producer' },
  { id: 20, categoryId: 36, name: 'General Manager' },
  { id: 21, categoryId: 36, name: 'Press agent' },
  { id: 22, categoryId: 36, name: 'Marketing Director' },
  { id: 23, categoryId: 36, name: 'Production Manager' },
  { id: 24, categoryId: 36, name: 'Orchestra Contractor' },
  { id: 25, categoryId: 36, name: 'Music Producer' },
  { id: 26, categoryId: 36, name: 'Arranger' },
  { id: 27, categoryId: 36, name: 'Casting Director' },
  { id: 28, categoryId: 36, name: 'Backstage Manager' },
  { id: 29, categoryId: 37, name: 'Modern' },
  { id: 31, categoryId: 37, name: 'Classic' },
  { id: 32, categoryId: 37, name: 'Hip-Hop' },
  { id: 33, categoryId: 37, name: 'Jazz' },
  { id: 34, categoryId: 37, name: 'Flamenco' },
  { id: 35, categoryId: 37, name: 'Contemporary' },
  { id: 36, categoryId: 37, name: 'Tap Dance' },
  { id: 37, categoryId: 37, name: 'Ballroom' },
  { id: 38, categoryId: 37, name: 'Oriental' },
  { id: 39, categoryId: 37, name: 'Pole dancing' },
  { id: 40, categoryId: 37, name: 'Rock' },
  { id: 41, categoryId: 37, name: 'Burlesque' },
  { id: 42, categoryId: 37, name: 'B-Boy' },
  { id: 43, categoryId: 38, name: 'Gymnastics' },
  { id: 44, categoryId: 38, name: 'Contortion' },
  { id: 45, categoryId: 38, name: 'Aerial' },
  { id: 53, categoryId: 40, name: 'Pop' },
  { id: 54, categoryId: 40, name: 'Rock' },
  { id: 55, categoryId: 40, name: 'Opera/Classic' },
  { id: 56, categoryId: 40, name: 'Blues' },
  { id: 57, categoryId: 40, name: 'Jazz' },
  { id: 58, categoryId: 40, name: 'Hip Hop' },
  { id: 59, categoryId: 40, name: 'Country' },
  { id: 60, categoryId: 40, name: 'Musical theatre' },
  { id: 64, categoryId: 41, name: 'Lighting' },
  { id: 65, categoryId: 41, name: 'Sound Engineer' },
  { id: 66, categoryId: 41, name: 'Live Sound Engineer' },
  { id: 67, categoryId: 41, name: 'Rigging' },
  { id: 68, categoryId: 41, name: 'Carpenters' },
  { id: 69, categoryId: 41, name: 'Costumes' },
  { id: 70, categoryId: 41, name: 'Hair' },
  { id: 71, categoryId: 41, name: 'Make-Up' },
  { id: 72, categoryId: 42, name: 'Lighting' },
  { id: 73, categoryId: 42, name: 'Set' },
  { id: 74, categoryId: 42, name: 'Sound' },
  { id: 75, categoryId: 42, name: 'Costumes' },
  { id: 76, categoryId: 42, name: 'Hair' },
  { id: 77, categoryId: 42, name: 'Make-Up' },
  { id: 90, categoryId: 19, name: 'Coperator' },
  { id: 61, categoryId: 50, name: 'Rental' },
  { id: 62, categoryId: 50, name: 'Sales' },
  { id: 63, categoryId: 50, name: 'Fabrication' },
  { id: 91, categoryId: 52, name: 'Singer Support' },
  { id: 92, categoryId: 53, name: 'Comedy drama' },
  { id: 86, categoryId: 63, name: 'Sub 1' },
  { id: 87, categoryId: 63, name: 'Sub 2' },
  { id: 89, categoryId: 68, name: 'Sub-Cat1' },
];

export default function JobFilterSidebar({
  recordType,
  selectedCategoryId,
  selectedSubCategoryId,
  onFilterChange,
}: JobFilterSidebarProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCat, setExpandedCat] = useState<number | null>(null);

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('su_register_token') || ''
      : '';

  useEffect(() => {
    loadCategories();
  }, [token, recordType]);

  async function loadCategories() {
    if (!token) return;
    setLoading(true);
    try {
      const typeName =
        recordType === 'Company' ? 'CompanyCategory' : 'IndividualCategory';
      const res = await axios.post('/api/user', {
        endpoint: 'GetListByTypeName',
        token,
        data: { typeName },
      });
      const rd = res.data?.responseData;
      if (Array.isArray(rd)) {
        setCategories(
          rd.map((c: { Value: number; Name: string }) => ({
            id: c.Value,
            name: c.Name.trim(),
          }))
        );
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }

  const filteredCategories = searchQuery
    ? categories.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categories;

  function getSubCategoriesForCat(catId: number): SubCategory[] {
    return SUB_CATEGORIES.filter((sc) => sc.categoryId === catId);
  }

  return (
    <div className="sticky top-20 hidden w-[280px] flex-shrink-0 lg:block">
      <div className="rounded-xl border border-gray-200 bg-white">
        {/* Category section */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-gray-900">
              Category
            </h3>
            <button
              onClick={() => setSearchQuery((prev) => (prev ? '' : ' '))}
              className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <PiMagnifyingGlassLight className="h-4 w-4" />
            </button>
          </div>

          {searchQuery !== '' && (
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery.trim()}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] outline-none placeholder:text-gray-400 focus:border-gray-300"
              autoFocus
            />
          )}

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-0.5">
              {/* "All" option */}
              <button
                onClick={() => onFilterChange({})}
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2 text-left text-[14px] transition-colors',
                  !selectedCategoryId
                    ? 'bg-gray-100 font-medium text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                All
              </button>

              {filteredCategories.map((cat) => {
                const subs = getSubCategoriesForCat(cat.id);
                const hasSubs = subs.length > 0;
                const isSelected = selectedCategoryId === cat.id;
                const isExpanded = expandedCat === cat.id;

                return (
                  <div key={cat.id}>
                    <button
                      onClick={() => {
                        if (hasSubs) {
                          setExpandedCat(isExpanded ? null : cat.id);
                        } else {
                          onFilterChange({ categoryId: cat.id });
                        }
                      }}
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[14px] transition-colors',
                        isSelected
                          ? 'bg-gray-100 font-medium text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      <span className="truncate">{cat.name}</span>
                      {hasSubs && (
                        <PiCaretDownBold
                          className={cn(
                            'h-3 w-3 flex-shrink-0 text-gray-400 transition-transform',
                            isExpanded && 'rotate-180'
                          )}
                        />
                      )}
                    </button>

                    {hasSubs && isExpanded && (
                      <div className="ml-3 border-l border-gray-100 pl-2">
                        {/* Select just the category (all subs) */}
                        <button
                          onClick={() =>
                            onFilterChange({ categoryId: cat.id })
                          }
                          className={cn(
                            'flex w-full items-center rounded-lg px-3 py-1.5 text-left text-[13px] transition-colors',
                            isSelected && !selectedSubCategoryId
                              ? 'font-medium text-gray-900'
                              : 'text-gray-500 hover:text-gray-700'
                          )}
                        >
                          All {cat.name}
                        </button>
                        {subs.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() =>
                              onFilterChange({
                                categoryId: cat.id,
                                subCategoryId: sub.id,
                              })
                            }
                            className={cn(
                              'flex w-full items-center rounded-lg px-3 py-1.5 text-left text-[13px] transition-colors',
                              selectedSubCategoryId === sub.id
                                ? 'font-medium text-gray-900'
                                : 'text-gray-500 hover:text-gray-700'
                            )}
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

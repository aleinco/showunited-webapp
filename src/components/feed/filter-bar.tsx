'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import cn from '@/utils/class-names';
import {
  PiCaretDownBold,
  PiFunnelLight,
  PiBriefcaseLight,
  PiMicrophoneStageLight,
  PiBuildingsLight,
  PiUserLight,
} from 'react-icons/pi';
import FilterModal from './filter-modal';

/* ── Types ── */
interface Category {
  id: number;
  name: string;
}

interface SubCategory {
  id: number;
  categoryId: number;
  name: string;
}

interface FilterBarProps {
  onFilterChange: (filter: {
    type: string;
    categoryId?: number;
    subCategoryId?: number;
    selectedCategoryIds?: number[];
  }) => void;
}

const TABS = [
  { key: 'Job', label: 'Job', icon: PiBriefcaseLight, typeName: 'IndividualCategory' },
  { key: 'Audition', label: 'Audition', icon: PiMicrophoneStageLight, typeName: 'IndividualCategory' },
  { key: 'Individual', label: 'Individual', icon: PiUserLight, typeName: 'IndividualCategory' },
  { key: 'Company', label: 'Company', icon: PiBuildingsLight, typeName: 'CompanyCategory' },
] as const;

/* ── Static subcategory data (from API master data) ── */
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

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [expandedCat, setExpandedCat] = useState<number | null>(null);
  const [categories, setCategories] = useState<Record<string, Category[]>>({});
  const [loadingCats, setLoadingCats] = useState<string | null>(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [appliedCategoryCount, setAppliedCategoryCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('su_register_token') || ''
      : '';

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setActiveTab(null);
        setExpandedCat(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Load categories for a tab
  async function loadCategories(typeName: string, tabKey: string) {
    if (categories[tabKey]) return;
    setLoadingCats(tabKey);
    try {
      const res = await axios.post('/api/user', {
        endpoint: 'GetListByTypeName',
        token,
        data: { typeName },
      });
      const rd = res.data?.responseData;
      if (Array.isArray(rd) && rd.length > 0) {
        setCategories((prev) => ({
          ...prev,
          [tabKey]: rd.map((c: { Value: number; Name: string }) => ({
            id: c.Value,
            name: c.Name.trim(),
          })),
        }));
      }
    } catch {
      /* fallback empty */
    } finally {
      setLoadingCats(null);
    }
  }

  function handleTabClick(tab: (typeof TABS)[number]) {
    if (activeTab === tab.key) {
      setActiveTab(null);
      setExpandedCat(null);
      return;
    }
    setActiveTab(tab.key);
    setExpandedCat(null);
    loadCategories(tab.typeName, tab.key);
  }

  function handleCategoryToggle(catId: number) {
    setExpandedCat(expandedCat === catId ? null : catId);
  }

  function handleCategorySelect(tabKey: string, categoryId: number) {
    onFilterChange({ type: tabKey, categoryId });
    setActiveTab(null);
    setExpandedCat(null);
  }

  function handleSubCategorySelect(tabKey: string, categoryId: number, subCategoryId: number) {
    onFilterChange({ type: tabKey, categoryId, subCategoryId });
    setActiveTab(null);
    setExpandedCat(null);
  }

  function getSubCategoriesForCat(catId: number): SubCategory[] {
    return SUB_CATEGORIES.filter((sc) => sc.categoryId === catId);
  }

  return (
    <>
      <div ref={dropdownRef} className="relative">
        <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-hide">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab)}
                className={cn(
                  'inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all',
                  isActive
                    ? 'border-[#F26B50] bg-[#F26B50] text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                <PiCaretDownBold
                  className={cn(
                    'h-3 w-3 transition-transform',
                    isActive && 'rotate-180'
                  )}
                />
              </button>
            );
          })}

          {/* Advanced filters button */}
          <button
            onClick={() => setFilterModalOpen(true)}
            className={cn(
              'ml-auto inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-sm transition-colors',
              appliedCategoryCount > 0
                ? 'border-[#F26B50] bg-[#F26B50] text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            )}
          >
            <PiFunnelLight className="h-4 w-4" />
            {appliedCategoryCount > 0 && (
              <span className="text-xs font-semibold">{appliedCategoryCount}</span>
            )}
          </button>
        </div>

        {/* Dropdown panel with accordion */}
        {activeTab && (
          <div className="absolute left-0 top-full z-50 mt-1 w-[280px] max-h-[70vh] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
            {loadingCats === activeTab ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
              </div>
            ) : categories[activeTab]?.length ? (
              <div className="py-1">
                {categories[activeTab].map((cat) => {
                  const subs = getSubCategoriesForCat(cat.id);
                  const hasSubs = subs.length > 0;
                  const isExpanded = expandedCat === cat.id;

                  return (
                    <div key={cat.id}>
                      {/* Category row */}
                      <div className="flex items-center">
                        <button
                          onClick={() =>
                            hasSubs
                              ? handleCategoryToggle(cat.id)
                              : handleCategorySelect(activeTab, cat.id)
                          }
                          className={cn(
                            'flex flex-1 items-center justify-between px-4 py-3 text-left text-[15px] transition-colors hover:bg-gray-50',
                            isExpanded ? 'bg-orange-50 text-gray-900 font-medium' : 'text-gray-800'
                          )}
                        >
                          <span>{cat.name}</span>
                          {hasSubs && (
                            <PiCaretDownBold
                              className={cn(
                                'h-3.5 w-3.5 text-gray-400 transition-transform',
                                isExpanded && 'rotate-180'
                              )}
                            />
                          )}
                        </button>
                      </div>

                      {/* Subcategories (expanded) */}
                      {hasSubs && isExpanded && (
                        <div className="bg-orange-50/50">
                          {subs.map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() =>
                                handleSubCategorySelect(activeTab, cat.id, sub.id)
                              }
                              className="block w-full px-4 py-2.5 pl-8 text-left text-[14px] text-gray-600 transition-colors hover:bg-orange-100/50 hover:text-gray-900"
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
            ) : (
              <div className="py-8 text-center text-sm text-gray-400">
                No categories found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter Modal */}
      <FilterModal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApply={(filters) => {
          setAppliedCategoryCount(filters.selectedCategoryIds?.length || 0);
          onFilterChange(filters);
          setFilterModalOpen(false);
        }}
      />
    </>
  );
}

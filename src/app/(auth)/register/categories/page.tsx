'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Title, Text } from 'rizzui';
import toast from 'react-hot-toast';
import axios from 'axios';
import { PiCaretDownBold, PiCheckBold, PiXBold } from 'react-icons/pi';

/* ── Types ── */
interface ListItem {
  id: number;
  name: string;
}

/* ── Static master data (fallback when API doesn't expose sub-levels) ── */
const SUB_CATEGORIES: { id: number; categoryId: number; name: string }[] = [
  // Production (Individual, id:36)
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
  // Dancer (id:37)
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
  // Acrobat (id:38)
  { id: 43, categoryId: 38, name: 'Gymnastics' },
  { id: 44, categoryId: 38, name: 'Contortion' },
  { id: 45, categoryId: 38, name: 'Aerial' },
  // Singer (id:40)
  { id: 53, categoryId: 40, name: 'Pop' },
  { id: 54, categoryId: 40, name: 'Rock' },
  { id: 55, categoryId: 40, name: 'Opera/Classic' },
  { id: 56, categoryId: 40, name: 'Blues' },
  { id: 57, categoryId: 40, name: 'Jazz' },
  { id: 58, categoryId: 40, name: 'Hip Hop' },
  { id: 59, categoryId: 40, name: 'Country' },
  { id: 60, categoryId: 40, name: 'Musical theatre' },
  // Technician (id:41)
  { id: 64, categoryId: 41, name: 'Lighting' },
  { id: 65, categoryId: 41, name: 'Sound Engineer' },
  { id: 66, categoryId: 41, name: 'Live Sound Engineer' },
  { id: 67, categoryId: 41, name: 'Rigging' },
  { id: 68, categoryId: 41, name: 'Carpenters' },
  { id: 69, categoryId: 41, name: 'Costumes' },
  { id: 70, categoryId: 41, name: 'Hair' },
  { id: 71, categoryId: 41, name: 'Make-Up' },
  // Developer (id:42)
  { id: 72, categoryId: 42, name: 'Lighting' },
  { id: 73, categoryId: 42, name: 'Set' },
  { id: 74, categoryId: 42, name: 'Sound' },
  { id: 75, categoryId: 42, name: 'Costumes' },
  { id: 76, categoryId: 42, name: 'Hair' },
  { id: 77, categoryId: 42, name: 'Make-Up' },
  // Company categories
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

const SUB_CATEGORIES_1: { id: number; subCategoryId: number; name: string }[] = [
  // Aerial (subCategoryId:45)
  { id: 17, subCategoryId: 45, name: 'Trapeze' },
  { id: 18, subCategoryId: 45, name: 'Rope' },
  { id: 19, subCategoryId: 45, name: 'Cloud' },
  { id: 20, subCategoryId: 45, name: 'Pole' },
  { id: 21, subCategoryId: 45, name: 'Hoop' },
  // Pop Singer (subCategoryId:53)
  { id: 53, subCategoryId: 53, name: 'New Pop' },
  // Sound Engineer (subCategoryId:65)
  { id: 44, subCategoryId: 65, name: 'Mixing' },
  { id: 45, subCategoryId: 65, name: 'Mastering' },
  { id: 46, subCategoryId: 65, name: 'Studio' },
  { id: 47, subCategoryId: 65, name: 'Recording' },
  { id: 48, subCategoryId: 65, name: 'RF' },
  // Live Sound Engineer (subCategoryId:66)
  { id: 49, subCategoryId: 66, name: 'FOH' },
  { id: 50, subCategoryId: 66, name: 'Wireless Microphone' },
  { id: 51, subCategoryId: 66, name: 'Monitor' },
  // Rental (subCategoryId:61)
  { id: 22, subCategoryId: 61, name: 'Lighting Equipment' },
  { id: 23, subCategoryId: 61, name: 'Sound Equipment' },
  { id: 24, subCategoryId: 61, name: 'Video Equipment' },
  { id: 25, subCategoryId: 61, name: 'Rigging Equipment' },
  { id: 26, subCategoryId: 61, name: 'Soft Goods' },
  { id: 27, subCategoryId: 61, name: 'Backstage' },
  { id: 28, subCategoryId: 61, name: 'Costumes' },
  { id: 29, subCategoryId: 61, name: 'Wigs' },
  // Sales (subCategoryId:62)
  { id: 36, subCategoryId: 62, name: 'Lighting Equipment' },
  { id: 37, subCategoryId: 62, name: 'Sound Equipment' },
  { id: 38, subCategoryId: 62, name: 'Video Equipment' },
  // Fabrication (subCategoryId:63)
  { id: 30, subCategoryId: 63, name: 'Set' },
  { id: 31, subCategoryId: 63, name: 'Rigging Equipment' },
  { id: 32, subCategoryId: 63, name: 'Softgoods' },
  { id: 33, subCategoryId: 63, name: 'Props' },
  { id: 34, subCategoryId: 63, name: 'Costumes' },
  { id: 35, subCategoryId: 63, name: 'Wigs' },
];

const VOCAL_CATEGORIES: ListItem[] = [
  { id: 1, name: 'Soprano' },
  { id: 7, name: 'New Vocal 1' },
  { id: 8, name: 'New Vocal' },
  { id: 2, name: 'Mezzo-Soprano' },
  { id: 3, name: 'Alto' },
  { id: 4, name: 'Tenor' },
  { id: 5, name: 'Baritone' },
  { id: 6, name: 'Bass' },
  { id: 9, name: 'Countertenor' },
];

// Singer category IDs that show vocals
const VOCAL_CATEGORY_IDS = [40];

/* ── Custom Dropdown ── */
function Dropdown({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: ListItem[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selectedLabel = options.find((o) => String(o.id) === value)?.name || '';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between rounded-lg border bg-gray-50 px-4 py-3.5 text-left text-[15px] transition-colors ${
          open
            ? 'border-[#F26B50] ring-1 ring-[#F26B50]'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <span className={selectedLabel ? 'text-gray-900' : 'text-gray-400'}>
          {selectedLabel || placeholder}
        </span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm">
          <PiCaretDownBold
            className={`h-3.5 w-3.5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {open && options.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                onChange(String(opt.id));
                setOpen(false);
              }}
              className={`block w-full px-4 py-3 text-left text-[15px] transition-colors hover:bg-gray-50 ${
                String(opt.id) === value
                  ? 'font-semibold text-[#F26B50]'
                  : 'text-gray-900'
              }`}
            >
              {opt.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Multi-select Dropdown with chips ── */
function MultiSelectDropdown({
  selected,
  onToggle,
  placeholder,
  options,
}: {
  selected: number[];
  onToggle: (id: number) => void;
  placeholder: string;
  options: ListItem[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex min-h-[52px] w-full flex-wrap items-center gap-1.5 rounded-lg border bg-gray-50 px-3 py-2 pr-12 text-left transition-colors ${
          open
            ? 'border-[#F26B50] ring-1 ring-[#F26B50]'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        {selected.length === 0 && (
          <span className="px-1 py-1 text-[15px] text-gray-400">
            {placeholder}
          </span>
        )}
        {selected.map((id) => {
          const opt = options.find((o) => o.id === id);
          if (!opt) return null;
          return (
            <span
              key={id}
              className="inline-flex items-center gap-1 rounded-full border border-[#F26B50] bg-[#F26B50]/5 px-2.5 py-1 text-sm font-medium text-[#F26B50]"
            >
              {opt.name}
              <PiXBold
                className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(id);
                }}
              />
            </span>
          );
        })}
        <span className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-sm">
          <PiCaretDownBold
            className={`h-3.5 w-3.5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {open && options.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {options.map((opt) => {
            const isSelected = selected.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onToggle(opt.id)}
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-[15px] transition-colors hover:bg-gray-50 ${
                  isSelected ? 'font-semibold text-[#F26B50]' : 'text-gray-900'
                }`}
              >
                <span>{opt.name}</span>
                {isSelected && <PiCheckBold className="h-4 w-4 text-[#F26B50]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Page ── */
export default function CategoriesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState<ListItem[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [subCategories, setSubCategories] = useState<ListItem[]>([]);
  const [subCategoryId, setSubCategoryId] = useState('');
  const [subCategories1, setSubCategories1] = useState<ListItem[]>([]);
  const [subCategory1Id, setSubCategory1Id] = useState('');
  const [selectedVocals, setSelectedVocals] = useState<number[]>([]);

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('su_register_token') || ''
      : '';

  const userType =
    typeof window !== 'undefined'
      ? localStorage.getItem('su_register_userType') || 'IndividualUser'
      : 'IndividualUser';

  const showVocals = VOCAL_CATEGORY_IDS.includes(Number(categoryId));

  // Load categories from API
  useEffect(() => {
    async function loadCategories() {
      try {
        const typeName =
          userType === 'CompanyUser' ? 'CompanyCategory' : 'IndividualCategory';
        const res = await axios.post('/api/user', {
          endpoint: 'GetListByTypeName',
          token,
          data: { typeName },
        });
        const rd = res.data?.responseData;
        if (Array.isArray(rd) && rd.length > 0) {
          setCategories(
            rd.map((c: { Value: number; Name: string }) => ({
              id: c.Value,
              name: c.Name,
            }))
          );
          return;
        }
      } catch {
        /* fallback */
      }
      // Fallback to hardcoded (shouldn't happen)
      setCategories([
        { id: 36, name: 'Production' },
        { id: 42, name: 'Developer' },
        { id: 37, name: 'Dancer' },
        { id: 38, name: 'Acrobat' },
        { id: 40, name: 'Singer' },
        { id: 41, name: 'Technician' },
        { id: 66, name: 'Audition' },
      ]);
    }
    loadCategories();
  }, [token, userType]);

  // When category changes -> load subcategories
  useEffect(() => {
    if (categoryId) {
      const subs = SUB_CATEGORIES.filter(
        (sc) => sc.categoryId === Number(categoryId)
      ).map((sc) => ({ id: sc.id, name: sc.name }));
      setSubCategories(subs);
    } else {
      setSubCategories([]);
    }
    setSubCategoryId('');
    setSubCategory1Id('');
    setSubCategories1([]);
    setSelectedVocals([]);
  }, [categoryId]);

  // When subcategory changes -> load sub-subcategories
  useEffect(() => {
    if (subCategoryId) {
      const subs1 = SUB_CATEGORIES_1.filter(
        (sc1) => sc1.subCategoryId === Number(subCategoryId)
      ).map((sc1) => ({ id: sc1.id, name: sc1.name }));
      setSubCategories1(subs1);
    } else {
      setSubCategories1([]);
    }
    setSubCategory1Id('');
  }, [subCategoryId]);

  function toggleVocal(id: number) {
    setSelectedVocals((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }

  async function handleContinue() {
    if (!categoryId) {
      toast.error('Please select a category');
      return;
    }

    setLoading(true);
    try {
      const endpoint =
        userType === 'CompanyUser'
          ? 'CompanyRegistration4'
          : 'IndividualRegistration2';

      const payload = {
        categoryId: Number(categoryId),
        subCategoryId: subCategoryId ? Number(subCategoryId) : null,
        subCategory1Id: subCategory1Id ? Number(subCategory1Id) : null,
        vocalCategoryId:
          selectedVocals.length > 0 ? selectedVocals.join(',') : null,
      };

      const res = await axios.post('/api/user', {
        endpoint,
        token,
        data: payload,
      });

      const data = res.data;
      if (data.responseCode === '1' || data.responseCode === '200') {
        toast.success('Categories saved');
        router.push('/register/measurements');
      } else {
        toast.error(data.responseMessage || 'Failed to save. Please try again.');
      }
    } catch {
      toast.error('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col px-4 py-6">
      {/* Top nav */}
      <div className="mb-8 flex items-center justify-between">
        <Link href="/signin">
          <img
            src="/logo-showunited.png"
            alt="Show United"
            className="h-10 w-auto"
          />
        </Link>
        <Text as="span" className="text-nowrap font-medium text-gray-500">
          Step 5 of 7
        </Text>
      </div>

      <div className="mx-auto w-full max-w-sm md:max-w-lg">
        <Title as="h3" className="mb-1 font-inter text-xl font-medium md:text-2xl">
          Select Categories{' '}
          <span className="text-[#F26B50]">*</span>
        </Title>
        <Text className="mb-6 text-sm text-gray-500">
          Choose your profile category and specialization
        </Text>

        <div className="space-y-4">
          {/* Main category */}
          <Dropdown
            value={categoryId}
            onChange={setCategoryId}
            placeholder="Profile"
            options={categories}
          />

          {/* Sub-category */}
          {subCategories.length > 0 && (
            <Dropdown
              value={subCategoryId}
              onChange={setSubCategoryId}
              placeholder="Sub Category"
              options={subCategories}
            />
          )}

          {/* Sub-category 1 (specialization) */}
          {subCategories1.length > 0 && (
            <Dropdown
              value={subCategory1Id}
              onChange={setSubCategory1Id}
              placeholder="Specialization"
              options={subCategories1}
            />
          )}

          {/* Vocals multi-select (Singer only) */}
          {showVocals && (
            <MultiSelectDropdown
              selected={selectedVocals}
              onToggle={toggleVocal}
              placeholder="Vocals"
              options={VOCAL_CATEGORIES}
            />
          )}
        </div>
      </div>

      {/* Bottom button */}
      <div className="mx-auto mt-auto w-full max-w-sm pt-8 md:max-w-lg">
        <Button
          onClick={handleContinue}
          disabled={!categoryId}
          isLoading={loading}
          className="w-full"
          size="lg"
        >
          Continue
        </Button>
        <button
          onClick={() => router.push('/register/measurements')}
          className="mt-3 block w-full text-center text-sm text-gray-400 hover:text-gray-600"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

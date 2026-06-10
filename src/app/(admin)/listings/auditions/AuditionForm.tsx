'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Select, Textarea, Button, Title } from 'rizzui';
import toast from 'react-hot-toast';

interface CategoryItem {
  id: number;
  name: string;
  type: string;
}

interface SubCategoryItem {
  id: number;
  categoryId: number;
  name: string;
}

function toDateString(raw: string | undefined | null): string {
  if (!raw) return '';
  const s = String(raw);
  if (s.includes('T') || s.includes(' ')) return s.slice(0, 10);
  return s.slice(0, 10);
}

function toTimeString(raw: string | undefined | null): string {
  if (!raw) return '';
  const m = /^(\d{1,2}):(\d{2})/.exec(String(raw));
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : '';
}

export default function AuditionForm({ auditionId }: { auditionId?: string }) {
  const router = useRouter();

  // Field state
  const [auditionTitle, setAuditionTitle] = useState('');
  const [productionName, setProductionName] = useState('');
  const [productionLocation, setProductionLocation] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [pincode, setPincode] = useState('');
  const [auditionStartDate, setAuditionStartDate] = useState('');
  const [auditionEndDate, setAuditionEndDate] = useState('');
  const [auditionStartTime, setAuditionStartTime] = useState('');
  const [auditionEndTime, setAuditionEndTime] = useState('');
  const [aboutAudition, setAboutAudition] = useState('');
  const [extraInformation, setExtraInformation] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // Category data
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategoryItem[]>([]);

  // UI state
  const [submitting, setSubmitting] = useState(false);

  // Load categories on mount
  useEffect(() => {
    fetch('/api/admin/categories')
      .then((r) => r.json())
      .then((d) => {
        setCategories(d.categories || []);
        setSubCategories(d.subCategories || []);
      })
      .catch(() => toast.error('Failed to load categories'));
  }, []);

  // Prefill when editing
  useEffect(() => {
    if (!auditionId) return;
    fetch('/api/admin/audition-detail?id=' + auditionId)
      .then((r) => r.json())
      .then((d) => {
        const rd = d.responseData;
        if (!rd) return;
        setAuditionTitle(rd.AuditionTitle || '');
        setProductionName(rd.ProductionName || '');
        setProductionLocation(rd.ProductionLocation || '');
        setCategoryId(rd.CategoryId != null ? String(rd.CategoryId) : '');
        setSubCategoryId(rd.SubCategoryId != null ? String(rd.SubCategoryId) : '');
        setAddress1(rd.Address1 || '');
        setAddress2(rd.Address2 || '');
        setCity(rd.City || '');
        setState(rd.State || '');
        setCountry(rd.Country || '');
        setPincode(rd.Pincode || '');
        setAuditionStartDate(toDateString(rd.AuditionStartDate));
        setAuditionEndDate(toDateString(rd.AuditionEndDate));
        setAuditionStartTime(toTimeString(rd.AuditionStartTime));
        setAuditionEndTime(toTimeString(rd.AuditionEndTime));
        setAboutAudition(rd.AboutAudition || '');
        setExtraInformation(rd.ExtraInformation || '');
      })
      .catch(() => toast.error('Failed to load audition details'));
  }, [auditionId]);

  const categoryOptions = categories.map((c) => ({ label: c.name, value: String(c.id) }));

  const subCategoryOptions = subCategories
    .filter((sc) => categoryId && sc.categoryId === Number(categoryId))
    .map((sc) => ({ label: sc.name, value: String(sc.id) }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!auditionTitle.trim()) {
      toast.error('Audition title is required');
      return;
    }
    if (!file) {
      toast.error('A photo is required');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (auditionId) fd.append('CompanyAuditionId', auditionId);
      fd.append('AuditionTitle', auditionTitle);
      fd.append('ProductionName', productionName);
      fd.append('ProductionLocation', productionLocation);
      fd.append('CategoryId', categoryId);
      fd.append('SubCategoryId', subCategoryId);
      fd.append('Address1', address1);
      fd.append('Address2', address2);
      fd.append('City', city);
      fd.append('State', state);
      fd.append('Country', country);
      fd.append('Pincode', pincode);
      fd.append('auditionStartDate', auditionStartDate);
      fd.append('auditionEndDate', auditionEndDate);
      fd.append('auditionStartTime', auditionStartTime);
      fd.append('auditionEndTime', auditionEndTime);
      fd.append('aboutAudition', aboutAudition);
      fd.append('extraInformation', extraInformation);
      if (file) fd.append('files', file);

      const res = await fetch('/api/admin/save-audition', { method: 'POST', body: fd });
      const j = await res.json();
      if (String(j.responseCode) === '200') {
        toast.success(auditionId ? 'Audition updated' : 'Audition created');
        router.push('/listings/auditions');
      } else {
        const stepPart = j.step ? ` (step ${j.step})` : '';
        toast.error((j.responseMessage || 'Save failed') + stepPart);
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      <Title as="h4" className="text-lg font-semibold">
        {auditionId ? 'Edit Audition' : 'Create Audition'}
      </Title>

      <div>
        <Input
          label="Audition Title"
          value={auditionTitle}
          onChange={(e) => setAuditionTitle(e.target.value)}
          required
        />
      </div>

      <div>
        <Input
          label="Production Name"
          value={productionName}
          onChange={(e) => setProductionName(e.target.value)}
        />
      </div>

      <div>
        <Input
          label="Production Location"
          value={productionLocation}
          onChange={(e) => setProductionLocation(e.target.value)}
        />
      </div>

      <div>
        <Select
          label="Category"
          options={categoryOptions}
          value={categoryId}
          onChange={(o: any) => {
            setCategoryId(o.value);
            setSubCategoryId('');
          }}
        />
      </div>

      <div>
        <Select
          label="Subcategory"
          options={subCategoryOptions}
          value={subCategoryId}
          onChange={(o: any) => setSubCategoryId(o.value)}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">Photo (required)</label>
        <input
          type="file"
          accept="image/*"
          className="text-sm text-gray-600"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>

      <div>
        <Input
          label="Address line 1"
          value={address1}
          onChange={(e) => setAddress1(e.target.value)}
        />
      </div>

      <div>
        <Input
          label="Address line 2"
          value={address2}
          onChange={(e) => setAddress2(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
        <Input label="State" value={state} onChange={(e) => setState(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
        <Input label="Post Code" value={pincode} onChange={(e) => setPincode(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          type="date"
          label="Start Date"
          value={auditionStartDate}
          onChange={(e) => setAuditionStartDate(e.target.value)}
        />
        <Input
          type="date"
          label="End Date"
          value={auditionEndDate}
          onChange={(e) => setAuditionEndDate(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          type="time"
          label="Start Time"
          value={auditionStartTime}
          onChange={(e) => setAuditionStartTime(e.target.value)}
        />
        <Input
          type="time"
          label="End Time"
          value={auditionEndTime}
          onChange={(e) => setAuditionEndTime(e.target.value)}
        />
      </div>

      <div>
        <Textarea
          label="About the Audition"
          rows={5}
          value={aboutAudition}
          onChange={(e) => setAboutAudition(e.target.value)}
        />
      </div>

      <div>
        <Textarea
          label="Extra Information"
          rows={3}
          value={extraInformation}
          onChange={(e) => setExtraInformation(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={submitting} className="bg-primary text-white">
        {submitting ? 'Saving…' : auditionId ? 'Save changes' : 'Create audition'}
      </Button>
    </form>
  );
}

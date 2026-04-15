'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Input, Select, Button, Text, Switch } from 'rizzui';
import { PiCaretLeftBold } from 'react-icons/pi';
import toast from 'react-hot-toast';

const GENDER_OPTIONS = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Non-binary', value: 'Non-binary' },
];

export default function PersonalInfoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    bithDate: '',
    countryName: '',
    cityName: '',
    countryCallingCode: '',
    phoneNumber: '',
    categoryId: 0,
    subCategoryId: 0,
    isInterestedInInternationalTouring: false,
  });

  const [userId, setUserId] = useState(0);

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('su_register_token') || ''
      : '';

  useEffect(() => {
    if (!token) return;

    let uid = 0;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      uid = Number(payload.IndividualUserId || 0);
    } catch {
      return;
    }
    setUserId(uid);

    // Load from direct SQL route
    axios
      .post('/api/user/profile-data', { action: 'get', userId: uid })
      .then((res) => {
        if (!res.data?.ok) return;
        const d = res.data.data;
        setForm({
          firstName: d.FirstName || '',
          lastName: d.LastName || '',
          gender: d.Gender || '',
          bithDate: d.BithDate || '',
          countryName: d.CountryId || '',
          cityName: d.CityId || '',
          countryCallingCode: d.CountryCallingCode || '',
          phoneNumber: d.PhoneNumber || '',
          categoryId: d.CategoryId || 0,
          subCategoryId: d.SubCategoryId || 0,
          isInterestedInInternationalTouring:
            d.IsInterestedInInternationalTouring || false,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await axios.post('/api/user/profile-data', {
        action: 'save',
        userId,
        data: {
          firstName: form.firstName,
          lastName: form.lastName,
          gender: form.gender,
          bithDate: form.bithDate,
          countryName: form.countryName,
          cityName: form.cityName,
          countryCallingCode: form.countryCallingCode,
          phoneNumber: form.phoneNumber,
          categoryId: form.categoryId,
          subCategoryId: form.subCategoryId,
          isInterestedInInternationalTouring:
            form.isInterestedInInternationalTouring,
        },
      });

      if (res.data?.ok) {
        toast.success('Personal info updated');
      } else {
        toast.error(res.data?.error || 'Failed to update');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setSaving(false);
    }
  }

  function updateField(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile header */}
      <div className="flex items-center border-b border-gray-100 px-4 py-3 md:hidden">
        <button onClick={() => router.back()} className="mr-3 text-[#F26B50]">
          <PiCaretLeftBold className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-gray-900">
          Personal Info
        </h1>
        <div className="w-8" />
      </div>

      {/* Desktop title */}
      <div className="hidden border-b border-gray-100 px-8 py-5 md:block">
        <h1 className="text-xl font-bold text-gray-900">Personal Info</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-lg space-y-5 px-5 py-6 md:px-8"
      >
        {/* Name row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-900">
              First Name
            </label>
            <Input
              size="lg"
              inputClassName="text-sm"
              value={form.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-900">
              Last Name
            </label>
            <Input
              size="lg"
              inputClassName="text-sm"
              value={form.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
            />
          </div>
        </div>

        {/* Gender */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-900">
            Gender
          </label>
          <Select
            size="lg"
            options={GENDER_OPTIONS}
            value={GENDER_OPTIONS.find((o) => o.value === form.gender) || null}
            onChange={(opt: any) => updateField('gender', opt?.value || '')}
            placeholder="Select gender"
            className="text-sm"
          />
        </div>

        {/* Birth Date */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-900">
            Date of Birth
          </label>
          <Input
            type="date"
            size="lg"
            inputClassName="text-sm"
            value={form.bithDate}
            onChange={(e) => updateField('bithDate', e.target.value)}
          />
        </div>

        {/* Country + City */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-900">
              Country
            </label>
            <Input
              size="lg"
              inputClassName="text-sm"
              placeholder="France"
              value={form.countryName}
              onChange={(e) => updateField('countryName', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-900">
              City
            </label>
            <Input
              size="lg"
              inputClassName="text-sm"
              placeholder="Paris"
              value={form.cityName}
              onChange={(e) => updateField('cityName', e.target.value)}
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-900">
            Phone Number
          </label>
          <div className="flex gap-3">
            <Input
              size="lg"
              inputClassName="text-sm text-center"
              className="w-20"
              placeholder="+33"
              value={form.countryCallingCode}
              onChange={(e) =>
                updateField('countryCallingCode', e.target.value)
              }
            />
            <Input
              size="lg"
              inputClassName="text-sm"
              className="flex-1"
              placeholder="612 345 678"
              value={form.phoneNumber}
              onChange={(e) => updateField('phoneNumber', e.target.value)}
            />
          </div>
        </div>

        {/* International Touring */}
        <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <div>
            <Text className="text-sm font-semibold text-gray-900">
              International Touring
            </Text>
            <Text className="text-xs text-gray-400">
              Available for work internationally
            </Text>
          </div>
          <Switch
            checked={form.isInterestedInInternationalTouring}
            onChange={() =>
              updateField(
                'isInterestedInInternationalTouring',
                !form.isInterestedInInternationalTouring
              )
            }
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          className="w-full rounded-lg text-sm font-semibold"
          style={{ backgroundColor: '#F26B50', color: 'white' }}
          isLoading={saving}
        >
          Save Changes
        </Button>
      </form>
    </div>
  );
}

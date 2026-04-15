'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Input, Textarea, Select, Button, Text } from 'rizzui';
import { PiCaretLeftBold } from 'react-icons/pi';
import toast from 'react-hot-toast';

const GENDER_OPTIONS = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Non-binary', value: 'Non-binary' },
  { label: 'Prefer not to say', value: 'Prefer not to say' },
];

export default function EditProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    aboutUs: '',
    website: '',
    gender: '',
  });

  const [profileImage, setProfileImage] = useState('');
  const [userId, setUserId] = useState(0);

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('su_register_token') || ''
      : '';

  /* ── Load current profile ── */
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

    // Load profile fields from direct SQL route
    const loadProfile = axios.post('/api/user/profile-data', {
      action: 'get',
      userId: uid,
    });

    // Load profile image from external API (it returns IndividualUserImageList)
    const loadImage = axios.post('/api/user', {
      endpoint: 'GetUserDetailById',
      token,
      data: { IndividualUserId: uid },
    });

    Promise.allSettled([loadProfile, loadImage])
      .then(([profileRes, imageRes]) => {
        // Profile fields from SQL
        if (profileRes.status === 'fulfilled' && profileRes.value.data?.ok) {
          const d = profileRes.value.data.data;
          setForm({
            firstName: d.FirstName || '',
            lastName: d.LastName || '',
            aboutUs: d.AboutUs || '',
            website: d.Website || '',
            gender: d.Gender || '',
          });
        }

        // Profile image from external API
        if (imageRes.status === 'fulfilled') {
          const d = imageRes.value.data?.responseData;
          if (d) {
            const images = d.IndividualUserImageList || [];
            const imgUrl = images[0]?.IndividualUserImage || d.ProfileImage || '';
            setProfileImage(imgUrl);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  /* ── Save profile fields via direct SQL ── */
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
          aboutUs: form.aboutUs,
          website: form.website,
          gender: form.gender,
        },
      });

      if (res.data?.ok) {
        toast.success('Profile updated successfully');
      } else {
        toast.error(res.data?.error || 'Failed to update');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setSaving(false);
    }
  }

  /* ── Photo upload ── */
  function handleChangePhotoClick() {
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('token', token);
      formData.append('endpoint', 'SaveIndividualUserImage');
      formData.append('files', file);

      const res = await axios.post('/api/user/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const rc = String(res.data?.responseCode);
      if (rc === '1' || rc === '200') {
        toast.success('Photo updated successfully');

        // Reload the image from external API
        try {
          const imgRes = await axios.post('/api/user', {
            endpoint: 'GetUserDetailById',
            token,
            data: { IndividualUserId: userId },
          });
          const d = imgRes.data?.responseData;
          if (d) {
            const images = d.IndividualUserImageList || [];
            const imgUrl = images[0]?.IndividualUserImage || d.ProfileImage || '';
            setProfileImage(imgUrl ? `${imgUrl}?t=${Date.now()}` : '');
          }
        } catch {
          // Image reload failed, but upload was successful
        }
      } else {
        toast.error(res.data?.responseMessage || 'Upload failed');
      }
    } catch {
      toast.error('Upload failed — connection error');
    } finally {
      setUploading(false);
      // Reset file input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function updateField(field: string, value: string) {
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
      {/* Hidden file input for photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Mobile header */}
      <div className="flex items-center border-b border-gray-100 px-4 py-3 md:hidden">
        <button
          onClick={() => router.back()}
          className="mr-3 text-[#F26B50]"
        >
          <PiCaretLeftBold className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-gray-900">
          Edit Profile
        </h1>
        <div className="w-8" />
      </div>

      {/* Desktop title */}
      <div className="hidden border-b border-gray-100 px-8 py-5 md:block">
        <h1 className="text-xl font-bold text-gray-900">Edit Profile</h1>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6 px-5 py-6 md:px-8">
        {/* Avatar + Change Photo */}
        <div className="flex items-center gap-5 rounded-2xl bg-gray-50 px-5 py-4">
          <div className="relative">
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="h-16 w-16 rounded-full border border-gray-200 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-orange-50 text-xl font-bold text-[#F26B50]">
                {form.firstName.charAt(0) || '?'}
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <Text className="text-sm font-semibold text-gray-900">
              {form.firstName} {form.lastName}
            </Text>
            <Text className="text-xs text-gray-400">ID: {userId}</Text>
          </div>
          <Button
            size="sm"
            className="rounded-lg text-xs font-semibold"
            style={{ backgroundColor: '#F26B50', color: 'white' }}
            onClick={handleChangePhotoClick}
            type="button"
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Change Photo'}
          </Button>
        </div>

        {/* Website */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-900">
            Website
          </label>
          <Input
            size="lg"
            placeholder="www.example.com"
            inputClassName="text-sm"
            value={form.website}
            onChange={(e) => updateField('website', e.target.value)}
          />
          <Text className="mt-1 text-xs text-gray-400">
            Add your personal or professional website
          </Text>
        </div>

        {/* Bio / About */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-900">
            Bio
          </label>
          <div className="relative">
            <Textarea
              size="lg"
              placeholder="Tell us about yourself..."
              textareaClassName="text-sm min-h-[100px] resize-none"
              value={form.aboutUs}
              onChange={(e) => {
                if (e.target.value.length <= 150) {
                  updateField('aboutUs', e.target.value);
                }
              }}
            />
            <span className="absolute bottom-2 right-3 text-xs text-gray-400">
              {form.aboutUs.length} / 150
            </span>
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
          <Text className="mt-1 text-xs text-gray-400">
            This won&apos;t be part of your public profile
          </Text>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          className="w-full rounded-lg text-sm font-semibold"
          style={{ backgroundColor: '#F26B50', color: 'white' }}
          isLoading={saving}
        >
          Submit
        </Button>
      </form>
    </div>
  );
}

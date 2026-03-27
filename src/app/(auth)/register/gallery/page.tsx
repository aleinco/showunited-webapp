'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button, Title, Text, ActionIcon } from 'rizzui';
import toast from 'react-hot-toast';
import axios from 'axios';
import {
  PiPlusBold,
  PiTrashBold,
  PiImageBold,
  PiEyeBold,
  PiPencilSimpleBold,
  PiUploadSimpleBold,
  PiDotsSixVerticalBold,
} from 'react-icons/pi';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/* ── Types ── */
interface GalleryImage {
  id: string;
  file: File;
  preview: string;
}

/* ── Sortable Image Card ── */
function SortableImageCard({
  image,
  index,
  onDelete,
}: {
  image: GalleryImage;
  index: number;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto' as any,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
    >
      <Image
        src={image.preview}
        alt={image.file.name}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 33vw, 200px"
      />

      {/* Drag handle — visible on hover */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1/2 top-1 z-10 -translate-x-1/2 cursor-grab rounded-full bg-black/40 p-1 opacity-0 backdrop-blur-sm transition-opacity active:cursor-grabbing group-hover:opacity-100"
      >
        <PiDotsSixVerticalBold className="h-4 w-4 text-white" />
      </div>

      {/* Delete overlay on hover */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
        <ActionIcon
          size="sm"
          variant="solid"
          color="danger"
          rounded="full"
          className="shadow-lg"
          onClick={onDelete}
        >
          <PiTrashBold className="h-4 w-4" />
        </ActionIcon>
      </div>

      {/* Main badge for first image */}
      {index === 0 && (
        <span className="absolute left-1.5 bottom-1.5 rounded-full bg-[#F26B50] px-2 py-0.5 text-[10px] font-bold text-white shadow">
          Main
        </span>
      )}
    </div>
  );
}

/* ── Page ── */
export default function GalleryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [images, setImages] = useState<GalleryImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('su_register_token') || ''
      : '';

  const userType =
    typeof window !== 'undefined'
      ? localStorage.getItem('su_register_userType') || 'IndividualUser'
      : 'IndividualUser';

  /* ── DnD sensors ── */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setImages((prev) => {
        const oldIndex = prev.findIndex((img) => img.id === active.id);
        const newIndex = prev.findIndex((img) => img.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }

  /* ── File handling ── */
  const handleFilesSelected = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const uploadedFiles = event.target.files;
      if (!uploadedFiles) return;

      const newImages: GalleryImage[] = Array.from(uploadedFiles)
        .filter((f) => f.type.startsWith('image/'))
        .map((file) => ({
          id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          preview: URL.createObjectURL(file),
        }));

      if (newImages.length === 0) {
        toast.error('Please select image files only');
        return;
      }

      setImages((prev) => [...prev, ...newImages]);

      // Reset input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    []
  );

  const handleDeleteImage = useCallback((id: string) => {
    setImages((prev) => {
      const idx = prev.findIndex((img) => img.id === id);
      if (idx >= 0) URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  const handleAddMore = () => {
    fileInputRef.current?.click();
  };

  /* ── Upload to API (multipart/form-data — real server) ── */
  async function handleContinue() {
    if (images.length === 0) {
      toast.error('Please add at least one image');
      return;
    }

    setLoading(true);
    try {
      // The SU API accepts "files" as multipart/form-data
      // Endpoints: IndividualRegistration3 / CompanyRegistration3 (during registration)
      //            SaveIndividualUserImage / SaveCompanyUserImage (existing users)
      const endpoint =
        userType === 'CompanyUser'
          ? 'CompanyRegistration3'
          : 'IndividualRegistration3';

      // Upload all images in one request
      const formData = new FormData();
      formData.append('token', token);
      formData.append('endpoint', endpoint);
      for (const img of images) {
        formData.append('files', img.file, img.file.name);
      }

      const res = await axios.post('/api/user/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000, // 60s for large files
      });

      const data = res.data;

      if (data.responseCode === '200' || data.responseCode === '1') {
        // Verify images were stored by checking the response
        const imageList =
          data.responseData?.IndividualUserImageList ||
          data.responseData?.CompanyUserImageList ||
          [];

        const uploadedCount = imageList.length;

        toast.success(
          `${uploadedCount} image(s) uploaded to the server successfully`
        );

        // Store uploaded image URLs for potential use later
        if (typeof window !== 'undefined' && imageList.length > 0) {
          localStorage.setItem(
            'su_register_images',
            JSON.stringify(
              imageList.map(
                (img: any) =>
                  img.IndividualUserImage || img.CompanyUserImage || ''
              )
            )
          );
        }

        router.push('/home');
      } else {
        toast.error(
          data.responseMessage || 'Failed to upload images. Please try again.'
        );
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.responseMessage ||
        err?.message ||
        'Connection error';
      toast.error(`Upload failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col px-4 py-6">
      {/* Top nav — same style as other registration steps */}
      <div className="mb-8 flex items-center justify-between">
        <Link href="/signin">
          <img
            src="/logo-showunited.png"
            alt="Show United"
            className="h-10 w-auto"
          />
        </Link>
        <Text as="span" className="text-nowrap font-medium text-gray-500">
          Step 7 of 7
        </Text>
      </div>

      <div className="mx-auto w-full max-w-sm md:max-w-lg">
        <Title
          as="h3"
          className="mb-4 font-inter text-xl font-medium md:text-2xl"
        >
          Image & Gallery profile
        </Title>

        {/* Tabs: Edit / Preview */}
        <div className="mb-6 flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`flex-1 pb-3 text-center text-[15px] font-medium transition-colors ${
              activeTab === 'edit'
                ? 'border-b-2 border-[#F26B50] text-[#F26B50]'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <PiPencilSimpleBold className="h-4 w-4" />
              Edit
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex-1 pb-3 text-center text-[15px] font-medium transition-colors ${
              activeTab === 'preview'
                ? 'border-b-2 border-[#F26B50] text-[#F26B50]'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <PiEyeBold className="h-4 w-4" />
              Preview
            </span>
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFilesSelected}
        />

        {activeTab === 'edit' ? (
          /* ── EDIT TAB ── */
          <div>
            {images.length === 0 ? (
              /* Empty state — dropzone matching mobile design */
              <div className="mb-6 grid grid-cols-2 gap-3">
                {/* Main drop zone with dashed border */}
                <button
                  type="button"
                  onClick={handleAddMore}
                  className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-400 bg-white transition-colors hover:border-[#F26B50] hover:bg-[#F26B50]/5"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F26B50] shadow-md">
                    <PiPlusBold className="h-5 w-5 text-white" />
                  </span>
                </button>

                {/* Add More card */}
                <button
                  type="button"
                  onClick={handleAddMore}
                  className="flex aspect-square flex-col items-center justify-center rounded-xl border border-gray-200 bg-white transition-colors hover:border-[#F26B50]/30 hover:bg-[#F26B50]/5"
                >
                  <span className="mb-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-[#F26B50]/10">
                    <PiPlusBold className="h-5 w-5 text-[#F26B50]" />
                  </span>
                  <span className="text-sm font-medium text-[#F26B50]">
                    Add More
                  </span>
                </button>
              </div>
            ) : (
              /* Sortable image grid */
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={images.map((img) => img.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="mb-6 grid grid-cols-3 gap-3">
                    {images.map((img, index) => (
                      <SortableImageCard
                        key={img.id}
                        image={img}
                        index={index}
                        onDelete={() => handleDeleteImage(img.id)}
                      />
                    ))}

                    {/* Add More card */}
                    <button
                      type="button"
                      onClick={handleAddMore}
                      className="flex aspect-square flex-col items-center justify-center rounded-xl border border-gray-200 bg-white transition-colors hover:border-[#F26B50]/30 hover:bg-[#F26B50]/5"
                    >
                      <span className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-[#F26B50]/10">
                        <PiPlusBold className="h-5 w-5 text-[#F26B50]" />
                      </span>
                      <span className="text-xs font-medium text-[#F26B50]">
                        Add More
                      </span>
                    </button>
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {images.length > 0 && (
              <Text className="mb-4 text-center text-sm text-gray-500">
                {images.length} image{images.length > 1 ? 's' : ''} selected
                {' \u2022 '}
                Drag to reorder
              </Text>
            )}
          </div>
        ) : (
          /* ── PREVIEW TAB ── */
          <div className="mb-6">
            {images.length === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50/50">
                <PiImageBold className="mb-3 h-12 w-12 text-gray-300" />
                <Text className="text-sm text-gray-400">
                  No images added yet
                </Text>
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  className="mt-2 text-sm font-medium text-[#F26B50] hover:underline"
                >
                  Go to Edit tab to add images
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Featured / main image */}
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-gray-200">
                  <Image
                    src={images[0].preview}
                    alt="Main profile image"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 500px"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-[#F26B50] px-3 py-1 text-xs font-bold text-white shadow">
                    Main Photo
                  </span>
                </div>

                {/* Rest of images in a row */}
                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {images.slice(1).map((img, index) => (
                      <div
                        key={`preview-${index}`}
                        className="relative aspect-square overflow-hidden rounded-lg border border-gray-200"
                      >
                        <Image
                          src={img.preview}
                          alt={`Gallery image ${index + 2}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 25vw, 120px"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bottom button */}
        <div className="mt-6">
          <Button
            onClick={handleContinue}
            disabled={images.length === 0}
            isLoading={loading}
            className="w-full"
            size="lg"
          >
            Continue
          </Button>
          <button
            onClick={() => router.push('/home')}
            className="mt-3 block w-full text-center text-sm text-gray-400 hover:text-gray-600"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}


'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from 'rizzui';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  PiXBold,
  PiImagesLight,
  PiFolderSimpleLight,
} from 'react-icons/pi';

interface GalleryImage {
  id: number;
  image: string;
  thumbnail: string;
  date: string;
}

type Tab = 'fotos' | 'colecciones';

function getUserId(): string | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('su_register_token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.IndividualUserId || payload.CompanyUserId || null;
  } catch {
    return null;
  }
}

export default function UserGalleryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('fotos');
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchImages = useCallback(async () => {
    const userId = getUserId();
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get('/api/user/gallery', {
        params: { userId },
      });
      if (res.data?.ok) {
        setImages(res.data.images || []);
      }
    } catch (err) {
      console.error('Failed to load gallery:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  async function handleDelete(imageId: number) {
    const userId = getUserId();
    if (!userId) return;

    setDeletingId(imageId);
    try {
      const res = await axios.delete('/api/user/gallery', {
        data: { imageId, userId },
      });
      if (res.data?.ok) {
        setImages((prev) => prev.filter((img) => img.id !== imageId));
        toast.success('Photo deleted');
      } else {
        toast.error('Failed to delete photo');
      }
    } catch {
      toast.error('Failed to delete photo');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Mobile header with X close button */}
      <div className="flex items-center border-b border-gray-100 px-4 py-3 md:hidden">
        <button
          onClick={() => router.back()}
          className="mr-3 text-gray-700"
        >
          <PiXBold className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-gray-900">
          Gallery
        </h1>
        <div className="w-8" />
      </div>

      {/* Desktop title */}
      <div className="hidden border-b border-gray-100 px-8 py-5 md:block">
        <h1 className="text-xl font-bold text-gray-900">Gallery</h1>
      </div>

      {/* Tab bar with coral underline */}
      <div className="border-b border-gray-100">
        <div className="mx-auto flex max-w-lg">
          <button
            onClick={() => setActiveTab('fotos')}
            className={`relative flex-1 py-3 text-center text-sm font-semibold transition-colors ${
              activeTab === 'fotos' ? 'text-[#F26B50]' : 'text-gray-400'
            }`}
          >
            Fotos
            {activeTab === 'fotos' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#F26B50]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('colecciones')}
            className={`relative flex-1 py-3 text-center text-sm font-semibold transition-colors ${
              activeTab === 'colecciones' ? 'text-[#F26B50]' : 'text-gray-400'
            }`}
          >
            Colecciones
            {activeTab === 'colecciones' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#F26B50]" />
            )}
          </button>
        </div>
      </div>

      {/* Fotos tab content */}
      {activeTab === 'fotos' && (
        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader variant="spinner" size="xl" />
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
                <PiImagesLight className="h-8 w-8 text-gray-300" />
              </div>
              <p className="mb-1 text-sm font-semibold text-gray-900">
                No photos yet
              </p>
              <p className="text-sm text-gray-400">
                Photos you upload will appear here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-[2px] md:gap-1">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="group relative aspect-square overflow-hidden bg-gray-100"
                >
                  <img
                    src={img.thumbnail || img.image}
                    alt=""
                    className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
                    loading="lazy"
                  />
                  {/* Delete (x) button overlay — top-right */}
                  <button
                    onClick={() => handleDelete(img.id)}
                    disabled={deletingId === img.id}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/70 group-hover:opacity-100 disabled:opacity-50"
                    title="Delete photo"
                  >
                    {deletingId === img.id ? (
                      <div className="h-3 w-3 animate-spin rounded-full border border-white/40 border-t-white" />
                    ) : (
                      <PiXBold className="h-3 w-3" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Colecciones tab content */}
      {activeTab === 'colecciones' && (
        <div className="flex-1">
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
              <PiFolderSimpleLight className="h-8 w-8 text-gray-300" />
            </div>
            <p className="mb-1 text-sm font-semibold text-gray-900">
              No collections yet
            </p>
            <p className="text-sm text-gray-400">
              Collections you create will appear here
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

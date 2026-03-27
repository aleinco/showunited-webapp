'use client';

import Link from 'next/link';
import cn from '@/utils/class-names';
import { PiImagesLight } from 'react-icons/pi';

interface PhotoCardProps {
  userId: number;
  imageUrl: string | null;
  hasMultipleImages?: boolean;
  categoryName?: string | null;
  subCategoryName?: string | null;
  title?: string | null;
  className?: string;
}

export default function PhotoCard({
  userId,
  imageUrl,
  hasMultipleImages,
  categoryName,
  subCategoryName,
  title,
  className,
}: PhotoCardProps) {
  // Pass category info via query params so post page can display it
  const params = new URLSearchParams();
  if (categoryName) params.set('cat', categoryName);
  if (subCategoryName) params.set('sub', subCategoryName);
  if (title) params.set('title', title);
  const qs = params.toString();

  return (
    <Link
      href={`/post/${userId}${qs ? `?${qs}` : ''}`}
      className={cn('group relative block overflow-hidden bg-gray-100', className)}
    >
      <div className="aspect-square w-full">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-all duration-300 group-hover:scale-[1.03] group-hover:brightness-90"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-200">
            <span className="text-3xl text-gray-400">?</span>
          </div>
        )}
      </div>

      {/* Multiple images badge */}
      {hasMultipleImages && (
        <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md bg-black/50 backdrop-blur-sm">
          <PiImagesLight className="h-4 w-4 text-white" />
        </div>
      )}
    </Link>
  );
}

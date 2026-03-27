'use client';

import Link from 'next/link';
import cn from '@/utils/class-names';
import {
  PiBookmarkSimpleLight,
  PiBookmarkSimpleFill,
  PiMapPinLight,
  PiClockLight,
  PiBriefcaseLight,
  PiMicrophoneStageLight,
} from 'react-icons/pi';
import { useState } from 'react';

interface JobCardProps {
  recordId: number;
  recordType: string;
  title: string;
  categoryName?: string | null;
  subCategoryName?: string | null;
  imageUrl: string | null;
  birthDate?: string | null;
  /** Future fields — placeholders for when API returns them */
  description?: string | null;
  location?: string | null;
  duration?: string | null;
  companyName?: string | null;
  followers?: number | null;
  className?: string;
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return '1 month ago';
    return `${diffMonths} months ago`;
  } catch {
    return '';
  }
}

export default function JobCard({
  recordId,
  recordType,
  title,
  categoryName,
  subCategoryName,
  imageUrl,
  birthDate,
  description,
  location,
  duration,
  companyName,
  followers,
  className,
}: JobCardProps) {
  const [saved, setSaved] = useState(false);

  const params = new URLSearchParams();
  if (categoryName) params.set('cat', categoryName);
  if (subCategoryName) params.set('sub', subCategoryName);
  if (title) params.set('title', title);
  const qs = params.toString();

  const postedAgo = timeAgo(birthDate);
  const isJob = recordType?.toLowerCase() === 'job';
  const TypeIcon = isJob ? PiBriefcaseLight : PiMicrophoneStageLight;

  return (
    <div
      className={cn(
        'group relative rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md',
        className
      )}
    >
      <Link href={`/post/${recordId}${qs ? `?${qs}` : ''}`} className="block">
        {/* Top row: image + info + bookmark */}
        <div className="flex gap-4">
          {/* Avatar / Logo */}
          <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <TypeIcon className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[16px] font-semibold text-gray-900">
              {title || 'Untitled'}
            </h3>

            {/* Badges row */}
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium',
                  isJob
                    ? 'bg-orange-50 text-orange-600'
                    : 'bg-purple-50 text-purple-600'
                )}
              >
                <TypeIcon className="h-3 w-3" />
                {recordType}
              </span>

              {categoryName && (
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[12px] font-medium text-gray-600">
                  {categoryName}
                </span>
              )}

              {duration && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-[12px] font-medium text-gray-600">
                  <PiClockLight className="h-3 w-3" />
                  {duration}
                </span>
              )}
            </div>

            {/* Subcategory */}
            {subCategoryName && (
              <p className="mt-1 text-[13px] text-gray-500">
                {subCategoryName}
              </p>
            )}
          </div>
        </div>

        {/* Description (when available) */}
        {description && (
          <p className="mt-3 line-clamp-2 text-[14px] leading-relaxed text-gray-600">
            {description}
          </p>
        )}

        {/* Footer: location + posted ago */}
        <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-3">
          {location && (
            <span className="inline-flex items-center gap-1 text-[13px] text-gray-500">
              <PiMapPinLight className="h-3.5 w-3.5" />
              <span className="truncate">{location}</span>
            </span>
          )}

          {companyName && (
            <span className="text-[13px] font-medium text-gray-700">
              {companyName}
              {typeof followers === 'number' && (
                <span className="ml-1 font-normal text-gray-400">
                  · {followers} followers
                </span>
              )}
            </span>
          )}

          {postedAgo && (
            <span className="ml-auto text-[12px] text-gray-400">
              {postedAgo}
            </span>
          )}
        </div>
      </Link>

      {/* Bookmark button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setSaved(!saved);
        }}
        className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
      >
        {saved ? (
          <PiBookmarkSimpleFill className="h-5 w-5 text-gray-900" />
        ) : (
          <PiBookmarkSimpleLight className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}

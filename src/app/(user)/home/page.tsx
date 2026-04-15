'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import PhotoCard from '@/components/feed/photo-card';
import FilterBar from '@/components/feed/filter-bar';

/* ── Types ── */
interface FeedItem {
  RecordId: number;
  RecordType: string;
  Title: string;
  CategoryName?: string | null;
  SubCategoryName?: string | null;
  BithDate?: string | null;
  UserLogoList: Array<{
    UserLogoPath?: string;
    UserThumbnailLogoPath?: string;
  }>;
  IsMultipleImage: number;
}

interface PagingData {
  page: number;
  limit: number;
  total: number;
  nextPage: number | null;
}

/* ── Skeleton loader ── */
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-3 gap-[3px]">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square animate-pulse bg-gray-200"
        />
      ))}
    </div>
  );
}

/* ── Page ── */
export default function HomePage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<{
    type: string;
    categoryId?: number;
    subCategoryId?: number;
    selectedCategoryIds?: number[];
  }>({ type: 'All' });

  const observerRef = useRef<HTMLDivElement>(null);

  // Read token client-side only (avoids SSR mismatch)
  const [token, setToken] = useState('');
  useEffect(() => {
    setToken(localStorage.getItem('su_register_token') || '');
  }, []);

  /* ── Fetch feed ── */
  const fetchFeed = useCallback(
    async (pageNum: number, reset = false) => {
      if (!token) return; // wait until token is available

      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const res = await axios.post('/api/user/feed', {
          token,
          type: filter.type,
          categoryId: filter.categoryId || null,
          subCategoryId: filter.subCategoryId || null,
          page: pageNum,
        });

        const data = res.data;
        const newItems: FeedItem[] = data.responseData || [];
        const paging: PagingData = data.responsePagingData || {};

        if (reset) {
          setItems(newItems);
        } else {
          setItems((prev) => [...prev, ...newItems]);
        }

        setHasMore(!!paging.nextPage);
        setPage(pageNum);
      } catch {
        // silent fail
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [token, filter]
  );

  // Initial load + when filter changes
  useEffect(() => {
    fetchFeed(1, true);
  }, [fetchFeed]);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    if (!hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchFeed(page + 1);
        }
      },
      { threshold: 0.1 }
    );

    const el = observerRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasMore, loadingMore, page, fetchFeed]);

  /* ── Filter handler ── */
  function handleFilterChange(newFilter: {
    type: string;
    categoryId?: number;
    subCategoryId?: number;
    selectedCategoryIds?: number[];
  }) {
    setFilter(newFilter);
    setPage(1);
    setHasMore(true);
  }

  /* ── Get image URL from a feed item ── */
  function getImageUrl(item: FeedItem): string | null {
    if (!item.UserLogoList || item.UserLogoList.length === 0) return null;
    const first = item.UserLogoList[0];
    // Prefer thumbnail for grid (faster loading)
    return first.UserThumbnailLogoPath || first.UserLogoPath || null;
  }

  return (
    <div>
      {/* Filter bar */}
      <FilterBar onFilterChange={handleFilterChange} />

      {/* Photo grid */}
      {loading ? (
        <SkeletonGrid />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-lg font-medium text-gray-400">
            No results found
          </p>
          <p className="mt-1 text-sm text-gray-300">
            Try adjusting your filters
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-[3px]">
            {items.map((item) => (
              <PhotoCard
                key={`${item.RecordType}-${item.RecordId}`}
                userId={item.RecordId}
                imageUrl={getImageUrl(item)}
                hasMultipleImages={item.IsMultipleImage === 1}
                categoryName={item.CategoryName}
                subCategoryName={item.SubCategoryName}
                title={item.Title}
              />
            ))}
          </div>

          {/* Infinite scroll trigger */}
          {hasMore && (
            <div ref={observerRef} className="flex justify-center py-8">
              {loadingMore && (
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

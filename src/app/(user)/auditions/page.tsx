'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import cn from '@/utils/class-names';
import JobCard from '@/components/feed/job-card';
import JobFilterSidebar from '@/components/feed/job-filter-sidebar';
import {
  PiListBulletsLight,
  PiPaperPlaneTiltLight,
  PiBookmarkSimpleLight,
} from 'react-icons/pi';

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

const TABS = [
  { key: 'listings', label: 'All Auditions', icon: PiListBulletsLight },
  { key: 'applied', label: 'Applied', icon: PiPaperPlaneTiltLight },
  { key: 'saved', label: 'Saved', icon: PiBookmarkSimpleLight },
] as const;

/* ── Skeleton ── */
function SkeletonCards() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-gray-200 p-4"
        >
          <div className="flex gap-4">
            <div className="h-14 w-14 rounded-xl bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-2/3 rounded bg-gray-200" />
              <div className="h-4 w-1/3 rounded bg-gray-200" />
            </div>
          </div>
          <div className="mt-3 h-4 w-full rounded bg-gray-100" />
          <div className="mt-2 h-4 w-3/4 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

export default function AuditionsPage() {
  const [activeTab, setActiveTab] = useState<string>('listings');
  const [items, setItems] = useState<FeedItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [subCategoryId, setSubCategoryId] = useState<number | undefined>();

  const observerRef = useRef<HTMLDivElement>(null);

  const [token, setToken] = useState('');
  useEffect(() => {
    setToken(localStorage.getItem('su_register_token') || '');
  }, []);

  /* ── Fetch feed ── */
  const fetchFeed = useCallback(
    async (pageNum: number, reset = false) => {
      if (!token) return;

      if (reset) setLoading(true);
      else setLoadingMore(true);

      try {
        const res = await axios.post('/api/user/feed', {
          token,
          type: 'Audition',
          categoryId: categoryId || null,
          subCategoryId: subCategoryId || null,
          page: pageNum,
        });

        const data = res.data;
        const newItems: FeedItem[] = data.responseData || [];
        const paging = data.responsePagingData || {};

        if (reset) setItems(newItems);
        else setItems((prev) => [...prev, ...newItems]);

        setHasMore(!!paging.nextPage);
        setPage(pageNum);
      } catch {
        // silent
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [token, categoryId, subCategoryId]
  );

  useEffect(() => {
    fetchFeed(1, true);
  }, [fetchFeed]);

  // Infinite scroll
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

  /* ── Filter handler from sidebar ── */
  function handleSidebarFilter(filter: {
    categoryId?: number;
    subCategoryId?: number;
  }) {
    setCategoryId(filter.categoryId);
    setSubCategoryId(filter.subCategoryId);
    setPage(1);
    setHasMore(true);
  }

  function getImageUrl(item: FeedItem): string | null {
    if (!item.UserLogoList || item.UserLogoList.length === 0) return null;
    const first = item.UserLogoList[0];
    return first.UserThumbnailLogoPath || first.UserLogoPath || null;
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-4 pt-4 md:pt-6">
        <h1 className="text-2xl font-bold text-gray-900 px-4 md:px-0">Auditions</h1>
        <p className="mt-1 text-[14px] text-gray-500 px-4 md:px-0">
          Discover auditions and casting calls
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 px-4 md:px-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'inline-flex items-center gap-2 border-b-2 px-4 py-3 text-[14px] font-medium transition-colors',
                isActive
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content area: cards + sidebar */}
      <div className="mt-4 flex gap-6 px-4 md:px-0">
        {/* Main column: audition cards */}
        <div className="min-w-0 flex-1">
          {activeTab === 'listings' ? (
            loading ? (
              <SkeletonCards />
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-lg font-medium text-gray-400">
                  No auditions found
                </p>
                <p className="mt-1 text-sm text-gray-300">
                  Try adjusting your filters
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-4">
                  {items.map((item) => (
                    <JobCard
                      key={`${item.RecordType}-${item.RecordId}`}
                      recordId={item.RecordId}
                      recordType={item.RecordType || 'Audition'}
                      title={item.Title}
                      categoryName={item.CategoryName}
                      subCategoryName={item.SubCategoryName}
                      imageUrl={getImageUrl(item)}
                      birthDate={item.BithDate}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div
                    ref={observerRef}
                    className="flex justify-center py-8"
                  >
                    {loadingMore && (
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                    )}
                  </div>
                )}
              </>
            )
          ) : (
            /* Applied / Saved tabs — placeholder */
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-lg font-medium text-gray-400">
                {activeTab === 'applied'
                  ? 'No applications yet'
                  : 'No saved auditions'}
              </p>
              <p className="mt-1 text-sm text-gray-300">Coming soon</p>
            </div>
          )}
        </div>

        {/* Right sidebar: filters (desktop only) */}
        <JobFilterSidebar
          recordType="Audition"
          selectedCategoryId={categoryId}
          selectedSubCategoryId={subCategoryId}
          onFilterChange={handleSidebarFilter}
        />
      </div>
    </div>
  );
}

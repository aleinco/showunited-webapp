'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button, Title, Text, Badge } from 'rizzui';
import {
  PiArrowSquareOutBold,
  PiCheckBold,
  PiXBold,
  PiArrowsClockwiseBold,
} from 'react-icons/pi';
import toast from 'react-hot-toast';

interface Listing {
  id: number;
  title: string;
  category?: string;
  categoryId?: number;
  city?: string;
  country?: string;
  about?: string;
  createdAt?: string;
  source: string;
  sourceUrl?: string;
  kind: string;
}

const SOURCE_LABEL: Record<string, string> = {
  broadwayworld_auditions: 'BroadwayWorld · US',
  clandestino_es: 'Clandestino · ES',
  tony_comedie_fr: 'Tony Comédie · FR',
};

export default function PendingListingsPage() {
  const [rows, setRows] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pending-listings', { cache: 'no-store' });
      const json = await res.json();
      setRows(Array.isArray(json.listings) ? json.listings : []);
    } catch {
      toast.error('Error loading listings');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: number, action: 'approve' | 'reject') => {
    setBusy(id);
    try {
      const res = await fetch('/api/admin/pending-listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) throw new Error('failed');
      setRows((r) => r.filter((x) => x.id !== id));
      toast.success(action === 'approve' ? 'Published — now live ✓' : 'Rejected');
    } catch {
      toast.error('Action failed');
    }
    setBusy(null);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Title as="h4" className="text-lg font-semibold">
            Pending Casting Listings
          </Title>
          <Text className="mt-1 text-sm text-gray-500">
            Scraped musical auditions awaiting review · {rows.length} pending. Approve to publish (goes
            live in the feed); reject to discard.
          </Text>
        </div>
        <Button size="sm" variant="outline" onClick={load} isLoading={loading}>
          <PiArrowsClockwiseBold className="me-1.5 h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-300 dark:bg-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-300 dark:bg-gray-200">
                {['Source', 'Title', 'Category', 'Location', 'Apply', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                    No pending listings 🎉
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-200">
                    <td className="px-4 py-3">
                      <Badge variant="flat" color="info" className="whitespace-nowrap">
                        {SOURCE_LABEL[r.source] || r.source}
                      </Badge>
                    </td>
                    <td className="max-w-md px-4 py-3 text-sm font-medium text-gray-800">{r.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{r.category || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {[r.city, r.country].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {r.sourceUrl ? (
                        <a
                          href={r.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          Official <PiArrowSquareOutBold className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          color="success"
                          isLoading={busy === r.id}
                          onClick={() => act(r.id, 'approve')}
                        >
                          <PiCheckBold className="me-1 h-4 w-4" /> Publish
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          color="danger"
                          disabled={busy === r.id}
                          onClick={() => act(r.id, 'reject')}
                        >
                          <PiXBold className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

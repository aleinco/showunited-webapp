'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from 'rizzui';
import cn from '@/utils/class-names';
import { defaultColumns } from './column';
import MainTable from '@/components/core/table';
import WidgetCard from '@/components/core/cards/widget-card';
import { reportAnalyticsData } from '@/data/crm-dashboard-data';
import { useTanStackTable } from '@/components/core/table/custom/use-TanStack-Table';

export type ReportAnalyticsDataType = (typeof reportAnalyticsData)[0];

export default function ReportAnalytics({ className }: { className?: string }) {
  const { table } = useTanStackTable<ReportAnalyticsDataType>({
    tableData: reportAnalyticsData,
    columnConfig: defaultColumns,
    options: {
      initialState: {
        pagination: {
          pageIndex: 0,
          pageSize: 5,
        },
      },
      enableSorting: false,
      enableColumnResizing: false,
    },
  });

  return (
    <WidgetCard
      title="Report Analytics"
      headerClassName="items-center"
      className={cn('space-y-4', className)}
      action={
        <Link href={'#'}>
          <Button as="span" variant="text" className="underline">
            View All
          </Button>
        </Link>
      }
    >
      <MainTable
        table={table}
        variant="minimal"
        classNames={{
          container: '[&>table>thead>tr>th]:whitespace-nowrap',
        }}
      />
    </WidgetCard>
  );
}

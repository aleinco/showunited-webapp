'use client';

import WidgetCard from '@/components/core/cards/widget-card';
import DropdownAction from '@/components/core/charts/dropdown-action';
import { useTanStackTable } from '@/components/core/table/custom/use-TanStack-Table';
import cn from '@/utils/class-names';
import Table from '@/components/core/table';
import { activeAuctionsColumns } from './column';
import { activeAuctionsData } from '@/data/bidding-data';

const viewOptions = [
  {
    value: 'Daily',
    label: 'Daily',
  },
  {
    value: 'Monthly',
    label: 'Monthly',
  },
];

export type ActiveAuctionType = (typeof activeAuctionsData)[0];

export default function ActiveAuctions({ className }: { className?: string }) {
  const { table } = useTanStackTable<ActiveAuctionType>({
    tableData: activeAuctionsData,
    columnConfig: activeAuctionsColumns,
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

  function handleChange(viewType: string) {
    console.log('viewType', viewType);
  }

  return (
    <WidgetCard
      className={cn('@container', className)}
      title="Active Auctions"
      description="Updated 45 minutes ago"
      titleClassName="font-inter"
      action={
        <DropdownAction
          className="rounded-lg border"
          options={viewOptions}
          onChange={handleChange}
          dropdownClassName="!z-0"
        />
      }
    >
      <Table
        table={table}
        variant="modern"
        classNames={{
          container: 'mt-6 [&_th]:font-semibold',
          rowClassName: 'last:border-0',
        }}
      />
    </WidgetCard>
  );
}

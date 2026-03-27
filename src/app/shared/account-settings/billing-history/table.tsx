'use client';

import { billingHistoryData } from '@/data/billing-history';
import Table from '@/components/core/table';
import { useTanStackTable } from '@/components/core/table/custom/use-TanStack-Table';
import TableFooter from '@/components/core/table/footer';
import TablePagination from '@/components/core/table/pagination';
import { billingHistoryColumns } from './columns';

export type BillingHistoryDataType = (typeof billingHistoryData)[number];

export default function BillingHistoryTable({
  className,
}: {
  className?: string;
}) {
  const { table, setData } = useTanStackTable<BillingHistoryDataType>({
    tableData: billingHistoryData,
    columnConfig: billingHistoryColumns,
    options: {
      initialState: {
        pagination: {
          pageIndex: 0,
          pageSize: 10,
        },
      },
      meta: {
        handleDeleteRow: (row: any) => {
          setData((prev) => prev.filter((r) => r.id !== row.id));
          table.resetRowSelection();
        },
        handleMultipleDelete: (rows: any[]) => {
          setData((prev) => prev.filter((r) => !rows.includes(r)));
          table.resetRowSelection();
        },
      },
      enableColumnResizing: false,
    },
  });

  return (
    <div className={className}>
      <Table table={table} variant="modern" />
      <TableFooter table={table} />
      <TablePagination table={table} className="mt-4" />
    </div>
  );
}

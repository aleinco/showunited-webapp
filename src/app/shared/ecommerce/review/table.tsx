'use client';

import { productsReviewsColumns } from '@/app/shared/ecommerce/review/columns';
import { productReviews } from '@/data/product-reviews';
import Table from '@/components/core/table';
import { useTanStackTable } from '@/components/core/table/custom/use-TanStack-Table';
import TableFooter from '@/components/core/table/footer';
import TablePagination from '@/components/core/table/pagination';
import Filters from './filters';

export type ReviewsDataType = (typeof productReviews)[number];

export default function ReviewsTable() {
  const { table, setData } = useTanStackTable<ReviewsDataType>({
    tableData: productReviews,
    columnConfig: productsReviewsColumns,
    options: {
      initialState: {
        pagination: {
          pageIndex: 0,
          pageSize: 10,
        },
      },
      meta: {
        handleDeleteRow: (row) => {
          setData((prev) => prev.filter((r) => r.id !== row.id));
        },
        handleMultipleDelete: (rows) => {
          setData((prev) => prev.filter((r) => !rows.includes(r)));
        },
      },
      enableColumnResizing: false,
    },
  });

  return (
    <>
      <Filters table={table} />
      <Table
        table={table}
        variant="modern"
        classNames={{
          container: 'border border-muted rounded-md',
          rowClassName: 'last:border-0',
        }}
      />
      <TableFooter table={table} />
      <TablePagination table={table} className="py-4" />
    </>
  );
}

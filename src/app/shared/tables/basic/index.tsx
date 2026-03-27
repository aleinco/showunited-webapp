'use client';

import Table from '@/components/core/table';
import { orderData } from '@/data/order-data';
import { useTanStackTable } from '@/components/core/table/custom/use-TanStack-Table';
import { OrdersDataType } from '../../ecommerce/dashboard/recent-order';
import { basicColumns } from './column';
import { TableVariantProps } from 'rizzui';

export default function BasicTable({
  stickyHeader = false,
  variants = 'classic',
}: {
  stickyHeader?: boolean;
  variants?: TableVariantProps;
}) {
  const { table, setData } = useTanStackTable<OrdersDataType>({
    tableData: orderData,
    columnConfig: basicColumns,
    options: {
      initialState: {
        pagination: {
          pageIndex: 0,
          pageSize: stickyHeader ? orderData.length : 7,
        },
      },
      meta: {
        handleDeleteRow: (row) => {
          setData((prev) => prev.filter((r) => r.id !== row.id));
        },
      },
      enableColumnResizing: false,
    },
  });

  return <Table table={table} stickyHeader={stickyHeader} variant={variants} />;
}

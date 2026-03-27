'use client';

import { getStatusBadge } from '@/components/core/table-utils/get-status-badge';
import AvatarCard from '@/components/ui/avatar-card';
import DateCell from '@/components/ui/date-cell';
import { toCurrency } from '@/utils/to-currency';
import { createColumnHelper } from '@tanstack/react-table';
import { OrdersDataType } from '../../ecommerce/dashboard/recent-order';
import TableRowActionGroup from '@/components/core/table-utils/table-row-action-group';

const columnHelper = createColumnHelper<OrdersDataType>();

export const basicColumns = [
  columnHelper.display({
    id: 'orderId',
    size: 120,
    header: 'Order ID',
    cell: ({ row }) => <>#{row.original.id}</>,
  }),
  columnHelper.accessor('name', {
    id: 'name',
    size: 320,
    header: 'Customer',
    enableSorting: false,
    cell: ({ row }) => (
      <AvatarCard
        src={row.original.avatar}
        name={row.original.name}
        description={row.original.email}
      />
    ),
  }),
  columnHelper.display({
    id: 'items',
    size: 120,
    header: 'Items',
    cell: ({ row }) => <>{row.original.items}</>,
  }),
  columnHelper.accessor('price', {
    id: 'price',
    size: 150,
    header: 'Price',
    cell: ({ row }) => <>{toCurrency(row.original.price)}</>,
  }),
  columnHelper.accessor('createdAt', {
    id: 'createdAt',
    size: 180,
    header: 'Created',
    cell: ({ row }) => <DateCell date={new Date(row.original.createdAt)} />,
  }),
  columnHelper.accessor('updatedAt', {
    id: 'updatedAt',
    size: 180,
    header: 'Modified',
    cell: ({ row }) => <DateCell date={new Date(row.original.createdAt)} />,
  }),
  columnHelper.display({
    id: 'status',
    size: 150,
    header: 'Status',
    cell: ({ row }) => getStatusBadge(row.original.status),
  }),
  columnHelper.display({
    id: 'actions',
    size: 150,
    cell: ({
      row,
      table: {
        options: { meta },
      },
    }) => (
      <TableRowActionGroup
        onDelete={() => meta?.handleDeleteRow?.(row.original)}
      />
    ),
  }),
];

'use client';

import React from 'react';
import { defaultColumns } from './column';
import Table from '@/components/core/table';
import { defaultData } from '@/data/tan-table-data';
import WidgetCard from '@/components/core/cards/widget-card';
import { useTanStackTable } from '@/components/core/table/custom/use-TanStack-Table';

export type PersonType = (typeof defaultData)[number];

export default function TableColumnPinning() {
  const { table, setData } = useTanStackTable<PersonType>({
    tableData: defaultData,
    columnConfig: defaultColumns,
    options: {
      initialState: {
        columnPinning: {
          left: ['id'],
          right: ['actions'],
        },
        pagination: {
          pageIndex: 0,
          pageSize: 6,
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

  return (
    <WidgetCard title="Column Pinning" className="space-y-4">
      <Table
        table={table}
        variant="modern"
        classNames={{
          rowClassName: 'last:border-b-transparent',
        }}
      />
    </WidgetCard>
  );
}

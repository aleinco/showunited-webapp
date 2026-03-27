'use client';

import React from 'react';
import { defaultColumns } from './column';
import Table from '@/components/core/table';
import { useDirection } from '@/hooks/use-direction';
import WidgetCard from '@/components/core/cards/widget-card';
import { defaultData } from '@/data/tan-table-data';
import { useTanStackTable } from '@/components/core/table/custom/use-TanStack-Table';

export type PersonType = (typeof defaultData)[number];

export default function TableResizable() {
  const { direction } = useDirection();
  const { table, setData } = useTanStackTable<PersonType>({
    tableData: defaultData,
    columnConfig: defaultColumns,
    options: {
      initialState: {
        pagination: {
          pageIndex: 0,
          pageSize: 7,
        },
      },
      meta: {
        handleDeleteRow: (row) => {
          setData((prev) => prev.filter((r) => r.id !== row.id));
        },
      },
      columnResizeDirection: direction as any,
      columnResizeMode: 'onChange',
    },
  });

  return (
    <WidgetCard title="Resizable Table" className="space-y-4">
      <Table
        table={table}
        variant="modern"
        classNames={{
          rowClassName: 'last:border-0',
        }}
      />
    </WidgetCard>
  );
}

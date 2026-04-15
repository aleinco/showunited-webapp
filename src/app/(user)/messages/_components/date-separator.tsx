'use client';

import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';

dayjs.extend(isToday);
dayjs.extend(isYesterday);

interface DateSeparatorProps {
  date: string | Date;
}

export default function DateSeparator({ date }: DateSeparatorProps) {
  const d = dayjs(date);
  let label: string;

  if (d.isToday()) {
    label = 'Today';
  } else if (d.isYesterday()) {
    label = 'Yesterday';
  } else if (d.year() === dayjs().year()) {
    label = d.format('MMM D');
  } else {
    label = d.format('MMM D, YYYY');
  }

  return (
    <div className="flex items-center justify-center py-3">
      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
        {label}
      </span>
    </div>
  );
}

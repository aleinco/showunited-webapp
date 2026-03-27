import cn from '@/utils/class-names';

export default function Logo({
  className,
  iconOnly,
}: {
  className?: string;
  iconOnly?: boolean;
}) {
  if (iconOnly) {
    return (
      <svg
        className={cn('h-8 w-8', className)}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="32" height="32" rx="8" fill="#F26B50" />
        <text
          x="50%"
          y="55%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="white"
          fontSize="16"
          fontWeight="bold"
          fontFamily="system-ui"
        >
          SU
        </text>
      </svg>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg
        className="h-8 w-8 shrink-0"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="32" height="32" rx="8" fill="#F26B50" />
        <text
          x="50%"
          y="55%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="white"
          fontSize="16"
          fontWeight="bold"
          fontFamily="system-ui"
        >
          SU
        </text>
      </svg>
      <span className="text-lg font-bold text-gray-900 dark:text-gray-700">
        Show United
      </span>
    </div>
  );
}

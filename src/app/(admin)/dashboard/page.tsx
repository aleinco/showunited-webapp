'use client';

import { useDashboardData, useDashboardMetrics } from '@/api/hooks/use-admin';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Title, Text, Badge, Avatar, Loader } from 'rizzui';
import cn from '@/utils/class-names';
import dynamic from 'next/dynamic';
import { useElementSize } from '@/hooks/use-element-size';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  PiUsersDuotone,
  PiCreditCardDuotone,
  PiChatCircleTextDuotone,
  PiCurrencyDollarDuotone,
} from 'react-icons/pi';

const COLORS = ['#F26B50', '#4e36f5', '#11a849', '#f5a623', '#0070f3'];

function MetricCard({
  title,
  value,
  icon,
  subtitle,
  className,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-300 dark:bg-gray-100',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <Text className="text-sm text-gray-500">{title}</Text>
          <Title as="h3" className="mt-2 text-2xl font-bold">
            {value}
          </Title>
          {subtitle && (
            <Text className="mt-1 text-xs text-gray-400">{subtitle}</Text>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-300 dark:bg-gray-100">
      <Title as="h5" className="mb-4 text-base font-semibold">
        {title}
      </Title>
      {children}
    </div>
  );
}

const DEMO_STATS = [
  { date: 'Jan', totalCount: 120, successCount: 100, errorCount: 20 },
  { date: 'Feb', totalCount: 180, successCount: 160, errorCount: 20 },
  { date: 'Mar', totalCount: 200, successCount: 170, errorCount: 30 },
  { date: 'Apr', totalCount: 250, successCount: 220, errorCount: 30 },
  { date: 'May', totalCount: 300, successCount: 260, errorCount: 40 },
  { date: 'Jun', totalCount: 280, successCount: 250, errorCount: 30 },
];

const DEMO_PRODUCTS = [
  { productName: 'Premium', count: 450 },
  { productName: 'Basic', count: 320 },
  { productName: 'Pro', count: 280 },
  { productName: 'Enterprise', count: 150 },
  { productName: 'Free', count: 90 },
];

const DEMO_REVENUE = [
  { revenueMonth: 'Jan', totalRevenue: 4200, revenueProfit: 1800 },
  { revenueMonth: 'Feb', totalRevenue: 5100, revenueProfit: 2200 },
  { revenueMonth: 'Mar', totalRevenue: 4800, revenueProfit: 2000 },
  { revenueMonth: 'Apr', totalRevenue: 6200, revenueProfit: 2800 },
  { revenueMonth: 'May', totalRevenue: 7100, revenueProfit: 3200 },
  { revenueMonth: 'Jun', totalRevenue: 6800, revenueProfit: 3000 },
];

export default function DashboardPage() {
  const { data, isLoading } = useDashboardData();
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();

  const chartData = data?.dashboardChartDatas || DEMO_STATS;
  const products = data?.frequentProductList || DEMO_PRODUCTS;
  const revenue = data?.dashboardRevenueDatas || DEMO_REVENUE;

  const totalUsers = (metrics?.totalIndividualUsers || 0) + (metrics?.totalCompanyUsers || 0);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <Title as="h2" className="text-xl font-bold">
          Dashboard
        </Title>
        <Text className="mt-1 text-sm text-gray-500">
          Welcome to Show United Admin Panel
        </Text>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Users"
          value={metricsLoading ? '...' : totalUsers.toLocaleString()}
          icon={<PiUsersDuotone className="h-6 w-6" />}
          subtitle={metricsLoading ? undefined : `${metrics?.totalIndividualUsers || 0} individual · ${metrics?.totalCompanyUsers || 0} company`}
        />
        <MetricCard
          title="Active Subscriptions"
          value={metricsLoading ? '...' : (metrics?.totalSubscriptions || 0).toLocaleString()}
          icon={<PiCreditCardDuotone className="h-6 w-6" />}
          subtitle={metricsLoading ? undefined : `${metrics?.totalPlans || 0} plans available`}
        />
        <MetricCard
          title="Open Disputes"
          value={metricsLoading ? '...' : (metrics?.totalDisputes || 0).toLocaleString()}
          icon={<PiChatCircleTextDuotone className="h-6 w-6" />}
        />
        <MetricCard
          title="Content & Taxonomy"
          value={metricsLoading ? '...' : (metrics?.totalSkills || 0).toLocaleString()}
          icon={<PiCurrencyDollarDuotone className="h-6 w-6" />}
          subtitle={metricsLoading ? undefined : `skills · ${metrics?.totalFaqs || 0} FAQs · ${metrics?.totalCategories || 0} categories`}
        />
      </div>

      {/* Map + Recent Users */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ActiveUsersMap />
        </div>
        <RecentUsers />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="API Activity">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="successCount" name="Success" fill="#11a849" radius={[4, 4, 0, 0]} />
              <Bar dataKey="errorCount" name="Errors" fill="#e00" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue & Profit">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="revenueMonth" />
              <YAxis />
              <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="totalRevenue"
                name="Revenue"
                stroke="#F26B50"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="revenueProfit"
                name="Profit"
                stroke="#4e36f5"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartCard title="Subscription Distribution">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={products}
                dataKey="count"
                nameKey="productName"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {products.map((_: any, index: number) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="xl:col-span-2">
          <ChartCard title="Total Activity Overview">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="totalCount"
                  name="Total"
                  fill="#F26B50"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

// --- Active Users Map Component ---
const WorldMap = dynamic(() => import('react-svg-worldmap'), { ssr: false });

const mapData = [
  { country: 'cn', name: 'China', value: 10, style: 'bg-[#e40d0d]', color: '#e40d0d' },
  { country: 'fr', name: 'France', value: 8, style: 'bg-[#F26B50]', color: '#F26B50' },
  { country: 'es', name: 'Spain', value: 6, style: 'bg-[#4e36f5]', color: '#4e36f5' },
  { country: 'us', name: 'United States', value: 3, style: 'bg-[#0A3161]', color: '#0A3161' },
  { country: 'ga', name: 'Gabon', value: 2, style: 'bg-[#11a849]', color: '#11a849' },
  { country: 'in', name: 'India', value: 2, style: 'bg-[#f5a623]', color: '#f5a623' },
];

const countryColorMap: Record<string, string> = {};
mapData.forEach((d) => { countryColorMap[d.country] = d.color; });

function createMapLabels(w: number) {
  const labels: ({ label: string } & ComponentProps<'text'>)[] = [
    { label: 'Atlantic', x: 0.37 * w, y: 0.39 * w },
    { label: 'Indian', x: 0.69 * w, y: 0.57 * w },
    { label: 'Pacific', x: 0.083 * w, y: 0.48 * w },
    { label: 'Arctic', x: 0.75 * w, y: 0.058 * w },
  ];
  return w < 550 ? labels.map((l) => ({ ...l, style: { ...l.style, fontSize: '70%' } })) : labels;
}

function ActiveUsersMap() {
  const [ref, { width }] = useElementSize();
  const [ready, setReady] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const t = setTimeout(() => setReady(true), 400); return () => clearTimeout(t); }, []);

  // Force-paint country colors — react-svg-worldmap ignores custom fills
  // We poll briefly after render to catch the library's last style update
  useEffect(() => {
    if (!ready || !mapContainerRef.current) return;

    function paintCountries() {
      const container = mapContainerRef.current;
      if (!container) return;
      const svgG = container.querySelector('figure svg > g');
      if (!svgG) return;
      const paths = svgG.querySelectorAll<SVGPathElement>(':scope > path');
      paths.forEach((path) => {
        const text = path.textContent?.trim() || '';
        const entry = mapData.find((d) => text.toLowerCase().startsWith(d.name.toLowerCase()));
        if (entry) {
          // Must removeAttribute first — library sets inline style that overrides everything
          path.removeAttribute('style');
          path.setAttribute('style', `fill: ${entry.color} !important; fill-opacity: 1 !important; stroke: #e5e7eb; stroke-width: 1; stroke-opacity: 0.5; cursor: pointer;`);
        }
      });
    }

    // Paint after library renders + re-renders
    const t1 = setTimeout(paintCountries, 300);
    const t2 = setTimeout(paintCountries, 800);
    const t3 = setTimeout(paintCountries, 1500);
    const t4 = setTimeout(paintCountries, 3000);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [ready, width]);

  return (
    <div className="rounded-lg border border-muted bg-white p-5">
      <Title as="h5" className="mb-4 text-base font-semibold">Active Users</Title>
      <div
        ref={(el) => { (ref as any)(el); (mapContainerRef as any).current = el; }}
        className="flex flex-col [&>figure]:flex [&>figure]:items-center [&>figure]:justify-center [&_figure]:!bg-transparent [&_svg]:dark:invert"
      >
        {!ready ? (
          <div className="flex h-[300px] items-center justify-center"><Loader variant="spinner" size="lg" /></div>
        ) : (
          <WorldMap
            color="#F26B50"
            valueSuffix="%"
            size={width || 500}
            data={mapData}
            textLabelFunction={createMapLabels}
            styleFunction={({ countryValue }: any) => ({
              fill: '#F26B50',
              fillOpacity: countryValue ? 0.15 : 0,
              stroke: '#e5e7eb',
              strokeWidth: 1,
              strokeOpacity: 0.5,
              cursor: countryValue ? 'pointer' : 'default',
            })}
          />
        )}
      </div>
      <div className="-mx-5 mt-3 border-t border-dashed border-muted px-5 pt-4">
        <div className="mx-auto flex w-full max-w-lg flex-wrap justify-center gap-x-4 gap-y-1.5">
          {mapData.map((c) => (
            <div key={c.name} className="flex items-center gap-1.5">
              <Badge renderAsDot className={cn(c.style)} />
              <Text className="text-sm text-gray-500">
                {c.name} <Text as="span" className="ms-0.5 font-medium text-gray-700">{c.value}%</Text>
              </Text>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Recent Users Component ---
function RecentUsers() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ['all-individual-users'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users-list');
      return res.json();
    },
    staleTime: 120_000,
  });

  const recentUsers = (data?.users || [])
    .sort((a: any, b: any) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
    .slice(0, 8);

  return (
    <div className="rounded-lg border border-muted bg-white p-5">
      <Title as="h5" className="mb-4 text-base font-semibold">Recent Users</Title>
      <div className="space-y-1">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
              <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                <div className="mt-1 h-3 w-16 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          ))
        ) : (
          recentUsers.map((u: any) => (
            <button
              key={u.id}
              onClick={() => router.push(`/users/individual/${u.id}`)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
            >
              <Avatar
                name={u.name}
                src={u.photo || ''}
                size="sm"
                className="shrink-0 rounded-full"
              />
              <div className="min-w-0 flex-1">
                <Text className="truncate text-sm font-medium text-gray-900">{u.name}</Text>
                <Text className="truncate text-xs text-gray-500">{u.category || '---'}</Text>
              </div>
              <Text className="shrink-0 text-xs text-gray-400">
                {u.createdDate ? new Date(u.createdDate).toLocaleDateString() : ''}
              </Text>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

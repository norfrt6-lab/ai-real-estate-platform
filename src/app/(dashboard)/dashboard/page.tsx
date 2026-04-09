'use client';

import { useEffect, useState } from 'react';
import {
  Building2,
  Users,
  DollarSign,
  Wrench,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface StatCard {
  label: string;
  value: string | number;
  trend: number; // percentage change, positive = up
  trendLabel: string;
  icon: React.ElementType;
  color: string;
  href: string;
}

interface RecentActivity {
  id: string;
  type: 'payment' | 'maintenance' | 'lease' | 'tenant';
  description: string;
  time: string;
  status?: 'success' | 'warning' | 'error' | 'info';
}

interface DashboardStats {
  totalProperties: number;
  activeTenants: number;
  monthlyRevenue: number;
  openTickets: number;
  propertiesTrend: number;
  tenantsTrend: number;
  revenueTrend: number;
  ticketsTrend: number;
}

// ---------------------------------------------------------------------------
// Placeholder data (replace with real API calls)
// ---------------------------------------------------------------------------
const PLACEHOLDER_STATS: DashboardStats = {
  totalProperties: 24,
  activeTenants: 18,
  monthlyRevenue: 42750,
  openTickets: 7,
  propertiesTrend: 4.2,
  tenantsTrend: 2.1,
  revenueTrend: 8.7,
  ticketsTrend: -15.3, // negative = fewer tickets = good
};

const PLACEHOLDER_ACTIVITY: RecentActivity[] = [
  {
    id: '1',
    type: 'payment',
    description: 'Rent payment received from Marcus Johnson — Unit 4B',
    time: '2 minutes ago',
    status: 'success',
  },
  {
    id: '2',
    type: 'maintenance',
    description: 'New maintenance ticket: HVAC issue at 221 Oak Street',
    time: '34 minutes ago',
    status: 'warning',
  },
  {
    id: '3',
    type: 'tenant',
    description: 'Tenant application submitted: Sarah Chen — Apt 12',
    time: '1 hour ago',
    status: 'info',
  },
  {
    id: '4',
    type: 'payment',
    description: 'Payment failed for tenant David Park — Unit 7A',
    time: '3 hours ago',
    status: 'error',
  },
  {
    id: '5',
    type: 'lease',
    description: 'Lease expiring in 30 days — Emily Rodriguez, Unit 2C',
    time: '5 hours ago',
    status: 'warning',
  },
  {
    id: '6',
    type: 'payment',
    description: 'Security deposit received from new tenant — Unit 9D',
    time: 'Yesterday',
    status: 'success',
  },
];

// ---------------------------------------------------------------------------
// Stat card component
// ---------------------------------------------------------------------------
function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="h-4 w-24 rounded bg-slate-700" />
        <div className="h-10 w-10 rounded-lg bg-slate-700" />
      </div>
      <div className="h-8 w-28 rounded bg-slate-700 mb-2" />
      <div className="h-4 w-36 rounded bg-slate-700" />
    </div>
  );
}

function StatCard({
  label,
  value,
  trend,
  trendLabel,
  icon: Icon,
  color,
  href,
}: StatCard) {
  const isPositive = trend > 0;
  const isNeutral = trend === 0;

  const TrendIcon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  const trendColor = isNeutral
    ? 'text-slate-400'
    : isPositive
    ? 'text-emerald-400'
    : 'text-red-400';
  const trendBg = isNeutral
    ? 'bg-slate-700/50'
    : isPositive
    ? 'bg-emerald-500/10'
    : 'bg-red-500/10';

  return (
    <Link
      href={href}
      className="group relative rounded-xl border border-slate-700/50 bg-slate-800/50 p-6 hover:border-slate-600 hover:bg-slate-800 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-slate-400">{label}</p>
        <div className={`rounded-lg p-2.5 ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>

      <p className="text-3xl font-bold text-white mb-3 tabular-nums">
        {typeof value === 'number' && label.toLowerCase().includes('revenue')
          ? `$${value.toLocaleString()}`
          : value.toLocaleString()}
      </p>

      <div className="flex items-center gap-1.5">
        <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${trendColor} ${trendBg}`}>
          <TrendIcon className="h-3 w-3" />
          {Math.abs(trend)}%
        </span>
        <span className="text-xs text-slate-500">{trendLabel}</span>
      </div>

      {/* Hover arrow */}
      <ArrowRight className="absolute right-5 bottom-5 h-4 w-4 text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Activity feed
// ---------------------------------------------------------------------------
const activityConfig = {
  payment: { color: 'bg-emerald-500', label: 'Payment' },
  maintenance: { color: 'bg-orange-500', label: 'Maintenance' },
  lease: { color: 'bg-purple-500', label: 'Lease' },
  tenant: { color: 'bg-blue-500', label: 'Tenant' },
};

const statusConfig = {
  success: { dot: 'bg-emerald-400', text: 'text-emerald-400' },
  warning: { dot: 'bg-amber-400', text: 'text-amber-400' },
  error: { dot: 'bg-red-400', text: 'text-red-400' },
  info: { dot: 'bg-blue-400', text: 'text-blue-400' },
};

function ActivityItem({ item }: { item: RecentActivity }) {
  const cfg = activityConfig[item.type];
  const sCfg = item.status ? statusConfig[item.status] : null;

  return (
    <div className="flex items-start gap-3 py-3">
      <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${sCfg?.dot ?? 'bg-slate-500'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-300 leading-snug">{item.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`inline-block rounded-full px-1.5 py-0.5 text-xs font-medium text-white ${cfg.color}`}>
            {cfg.label}
          </span>
          <span className="text-xs text-slate-600">{item.time}</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quick actions
// ---------------------------------------------------------------------------
const quickActions = [
  { label: 'Add Property', href: '/properties/new', icon: Building2, color: 'bg-blue-600 hover:bg-blue-500' },
  { label: 'Add Tenant', href: '/tenants/new', icon: Users, color: 'bg-violet-600 hover:bg-violet-500' },
  { label: 'Record Payment', href: '/payments/new', icon: DollarSign, color: 'bg-emerald-600 hover:bg-emerald-500' },
  { label: 'Open Ticket', href: '/maintenance/new', icon: Wrench, color: 'bg-orange-600 hover:bg-orange-500' },
];

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  async function loadData(silent = false) {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');

    try {
      // Simulate API call with a short delay
      await new Promise((res) => setTimeout(res, 600));
      setStats(PLACEHOLDER_STATS);
      setActivity(PLACEHOLDER_ACTIVITY);
    } catch {
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Build stat cards from loaded data
  const statCards: StatCard[] = stats
    ? [
        {
          label: 'Total Properties',
          value: stats.totalProperties,
          trend: stats.propertiesTrend,
          trendLabel: 'vs last month',
          icon: Building2,
          color: 'bg-blue-600',
          href: '/properties',
        },
        {
          label: 'Active Tenants',
          value: stats.activeTenants,
          trend: stats.tenantsTrend,
          trendLabel: 'vs last month',
          icon: Users,
          color: 'bg-violet-600',
          href: '/tenants',
        },
        {
          label: 'Monthly Revenue',
          value: stats.monthlyRevenue,
          trend: stats.revenueTrend,
          trendLabel: 'vs last month',
          icon: DollarSign,
          color: 'bg-emerald-600',
          href: '/payments',
        },
        {
          label: 'Open Tickets',
          value: stats.openTickets,
          trend: stats.ticketsTrend,
          trendLabel: 'vs last month',
          icon: Wrench,
          color: 'bg-orange-600',
          href: '/maintenance',
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* ------------------------------------------------------------------ */}
      {/* Page header                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Welcome back — here&apos;s what&apos;s happening with your portfolio.
          </p>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={refreshing || loading}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Error banner                                                         */}
      {/* ------------------------------------------------------------------ */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button
            onClick={() => loadData()}
            className="ml-auto text-red-400 underline hover:text-red-300 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Stat cards                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map((card) => <StatCard key={card.label} {...card} />)}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Lower section: activity + quick actions                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Activity feed (2/3 width on large screens) */}
        <div className="lg:col-span-2 rounded-xl border border-slate-700/50 bg-slate-800/50 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-700/50 px-5 py-4">
            <h2 className="text-base font-semibold text-white">Recent Activity</h2>
            <Link
              href="/reports"
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-700/30 px-5">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 py-3 animate-pulse">
                    <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-slate-700" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-4 w-3/4 rounded bg-slate-700" />
                      <div className="h-3 w-1/4 rounded bg-slate-700" />
                    </div>
                  </div>
                ))
              : activity.map((item) => <ActivityItem key={item.id} item={item} />)}
          </div>
        </div>

        {/* Quick actions (1/3 width) */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 overflow-hidden">
          <div className="border-b border-slate-700/50 px-5 py-4">
            <h2 className="text-base font-semibold text-white">Quick Actions</h2>
          </div>
          <div className="p-5 space-y-3">
            {quickActions.map(({ label, href, icon: Icon, color }) => (
              <Link
                key={label}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white transition-colors ${color}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
                <ArrowRight className="ml-auto h-4 w-4 opacity-70" />
              </Link>
            ))}
          </div>

          {/* Occupancy pill */}
          {stats && (
            <div className="border-t border-slate-700/50 px-5 py-4">
              <p className="text-xs font-medium text-slate-400 mb-2">Occupancy Rate</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{
                      width: `${Math.round((stats.activeTenants / stats.totalProperties) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-bold text-white tabular-nums">
                  {Math.round((stats.activeTenants / stats.totalProperties) * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

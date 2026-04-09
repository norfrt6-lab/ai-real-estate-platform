'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  CreditCard,
  MoreHorizontal,
  Eye,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type PaymentStatus = 'PAID' | 'PENDING' | 'FAILED' | 'PROCESSING' | 'REFUNDED';
type PaymentType =
  | 'RENT'
  | 'SECURITY_DEPOSIT'
  | 'LATE_FEE'
  | 'MAINTENANCE_COST'
  | 'OTHER';

interface Payment {
  id: string;
  amount: number;
  status: PaymentStatus;
  type: PaymentType;
  dueDate: string;
  paidAt?: string | null;
  tenant: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  property: {
    id: string;
    title: string;
    address: string;
  };
  stripePaymentIntentId?: string | null;
  notes?: string | null;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'pay_1',
    amount: 2400,
    status: 'PAID',
    type: 'RENT',
    dueDate: '2024-10-01',
    paidAt: '2024-09-29T14:23:00Z',
    tenant: { id: 't1', name: 'Marcus Johnson', email: 'marcus.johnson@example.com' },
    property: { id: 'p1', title: '221B Baker Street — Apt 4', address: '221B Baker St, London' },
    stripePaymentIntentId: 'pi_3QA9cK2eZvKYlo2C0aBcDeFg',
  },
  {
    id: 'pay_2',
    amount: 1850,
    status: 'PAID',
    type: 'RENT',
    dueDate: '2024-10-01',
    paidAt: '2024-10-01T09:05:00Z',
    tenant: { id: 't2', name: 'Sarah Chen', email: 'sarah.chen@example.com' },
    property: { id: 'p3', title: 'Downtown Condo #12', address: '500 Main St, Dallas TX' },
    stripePaymentIntentId: 'pi_3QB1mN2eZvKYlo2C1bCdEfGh',
  },
  {
    id: 'pay_3',
    amount: 2750,
    status: 'PENDING',
    type: 'RENT',
    dueDate: '2024-11-01',
    paidAt: null,
    tenant: { id: 't3', name: 'David Park', email: 'david.park@example.com' },
    property: { id: 'p4', title: 'Oak Lane Townhouse', address: '14 Oak Lane, Nashville TN' },
  },
  {
    id: 'pay_4',
    amount: 1100,
    status: 'PAID',
    type: 'RENT',
    dueDate: '2024-10-01',
    paidAt: '2024-10-02T11:47:00Z',
    tenant: { id: 't4', name: 'Emily Rodriguez', email: 'emily.rodriguez@example.com' },
    property: { id: 'p5', title: 'Studio Loft — Midtown', address: '900 Peachtree St NE, Atlanta GA' },
    stripePaymentIntentId: 'pi_3QC2nO2eZvKYlo2C2cDeFgHi',
  },
  {
    id: 'pay_5',
    amount: 2900,
    status: 'FAILED',
    type: 'RENT',
    dueDate: '2024-10-01',
    paidAt: null,
    tenant: { id: 't5', name: 'James Liu', email: 'james.liu@example.com' },
    property: { id: 'p8', title: 'Riverside House', address: '32 River Rd, Portland OR' },
    notes: 'Card declined — insufficient funds.',
  },
  {
    id: 'pay_6',
    amount: 5500,
    status: 'PAID',
    type: 'SECURITY_DEPOSIT',
    dueDate: '2024-09-15',
    paidAt: '2024-09-14T16:00:00Z',
    tenant: { id: 't6', name: 'Carlos Mendoza', email: 'carlos.mendoza@example.com' },
    property: { id: 'p9', title: 'Scottsdale Heights Unit 3A', address: '77 Desert Bloom Ave, AZ' },
    stripePaymentIntentId: 'pi_3QD3oP2eZvKYlo2C3dEfGhIj',
  },
  {
    id: 'pay_7',
    amount: 150,
    status: 'PENDING',
    type: 'LATE_FEE',
    dueDate: '2024-10-15',
    paidAt: null,
    tenant: { id: 't5', name: 'James Liu', email: 'james.liu@example.com' },
    property: { id: 'p8', title: 'Riverside House', address: '32 River Rd, Portland OR' },
    notes: 'Late fee for October rent.',
  },
  {
    id: 'pay_8',
    amount: 1950,
    status: 'REFUNDED',
    type: 'SECURITY_DEPOSIT',
    dueDate: '2024-06-01',
    paidAt: '2024-06-01T10:00:00Z',
    tenant: { id: 't8', name: 'Priya Patel', email: 'priya.patel@example.com' },
    property: { id: 'p10', title: 'Capitol Hill Studio', address: '420 Pine St, Seattle WA' },
    stripePaymentIntentId: 'pi_3QE4pQ2eZvKYlo2C4eFgHiJk',
    notes: 'Security deposit returned after lease termination.',
  },
  {
    id: 'pay_9',
    amount: 2200,
    status: 'PROCESSING',
    type: 'RENT',
    dueDate: '2024-11-01',
    paidAt: null,
    tenant: { id: 't7', name: 'Aisha Williams', email: 'aisha.williams@example.com' },
    property: { id: 'p6', title: 'Lakeview Apartment 7C', address: '1200 Lake Shore Dr, Chicago IL' },
    stripePaymentIntentId: 'pi_3QF5qR2eZvKYlo2C5fGhIjKl',
  },
  {
    id: 'pay_10',
    amount: 850,
    status: 'FAILED',
    type: 'MAINTENANCE_COST',
    dueDate: '2024-10-20',
    paidAt: null,
    tenant: { id: 't3', name: 'David Park', email: 'david.park@example.com' },
    property: { id: 'p4', title: 'Oak Lane Townhouse', address: '14 Oak Lane, Nashville TN' },
    notes: 'HVAC repair cost-share — payment bounced.',
  },
];

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------
const STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; className: string; icon: React.ElementType; dotColor: string }
> = {
  PAID: {
    label: 'Paid',
    className: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
    icon: CheckCircle2,
    dotColor: 'bg-emerald-400',
  },
  PENDING: {
    label: 'Pending',
    className: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
    icon: Clock,
    dotColor: 'bg-amber-400',
  },
  FAILED: {
    label: 'Failed',
    className: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30',
    icon: XCircle,
    dotColor: 'bg-red-400',
  },
  PROCESSING: {
    label: 'Processing',
    className: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30',
    icon: RefreshCw,
    dotColor: 'bg-blue-400',
  },
  REFUNDED: {
    label: 'Refunded',
    className: 'bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/30',
    icon: RefreshCw,
    dotColor: 'bg-slate-400',
  },
};

const TYPE_LABELS: Record<PaymentType, string> = {
  RENT: 'Rent',
  SECURITY_DEPOSIT: 'Security Deposit',
  LATE_FEE: 'Late Fee',
  MAINTENANCE_COST: 'Maintenance',
  OTHER: 'Other',
};

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: PaymentStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Stat summary card
// ---------------------------------------------------------------------------
function SummaryCard({
  label,
  value,
  subtext,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
      {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row actions
// ---------------------------------------------------------------------------
function RowActions({ payment }: { payment: Payment }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-100 transition-colors"
        aria-label="Payment actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-slate-700 bg-slate-800 shadow-xl shadow-black/40 py-1 overflow-hidden">
            <Link
              href={`/payments/${payment.id}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <Eye className="h-4 w-4 text-slate-500" />
              View receipt
            </Link>
            <button
              onClick={() => {
                setOpen(false);
                alert(`Downloading receipt for payment ${payment.id}`);
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <Download className="h-4 w-4 text-slate-500" />
              Download PDF
            </button>
            {payment.status === 'PENDING' && (
              <button
                onClick={() => {
                  setOpen(false);
                  alert(`Sending reminder to ${payment.tenant.name}`);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors"
              >
                <AlertCircle className="h-4 w-4" />
                Send reminder
              </button>
            )}
            {payment.status === 'FAILED' && (
              <button
                onClick={() => {
                  setOpen(false);
                  alert(`Retrying payment for ${payment.tenant.name}`);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-blue-400 hover:bg-blue-500/10 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Retry payment
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton row
// ---------------------------------------------------------------------------
function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-slate-700/30">
      <td className="px-4 py-3">
        <div className="space-y-1.5">
          <div className="h-4 w-36 rounded bg-slate-700" />
          <div className="h-3 w-48 rounded bg-slate-700" />
        </div>
      </td>
      {[60, 40, 36, 50, 50, 24].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-slate-700" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isOverdue(dueDate: string, status: PaymentStatus) {
  return (
    (status === 'PENDING' || status === 'FAILED') &&
    new Date(dueDate) < new Date()
  );
}

// ---------------------------------------------------------------------------
// Filter options
// ---------------------------------------------------------------------------
const STATUS_OPTIONS: { value: PaymentStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'REFUNDED', label: 'Refunded' },
];

const TYPE_OPTIONS: { value: PaymentType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All types' },
  { value: 'RENT', label: 'Rent' },
  { value: 'SECURITY_DEPOSIT', label: 'Security Deposit' },
  { value: 'LATE_FEE', label: 'Late Fee' },
  { value: 'MAINTENANCE_COST', label: 'Maintenance' },
];

const PAGE_SIZE = 7;

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<PaymentType | 'ALL'>('ALL');
  const [page, setPage] = useState(1);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setPayments(MOCK_PAYMENTS);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter]);

  // Client-side filter
  const filtered = payments.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && p.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.tenant.name.toLowerCase().includes(q) ||
        p.tenant.email.toLowerCase().includes(q) ||
        p.property.title.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        TYPE_LABELS[p.type].toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Summary stats
  const totalCollected = payments
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments
    .filter((p) => p.status === 'PENDING')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalFailed = payments
    .filter((p) => p.status === 'FAILED')
    .reduce((sum, p) => sum + p.amount, 0);
  const overdueCount = payments.filter(
    (p) => isOverdue(p.dueDate, p.status),
  ).length;

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Page header                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Payments</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Track rent, deposits, fees, and payment history
          </p>
        </div>
        <Link
          href="/payments/new"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-md shadow-emerald-900/30 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Record Payment
        </Link>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Summary cards                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          label="Collected"
          value={`$${totalCollected.toLocaleString()}`}
          subtext={`${payments.filter((p) => p.status === 'PAID').length} payments`}
          icon={TrendingUp}
          color="bg-emerald-600"
        />
        <SummaryCard
          label="Pending"
          value={`$${totalPending.toLocaleString()}`}
          subtext={`${payments.filter((p) => p.status === 'PENDING').length} payments`}
          icon={Clock}
          color="bg-amber-600"
        />
        <SummaryCard
          label="Failed"
          value={`$${totalFailed.toLocaleString()}`}
          subtext={`${payments.filter((p) => p.status === 'FAILED').length} payments`}
          icon={TrendingDown}
          color="bg-red-600"
        />
        <SummaryCard
          label="Overdue"
          value={String(overdueCount)}
          subtext="payments past due"
          icon={AlertCircle}
          color="bg-orange-600"
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Filters                                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenant, property, ID…"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-500 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as PaymentStatus | 'ALL')
            }
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as PaymentType | 'ALL')}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors cursor-pointer"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Results */}
        {(search || statusFilter !== 'ALL' || typeFilter !== 'ALL') && (
          <span className="text-xs text-slate-400 whitespace-nowrap">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        )}

        {/* Clear all filters */}
        {(search || statusFilter !== 'ALL' || typeFilter !== 'ALL') && (
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('ALL');
              setTypeFilter('ALL');
            }}
            className="text-xs text-slate-500 hover:text-slate-300 underline transition-colors whitespace-nowrap"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Table                                                                */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-800/80">
                <th className="px-4 py-3 text-left font-medium text-slate-400 min-w-[180px]">
                  Tenant
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-400 min-w-[160px]">
                  Property
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">
                  Type
                </th>
                <th className="px-4 py-3 text-right font-medium text-slate-400">
                  Amount
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-400 min-w-[110px]">
                  Due Date
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-400 min-w-[110px]">
                  Paid On
                </th>
                <th className="px-4 py-3 text-center font-medium text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-700/30">
              {loading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-16 text-center text-slate-500"
                  >
                    <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-slate-400">
                      No payments found
                    </p>
                    <p className="text-xs mt-1">
                      {search || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                        ? 'Try adjusting your search or filters.'
                        : 'Record your first payment to get started.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginated.map((payment) => {
                  const overdue = isOverdue(payment.dueDate, payment.status);
                  return (
                    <tr
                      key={payment.id}
                      className="group hover:bg-slate-700/20 transition-colors"
                    >
                      {/* Tenant */}
                      <td className="px-4 py-3">
                        <div>
                          <Link
                            href={`/tenants/${payment.tenant.id}`}
                            className="font-medium text-white hover:text-emerald-400 transition-colors block truncate"
                          >
                            {payment.tenant.name}
                          </Link>
                          <a
                            href={`mailto:${payment.tenant.email}`}
                            className="text-xs text-slate-500 hover:text-slate-300 transition-colors block truncate mt-0.5"
                          >
                            {payment.tenant.email}
                          </a>
                        </div>
                      </td>

                      {/* Property */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/properties/${payment.property.id}`}
                          className="text-slate-300 hover:text-emerald-400 transition-colors block truncate text-sm"
                        >
                          {payment.property.title}
                        </Link>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        <span className="text-slate-400 text-xs whitespace-nowrap">
                          {TYPE_LABELS[payment.type]}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-white tabular-nums">
                          ${payment.amount.toLocaleString()}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={payment.status} />
                        {payment.notes && (
                          <p className="text-xs text-slate-600 mt-1 max-w-[180px] truncate" title={payment.notes}>
                            {payment.notes}
                          </p>
                        )}
                      </td>

                      {/* Due Date */}
                      <td className="px-4 py-3">
                        <span
                          className={`text-sm whitespace-nowrap ${
                            overdue
                              ? 'text-red-400 font-medium'
                              : 'text-slate-400'
                          }`}
                        >
                          {formatDate(payment.dueDate)}
                          {overdue && (
                            <span className="ml-1 text-xs text-red-500">
                              (overdue)
                            </span>
                          )}
                        </span>
                      </td>

                      {/* Paid On */}
                      <td className="px-4 py-3">
                        {payment.paidAt ? (
                          <span className="text-sm text-emerald-400 whitespace-nowrap">
                            {formatDate(payment.paidAt)}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-sm">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-center">
                        <RowActions payment={payment} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-slate-700/50 px-4 py-3">
            <p className="text-xs text-slate-500">
              Showing{' '}
              <span className="text-slate-300">
                {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, filtered.length)}
              </span>{' '}
              of <span className="text-slate-300">{filtered.length}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`min-w-[32px] rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                    page === i + 1
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:bg-slate-700 hover:text-slate-100'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Stripe note                                                          */}
      {/* ------------------------------------------------------------------ */}
      <p className="text-xs text-slate-600 text-center">
        Payments processed via{' '}
        <span className="text-slate-500 font-medium">Stripe</span>. Payment
        intents are stored for reconciliation and refund flows.
      </p>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Wrench,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  SlidersHorizontal,
  AlertTriangle,
  Flame,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  User,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type TicketPriority = 'EMERGENCY' | 'HIGH' | 'MEDIUM' | 'LOW';
type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'AWAITING_PARTS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'CANCELLED';

interface Vendor {
  id: string;
  name: string;
  specialty: string;
  phone?: string;
}

interface MaintenanceTicket {
  id: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  property: {
    id: string;
    title: string;
    address: string;
  };
  tenant?: {
    id: string;
    name: string;
    email: string;
  } | null;
  vendor?: Vendor | null;
  estimatedCost?: number | null;
  actualCost?: number | null;
  scheduledDate?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const MOCK_TICKETS: MaintenanceTicket[] = [
  {
    id: 'mt_1',
    title: 'Gas leak in kitchen — URGENT',
    description: 'Tenant reports strong smell of gas near the stove. Immediate attention required.',
    priority: 'EMERGENCY',
    status: 'IN_PROGRESS',
    property: { id: 'p1', title: '221B Baker Street — Apt 4', address: '221B Baker St, London' },
    tenant: { id: 't1', name: 'Marcus Johnson', email: 'marcus.johnson@example.com' },
    vendor: { id: 'v1', name: 'SafeGas Pro', specialty: 'Gas & Plumbing', phone: '+1 (512) 555-9911' },
    estimatedCost: 850,
    actualCost: null,
    scheduledDate: '2024-11-01',
    resolvedAt: null,
    createdAt: '2024-10-31T08:00:00Z',
    updatedAt: '2024-10-31T09:30:00Z',
  },
  {
    id: 'mt_2',
    title: 'HVAC system not heating',
    description: 'Heating unit has stopped working. Tenant reports indoor temperature dropping significantly.',
    priority: 'HIGH',
    status: 'OPEN',
    property: { id: 'p4', title: 'Oak Lane Townhouse', address: '14 Oak Lane, Nashville TN' },
    tenant: { id: 't3', name: 'David Park', email: 'david.park@example.com' },
    vendor: null,
    estimatedCost: 1200,
    actualCost: null,
    scheduledDate: null,
    resolvedAt: null,
    createdAt: '2024-10-30T14:22:00Z',
    updatedAt: '2024-10-30T14:22:00Z',
  },
  {
    id: 'mt_3',
    title: 'Bathroom ceiling water leak',
    description: 'Water dripping from ceiling in the master bathroom. Likely a pipe leak from upstairs unit.',
    priority: 'HIGH',
    status: 'AWAITING_PARTS',
    property: { id: 'p3', title: 'Downtown Condo #12', address: '500 Main St, Dallas TX' },
    tenant: { id: 't2', name: 'Sarah Chen', email: 'sarah.chen@example.com' },
    vendor: { id: 'v2', name: 'Dallas Plumbing Co.', specialty: 'Plumbing', phone: '+1 (214) 555-7722' },
    estimatedCost: 650,
    actualCost: null,
    scheduledDate: '2024-11-03',
    resolvedAt: null,
    createdAt: '2024-10-28T10:15:00Z',
    updatedAt: '2024-10-29T16:00:00Z',
  },
  {
    id: 'mt_4',
    title: 'Broken window latch — Unit 5',
    description: 'Living room window latch is broken and window will not lock properly. Security concern.',
    priority: 'MEDIUM',
    status: 'OPEN',
    property: { id: 'p5', title: 'Studio Loft — Midtown', address: '900 Peachtree St NE, Atlanta GA' },
    tenant: { id: 't4', name: 'Emily Rodriguez', email: 'emily.rodriguez@example.com' },
    vendor: null,
    estimatedCost: 180,
    actualCost: null,
    scheduledDate: null,
    resolvedAt: null,
    createdAt: '2024-10-27T09:45:00Z',
    updatedAt: '2024-10-27T09:45:00Z',
  },
  {
    id: 'mt_5',
    title: 'Garbage disposal replacement',
    description: 'Kitchen garbage disposal has seized and is non-functional. Making loud grinding noise before stopping.',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    property: { id: 'p8', title: 'Riverside House', address: '32 River Rd, Portland OR' },
    tenant: { id: 't5', name: 'James Liu', email: 'james.liu@example.com' },
    vendor: { id: 'v3', name: 'Portland Home Services', specialty: 'General Repairs', phone: '+1 (503) 555-4433' },
    estimatedCost: 320,
    actualCost: null,
    scheduledDate: '2024-11-02',
    resolvedAt: null,
    createdAt: '2024-10-26T11:30:00Z',
    updatedAt: '2024-10-30T08:00:00Z',
  },
  {
    id: 'mt_6',
    title: 'Paint touch-up in living room',
    description: 'Tenant reported scuff marks and minor paint damage on the living room walls.',
    priority: 'LOW',
    status: 'OPEN',
    property: { id: 'p6', title: 'Lakeview Apartment 7C', address: '1200 Lake Shore Dr, Chicago IL' },
    tenant: null,
    vendor: null,
    estimatedCost: 200,
    actualCost: null,
    scheduledDate: null,
    resolvedAt: null,
    createdAt: '2024-10-25T13:00:00Z',
    updatedAt: '2024-10-25T13:00:00Z',
  },
  {
    id: 'mt_7',
    title: 'AC unit filter replacement',
    description: 'Routine quarterly HVAC filter replacement and system check.',
    priority: 'LOW',
    status: 'RESOLVED',
    property: { id: 'p9', title: 'Scottsdale Heights Unit 3A', address: '77 Desert Bloom Ave, AZ' },
    tenant: { id: 't7', name: 'Carlos Mendoza', email: 'carlos.mendoza@example.com' },
    vendor: { id: 'v4', name: 'AZ Climate Control', specialty: 'HVAC', phone: '+1 (602) 555-2211' },
    estimatedCost: 150,
    actualCost: 120,
    scheduledDate: '2024-10-20',
    resolvedAt: '2024-10-20T15:00:00Z',
    createdAt: '2024-10-15T10:00:00Z',
    updatedAt: '2024-10-20T15:00:00Z',
  },
  {
    id: 'mt_8',
    title: 'Electrical outlet sparking — bedroom',
    description: 'Bedroom wall outlet is emitting sparks when devices are plugged in. Potential fire hazard.',
    priority: 'EMERGENCY',
    status: 'RESOLVED',
    property: { id: 'p10', title: 'Capitol Hill Studio', address: '420 Pine St, Seattle WA' },
    tenant: { id: 't8', name: 'Priya Patel', email: 'priya.patel@example.com' },
    vendor: { id: 'v5', name: 'Seattle Electric Solutions', specialty: 'Electrical', phone: '+1 (206) 555-8800' },
    estimatedCost: 400,
    actualCost: 380,
    scheduledDate: '2024-10-10',
    resolvedAt: '2024-10-10T12:00:00Z',
    createdAt: '2024-10-09T18:00:00Z',
    updatedAt: '2024-10-10T12:00:00Z',
  },
  {
    id: 'mt_9',
    title: 'Dryer vent cleaning',
    description: 'Annual dryer vent cleaning to prevent fire hazard and maintain efficiency.',
    priority: 'LOW',
    status: 'CLOSED',
    property: { id: 'p2', title: 'Sunridge Villa', address: '88 Sunridge Blvd, Austin TX' },
    tenant: null,
    vendor: { id: 'v6', name: 'Austin Appliance Care', specialty: 'Appliances', phone: '+1 (512) 555-6655' },
    estimatedCost: 100,
    actualCost: 100,
    scheduledDate: '2024-09-15',
    resolvedAt: '2024-09-15T11:00:00Z',
    createdAt: '2024-09-10T09:00:00Z',
    updatedAt: '2024-09-15T11:00:00Z',
  },
  {
    id: 'mt_10',
    title: 'Roof shingle repair after storm',
    description: 'Several shingles were dislodged during last week\'s storm. Minor water ingress observed in attic.',
    priority: 'HIGH',
    status: 'OPEN',
    property: { id: 'p2', title: 'Sunridge Villa', address: '88 Sunridge Blvd, Austin TX' },
    tenant: null,
    vendor: null,
    estimatedCost: 2200,
    actualCost: null,
    scheduledDate: null,
    resolvedAt: null,
    createdAt: '2024-10-29T07:30:00Z',
    updatedAt: '2024-10-29T07:30:00Z',
  },
];

// ---------------------------------------------------------------------------
// Priority config
// ---------------------------------------------------------------------------
const PRIORITY_CONFIG: Record<
  TicketPriority,
  {
    label: string;
    className: string;
    icon: React.ElementType;
    order: number;
  }
> = {
  EMERGENCY: {
    label: 'Emergency',
    className: 'bg-red-500/20 text-red-400 ring-1 ring-red-500/40',
    icon: Flame,
    order: 0,
  },
  HIGH: {
    label: 'High',
    className: 'bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/40',
    icon: ArrowUp,
    order: 1,
  },
  MEDIUM: {
    label: 'Medium',
    className: 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/40',
    icon: ArrowRight,
    order: 2,
  },
  LOW: {
    label: 'Low',
    className: 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40',
    icon: ArrowDown,
    order: 3,
  },
};

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------
const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; className: string; icon: React.ElementType }
> = {
  OPEN: {
    label: 'Open',
    className: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30',
    icon: Clock,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className: 'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30',
    icon: Loader2,
  },
  AWAITING_PARTS: {
    label: 'Awaiting Parts',
    className: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
    icon: AlertTriangle,
  },
  RESOLVED: {
    label: 'Resolved',
    className: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
    icon: CheckCircle2,
  },
  CLOSED: {
    label: 'Closed',
    className: 'bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/30',
    icon: XCircle,
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-red-500/10 text-red-500/70 ring-1 ring-red-500/20',
    icon: XCircle,
  },
};

// ---------------------------------------------------------------------------
// Priority badge
// ---------------------------------------------------------------------------
function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const cfg = PRIORITY_CONFIG[priority];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: TicketStatus }) {
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
// Summary card
// ---------------------------------------------------------------------------
function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
  subtext,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtext?: string;
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
// Row actions dropdown
// ---------------------------------------------------------------------------
function RowActions({ ticket }: { ticket: MaintenanceTicket }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-100 transition-colors"
        aria-label="Ticket actions"
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
              href={`/maintenance/${ticket.id}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <Eye className="h-4 w-4 text-slate-500" />
              View details
            </Link>
            <Link
              href={`/maintenance/${ticket.id}/edit`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <Pencil className="h-4 w-4 text-slate-500" />
              Edit ticket
            </Link>
            {!ticket.vendor && (
              <Link
                href={`/maintenance/${ticket.id}/assign`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
              >
                <User className="h-4 w-4 text-slate-500" />
                Assign vendor
              </Link>
            )}
            {(ticket.status === 'IN_PROGRESS' || ticket.status === 'AWAITING_PARTS') && (
              <button
                onClick={() => {
                  setOpen(false);
                  alert(`Marking ticket "${ticket.title}" as resolved`);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark resolved
              </button>
            )}
            <div className="my-1 border-t border-slate-700" />
            <button
              onClick={() => {
                setOpen(false);
                alert(`Delete ticket "${ticket.title}"?`);
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete ticket
            </button>
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
          <div className="h-4 w-48 rounded bg-slate-700" />
          <div className="h-3 w-64 rounded bg-slate-700" />
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-36 rounded bg-slate-700" />
      </td>
      <td className="px-4 py-3">
        <div className="h-5 w-20 rounded-full bg-slate-700" />
      </td>
      <td className="px-4 py-3">
        <div className="h-5 w-24 rounded-full bg-slate-700" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-32 rounded bg-slate-700" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-20 rounded bg-slate-700" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-4 rounded bg-slate-700 mx-auto" />
      </td>
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

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

// ---------------------------------------------------------------------------
// Filter options
// ---------------------------------------------------------------------------
const PRIORITY_OPTIONS: { value: TicketPriority | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All priorities' },
  { value: 'EMERGENCY', label: 'Emergency' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

const STATUS_OPTIONS: { value: TicketStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'AWAITING_PARTS', label: 'Awaiting Parts' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const PAGE_SIZE = 7;

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function MaintenancePage() {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setTickets(MOCK_TICKETS);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    setPage(1);
  }, [search, priorityFilter, statusFilter]);

  // Client-side filter + sort by priority order
  const filtered = tickets
    .filter((t) => {
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.property.title.toLowerCase().includes(q) ||
          t.property.address.toLowerCase().includes(q) ||
          (t.tenant?.name.toLowerCase().includes(q) ?? false) ||
          (t.vendor?.name.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    })
    .sort(
      (a, b) =>
        PRIORITY_CONFIG[a.priority].order - PRIORITY_CONFIG[b.priority].order,
    );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Summary stats
  const openCount       = tickets.filter((t) => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const emergencyCount  = tickets.filter((t) => t.priority === 'EMERGENCY' && t.status !== 'RESOLVED' && t.status !== 'CLOSED' && t.status !== 'CANCELLED').length;
  const resolvedCount   = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Page header                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Maintenance</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Track and resolve property maintenance tickets
          </p>
        </div>
        <Link
          href="/maintenance/new"
          className="inline-flex items-center gap-2 rounded-lg bg-orange-600 hover:bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-md shadow-orange-900/30 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Open Ticket
        </Link>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Summary cards                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          label="Open"
          value={openCount}
          icon={Clock}
          color="bg-blue-600"
          subtext="awaiting action"
        />
        <SummaryCard
          label="In Progress"
          value={inProgressCount}
          icon={RefreshCw}
          color="bg-violet-600"
          subtext="being addressed"
        />
        <SummaryCard
          label="Emergency"
          value={emergencyCount}
          icon={Flame}
          color="bg-red-600"
          subtext="critical priority"
        />
        <SummaryCard
          label="Resolved"
          value={resolvedCount}
          icon={CheckCircle2}
          color="bg-emerald-600"
          subtext="completed tickets"
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Emergency alert banner                                               */}
      {/* ------------------------------------------------------------------ */}
      {!loading && emergencyCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <Flame className="h-5 w-5 text-red-400 shrink-0 animate-pulse" />
          <p className="text-sm text-red-300 font-medium">
            {emergencyCount} emergency ticket{emergencyCount > 1 ? 's' : ''}{' '}
            require{emergencyCount === 1 ? 's' : ''} immediate attention.
          </p>
          <button
            onClick={() => {
              setPriorityFilter('EMERGENCY');
              setStatusFilter('ALL');
            }}
            className="ml-auto text-xs text-red-400 underline hover:text-red-300 transition-colors whitespace-nowrap"
          >
            View emergencies
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Filters bar                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, property, vendor…"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-colors"
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

        {/* Priority filter */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-500 shrink-0" />
          <select
            value={priorityFilter}
            onChange={(e) =>
              setPriorityFilter(e.target.value as TicketPriority | 'ALL')
            }
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-colors cursor-pointer"
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as TicketStatus | 'ALL')
          }
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-colors cursor-pointer"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Results count */}
        {(search || priorityFilter !== 'ALL' || statusFilter !== 'ALL') && (
          <span className="text-xs text-slate-400 whitespace-nowrap">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        )}

        {/* Clear all */}
        {(search || priorityFilter !== 'ALL' || statusFilter !== 'ALL') && (
          <button
            onClick={() => {
              setSearch('');
              setPriorityFilter('ALL');
              setStatusFilter('ALL');
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
                <th className="px-4 py-3 text-left font-medium text-slate-400 min-w-[220px]">
                  Ticket
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-400 min-w-[160px]">
                  Property
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">
                  Priority
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-400 min-w-[140px]">
                  Assigned Vendor
                </th>
                <th className="px-4 py-3 text-right font-medium text-slate-400">
                  Est. Cost
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-400 min-w-[90px]">
                  Opened
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
                    <Wrench className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-slate-400">
                      No tickets found
                    </p>
                    <p className="text-xs mt-1">
                      {search || priorityFilter !== 'ALL' || statusFilter !== 'ALL'
                        ? 'Try adjusting your search or filters.'
                        : 'Open your first maintenance ticket to get started.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginated.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className={`group hover:bg-slate-700/20 transition-colors ${
                      ticket.priority === 'EMERGENCY' &&
                      ticket.status !== 'RESOLVED' &&
                      ticket.status !== 'CLOSED'
                        ? 'border-l-2 border-l-red-500'
                        : ''
                    }`}
                  >
                    {/* Title + description */}
                    <td className="px-4 py-3">
                      <div>
                        <Link
                          href={`/maintenance/${ticket.id}`}
                          className="font-medium text-white hover:text-orange-400 transition-colors line-clamp-1"
                        >
                          {ticket.title}
                        </Link>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-[240px]">
                          {ticket.description}
                        </p>
                        {ticket.tenant && (
                          <p className="text-xs text-slate-600 mt-0.5">
                            Tenant:{' '}
                            <Link
                              href={`/tenants/${ticket.tenant.id}`}
                              className="text-slate-500 hover:text-slate-300 transition-colors"
                            >
                              {ticket.tenant.name}
                            </Link>
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Property */}
                    <td className="px-4 py-3">
                      <Link
                        href={`/properties/${ticket.property.id}`}
                        className="text-slate-300 hover:text-orange-400 transition-colors block truncate text-sm font-medium"
                      >
                        {ticket.property.title}
                      </Link>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {ticket.property.address}
                      </p>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3">
                      <PriorityBadge priority={ticket.priority} />
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={ticket.status} />
                      {ticket.scheduledDate &&
                        ticket.status !== 'RESOLVED' &&
                        ticket.status !== 'CLOSED' && (
                          <p className="text-xs text-slate-500 mt-1">
                            Scheduled: {formatDate(ticket.scheduledDate)}
                          </p>
                        )}
                    </td>

                    {/* Assigned Vendor */}
                    <td className="px-4 py-3">
                      {ticket.vendor ? (
                        <div>
                          <p className="text-slate-200 font-medium text-sm truncate">
                            {ticket.vendor.name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {ticket.vendor.specialty}
                          </p>
                          {ticket.vendor.phone && (
                            <a
                              href={`tel:${ticket.vendor.phone}`}
                              className="text-xs text-blue-400 hover:text-blue-300 transition-colors mt-0.5 block"
                            >
                              {ticket.vendor.phone}
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-600 italic">
                          <User className="h-3 w-3" />
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Cost */}
                    <td className="px-4 py-3 text-right">
                      {ticket.actualCost != null ? (
                        <div className="text-right">
                          <p className="font-semibold text-white tabular-nums">
                            ${ticket.actualCost.toLocaleString()}
                          </p>
                          <p className="text-xs text-emerald-500">Final</p>
                        </div>
                      ) : ticket.estimatedCost != null ? (
                        <div className="text-right">
                          <p className="font-medium text-slate-300 tabular-nums">
                            ${ticket.estimatedCost.toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-600">Est.</p>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-sm">—</span>
                      )}
                    </td>

                    {/* Opened */}
                    <td className="px-4 py-3">
                      <span
                        className="text-xs text-slate-400 whitespace-nowrap"
                        title={formatDate(ticket.createdAt)}
                      >
                        {timeAgo(ticket.createdAt)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-center">
                      <RowActions ticket={ticket} />
                    </td>
                  </tr>
                ))
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
                      ? 'bg-orange-600 text-white'
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
      {/* Legend                                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-wrap items-center gap-4 pt-2">
        <p className="text-xs text-slate-600 font-medium uppercase tracking-wide">
          Priority:
        </p>
        {(Object.keys(PRIORITY_CONFIG) as TicketPriority[]).map((p) => (
          <PriorityBadge key={p} priority={p} />
        ))}
      </div>
    </div>
  );
}

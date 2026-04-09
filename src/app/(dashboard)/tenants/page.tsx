'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Users,
  MoreHorizontal,
  Eye,
  Mail,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  SlidersHorizontal,
  Phone,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type LeaseStatus = 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'TERMINATED';

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  image?: string;
  property?: {
    id: string;
    title: string;
    address: string;
  } | null;
  lease?: {
    id: string;
    status: LeaseStatus;
    startDate: string;
    endDate: string;
    rentAmount: number;
  } | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const MOCK_TENANTS: Tenant[] = [
  {
    id: '1',
    name: 'Marcus Johnson',
    email: 'marcus.johnson@example.com',
    phone: '+1 (512) 555-0101',
    property: {
      id: 'p1',
      title: '221B Baker Street — Apt 4',
      address: '221B Baker Street, London',
    },
    lease: {
      id: 'l1',
      status: 'ACTIVE',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      rentAmount: 2400,
    },
    createdAt: '2024-01-01',
  },
  {
    id: '2',
    name: 'Sarah Chen',
    email: 'sarah.chen@example.com',
    phone: '+1 (214) 555-0202',
    property: {
      id: 'p3',
      title: 'Downtown Condo #12',
      address: '500 Main St, Unit 12, Dallas TX',
    },
    lease: {
      id: 'l2',
      status: 'ACTIVE',
      startDate: '2024-01-22',
      endDate: '2025-01-21',
      rentAmount: 1850,
    },
    createdAt: '2024-01-22',
  },
  {
    id: '3',
    name: 'David Park',
    email: 'david.park@example.com',
    phone: '+1 (615) 555-0303',
    property: {
      id: 'p4',
      title: 'Oak Lane Townhouse',
      address: '14 Oak Lane, Nashville TN',
    },
    lease: {
      id: 'l3',
      status: 'ACTIVE',
      startDate: '2023-11-30',
      endDate: '2024-11-29',
      rentAmount: 2750,
    },
    createdAt: '2023-11-30',
  },
  {
    id: '4',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@example.com',
    phone: '+1 (404) 555-0404',
    property: {
      id: 'p5',
      title: 'Studio Loft — Midtown',
      address: '900 Peachtree St NE, Atlanta GA',
    },
    lease: {
      id: 'l4',
      status: 'ACTIVE',
      startDate: '2024-03-01',
      endDate: '2025-02-28',
      rentAmount: 1100,
    },
    createdAt: '2024-03-01',
  },
  {
    id: '5',
    name: 'James Liu',
    email: 'james.liu@example.com',
    phone: '+1 (503) 555-0505',
    property: {
      id: 'p8',
      title: 'Riverside House',
      address: '32 River Rd, Portland OR',
    },
    lease: {
      id: 'l5',
      status: 'ACTIVE',
      startDate: '2024-01-05',
      endDate: '2025-01-04',
      rentAmount: 2900,
    },
    createdAt: '2024-01-05',
  },
  {
    id: '6',
    name: 'Aisha Williams',
    email: 'aisha.williams@example.com',
    phone: '+1 (713) 555-0606',
    property: null,
    lease: {
      id: 'l6',
      status: 'EXPIRED',
      startDate: '2023-01-01',
      endDate: '2023-12-31',
      rentAmount: 1600,
    },
    createdAt: '2023-01-01',
  },
  {
    id: '7',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@example.com',
    phone: '+1 (602) 555-0707',
    property: {
      id: 'p9',
      title: 'Scottsdale Heights Unit 3A',
      address: '77 Desert Bloom Ave, Scottsdale AZ',
    },
    lease: {
      id: 'l7',
      status: 'PENDING',
      startDate: '2024-11-01',
      endDate: '2025-10-31',
      rentAmount: 2200,
    },
    createdAt: '2024-10-15',
  },
  {
    id: '8',
    name: 'Priya Patel',
    email: 'priya.patel@example.com',
    phone: '+1 (206) 555-0808',
    property: {
      id: 'p10',
      title: 'Capitol Hill Studio',
      address: '420 Pine St, Seattle WA',
    },
    lease: {
      id: 'l8',
      status: 'TERMINATED',
      startDate: '2023-06-01',
      endDate: '2024-05-31',
      rentAmount: 1950,
    },
    createdAt: '2023-06-01',
  },
];

// ---------------------------------------------------------------------------
// Lease status badge
// ---------------------------------------------------------------------------
const LEASE_STATUS_CONFIG: Record<
  LeaseStatus,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: 'Active',
    className: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  },
  PENDING: {
    label: 'Pending',
    className: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
  },
  EXPIRED: {
    label: 'Expired',
    className: 'bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/30',
  },
  TERMINATED: {
    label: 'Terminated',
    className: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30',
  },
};

function LeaseStatusBadge({ status }: { status: LeaseStatus }) {
  const cfg = LEASE_STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------
function TenantAvatar({ name, image }: { name: string; image?: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name}
        className="h-8 w-8 rounded-full object-cover ring-2 ring-slate-700 shrink-0"
      />
    );
  }

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white ring-2 ring-violet-700">
      {initials}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Row actions dropdown
// ---------------------------------------------------------------------------
function RowActions({ tenant }: { tenant: Tenant }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-100 transition-colors"
        aria-label="Tenant actions"
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
              href={`/tenants/${tenant.id}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <Eye className="h-4 w-4 text-slate-500" />
              View profile
            </Link>
            <Link
              href={`/tenants/${tenant.id}/edit`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <Pencil className="h-4 w-4 text-slate-500" />
              Edit tenant
            </Link>
            <a
              href={`mailto:${tenant.email}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <Mail className="h-4 w-4 text-slate-500" />
              Send email
            </a>
            {tenant.phone && (
              <a
                href={`tel:${tenant.phone}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
              >
                <Phone className="h-4 w-4 text-slate-500" />
                Call tenant
              </a>
            )}
            <div className="my-1 border-t border-slate-700" />
            <button
              onClick={() => {
                setOpen(false);
                alert(`Remove tenant "${tenant.name}"?`);
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Remove tenant
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
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-700 shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 w-32 rounded bg-slate-700" />
            <div className="h-3 w-44 rounded bg-slate-700" />
          </div>
        </div>
      </td>
      {[60, 70, 40, 36, 24].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-slate-700" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
const PAGE_SIZE = 6;

const LEASE_STATUS_OPTIONS: { value: LeaseStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'TERMINATED', label: 'Terminated' },
];

export default function TenantsPage() {
  const [search, setSearch] = useState('');
  const [leaseFilter, setLeaseFilter] = useState<LeaseStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setTenants(MOCK_TENANTS);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  useEffect(() => {
    setPage(1);
  }, [search, leaseFilter]);

  // Client-side filter
  const filtered = tenants.filter((t) => {
    const matchesLease =
      leaseFilter === 'ALL' || t.lease?.status === leaseFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      (t.phone?.toLowerCase().includes(q) ?? false) ||
      (t.property?.title.toLowerCase().includes(q) ?? false) ||
      (t.property?.address.toLowerCase().includes(q) ?? false);
    return matchesLease && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Summary counts
  const activeTenants = tenants.filter((t) => t.lease?.status === 'ACTIVE').length;
  const pendingTenants = tenants.filter((t) => t.lease?.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Page header                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tenants</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {activeTenants} active · {pendingTenants} pending · {tenants.length} total
          </p>
        </div>
        <Link
          href="/tenants/new"
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-md shadow-violet-900/30 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Tenant
        </Link>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Filters bar                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, property…"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-colors"
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

        {/* Lease status filter */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-500 shrink-0" />
          <select
            value={leaseFilter}
            onChange={(e) =>
              setLeaseFilter(e.target.value as LeaseStatus | 'ALL')
            }
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-colors cursor-pointer"
          >
            {LEASE_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Results count */}
        {(search || leaseFilter !== 'ALL') && (
          <span className="text-xs text-slate-400 whitespace-nowrap">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
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
                <th className="px-4 py-3 text-left font-medium text-slate-400 min-w-[200px]">
                  Tenant
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-400 min-w-[180px]">
                  Property
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">
                  Lease Status
                </th>
                <th className="px-4 py-3 text-right font-medium text-slate-400">
                  Rent / mo
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-400 min-w-[130px]">
                  Lease Period
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
                    colSpan={6}
                    className="px-4 py-16 text-center text-slate-500"
                  >
                    <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-slate-400">No tenants found</p>
                    <p className="text-xs mt-1">
                      {search || leaseFilter !== 'ALL'
                        ? 'Try adjusting your search or filters.'
                        : 'Add your first tenant to get started.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginated.map((tenant) => (
                  <tr
                    key={tenant.id}
                    className="group hover:bg-slate-700/20 transition-colors"
                  >
                    {/* Name + email */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <TenantAvatar name={tenant.name} image={tenant.image} />
                        <div className="min-w-0">
                          <Link
                            href={`/tenants/${tenant.id}`}
                            className="block font-medium text-white hover:text-violet-400 transition-colors truncate"
                          >
                            {tenant.name}
                          </Link>
                          <a
                            href={`mailto:${tenant.email}`}
                            className="block text-xs text-slate-500 hover:text-slate-300 transition-colors truncate mt-0.5"
                          >
                            {tenant.email}
                          </a>
                          {tenant.phone && (
                            <p className="text-xs text-slate-600 mt-0.5 truncate">
                              {tenant.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Property */}
                    <td className="px-4 py-3">
                      {tenant.property ? (
                        <div>
                          <Link
                            href={`/properties/${tenant.property.id}`}
                            className="block text-slate-200 font-medium hover:text-violet-400 transition-colors truncate text-sm"
                          >
                            {tenant.property.title}
                          </Link>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {tenant.property.address}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600 italic">
                          No property assigned
                        </span>
                      )}
                    </td>

                    {/* Lease status */}
                    <td className="px-4 py-3">
                      {tenant.lease ? (
                        <LeaseStatusBadge status={tenant.lease.status} />
                      ) : (
                        <span className="text-xs text-slate-600 italic">
                          No lease
                        </span>
                      )}
                    </td>

                    {/* Rent amount */}
                    <td className="px-4 py-3 text-right">
                      {tenant.lease ? (
                        <span className="font-medium text-white tabular-nums">
                          ${tenant.lease.rentAmount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Lease period */}
                    <td className="px-4 py-3">
                      {tenant.lease ? (
                        <div className="text-xs text-slate-400 space-y-0.5">
                          <p>
                            <span className="text-slate-500">From </span>
                            {new Date(tenant.lease.startDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                          <p>
                            <span className="text-slate-500">To </span>
                            {new Date(tenant.lease.endDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-center">
                      <RowActions tenant={tenant} />
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
                      ? 'bg-violet-600 text-white'
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
    </div>
  );
}

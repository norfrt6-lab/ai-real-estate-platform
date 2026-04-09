'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Building2,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type PropertyStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'UNLISTED';
type PropertyType =
  | 'APARTMENT'
  | 'HOUSE'
  | 'CONDO'
  | 'TOWNHOUSE'
  | 'STUDIO'
  | 'COMMERCIAL'
  | 'LAND';

interface Property {
  id: string;
  title: string;
  address: string;
  type: PropertyType;
  status: PropertyStatus;
  monthlyRent: number;
  tenant?: { name: string; email: string } | null;
  bedrooms?: number;
  bathrooms?: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Placeholder data
// ---------------------------------------------------------------------------
const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    title: '221B Baker Street — Apt 4',
    address: '221B Baker Street, London',
    type: 'APARTMENT',
    status: 'OCCUPIED',
    monthlyRent: 2400,
    tenant: { name: 'Marcus Johnson', email: 'marcus@example.com' },
    bedrooms: 2,
    bathrooms: 1,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    title: 'Sunridge Villa',
    address: '88 Sunridge Blvd, Austin TX',
    type: 'HOUSE',
    status: 'AVAILABLE',
    monthlyRent: 3200,
    tenant: null,
    bedrooms: 4,
    bathrooms: 3,
    createdAt: '2024-02-08',
  },
  {
    id: '3',
    title: 'Downtown Condo #12',
    address: '500 Main St, Unit 12, Dallas TX',
    type: 'CONDO',
    status: 'OCCUPIED',
    monthlyRent: 1850,
    tenant: { name: 'Sarah Chen', email: 'sarah@example.com' },
    bedrooms: 1,
    bathrooms: 1,
    createdAt: '2024-01-22',
  },
  {
    id: '4',
    title: 'Oak Lane Townhouse',
    address: '14 Oak Lane, Nashville TN',
    type: 'TOWNHOUSE',
    status: 'MAINTENANCE',
    monthlyRent: 2750,
    tenant: { name: 'David Park', email: 'david@example.com' },
    bedrooms: 3,
    bathrooms: 2,
    createdAt: '2023-11-30',
  },
  {
    id: '5',
    title: 'Studio Loft — Midtown',
    address: '900 Peachtree St NE, Atlanta GA',
    type: 'STUDIO',
    status: 'OCCUPIED',
    monthlyRent: 1100,
    tenant: { name: 'Emily Rodriguez', email: 'emily@example.com' },
    bedrooms: 0,
    bathrooms: 1,
    createdAt: '2024-03-01',
  },
  {
    id: '6',
    title: 'Lakeview Apartment 7C',
    address: '1200 Lake Shore Dr, Chicago IL',
    type: 'APARTMENT',
    status: 'AVAILABLE',
    monthlyRent: 2100,
    tenant: null,
    bedrooms: 2,
    bathrooms: 2,
    createdAt: '2024-03-15',
  },
  {
    id: '7',
    title: 'Commerce Plaza Unit B',
    address: '45 Commerce Blvd, Denver CO',
    type: 'COMMERCIAL',
    status: 'UNLISTED',
    monthlyRent: 5500,
    tenant: null,
    createdAt: '2023-09-10',
  },
  {
    id: '8',
    title: 'Riverside House',
    address: '32 River Rd, Portland OR',
    type: 'HOUSE',
    status: 'OCCUPIED',
    monthlyRent: 2900,
    tenant: { name: 'James Liu', email: 'james@example.com' },
    bedrooms: 3,
    bathrooms: 2,
    createdAt: '2024-01-05',
  },
];

// ---------------------------------------------------------------------------
// Badge helper
// ---------------------------------------------------------------------------
const STATUS_CONFIG: Record<
  PropertyStatus,
  { label: string; className: string }
> = {
  AVAILABLE: {
    label: 'Available',
    className:
      'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  },
  OCCUPIED: {
    label: 'Occupied',
    className: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30',
  },
  MAINTENANCE: {
    label: 'Maintenance',
    className:
      'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
  },
  UNLISTED: {
    label: 'Unlisted',
    className:
      'bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/30',
  },
};

const TYPE_LABELS: Record<PropertyType, string> = {
  APARTMENT: 'Apartment',
  HOUSE: 'House',
  CONDO: 'Condo',
  TOWNHOUSE: 'Townhouse',
  STUDIO: 'Studio',
  COMMERCIAL: 'Commercial',
  LAND: 'Land',
};

function StatusBadge({ status }: { status: PropertyStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Row actions dropdown
// ---------------------------------------------------------------------------
function RowActions({ property }: { property: Property }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-100 transition-colors"
        aria-label="Row actions"
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
          <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-slate-700 bg-slate-800 shadow-xl shadow-black/40 py-1 overflow-hidden">
            <Link
              href={`/properties/${property.id}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <Eye className="h-4 w-4 text-slate-500" />
              View details
            </Link>
            <Link
              href={`/properties/${property.id}/edit`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <Pencil className="h-4 w-4 text-slate-500" />
              Edit
            </Link>
            <button
              onClick={() => {
                setOpen(false);
                // TODO: wire up delete mutation
                alert(`Delete property "${property.title}"?`);
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete
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
      {[80, 56, 40, 36, 64, 24].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-4 rounded bg-slate-700"
            style={{ width: `${w}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
const PAGE_SIZE = 6;

const STATUS_OPTIONS: { value: PropertyStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'OCCUPIED', label: 'Occupied' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'UNLISTED', label: 'Unlisted' },
];

export default function PropertiesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PropertyStatus | 'ALL'>(
    'ALL',
  );
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);

  // Simulate API fetch
  const fetchProperties = useCallback(async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setProperties(MOCK_PROPERTIES);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  // Client-side filter
  const filtered = properties.filter((p) => {
    const matchesStatus =
      statusFilter === 'ALL' || p.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      (p.tenant?.name.toLowerCase().includes(q) ?? false) ||
      TYPE_LABELS[p.type].toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Page header                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Properties</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Manage your property portfolio ({properties.length} total)
          </p>
        </div>
        <Link
          href="/properties/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-md shadow-blue-900/30 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Property
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
            placeholder="Search by title, address, tenant…"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
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
              setStatusFilter(e.target.value as PropertyStatus | 'ALL')
            }
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Active filters summary */}
        {(search || statusFilter !== 'ALL') && (
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
                <th className="px-4 py-3 text-left font-medium text-slate-400">
                  Property
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">
                  Type
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-medium text-slate-400">
                  Rent / mo
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">
                  Tenant
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
                    <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-slate-400">
                      No properties found
                    </p>
                    <p className="text-xs mt-1">
                      {search || statusFilter !== 'ALL'
                        ? 'Try adjusting your filters.'
                        : 'Add your first property to get started.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginated.map((property) => (
                  <tr
                    key={property.id}
                    className="group hover:bg-slate-700/20 transition-colors"
                  >
                    {/* Title + address */}
                    <td className="px-4 py-3">
                      <div>
                        <Link
                          href={`/properties/${property.id}`}
                          className="font-medium text-white hover:text-blue-400 transition-colors line-clamp-1"
                        >
                          {property.title}
                        </Link>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {property.address}
                        </p>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3 text-slate-300">
                      {TYPE_LABELS[property.type]}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={property.status} />
                    </td>

                    {/* Rent */}
                    <td className="px-4 py-3 text-right font-medium text-white tabular-nums">
                      ${property.monthlyRent.toLocaleString()}
                    </td>

                    {/* Tenant */}
                    <td className="px-4 py-3">
                      {property.tenant ? (
                        <div>
                          <p className="text-slate-200 font-medium line-clamp-1">
                            {property.tenant.name}
                          </p>
                          <p className="text-xs text-slate-500 line-clamp-1">
                            {property.tenant.email}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-600 italic text-xs">
                          Vacant
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-center">
                      <RowActions property={property} />
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
              of{' '}
              <span className="text-slate-300">{filtered.length}</span>
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
                      ? 'bg-blue-600 text-white'
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

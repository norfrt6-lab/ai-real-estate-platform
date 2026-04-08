/**
 * @module  tenant
 * @feature search-filter
 * @branch  feat/tenant-search-filter
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '@/types/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SearchFilterItem {
  id: string;
  // TODO: add real fields
  [key: string]: unknown;
}

export interface CreateSearchFilterInput {
  // TODO: add creation fields
  [key: string]: unknown;
}

export interface SearchFilterFilters {
  page?:      number;
  limit?:     number;
  search?:    string;
  sortBy?:    string;
  sortOrder?: 'asc' | 'desc';
}

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const searchFilterKeys = {
  all:    ['tenant', 'search-filter'] as const,
  list:   (filters: SearchFilterFilters = {}) => [...searchFilterKeys.all, 'list', filters] as const,
  detail: (id: string) => [...searchFilterKeys.all, 'detail', id] as const,
};

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function fetchList(filters: SearchFilterFilters): Promise<SearchFilterItem[]> {
  const params = new URLSearchParams(
    Object.entries(filters)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)]),
  );
  const res = await fetch(`/api/tenant/search-filter?${params}`);
  if (!res.ok) throw new Error('Failed to fetch search-filter');
  const json: ApiResponse<SearchFilterItem[]> = await res.json();
  return json.data ?? [];
}

async function createItem(input: CreateSearchFilterInput): Promise<SearchFilterItem> {
  const res = await fetch('/api/tenant/search-filter', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(input),
  });
  if (!res.ok) {
    const err: ApiResponse<null> = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? 'Create failed');
  }
  const json: ApiResponse<SearchFilterItem> = await res.json();
  return json.data!;
}

// ---------------------------------------------------------------------------
// Main hook
// ---------------------------------------------------------------------------

export function useSearchFilter(filters: SearchFilterFilters = {}) {
  const queryClient = useQueryClient();

  const query = useQuery<SearchFilterItem[], Error>({
    queryKey: searchFilterKeys.list(filters),
    queryFn:  () => fetchList(filters),
    staleTime: 30_000,
  });

  const mutation = useMutation<SearchFilterItem, Error, CreateSearchFilterInput>({
    mutationFn: createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: searchFilterKeys.all });
    },
  });

  return {
    // Query state
    data:      query.data ?? [],
    isLoading: query.isLoading,
    isError:   query.isError,
    error:     query.error,
    refetch:   query.refetch,

    // Mutation
    create:    mutation.mutateAsync,
    isCreating: mutation.isPending,
    createError: mutation.error,
  };
}

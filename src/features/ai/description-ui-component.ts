/**
 * @module  ai
 * @feature description-ui-component
 * @branch  feat/ai-description-ui-component
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DescriptionUiComponentItem {
  id: string;
  // TODO: add real fields
  [key: string]: unknown;
}

interface DescriptionUiComponentProps {
  /** Optional initial data to avoid loading flash */
  initialData?: DescriptionUiComponentItem[];
  className?: string;
}

// ---------------------------------------------------------------------------
// Data fetching helper
// ---------------------------------------------------------------------------

async function fetchDescriptionUiComponent(): Promise<DescriptionUiComponentItem[]> {
  const res = await fetch('/api/ai/description-ui-component', { cache: 'no-store' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? 'Failed to load description-ui-component');
  }
  const json = await res.json();
  return json.data ?? [];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DescriptionUiComponent({ initialData, className }: DescriptionUiComponentProps) {
  const { data, isLoading, isError, error, refetch } = useQuery<DescriptionUiComponentItem[], Error>({
    queryKey: ['ai', 'description-ui-component'],
    queryFn:  fetchDescriptionUiComponent,
    initialData,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className={`space-y-3 ${className ?? ''}`}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card className={`border-destructive ${className ?? ''}`}>
        <CardHeader>
          <CardTitle className="text-destructive text-sm">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error?.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-2 text-xs underline hover:no-underline"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-3 ${className ?? ''}`}>
      {(data ?? []).length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          No description ui component found.
        </p>
      )}

      {(data ?? []).map((item) => (
        <Card key={item.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{item.id}</CardTitle>
              <Badge variant="secondary">active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* TODO: render item fields */}
            <p className="text-xs text-muted-foreground">ID: {item.id}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default DescriptionUiComponent;

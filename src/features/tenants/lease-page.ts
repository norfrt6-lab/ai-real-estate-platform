/**
 * @module  tenant
 * @feature lease-page
 * @branch  feat/tenant-lease-page
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LeasePage | AI Real Estate Platform',
  description: 'LeasePage page for the AI Real Estate Platform',
};

interface LeasePagePageProps {
  params: { id?: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function LeasePagePage({ params, searchParams }: LeasePagePageProps) {
  const session = await auth();
  if (!session?.user) redirect('/auth/login');

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">LeasePage</h1>
        <p className="text-muted-foreground mt-1">
          Manage your lease page here.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        {/* TODO: add LeasePageList or LeasePageTable component */}
        <p className="text-sm text-muted-foreground">No data yet.</p>
      </div>
    </main>
  );
}

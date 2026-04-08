/**
 * @module  tenant
 * @feature profile-page
 * @branch  feat/tenant-profile-page
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ProfilePage | AI Real Estate Platform',
  description: 'ProfilePage page for the AI Real Estate Platform',
};

interface ProfilePagePageProps {
  params: { id?: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ProfilePagePage({ params, searchParams }: ProfilePagePageProps) {
  const session = await auth();
  if (!session?.user) redirect('/auth/login');

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">ProfilePage</h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile page here.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        {/* TODO: add ProfilePageList or ProfilePageTable component */}
        <p className="text-sm text-muted-foreground">No data yet.</p>
      </div>
    </main>
  );
}

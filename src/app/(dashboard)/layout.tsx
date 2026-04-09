'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Wrench,
  Bot,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  Home,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Nav items
// ---------------------------------------------------------------------------
const navItems = [
  { href: '/dashboard',   label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/properties',  label: 'Properties',    icon: Building2 },
  { href: '/tenants',     label: 'Tenants',       icon: Users },
  { href: '/payments',    label: 'Payments',      icon: CreditCard },
  { href: '/maintenance', label: 'Maintenance',   icon: Wrench },
  { href: '/ai',          label: 'AI Assistant',  icon: Bot },
  { href: '/reports',     label: 'Reports',       icon: BarChart3 },
  { href: '/settings',    label: 'Settings',      icon: Settings },
];

// ---------------------------------------------------------------------------
// Sidebar (shared between desktop and mobile)
// ---------------------------------------------------------------------------
function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-slate-700/50 px-6">
        <Home className="h-6 w-6 text-blue-400 shrink-0" />
        <span className="text-lg font-bold text-white tracking-tight">RealEstate AI</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/dashboard'
              ? pathname === '/dashboard' || pathname === '/'
              : pathname === href || pathname.startsWith(href + '/');

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavClick}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-100'
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
                }`}
              />
              {label}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/70" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom hint */}
      <div className="border-t border-slate-700/50 px-6 py-4">
        <p className="text-xs text-slate-600">
          © {new Date().getFullYear()} RealEstate AI
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// User avatar dropdown
// ---------------------------------------------------------------------------
function UserDropdown() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const initials = session?.user?.name
    ? session.user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {/* Avatar */}
        {session?.user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.user.image}
            alt={session.user.name ?? 'User'}
            className="h-7 w-7 rounded-full object-cover ring-2 ring-slate-600"
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white ring-2 ring-blue-700">
            {initials}
          </span>
        )}
        <span className="hidden sm:block max-w-[120px] truncate font-medium">
          {session?.user?.name ?? session?.user?.email ?? 'Account'}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-xl border border-slate-700 bg-slate-800 shadow-xl shadow-black/40 py-1 overflow-hidden">
            {/* User info */}
            <div className="px-4 py-3 border-b border-slate-700">
              <p className="text-sm font-medium text-white truncate">
                {session?.user?.name ?? 'User'}
              </p>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {session?.user?.email}
              </p>
              {session?.user?.role && (
                <span className="mt-1.5 inline-block rounded-full bg-blue-600/20 px-2 py-0.5 text-xs font-medium text-blue-400">
                  {session.user.role}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="py-1">
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
              >
                <Settings className="h-4 w-4 text-slate-500" />
                Settings
              </Link>
              <button
                onClick={() => {
                  setOpen(false);
                  signOut({ callbackUrl: '/login' });
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root layout
// ---------------------------------------------------------------------------
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      {/* ------------------------------------------------------------------ */}
      {/* Desktop sidebar                                                      */}
      {/* ------------------------------------------------------------------ */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:shrink-0 border-r border-slate-700/50 bg-slate-900">
        <SidebarContent />
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile sidebar overlay                                              */}
      {/* ------------------------------------------------------------------ */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside className="relative flex h-full w-72 flex-col bg-slate-900 shadow-2xl border-r border-slate-700/50">
            {/* Close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavClick={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Main content area                                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-700/50 bg-slate-900 px-4 sm:px-6 gap-4">
          {/* Left: hamburger (mobile) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb / page title placeholder */}
            <PageTitle />
          </div>

          {/* Right: notifications + user */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button className="relative rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
              <Bell className="h-5 w-5" />
              {/* Unread badge */}
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-slate-900" />
            </button>

            {/* User dropdown */}
            <UserDropdown />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Derive page title from pathname
// ---------------------------------------------------------------------------
function PageTitle() {
  const pathname = usePathname();

  const title = navItems.find(
    ({ href }) =>
      href === '/dashboard'
        ? pathname === '/dashboard' || pathname === '/'
        : pathname === href || pathname.startsWith(href + '/'),
  )?.label ?? 'Dashboard';

  return (
    <h1 className="text-base font-semibold text-white sm:text-lg">{title}</h1>
  );
}

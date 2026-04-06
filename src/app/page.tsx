import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-6 py-20">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 text-blue-400 text-sm mb-6">
            <span>🏠</span>
            <span>AI-Powered Real Estate Platform</span>
          </div>

          <h1 className="text-5xl font-bold tracking-tight mb-4">
            Manage Properties
            <span className="block text-blue-400">Smarter with AI</span>
          </h1>

          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8">
            A production-grade real estate management platform for landlords,
            tenants, and agents — powered by GPT-4, Stripe, and Next.js 14.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/auth/login"
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3 rounded-lg transition-colors border border-white/10"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors"
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Roles */}
        <div className="mt-20 text-center">
          <h2 className="text-2xl font-bold mb-8 text-slate-200">
            Built for Every Role
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {roles.map((role) => (
              <div
                key={role.name}
                className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-5 py-2 text-sm"
              >
                <span>{role.icon}</span>
                <span className="text-slate-300">{role.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-24 text-center text-slate-600 text-sm">
          <p>
            Built by{' '}
            <a
              href="https://github.com/norfrt6-lab"
              className="text-slate-500 hover:text-slate-300 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              norfrt6-lab
            </a>{' '}
            · MIT License
          </p>
        </footer>
      </div>
    </main>
  );
}

const features = [
  {
    icon: '🤖',
    title: 'AI-Powered Listings',
    description:
      'GPT-4 auto-generates SEO-optimized property descriptions, tenant screening summaries, and rent price suggestions.',
  },
  {
    icon: '💳',
    title: 'Stripe Billing',
    description:
      'Automated rent collection, security deposits, late fees, and subscription plans for landlords.',
  },
  {
    icon: '🔐',
    title: 'Role-Based Access',
    description:
      'Fine-grained RBAC for Super Admins, Landlords, Tenants, and Agents with route-level protection.',
  },
  {
    icon: '🔧',
    title: 'Maintenance Tracking',
    description:
      'AI-prioritized maintenance tickets with vendor assignment, cost tracking, and SLA monitoring.',
  },
  {
    icon: '📊',
    title: 'Analytics Dashboard',
    description:
      'Occupancy rates, revenue trends, tenant retention metrics, and AI insights — all in one view.',
  },
  {
    icon: '📧',
    title: 'Automated Emails',
    description:
      'SendGrid-powered email workflows for rent reminders, payment receipts, and lease expiry warnings.',
  },
];

const roles = [
  { icon: '👑', name: 'Super Admin' },
  { icon: '🏠', name: 'Landlord' },
  { icon: '🪪', name: 'Tenant' },
  { icon: '🤝', name: 'Agent' },
];

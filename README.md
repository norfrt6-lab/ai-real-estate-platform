# 🏠 AI-Based Real Estate Management Platform

> Production-grade, AI-powered real estate platform built with Next.js 14, GPT-4, Stripe, and PostgreSQL.

[![CI](https://github.com/norfrt6-lab/ai-real-estate-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/norfrt6-lab/ai-real-estate-platform/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## Overview

A full-stack real estate management platform with AI-powered features for landlords, tenants, and agents. Built for production with clean architecture, RBAC, Stripe billing, and OpenAI GPT-4 integration.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | Next.js API Routes, Node.js |
| **Database** | PostgreSQL 16, Prisma ORM |
| **Auth** | NextAuth.js v5 (Google, GitHub, Credentials) |
| **AI** | OpenAI GPT-4 API |
| **Payments** | Stripe (Subscriptions + Metered Billing) |
| **Email** | SendGrid |
| **Storage** | AWS S3 / Cloudinary |
| **State** | Zustand, React Query |
| **Testing** | Jest, React Testing Library, Playwright |
| **CI/CD** | GitHub Actions, Vercel |

---

## Architecture

```
src/
├── app/                    # Next.js App Router pages & layouts
├── components/             # Reusable UI components
│   ├── ui/                 # Base UI (shadcn/ui)
│   ├── forms/              # Form components
│   └── layouts/            # Layout components
├── features/               # Feature modules
│   ├── auth/
│   ├── properties/
│   ├── tenants/
│   ├── payments/
│   ├── ai/
│   ├── maintenance/
│   ├── notifications/
│   ├── dashboard/
│   ├── admin/
│   └── reports/
├── lib/                    # Third-party clients
│   ├── prisma.ts
│   ├── stripe.ts
│   ├── openai.ts
│   ├── sendgrid.ts
│   └── auth.ts
├── hooks/                  # Custom React hooks
├── services/               # Business logic layer
├── repositories/           # Data access layer
├── types/                  # TypeScript types & interfaces
├── utils/                  # Helper utilities
└── middleware/             # Auth & validation middleware
```

---

## Roles & Permissions (RBAC)

| Role | Access |
|---|---|
| **Super Admin** | Full platform access, manage all users |
| **Landlord** | Own properties, tenants, payments, reports |
| **Tenant** | Lease info, rent payments, maintenance requests |
| **Agent** | Property listings, leads, commissions |

---

## AI Features

- **Smart Property Descriptions** — GPT-4 generates SEO-optimized listings
- **Tenant Screening Assistant** — AI analysis of applications
- **Rent Price Suggestions** — Market-based pricing recommendations
- **Maintenance Triage** — Auto-classify and prioritize tickets (Low/Medium/High/Emergency)
- **AI Chatbot** — 24/7 assistant for tenants and landlords
- **Document Summarizer** — Summarize lease agreements instantly

---

## Core Modules

### Properties
- Full CRUD with photo uploads (S3/Cloudinary)
- Availability calendar, floor plans, virtual tours
- Google Maps API for nearby amenities
- Search, filter, and sort

### Tenants
- Onboarding flow with document upload
- AI-powered background check summary
- Lease management and rent tracking

### Payments
- Stripe rent collection with late fee automation
- Security deposit handling
- PDF/CSV financial reports
- Subscription plans: Basic / Pro / Enterprise

### Maintenance
- Ticket system with photo uploads
- AI priority classification
- Vendor assignment and cost tracking
- SLA monitoring

### Dashboard & Analytics
- Occupancy rate, revenue, and maintenance charts
- Tenant retention metrics
- AI insights panel
- Role-based views

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16
- pnpm 9+

### Installation

```bash
git clone https://github.com/norfrt6-lab/ai-real-estate-platform.git
cd ai-real-estate-platform
pnpm install
cp .env.example .env.local
docker compose up -d
pnpm db:push
pnpm db:seed
pnpm dev
```

### Environment Variables

See [`.env.example`](./.env.example) for the full list of required environment variables.

---

## Database Schema

Key models: `User`, `Property`, `Lease`, `Payment`, `MaintenanceTicket`, `Notification`, `AuditLog`

```bash
pnpm db:push      # Push schema to database
pnpm db:migrate   # Run migrations
pnpm db:seed      # Seed with sample data
pnpm db:studio    # Open Prisma Studio
```

---

## Testing

```bash
pnpm test           # Run all tests
pnpm test:unit      # Unit tests only
pnpm test:e2e       # Playwright E2E tests
pnpm test:coverage  # Coverage report
```

---

## Git Workflow

```
main (production)
 └── dev (integration)
      ├── feat/<name>   →  PR into dev
      └── fix/<name>    →  PR into dev
```

- Never push directly to `main` or `dev`
- Feature branches created from `dev`
- Daily releases: `dev` → `main` via PR

---

## Deployment

Deployed on **Vercel** with **PlanetScale** (PostgreSQL) and **Sentry** for error monitoring.

```bash
pnpm build    # Production build
pnpm start    # Start production server
```

---

## License

MIT © [norfrt6-lab](https://github.com/norfrt6-lab)
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Real Estate Platform',
  description:
    'Production-grade, AI-powered real estate management platform for landlords, tenants, and agents.',
  keywords: ['real estate', 'property management', 'AI', 'rental', 'landlord', 'tenant'],
  authors: [{ name: 'norfrt6-lab' }],
  openGraph: {
    title: 'AI Real Estate Platform',
    description: 'Manage properties, tenants, and payments with AI-powered insights.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}

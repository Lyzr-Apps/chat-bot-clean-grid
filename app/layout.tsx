/**
 * ROOT LAYOUT - Next.js App Router
 *
 * ⚠️ DO NOT MODIFY THIS FILE unless you know what you're doing!
 * ⚠️ NEVER import from 'next/document' - that's for Pages Router only!
 * ⚠️ NEVER use <Html>, <Head>, <Main>, or <NextScript> here!
 *
 * For custom metadata: Use the `metadata` export below
 * For custom fonts: Add to <head> via metadata or use next/font
 * For global styles: Import CSS in this file
 */

import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lyra App',
  description: 'Built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}

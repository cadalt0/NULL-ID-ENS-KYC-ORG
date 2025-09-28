import type { Metadata } from 'next'
import '../src/app/globals.css'

export const metadata: Metadata = {
  title: 'Self Protocol - Create Your Null ID',
  description: 'Privacy-first identity verification using Self Protocol',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
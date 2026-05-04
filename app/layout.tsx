import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Navbar from './components/Navbar'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Manitoba Medication Safety Platform',
  description: 'FHIR R4 medication reconciliation for Manitoba hospital pharmacists',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} overflow-x-hidden`}>
        <Navbar />
        {children}
      </body>
    </html>
  )
}
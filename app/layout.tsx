import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Manitoba Medication Safety Platform',
  description: 'FHIR R4 medication reconciliation for Manitoba hospital pharmacists',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <nav className="bg-white border-b border-gray-200 px-8 h-14 flex items-center justify-between sticky top-0 z-50">
          <Link href="/" className="text-sm font-bold text-gray-900">
            Manitoba Med Safety
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/formulary" className="text-sm font-medium text-gray-500 px-3 py-1.5 rounded-md hover:bg-gray-100">
              Formulary
            </Link>
            <Link href="/reconciliation" className="text-sm font-medium text-gray-500 px-3 py-1.5 rounded-md hover:bg-gray-100">
              Reconciliation
            </Link>
            <Link href="/fhir" className="text-sm font-medium text-gray-500 px-3 py-1.5 rounded-md hover:bg-gray-100">
              FHIR API
            </Link>
            <Link href="/eds" className="text-sm font-medium text-gray-500 px-3 py-1.5 rounded-md hover:bg-gray-100">
              EDS
            </Link>
              <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-white bg-gray-900 px-4 py-1.5 rounded-md ml-2 hover:bg-gray-700"
            >
              GitHub
            </a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}

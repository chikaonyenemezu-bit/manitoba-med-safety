'use client'

import Link from 'next/link'
import { useState } from 'react'

const navLinks = [
  { href: '/formulary', label: 'Formulary' },
  { href: '/reconciliation', label: 'Reconciliation' },
  { href: '/fhir', label: 'FHIR API' },
  { href: '/eds', label: 'EDS' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <nav className="bg-white border-b border-gray-200 px-4 md:px-8 h-14 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="text-sm font-bold text-gray-900 shrink-0">
          Manitoba Med Safety
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium text-gray-500 px-3 py-1.5 rounded-md hover:bg-gray-100"
            >
              {label}
            </Link>
          ))}

          <a
            href="https://github.com/chikaonyenemezu-bit/manitoba-med-safety"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-white bg-gray-900 px-4 py-1.5 rounded-md ml-2 hover:bg-gray-700"
          >
            GitHub
          </a>
        </div>

        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-0.5 bg-gray-900 transition-transform duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-0.5 bg-gray-900 transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-gray-900 transition-transform duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </nav>

      {menuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex flex-col gap-1 sticky top-14 z-40">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium text-gray-600 px-3 py-2 rounded-md hover:bg-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}

          <a
            href="https://github.com/chikaonyenemezu-bit/manitoba-med-safety"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-white bg-gray-900 px-4 py-2 rounded-md mt-1 text-center hover:bg-gray-700"
          >
            GitHub
          </a>
        </div>
      )}
    </>
  )
}
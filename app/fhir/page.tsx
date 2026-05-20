'use client'

import { useState } from 'react'

const EXAMPLE_QUERIES = [
  {
    label: 'CapabilityStatement',
    url: '/api/fhir/metadata',
    description: 'Server capabilities and supported profiles',
  },
  {
    label: 'Search by drug name',
    url: '/api/fhir/Medication?_text=metformin',
    description: 'FHIR Bundle of Medication resources',
  },
  {
    label: 'Search by DIN',
    url: '/api/fhir/Medication?identifier=http://health.canada.ca/din|02223562',
    description: 'Lookup by Canadian Drug Identification Number',
  },
  {
    label: 'Single Medication by DIN',
    url: '/api/fhir/Medication/02223562',
    description: 'Individual Medication resource — pms-Metformin',
  },
  {
    label: 'MedicationKnowledge by DIN',
    url: '/api/fhir/Medication/02223562?_type=MedicationKnowledge',
    description: 'Formulary coverage and regulatory information',
  },
  {
    label: 'Search atorvastatin',
    url: '/api/fhir/Medication?_text=atorvastatin',
    description: 'Interchangeable atorvastatin products',
  },
  {
    label: 'Search warfarin',
    url: '/api/fhir/Medication?_text=warfarin',
    description: 'Warfarin products on Manitoba formulary',
  },
]

const SPACING = {
  pagePadding: 'px-6',
  sectionGap: 'gap-6',
  cardPadding: 'p-4',
  inputHeight: 'h-10',
  radius: 'rounded-lg',
}

const COLORS = {
  primary: 'bg-blue-600',
  primaryHover: 'hover:bg-blue-700',
  primaryText: 'text-blue-600',
  activeCard: 'border-blue-500 bg-blue-50',
  defaultCard: 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
  badge200: 'bg-green-100 text-green-700',
  badgeType: 'bg-gray-100 text-gray-600',
  errorBg: 'bg-red-50 border-red-200 text-red-700',
}

export default function FHIRExplorer() {
  const [url, setUrl] = useState('')
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeExample, setActiveExample] = useState<string | null>(null)

  async function query(queryUrl: string) {
    if (!queryUrl.trim()) return
    setLoading(true)
    setError(null)
    setResponse(null)
    setUrl(queryUrl)
    try {
      const res = await fetch(queryUrl)
      const data = await res.json()
      setResponse(data)
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') query(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200">
        <div className={`max-w-6xl mx-auto ${SPACING.pagePadding} py-5 flex items-center justify-between`}>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 tracking-tight">
              FHIR API Explorer
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              HL7 FHIR R4 · Manitoba Drug Benefits Formulary · CA-Core profiles
            </p>
          </div>
          <span className="text-xs font-mono text-gray-400 hidden sm:block">
            http://health.canada.ca/din
          </span>
        </div>
      </header>

      {/* ── Body ── */}
      <main className={`max-w-6xl mx-auto ${SPACING.pagePadding} py-6`}>
        <div className={`grid grid-cols-1 lg:grid-cols-[280px_1fr] ${SPACING.sectionGap}`}>

          {/* ── Sidebar ── */}
          <aside className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Example Queries
            </p>

            <div className="flex flex-col gap-1.5">
              {EXAMPLE_QUERIES.map(ex => (
                <button
                  key={ex.url}
                  onClick={() => { setActiveExample(ex.url); query(ex.url) }}
                  className={`w-full text-left ${SPACING.cardPadding} ${SPACING.radius} border transition-all duration-150 ${
                    activeExample === ex.url ? COLORS.activeCard : COLORS.defaultCard
                  }`}
                >
                  <p className="text-sm font-medium text-gray-800 leading-snug">
                    {ex.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                    {ex.description}
                  </p>
                  <p className={`font-mono text-xs mt-1.5 break-all ${
                    activeExample === ex.url ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {ex.url}
                  </p>
                </button>
              ))}
            </div>

            {/* Context chip */}
            <div className={`mt-1 border border-gray-200 bg-white ${SPACING.radius} ${SPACING.cardPadding}`}>
              <p className="text-xs font-semibold text-gray-500 mb-2">Context</p>
              <dl className="space-y-1.5">
                <div>
                  <dt className="text-xs text-gray-400">DIN system URI</dt>
                  <dd className="font-mono text-xs text-gray-700 break-all">
                    http://health.canada.ca/din
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">Profile</dt>
                  <dd className="font-mono text-xs text-gray-700">ca.infoway.io CA-Core</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">Standard</dt>
                  <dd className="text-xs text-gray-700">Canada Health Infoway ACCESS Health · FHIR R4</dd>
                </div>
              </dl>
            </div>
          </aside>

          {/* ── Response panel ── */}
          <section className="flex flex-col gap-3 min-w-0">

            {/* URL bar */}
            <div className="flex gap-2">
              <div className="flex-1 flex items-center border border-gray-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all overflow-hidden">
                <span className="pl-3 pr-2 text-xs font-semibold text-gray-400 select-none shrink-0">
                  GET
                </span>
                <div className="w-px h-4 bg-gray-200 shrink-0" />
                <input
                  type="text"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="/api/fhir/Medication?_text=metformin"
                  className="flex-1 font-mono text-sm px-3 py-2.5 bg-transparent focus:outline-none text-gray-800 placeholder-gray-300 min-w-0"
                />
              </div>
              <button
                onClick={() => query(url)}
                disabled={loading || !url.trim()}
                className={`${COLORS.primary} ${COLORS.primaryHover} text-white px-5 h-10 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0`}
              >
                {loading ? 'Loading…' : 'Send'}
              </button>
            </div>

            {/* States */}
            {!response && !loading && !error && (
              <div className="flex-1 flex items-center justify-center bg-white border border-dashed border-gray-200 rounded-xl py-16 text-center">
                <div>
                  <p className="text-sm text-gray-400">Select a query or enter a URL above</p>
                  <p className="text-xs text-gray-300 mt-1">Press Enter or click Send</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center bg-white border border-gray-200 rounded-xl py-16">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <svg className="animate-spin h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Querying FHIR endpoint…
                </div>
              </div>
            )}

            {error && !loading && (
              <div className={`border ${COLORS.errorBg} rounded-xl p-4`}>
                <p className="text-xs font-semibold mb-0.5">Request failed</p>
                <p className="text-xs font-mono">{error}</p>
              </div>
            )}

            {response && !loading && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {/* Response meta bar */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${COLORS.badge200}`}>
                      200 OK
                    </span>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded ${COLORS.badgeType}`}>
                      application/fhir+json
                    </span>
                  </div>
                  {response.resourceType && (
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>
                        resourceType: <span className="font-semibold text-gray-700">{response.resourceType}</span>
                      </span>
                      {response.total !== undefined && (
                        <span>
                          total: <span className="font-semibold text-gray-700">{response.total}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* JSON */}
                <pre className="p-4 text-xs font-mono text-gray-700 leading-relaxed overflow-auto max-h-[600px] bg-white">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
'use client'

import { useMemo, useState } from 'react'

const EXAMPLE_QUERIES = [
  {
    group: 'Server',
    label: 'CapabilityStatement',
    url: '/api/fhir/metadata',
    description: 'View supported FHIR resources, interactions, and server capability metadata.',
  },
  {
    group: 'Search',
    label: 'Search by drug name',
    url: '/api/fhir/Medication?_text=metformin',
    description: 'Return a Bundle of Medication resources matching a text search.',
  },
  {
    group: 'Search',
    label: 'Search atorvastatin',
    url: '/api/fhir/Medication?_text=atorvastatin',
    description: 'Find atorvastatin products from the loaded formulary dataset.',
  },
  {
    group: 'Search',
    label: 'Search warfarin',
    url: '/api/fhir/Medication?_text=warfarin',
    description: 'Find warfarin products from the loaded formulary dataset.',
  },
  {
    group: 'Identifier',
    label: 'Search by DIN',
    url: '/api/fhir/Medication?identifier=http://health.canada.ca/din|02223562',
    description: 'Search by Canadian Drug Identification Number identifier.',
  },
  {
    group: 'Read',
    label: 'Single Medication by DIN',
    url: '/api/fhir/Medication/02223562',
    description: 'Read one Medication resource using a DIN-style route parameter.',
  },
  {
    group: 'Knowledge',
    label: 'MedicationKnowledge by DIN',
    url: '/api/fhir/Medication/02223562?_type=MedicationKnowledge',
    description: 'View coverage and formulary-style knowledge attached to a DIN.',
  },
]

type ResponseTab = 'summary' | 'pretty' | 'raw'
type ResponseSummary = {
  resourceType?: string
  total?: number
  entries?: number
  id?: string
}

export default function FHIRExplorer() {
  const [url, setUrl] = useState('/api/fhir/Medication?_text=metformin')
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeExample, setActiveExample] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ResponseTab>('summary')
  const [copied, setCopied] = useState(false)

  const groupedExamples = useMemo(() => {
    return EXAMPLE_QUERIES.reduce<Record<string, typeof EXAMPLE_QUERIES>>((acc, item) => {
      acc[item.group] ||= []
      acc[item.group].push(item)
      return acc
    }, {})
  }, [])

  const responseSummary: ResponseSummary | null = useMemo(() => {
    if (!response) return null
    return {
      resourceType: response.resourceType,
      total: response.total,
      entries: Array.isArray(response.entry) ? response.entry.length : undefined,
      id: response.id,
    }
  }, [response])

  async function runQuery(queryUrl: string) {
    const cleanedUrl = queryUrl.trim()
    if (!cleanedUrl) return
    setLoading(true)
    setError(null)
    setResponse(null)
    setCopied(false)
    setUrl(cleanedUrl)
    try {
      const res = await fetch(cleanedUrl)
      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('json')) throw new Error(`Expected JSON but received ${contentType || 'unknown content type'}.`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.issue?.[0]?.diagnostics || data?.message || `Request failed with status ${res.status}.`)
      setResponse(data)
      setActiveTab('summary')
    } catch (e: any) {
      setError(e.message || 'Request failed.')
    } finally {
      setLoading(false)
    }
  }

  async function copyResponse() {
    if (!response) return
    const json = activeTab === 'raw' ? JSON.stringify(response) : JSON.stringify(response, null, 2)
    await navigator.clipboard.writeText(json)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-[#0f1923]" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Header ── */}
      <header className="bg-white border-b border-[#0f1923]/8">
        <div className="max-w-6xl mx-auto px-6 pt-10 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-end">
            <div>
              <p className="text-[11px] font-bold tracking-widest uppercase text-[#0f1923]/35 mb-2">
                FHIR R4 API Explorer
              </p>
              <h1 className="text-3xl font-bold tracking-tight mb-1">
                Test medication API routes built from Manitoba formulary data.
              </h1>
              <p className="text-sm text-[#0f1923]/45 leading-relaxed max-w-2xl">
                Run example FHIR-style requests, inspect JSON responses, and review how DIN-based medication records are represented for interoperability demonstrations.
              </p>
            </div>
            <div className="hidden lg:flex flex-col gap-1 text-right text-[11px] text-[#0f1923]/35 pb-1">
              <span className="font-mono">http://health.canada.ca/din</span>
              <span>FHIR R4-style JSON</span>
              <span>Manitoba formulary data</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 items-start">

          {/* ── Sidebar ── */}
          <aside className="space-y-3 lg:sticky lg:top-6">
            <div className="bg-white border border-[#0f1923]/8 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-[#0f1923]/40">Example Requests</h2>
                  <p className="text-[11px] text-[#0f1923]/35 mt-0.5">Select a route to populate and run.</p>
                </div>
                <span className="text-[11px] text-[#0f1923]/30">{EXAMPLE_QUERIES.length}</span>
              </div>

              <div className="space-y-5 max-h-[640px] overflow-y-auto pr-1">
                {Object.entries(groupedExamples).map(([group, examples]) => (
                  <div key={group}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#0f1923]/30 mb-2">{group}</p>
                    <div className="space-y-1.5">
                      {examples.map((ex) => {
                        const active = activeExample === ex.url
                        return (
                          <button
                            key={ex.url}
                            onClick={() => { setActiveExample(ex.url); runQuery(ex.url) }}
                            className={`w-full text-left p-3.5 rounded-lg border transition-all duration-150 ${
                              active
                                ? 'border-[#0f1923]/20 bg-[#0f1923] text-white'
                                : 'border-[#0f1923]/8 bg-[#f8f7f4] hover:bg-[#f0efe9] hover:border-[#0f1923]/15'
                            }`}
                          >
                            <p className={`text-xs font-semibold leading-snug ${active ? 'text-white' : 'text-[#0f1923]'}`}>
                              {ex.label}
                            </p>
                            <p className={`text-[11px] mt-1 leading-relaxed ${active ? 'text-white/55' : 'text-[#0f1923]/45'}`}>
                              {ex.description}
                            </p>
                            <p className={`font-mono text-[10px] mt-1.5 break-all ${active ? 'text-white/50' : 'text-[#0f1923]/30'}`}>
                              {ex.url}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* What to review */}
            <div className="bg-white border border-[#0f1923]/8 rounded-xl p-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#0f1923]/35 mb-3">What to review</p>
              <ul className="space-y-2">
                {[
                  'Resource type and Bundle structure',
                  'DIN identifier mapping',
                  'Medication vs MedicationKnowledge output',
                  'Search totals and entry counts',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-[#0f1923]/50">
                    <span className="text-[#0f1923]/20 shrink-0 mt-0.5">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* ── Main panel ── */}
          <div className="space-y-3 min-w-0">

            {/* URL bar */}
            <div className="bg-white border border-[#0f1923]/8 rounded-xl p-4">
              <label htmlFor="fhir-url" className="block text-[11px] font-bold uppercase tracking-widest text-[#0f1923]/35 mb-2.5">
                Request URL
              </label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center border border-[#0f1923]/15 rounded-lg bg-[#f8f7f4] focus-within:ring-2 focus-within:ring-[#0f1923]/20 focus-within:border-[#0f1923]/30 transition-all overflow-hidden">
                  <span className="pl-3 pr-2 text-[11px] font-bold text-emerald-600 select-none shrink-0">GET</span>
                  <div className="w-px h-4 bg-[#0f1923]/10 shrink-0" />
                  <input
                    id="fhir-url"
                    type="text"
                    value={url}
                    onChange={(e) => { setUrl(e.target.value); setActiveExample(null) }}
                    onKeyDown={(e) => e.key === 'Enter' && runQuery(url)}
                    placeholder="/api/fhir/Medication?_text=metformin"
                    className="flex-1 font-mono text-sm px-3 py-3 bg-transparent focus:outline-none text-[#0f1923] placeholder-[#0f1923]/25 min-w-0"
                  />
                </div>
                <button
                  onClick={() => runQuery(url)}
                  disabled={loading || !url.trim()}
                  className="bg-[#0f1923] text-white px-6 h-[46px] rounded-lg text-sm font-semibold hover:bg-[#1e2d3d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  {loading ? 'Sending…' : 'Send'}
                </button>
              </div>
              <p className="text-[11px] text-[#0f1923]/30 mt-2">
                Use relative API routes · Press Enter to send
              </p>
            </div>

            {/* States */}
            {!response && !loading && !error && (
              <div className="bg-white border border-dashed border-[#0f1923]/12 rounded-xl p-8 text-center">
                <p className="text-sm font-semibold text-[#0f1923] mb-1.5">Run a FHIR-style medication request.</p>
                <p className="text-xs text-[#0f1923]/45 max-w-lg mx-auto mb-5">
                  Select an example or edit the URL. The response panel shows returned JSON, resource type, total results, and entry count.
                </p>
                <div className="grid grid-cols-3 gap-3 text-left max-w-md mx-auto">
                  {[
                    { title: 'Search', text: 'Bundle via _text search' },
                    { title: 'Identifier', text: 'Lookup by Canadian DIN' },
                    { title: 'Read', text: 'Single Medication resource' },
                  ].map((item) => (
                    <div key={item.title} className="bg-[#f8f7f4] border border-[#0f1923]/8 rounded-lg p-3">
                      <p className="text-xs font-semibold text-[#0f1923]">{item.title}</p>
                      <p className="text-[11px] text-[#0f1923]/45 mt-0.5">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="bg-white border border-[#0f1923]/8 rounded-xl py-16 text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-[#0f1923]/40 mb-1">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Querying FHIR endpoint…
                </div>
                <p className="text-[11px] text-[#0f1923]/30">Fetching JSON response from the selected API route.</p>
              </div>
            )}

            {error && !loading && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-5">
                <p className="text-sm font-semibold mb-1">Request failed</p>
                <p className="text-xs leading-relaxed mb-3">
                  The endpoint did not return a successful FHIR-style JSON response. Check the route, query parameter, or server handler.
                </p>
                <pre className="bg-white/70 border border-red-100 rounded-lg p-3 text-xs font-mono overflow-auto">{error}</pre>
              </div>
            )}

            {response && !loading && (
              <div className="space-y-3">
                {/* Metric bar */}
                {responseSummary && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Resource type', value: responseSummary.resourceType || 'Unknown' },
                      { label: 'Total',          value: responseSummary.total !== undefined ? String(responseSummary.total) : '—' },
                      { label: 'Entries',        value: responseSummary.entries !== undefined ? String(responseSummary.entries) : '—' },
                      { label: 'ID',             value: responseSummary.id || '—' },
                    ].map((m) => (
                      <div key={m.label} className="bg-white border border-[#0f1923]/8 rounded-xl p-4 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#0f1923]/35 mb-1">{m.label}</p>
                        <p className="text-sm font-bold text-[#0f1923] truncate">{m.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Response panel */}
                <div className="bg-white border border-[#0f1923]/8 rounded-xl overflow-hidden">
                  {/* Toolbar */}
                  <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#0f1923]/6 bg-[#f8f7f4]">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700">200 OK</span>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-[#f0efe9] border border-[#0f1923]/8 text-[#0f1923]/50">application/fhir+json</span>
                    </div>
                    <button
                      onClick={copyResponse}
                      className="text-[11px] font-semibold text-[#0f1923] bg-white border border-[#0f1923]/10 px-3 py-1.5 rounded-lg hover:bg-[#f0efe9] transition-colors"
                    >
                      {copied ? 'Copied' : activeTab === 'raw' ? 'Copy raw' : 'Copy JSON'}
                    </button>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-1 px-4 pt-3 border-b border-[#0f1923]/6 bg-white">
                    {(['summary', 'pretty', 'raw'] as ResponseTab[]).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`text-xs font-semibold px-4 py-2 rounded-t-lg border-b-2 transition-colors capitalize ${
                          activeTab === tab
                            ? 'text-[#0f1923] border-[#0f1923]'
                            : 'text-[#0f1923]/40 border-transparent hover:text-[#0f1923]/70'
                        }`}
                      >
                        {tab === 'pretty' ? 'Pretty JSON' : tab === 'raw' ? 'Raw JSON' : 'Summary'}
                      </button>
                    ))}
                  </div>

                  {activeTab === 'summary' && <HumanReadableSummary response={response} />}

                  {activeTab === 'pretty' && (
                    <pre className="p-4 text-xs font-mono text-[#0f1923]/80 leading-relaxed overflow-auto max-h-[640px] bg-white">
                      {JSON.stringify(response, null, 2)}
                    </pre>
                  )}

                  {activeTab === 'raw' && (
                    <pre className="p-4 text-xs font-mono text-[#0f1923]/80 leading-relaxed overflow-auto max-h-[640px] bg-white whitespace-pre-wrap break-all">
                      {JSON.stringify(response)}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function HumanReadableSummary({ response }: { response: any }) {
  const entries = Array.isArray(response.entry) ? response.entry : []
  const isBundle = response.resourceType === 'Bundle'
  const isMedication = response.resourceType === 'Medication'
  const isCapabilityStatement = response.resourceType === 'CapabilityStatement'

  return (
    <div className="p-5 bg-white">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Resource type',    value: response.resourceType || 'Unknown' },
          { label: 'Returned entries', value: isBundle ? String(entries.length) : 'Single resource' },
          { label: 'Total matches',    value: response.total !== undefined ? String(response.total) : 'Not provided' },
        ].map((m) => (
          <div key={m.label} className="bg-[#f8f7f4] border border-[#0f1923]/8 rounded-lg p-3.5 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#0f1923]/35 mb-1">{m.label}</p>
            <p className="text-sm font-bold text-[#0f1923] truncate">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#f8f7f4] border border-[#0f1923]/8 rounded-lg p-4 mb-5">
        <p className="text-xs font-bold text-[#0f1923] mb-1">What this response means</p>
        <p className="text-xs text-[#0f1923]/60 leading-relaxed">
          {isBundle && 'This is a search result Bundle. Each entry contains a medication-related resource returned by the API for the request above.'}
          {isMedication && 'This is a single Medication resource. It represents one DIN-level medication record from the loaded formulary dataset.'}
          {isCapabilityStatement && 'This is the server CapabilityStatement. It describes which FHIR-style resources and interactions this demo API supports.'}
          {!isBundle && !isMedication && !isCapabilityStatement && 'This is a FHIR-style JSON response returned by the selected API route.'}
        </p>
      </div>

      {isBundle && entries.length > 0 && (
        <div>
          <p className="text-xs font-bold text-[#0f1923] mb-3">First results preview</p>
          <div className="space-y-2">
            {entries.slice(0, 5).map((entry: any, i: number) => {
              const resource = entry.resource || {}
              const coding = resource.code?.coding?.[0]
              const text = resource.code?.text || coding?.display || resource.name || 'Unnamed resource'
              const din = resource.identifier?.find((id: any) => id.system === 'http://health.canada.ca/din')?.value
              return (
                <div key={entry.fullUrl || i} className="border border-[#0f1923]/8 rounded-lg p-3 bg-[#f8f7f4]">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[#0f1923]">{text}</p>
                      <p className="text-[11px] text-[#0f1923]/40 mt-0.5">
                        {resource.resourceType || 'Resource'}{din ? ` · DIN ${din}` : ''}
                      </p>
                    </div>
                    {resource.status && (
                      <span className="text-[11px] font-semibold bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 self-start md:self-auto">
                        {resource.status}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {entries.length > 5 && (
            <p className="text-[11px] text-[#0f1923]/35 mt-3">
              Showing first 5 of {entries.length} returned entries. Use Pretty JSON for the full response.
            </p>
          )}
        </div>
      )}

      {!isBundle && (
        <div>
          <p className="text-xs font-bold text-[#0f1923] mb-3">Resource details</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: 'ID',     value: response.id || 'Not provided' },
              { label: 'Status', value: response.status || 'Not provided' },
              { label: 'Text',   value: response.code?.text || response.name || 'Not provided' },
              { label: 'DIN',    value: response.identifier?.find((id: any) => id.system === 'http://health.canada.ca/din')?.value || 'Not provided' },
            ].map((m) => (
              <div key={m.label} className="bg-[#f8f7f4] border border-[#0f1923]/8 rounded-lg p-3.5 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#0f1923]/35 mb-1">{m.label}</p>
                <p className="text-sm font-bold text-[#0f1923] truncate">{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
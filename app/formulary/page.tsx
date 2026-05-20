'use client'

import { useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Drug {
  din: string
  drug_name: string
  strength: string
  dosage_form: string
  product_name: string
  manufacturer_code: string
  manufacturer_name: string | null
  price: number
  interchangeable_group: string
  formulary_status: string
  general_benefit: boolean
  eds: {
    therapeutic_category: string
    brand_name: string
    strength: string
    dosage_form: string
  } | null
  dpd: {
    company_name: string
    active_ingredients: string
    last_update: string
  } | null
}

type CoverageFilter = 'all' | 'general' | 'eds' | 'not-benefit'
type SortOption = 'relevance' | 'price-low' | 'price-high' | 'name'

const PAGE_SIZE = 50

const coverageFilters: { value: CoverageFilter; label: string; helper: string }[] = [
  { value: 'all',         label: 'All results',          helper: 'Show every matching DIN' },
  { value: 'general',     label: 'General Benefit',      helper: 'Covered without special approval' },
  { value: 'eds',         label: 'EDS required',         helper: 'Requires Exception Drug Status review' },
  { value: 'not-benefit', label: 'Not listed as benefit', helper: 'May require verification' },
]

export default function FormularySearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Drug[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [coverageFilter, setCoverageFilter] = useState<CoverageFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('relevance')

  async function search(pageNum = 0) {
    const cleanedQuery = query.trim()
    if (!cleanedQuery) return

    setLoading(true)
    setError(null)

    if (pageNum === 0) {
      setSearched(true)
      setResults([])
      setCoverageFilter('all')
      setSortBy('relevance')
    }

    const isDIN = /^\d+$/.test(cleanedQuery)
    const from = pageNum * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data: formularyData, error: formularyError, count } = await supabase
      .from('mb_interchangeability')
      .select('*', { count: 'exact' })
      .or(
        isDIN
          ? `din.ilike.%${cleanedQuery}%`
          : `drug_name.ilike.%${cleanedQuery}%,product_name.ilike.%${cleanedQuery}%`
      )
      .range(from, to)

    if (formularyError) {
      setError(formularyError.message)
      setLoading(false)
      return
    }

    const safeData = formularyData || []
    const dins = safeData.map((d) => d.din)
    const manufacturerCodes = [...new Set(safeData.map((d) => d.manufacturer_code).filter(Boolean))]
    const productNamesUpper = safeData.map((d) => d.product_name?.toUpperCase()).filter(Boolean) as string[]

    const [edsRes, mfrRes, benefitsRes, dpdRes] = await Promise.all([
      dins.length ? supabase.from('mb_eds').select('*').in('din', dins) : Promise.resolve({ data: [] }),
      manufacturerCodes.length ? supabase.from('mb_manufacturers').select('*').in('abbreviation', manufacturerCodes) : Promise.resolve({ data: [] }),
      productNamesUpper.length ? supabase.from('mb_benefits').select('product_name').in('product_name', productNamesUpper) : Promise.resolve({ data: [] }),
      dins.length ? supabase.from('dpd_drugs').select('din, company_name, active_ingredients, last_update').in('din', dins) : Promise.resolve({ data: [] }),
    ])

    const edsMap = new Map((edsRes.data || []).map((e: any) => [e.din, e]))
    const mfrMap = new Map((mfrRes.data || []).map((m: any) => [m.abbreviation, m.manufacturer_name]))
    const benefitsSet = new Set((benefitsRes.data || []).map((b: any) => b.product_name?.toUpperCase()))
    const dpdMap = new Map((dpdRes.data || []).map((d: any) => [d.din, d]))

    const merged = safeData.map((drug) => ({
      ...drug,
      eds: edsMap.get(drug.din) || null,
      manufacturer_name: mfrMap.get(drug.manufacturer_code) || null,
      general_benefit: benefitsSet.has(drug.product_name?.toUpperCase()),
      dpd: dpdMap.get(drug.din) || null,
    }))

    setResults((prev) => (pageNum === 0 ? merged : [...prev, ...merged]))
    setTotal(count || 0)
    setPage(pageNum)
    setHasMore((pageNum + 1) * PAGE_SIZE < (count || 0))
    setLoading(false)
  }

  const counts = useMemo(() => ({
    all: results.length,
    general: results.filter((r) => r.general_benefit && !r.eds).length,
    eds: results.filter((r) => r.eds).length,
    notBenefit: results.filter((r) => !r.general_benefit && !r.eds).length,
  }), [results])

  const visibleResults = useMemo(() => {
    const filtered = results.filter((drug) => {
      if (coverageFilter === 'general') return drug.general_benefit && !drug.eds
      if (coverageFilter === 'eds') return Boolean(drug.eds)
      if (coverageFilter === 'not-benefit') return !drug.general_benefit && !drug.eds
      return true
    })
    return [...filtered].sort((a, b) => {
      if (sortBy === 'price-low') return Number(a.price || 0) - Number(b.price || 0)
      if (sortBy === 'price-high') return Number(b.price || 0) - Number(a.price || 0)
      if (sortBy === 'name') return String(a.product_name).localeCompare(String(b.product_name))
      return 0
    })
  }, [results, coverageFilter, sortBy])

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-[#0f1923]" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Header ── */}
      <header className="bg-white border-b border-[#0f1923]/8">
        <div className="max-w-6xl mx-auto px-6 pt-10 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-end">
            <div>
              <p className="text-[11px] font-bold tracking-widest uppercase text-[#0f1923]/35 mb-2">
                Manitoba Drug Benefits Formulary
              </p>
              <h1 className="text-3xl font-bold tracking-tight mb-2">
                Search medications by DIN, name, coverage, or manufacturer.
              </h1>
              <p className="text-sm text-[#0f1923]/45 max-w-2xl leading-relaxed">
                Look up Manitoba formulary records, identify General Benefit and Exception Drug Status medications, and review DIN-level manufacturer and DPD details.
              </p>
            </div>
            <div className="hidden lg:grid grid-cols-2 gap-x-8 gap-y-1 pb-1">
              {[
                { value: '4,075', label: 'Formulary DINs' },
                { value: '772',   label: 'EDS entries' },
                { value: '50',    label: 'Per page' },
                { value: '2026',  label: 'Dataset' },
              ].map(m => (
                <div key={m.label}>
                  <div className="text-lg font-bold tracking-tight">{m.value}</div>
                  <div className="text-[11px] text-[#0f1923]/40">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* ── Search bar ── */}
        <div className="bg-white border border-[#0f1923]/8 rounded-xl p-4 mb-6">
          <label htmlFor="formulary-search" className="block text-xs font-semibold text-[#0f1923]/50 uppercase tracking-widest mb-2.5">
            Find a medication
          </label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center border border-[#0f1923]/15 rounded-lg bg-[#f8f7f4] focus-within:ring-2 focus-within:ring-[#0f1923]/20 focus-within:border-[#0f1923]/30 transition-all overflow-hidden">
              <svg className="ml-3 shrink-0 text-[#0f1923]/25 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                id="formulary-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && search(0)}
                placeholder="Try metformin, atorvastatin, insulin, or a DIN such as 02229453"
                className="flex-1 text-sm px-3 py-3 bg-transparent focus:outline-none text-[#0f1923] placeholder-[#0f1923]/30"
              />
            </div>
            <button
              onClick={() => search(0)}
              disabled={loading || !query.trim()}
              className="bg-[#0f1923] text-white px-6 h-[46px] rounded-lg text-sm font-semibold hover:bg-[#1e2d3d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              {loading && page === 0 ? 'Searching…' : 'Search'}
            </button>
          </div>
          <p className="text-[11px] text-[#0f1923]/30 mt-2.5">
            Supports drug name · product name · DIN
          </p>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5 items-start">

          {/* ── Sidebar ── */}
          <aside className="bg-white border border-[#0f1923]/8 rounded-xl p-4 lg:sticky lg:top-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#0f1923]/40">Refine</h2>
              {searched && (
                <span className="text-[11px] text-[#0f1923]/30">{results.length} loaded</span>
              )}
            </div>

            <div className="space-y-1.5 mb-5">
              {coverageFilters.map((filter) => {
                const count =
                  filter.value === 'all' ? counts.all :
                  filter.value === 'general' ? counts.general :
                  filter.value === 'eds' ? counts.eds :
                  counts.notBenefit

                const active = coverageFilter === filter.value

                return (
                  <button
                    key={filter.value}
                    onClick={() => setCoverageFilter(filter.value)}
                    className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
                      active
                        ? 'border-[#0f1923]/20 bg-[#0f1923] text-white'
                        : 'border-[#0f1923]/8 bg-[#f8f7f4] hover:bg-[#f0efe9] hover:border-[#0f1923]/15'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-semibold ${active ? 'text-white' : 'text-[#0f1923]'}`}>
                        {filter.label}
                      </span>
                      <span className={`text-[11px] tabular-nums ${active ? 'text-white/60' : 'text-[#0f1923]/35'}`}>
                        {count}
                      </span>
                    </div>
                    <p className={`text-[11px] mt-0.5 ${active ? 'text-white/60' : 'text-[#0f1923]/40'}`}>
                      {filter.helper}
                    </p>
                  </button>
                )
              })}
            </div>

            <p className="text-[11px] font-bold uppercase tracking-widest text-[#0f1923]/35 mb-2">Sort by</p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full border border-[#0f1923]/12 rounded-lg px-3 py-2.5 text-xs text-[#0f1923] bg-[#f8f7f4] focus:outline-none focus:ring-2 focus:ring-[#0f1923]/15"
            >
              <option value="relevance">Best match</option>
              <option value="name">Product name</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
            </select>
          </aside>

          {/* ── Results panel ── */}
          <div className="space-y-3">

            {/* Initial state */}
            {!searched && !loading && (
              <div className="bg-white border border-[#0f1923]/8 rounded-xl p-6">
                <h2 className="text-sm font-bold text-[#0f1923] mb-1.5">Start with a medication search.</h2>
                <p className="text-xs text-[#0f1923]/50 mb-5 leading-relaxed max-w-xl">
                  Use this page to answer practical formulary questions: Is this medication listed? Is it a General Benefit? Does it require EDS approval? What DIN and manufacturer details are attached?
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { title: 'Search by name', text: 'e.g. metformin or atorvastatin' },
                    { title: 'Search by DIN', text: 'e.g. 02229453' },
                    { title: 'Review coverage', text: 'General Benefit, EDS, or verify status' },
                  ].map((item) => (
                    <div key={item.title} className="bg-[#f8f7f4] border border-[#0f1923]/8 rounded-lg p-3.5">
                      <div className="text-xs font-semibold text-[#0f1923] mb-0.5">{item.title}</div>
                      <div className="text-[11px] text-[#0f1923]/45">{item.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && page === 0 && (
              <div className="bg-white border border-[#0f1923]/8 rounded-xl p-10 text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-[#0f1923]/40">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Searching formulary records…
                </div>
                <p className="text-[11px] text-[#0f1923]/30 mt-1.5">Checking formulary, EDS, manufacturer, benefits, and DPD tables.</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
                <p className="font-semibold mb-0.5">Search could not be completed.</p>
                <p>{error}</p>
              </div>
            )}

            {/* Empty results */}
            {searched && !loading && results.length === 0 && !error && (
              <div className="bg-white border border-[#0f1923]/8 rounded-xl p-10 text-center">
                <p className="text-sm font-semibold text-[#0f1923] mb-1">No matching medications found</p>
                <p className="text-xs text-[#0f1923]/45 max-w-md mx-auto">
                  No formulary records matched &ldquo;{query}&rdquo;. Try a generic name, brand name, or DIN without spaces.
                </p>
              </div>
            )}

            {/* Results */}
            {results.length > 0 && (
              <>
                {/* Summary bar */}
                <div className="bg-white border border-[#0f1923]/8 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-[#0f1923]">
                      Showing {visibleResults.length} of {total} result{total !== 1 ? 's' : ''}
                    </p>
                    <p className="text-[11px] text-[#0f1923]/40 mt-0.5">
                      {counts.general} General Benefit · {counts.eds} EDS · {counts.notBenefit} verify coverage
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700">General Benefit</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700">EDS Required</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#f8f7f4] border border-[#0f1923]/8 text-[#0f1923]/50">Verify Coverage</span>
                  </div>
                </div>

                {visibleResults.map((drug) => (
                  <DrugCard key={drug.din} drug={drug} />
                ))}

                {hasMore && coverageFilter === 'all' && (
                  <div className="text-center pt-2 pb-8">
                    <button
                      onClick={() => search(page + 1)}
                      disabled={loading}
                      className="bg-white border border-[#0f1923]/12 text-[#0f1923] text-sm font-semibold px-8 py-3 rounded-lg hover:border-[#0f1923]/25 hover:bg-[#f0efe9] disabled:opacity-40 transition-colors"
                    >
                      {loading ? 'Loading…' : `Load more · ${total - results.length} remaining`}
                    </button>
                  </div>
                )}

                {hasMore && coverageFilter !== 'all' && (
                  <div className="bg-white border border-[#0f1923]/8 rounded-xl p-4 text-xs text-[#0f1923]/50">
                    You are filtering the first {results.length} loaded records. Switch to &ldquo;All results&rdquo; to load more.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function DrugCard({ drug }: { drug: Drug }) {
  const coverage = getCoverage(drug)
  const price = Number(drug.price || 0)

  return (
    <article className={`bg-white border rounded-xl p-5 hover:shadow-sm transition-shadow ${coverage.border}`}>
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">

        {/* Left */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
            <span className="font-mono text-[11px] bg-[#f8f7f4] border border-[#0f1923]/8 text-[#0f1923]/50 px-2 py-0.5 rounded">
              DIN {drug.din}
            </span>
            {drug.interchangeable_group && (
              <span className="text-[11px] bg-[#f8f7f4] border border-[#0f1923]/8 text-[#0f1923]/45 px-2 py-0.5 rounded-full font-semibold">
                Group {drug.interchangeable_group}
              </span>
            )}
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${coverage.badge}`}>
              {coverage.label}
            </span>
          </div>

          <h3 className="font-bold text-[#0f1923] text-base leading-tight break-words">
            {drug.product_name || drug.drug_name}
          </h3>
          <p className="text-sm text-[#0f1923]/50 mt-0.5">
            {[drug.drug_name, drug.strength, drug.dosage_form].filter(Boolean).join(' · ')}
          </p>
          {drug.dpd?.active_ingredients && (
            <p className="text-xs text-[#0f1923]/35 mt-1">
              <span className="font-semibold text-[#0f1923]/45">Active ingredient:</span> {drug.dpd.active_ingredients}
            </p>
          )}
        </div>

        {/* Right */}
        <div className="lg:text-right shrink-0 lg:min-w-[180px]">
          {price > 0 ? (
            <>
              <p className="text-xl font-bold text-[#0f1923]">${price.toFixed(4)}</p>
              <p className="text-[11px] text-[#0f1923]/35">per unit · CAD</p>
            </>
          ) : (
            <p className="text-xs text-[#0f1923]/30">Price not listed</p>
          )}
          <div className="mt-2.5">
            {drug.manufacturer_code && (
              <span className="font-mono text-[11px] bg-[#f8f7f4] border border-[#0f1923]/8 text-[#0f1923]/45 px-2 py-0.5 rounded">
                {drug.manufacturer_code}
              </span>
            )}
            <p className="text-[11px] text-[#0f1923]/40 mt-1 lg:max-w-[180px] lg:ml-auto">
              {drug.dpd?.company_name || drug.manufacturer_name || 'Manufacturer not listed'}
            </p>
            {drug.dpd?.last_update && (
              <p className="text-[10px] text-[#0f1923]/25 mt-0.5">DPD: {drug.dpd.last_update}</p>
            )}
          </div>
        </div>
      </div>

      {/* Coverage footer */}
      <div className={`mt-4 pt-4 border-t border-[#0f1923]/6 rounded-lg px-4 py-2.5 ${coverage.panel}`}>
        <p className={`text-xs font-semibold mb-0.5 ${coverage.textStrong}`}>{coverage.heading}</p>
        <p className={`text-xs leading-relaxed ${coverage.text}`}>{coverage.description}</p>
      </div>
    </article>
  )
}

function getCoverage(drug: Drug) {
  if (drug.eds) return {
    label: 'EDS Required',
    heading: `Exception Drug Status — ${drug.eds.therapeutic_category || 'Category not listed'}`,
    description: 'Coverage may require prescriber-submitted clinical criteria approval. Review EDS requirements before assuming public coverage.',
    badge: 'bg-amber-50 border-amber-100 text-amber-700',
    border: 'border-amber-200',
    panel: 'bg-amber-50',
    textStrong: 'text-amber-800',
    text: 'text-amber-700/80',
  }

  if (drug.general_benefit) return {
    label: 'General Benefit',
    heading: 'Manitoba Drug Benefits Formulary — General Benefit',
    description: 'Listed as a General Benefit in the loaded formulary dataset. Confirm patient-specific eligibility and plan rules where required.',
    badge: 'bg-blue-50 border-blue-100 text-blue-700',
    border: 'border-blue-100',
    panel: 'bg-blue-50',
    textStrong: 'text-blue-800',
    text: 'text-blue-700/80',
  }

  return {
    label: 'Verify Coverage',
    heading: 'Not identified as General Benefit or EDS in loaded data',
    description: 'This record was not matched to the loaded benefits or EDS tables. Verify coverage status with Manitoba Drug Programs before making a coverage decision.',
    badge: 'bg-[#f8f7f4] border-[#0f1923]/8 text-[#0f1923]/50',
    border: 'border-[#0f1923]/8',
    panel: 'bg-[#f8f7f4]',
    textStrong: 'text-[#0f1923]/60',
    text: 'text-[#0f1923]/40',
  }
}
'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface EDSDrug {
  din: string
  therapeutic_category: string
  brand_name: string | null
  generic_name: string | null
  strength: string
  dosage_form: string
  eds_status: boolean
}

type SortOption = 'category' | 'brand' | 'generic' | 'din'

function displayName(drug: EDSDrug): string {
  if (drug.brand_name) return drug.brand_name
  if (drug.generic_name) return drug.generic_name
  return `DIN ${drug.din}`
}

function displaySubtitle(drug: EDSDrug): string {
  const parts = []
  if (drug.brand_name && drug.generic_name) parts.push(drug.generic_name)
  if (drug.strength) parts.push(drug.strength)
  if (drug.dosage_form) parts.push(drug.dosage_form)
  return parts.join(' · ')
}

export default function EDSPage() {
  const [drugs, setDrugs] = useState<EDSDrug[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('category')

  useEffect(() => {
    setLoading(true)
    setError(null)
    supabase
      .from('mb_eds')
      .select('*')
      .order('therapeutic_category')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        setDrugs(data || [])
        setLoading(false)
      })
  }, [])

  const categories = useMemo(() =>
    Array.from(new Set(drugs.map((d) => d.therapeutic_category).filter(Boolean))).sort() as string[]
  , [drugs])

  const categoryCounts = useMemo(() =>
    drugs.reduce<Record<string, number>>((acc, d) => {
      const c = d.therapeutic_category || 'OTHER'
      acc[c] = (acc[c] || 0) + 1
      return acc
    }, {})
  , [drugs])

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return drugs
      .filter((d) => {
        const matchCat = selectedCategory === 'ALL' || d.therapeutic_category === selectedCategory
        const matchSearch = !q || d.brand_name?.toLowerCase().includes(q) || d.generic_name?.toLowerCase().includes(q) || d.din.includes(q)
        return matchCat && matchSearch
      })
      .sort((a, b) => {
        if (sortBy === 'brand')   return displayName(a).localeCompare(displayName(b))
        if (sortBy === 'generic') return String(a.generic_name || '').localeCompare(String(b.generic_name || ''))
        if (sortBy === 'din')     return String(a.din).localeCompare(String(b.din))
        return String(a.therapeutic_category || '').localeCompare(String(b.therapeutic_category || ''))
      })
  }, [drugs, searchQuery, selectedCategory, sortBy])

  const grouped = useMemo(() =>
    filtered.reduce<Record<string, EDSDrug[]>>((acc, d) => {
      const c = d.therapeutic_category || 'OTHER'
      acc[c] ||= []
      acc[c].push(d)
      return acc
    }, {})
  , [filtered])

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-[#0f1923]" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Header ── */}
      <header className="bg-white border-b border-[#0f1923]/8">
        <div className="max-w-6xl mx-auto px-6 pt-10 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-end">
            <div>
              <p className="text-[11px] font-bold tracking-widest uppercase text-[#0f1923]/35 mb-2">
                Manitoba Drug Programs
              </p>
              <h1 className="text-3xl font-bold tracking-tight mb-1">Exception Drug Status Coverage Lookup</h1>
              <p className="text-sm text-[#0f1923]/45 leading-relaxed max-w-2xl">
                Search EDS-listed medications, browse therapeutic categories, and identify drugs that may require clinical criteria review before coverage is approved.
              </p>
            </div>
            <div className="hidden lg:grid grid-cols-2 gap-x-8 gap-y-1 pb-1">
              {[
                { value: String(drugs.length), label: 'EDS entries' },
                { value: String(categories.length), label: 'Categories' },
                { value: 'Name / DIN', label: 'Search mode' },
                { value: 'Coverage', label: 'Data type' },
              ].map((m) => (
                <div key={m.label}>
                  <div className="text-lg font-bold tracking-tight">{m.value}</div>
                  <div className="text-[11px] text-[#0f1923]/40">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Info strip */}
        <div className="border-t border-[#0f1923]/6">
          <div className="max-w-6xl mx-auto px-6 py-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: 'What is EDS?', desc: 'Exception Drug Status supports coverage for certain drugs when approved clinical criteria are met. It is separate from general benefit listing.' },
                { title: 'Who reviews it?', desc: 'EDS coverage is linked to Manitoba Drug Programs processes and MDSTC recommendations based on clinical evidence and criteria.' },
                { title: 'How to read this page', desc: 'Use this as a coverage lookup and portfolio demonstration. Final coverage decisions should always be verified with the official program.' },
              ].map((c) => (
                <div key={c.title}>
                  <p className="text-xs font-semibold text-[#0f1923] mb-1">{c.title}</p>
                  <p className="text-xs text-[#0f1923]/50 leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5 items-start">

          {/* ── Sidebar ── */}
          <aside className="space-y-3 lg:sticky lg:top-6">

            {/* Search */}
            <div className="bg-white border border-[#0f1923]/8 rounded-xl p-4">
              <label htmlFor="eds-search" className="block text-[11px] font-bold uppercase tracking-widest text-[#0f1923]/35 mb-2.5">
                Search EDS drugs
              </label>
              <div className="flex items-center border border-[#0f1923]/15 rounded-lg bg-[#f8f7f4] focus-within:ring-2 focus-within:ring-[#0f1923]/20 focus-within:border-[#0f1923]/30 transition-all overflow-hidden">
                <svg className="ml-3 shrink-0 text-[#0f1923]/25 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  id="eds-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Brand, generic, or DIN"
                  className="flex-1 text-sm px-3 py-3 bg-transparent focus:outline-none text-[#0f1923] placeholder-[#0f1923]/30"
                />
              </div>
            </div>

            {/* Category filter */}
            <div className="bg-white border border-[#0f1923]/8 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#0f1923]/40">Category</h2>
                <span className="text-[11px] text-[#0f1923]/30">{categories.length}</span>
              </div>

              <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
                    selectedCategory === 'ALL'
                      ? 'border-[#0f1923]/20 bg-[#0f1923] text-white'
                      : 'border-[#0f1923]/8 bg-[#f8f7f4] text-[#0f1923] hover:bg-[#f0efe9]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-semibold ${selectedCategory === 'ALL' ? 'text-white' : 'text-[#0f1923]'}`}>All categories</span>
                    <span className={`text-[11px] tabular-nums ${selectedCategory === 'ALL' ? 'text-white/50' : 'text-[#0f1923]/35'}`}>{drugs.length}</span>
                  </div>
                </button>

                {categories.map((cat) => {
                  const active = selectedCategory === cat
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
                        active
                          ? 'border-[#0f1923]/20 bg-[#0f1923] text-white'
                          : 'border-[#0f1923]/8 bg-[#f8f7f4] text-[#0f1923] hover:bg-[#f0efe9]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-semibold leading-snug ${active ? 'text-white' : 'text-[#0f1923]'}`}>{cat}</span>
                        <span className={`text-[11px] tabular-nums shrink-0 ${active ? 'text-white/50' : 'text-[#0f1923]/35'}`}>{categoryCounts[cat] || 0}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </aside>

          {/* ── Results ── */}
          <div className="space-y-3 min-w-0">

            {/* Summary + sort bar */}
            <div className="bg-white border border-[#0f1923]/8 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#0f1923]">
                  Showing {filtered.length} of {drugs.length} EDS entr{drugs.length === 1 ? 'y' : 'ies'}
                </p>
                <p className="text-[11px] text-[#0f1923]/40 mt-0.5">
                  {selectedCategory === 'ALL' ? 'All therapeutic categories' : selectedCategory}
                  {searchQuery ? ` · filtered by "${searchQuery}"` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <label htmlFor="eds-sort" className="text-[11px] font-semibold text-[#0f1923]/40">Sort</label>
                <select
                  id="eds-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="border border-[#0f1923]/12 rounded-lg px-3 py-2 text-xs text-[#0f1923] bg-[#f8f7f4] focus:outline-none focus:ring-2 focus:ring-[#0f1923]/15"
                >
                  <option value="category">Category</option>
                  <option value="brand">Brand / name</option>
                  <option value="generic">Generic name</option>
                  <option value="din">DIN</option>
                </select>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="bg-white border border-[#0f1923]/8 rounded-xl py-16 text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-[#0f1923]/40 mb-1">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Loading EDS records…
                </div>
                <p className="text-[11px] text-[#0f1923]/30">Fetching therapeutic categories and DIN-level coverage entries.</p>
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-5">
                <p className="text-sm font-semibold mb-0.5">EDS data could not be loaded.</p>
                <p className="text-xs leading-relaxed">{error}</p>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && filtered.length === 0 && (
              <div className="bg-white border border-[#0f1923]/8 rounded-xl py-16 text-center">
                <p className="text-sm font-semibold text-[#0f1923] mb-1">No EDS records found</p>
                <p className="text-xs text-[#0f1923]/45 max-w-md mx-auto">
                  No results matched {searchQuery ? `"${searchQuery}"` : 'your current filters'}
                  {selectedCategory !== 'ALL' ? ` in ${selectedCategory}` : ''}. Try another spelling, generic name, brand name, or DIN.
                </p>
              </div>
            )}

            {/* Grouped results */}
            {!loading && !error && filtered.length > 0 && (
              <div className="space-y-6">
                {Object.entries(grouped).map(([category, categoryDrugs]) => (
                  <section key={category}>
                    <div className="flex items-center gap-3 mb-2.5">
                      <span className="text-xs font-bold text-[#0f1923] uppercase tracking-wide">{category}</span>
                      <span className="text-[11px] text-[#0f1923]/35">{categoryDrugs.length} drug{categoryDrugs.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="space-y-2">
                      {categoryDrugs.map((drug) => (
                        <DrugCard key={drug.din} drug={drug} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function DrugCard({ drug }: { drug: EDSDrug }) {
  return (
    <article className="bg-white border border-[#0f1923]/8 rounded-xl px-5 py-4 hover:border-[#0f1923]/20 hover:shadow-sm transition-all">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-mono text-[11px] bg-[#f8f7f4] border border-[#0f1923]/8 text-[#0f1923]/50 px-2 py-0.5 rounded">
              DIN {drug.din}
            </span>
            <span className="text-[11px] font-semibold bg-amber-50 border border-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              EDS Required
            </span>
          </div>
          <h3 className="font-bold text-[#0f1923] text-sm md:text-base leading-tight break-words">
            {displayName(drug)}
          </h3>
          {displaySubtitle(drug) && (
            <p className="text-xs text-[#0f1923]/50 mt-1 leading-relaxed">{displaySubtitle(drug)}</p>
          )}
        </div>
        <div className="md:text-right shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#0f1923]/30 mb-1">Category</p>
          <span className="text-[11px] font-semibold text-[#0f1923]/60">{drug.therapeutic_category || 'OTHER'}</span>
        </div>
      </div>

      <div className="mt-4 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5">
        <p className="text-xs font-semibold text-amber-800 mb-0.5">Coverage review needed</p>
        <p className="text-xs text-amber-700/80 leading-relaxed">
          This medication appears in the loaded EDS dataset. Coverage may require prescriber-submitted clinical criteria review before approval.
        </p>
      </div>
    </article>
  )
}
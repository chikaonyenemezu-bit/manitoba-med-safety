'use client'

import { useState } from 'react'
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

const PAGE_SIZE = 50

export default function FormularySearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Drug[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  async function search(pageNum = 0) {
    if (!query.trim()) return
    setLoading(true)
    if (pageNum === 0) {
      setSearched(true)
      setResults([])
    }
    setError(null)

    const isDIN = /^\d+$/.test(query.trim())
    const from = pageNum * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data: formularyData, error: formularyError, count } = await supabase
      .from('mb_interchangeability')
      .select('*', { count: 'exact' })
      .or(
        isDIN
          ? `din.ilike.%${query.trim()}%`
          : `drug_name.ilike.%${query.trim()}%,product_name.ilike.%${query.trim()}%`
      )
      .range(from, to)

    if (formularyError) {
      setError(formularyError.message)
      setLoading(false)
      return
    }

    const dins = (formularyData || []).map(d => d.din)
    const manufacturerCodes = [
      ...new Set(
        (formularyData || []).map(d => d.manufacturer_code).filter(Boolean)
      ),
    ]
    const productNamesUpper = (formularyData || [])
      .map(d => d.product_name?.toUpperCase())
      .filter(Boolean) as string[]

    const [edsRes, mfrRes, benefitsRes, dpdRes] = await Promise.all([
  supabase.from('mb_eds').select('*').in('din', dins),
  supabase.from('mb_manufacturers').select('*').in('abbreviation', manufacturerCodes),
  supabase.from('mb_benefits').select('product_name').in('product_name', productNamesUpper),
  supabase.from('dpd_drugs').select('din, company_name, active_ingredients, last_update').in('din', dins),
])

    const edsMap = new Map((edsRes.data || []).map(e => [e.din, e]))
const mfrMap = new Map((mfrRes.data || []).map(m => [m.abbreviation, m.manufacturer_name]))
const benefitsSet = new Set(
  (benefitsRes.data || []).map(b => b.product_name?.toUpperCase())
)
const dpdMap = new Map((dpdRes.data || []).map(d => [d.din, d]))

    const merged = (formularyData || []).map(drug => ({
  ...drug,
  eds: edsMap.get(drug.din) || null,
  manufacturer_name: mfrMap.get(drug.manufacturer_code) || null,
  general_benefit: benefitsSet.has(drug.product_name?.toUpperCase()),
  dpd: dpdMap.get(drug.din) || null,
}))

    if (pageNum === 0) {
      setResults(merged)
    } else {
      setResults(prev => [...prev, ...merged])
    }

    const totalCount = count || 0
    setTotal(totalCount)
    setPage(pageNum)
    setHasMore((pageNum + 1) * PAGE_SIZE < totalCount)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-900 text-white px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <p className="text-blue-300 text-xs font-bold tracking-widest uppercase mb-2">
            Manitoba Drug Benefits Formulary
          </p>
          <h1 className="text-3xl font-bold mb-2">Formulary Search</h1>
          <p className="text-blue-200 text-sm">
            Search by drug name or DIN · General Benefit · EDS · Manufacturer · Effective April 1, 2026
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex gap-3 mb-6">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search(0)}
            placeholder="Search by drug name or DIN (e.g. metformin, 02229453)"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ color: '#111827', backgroundColor: '#ffffff' }}
          />
          <button
            onClick={() => search(0)}
            disabled={loading}
            className="bg-blue-900 text-white px-6 py-3 rounded-lg text-sm font-semibold
                       hover:bg-blue-800 disabled:opacity-50 transition-colors"
          >
            {loading && page === 0 ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="flex gap-3 mb-8 flex-wrap">
          {[
            { color: 'bg-blue-100 text-blue-800', label: 'General Benefit' },
            { color: 'bg-amber-100 text-amber-800', label: 'Exception Drug Status (EDS)' },
            { color: 'bg-green-100 text-green-800', label: 'Interchangeable' },
            { color: 'bg-gray-100 text-gray-600', label: 'Not on Benefits Formulary' },
          ].map(b => (
            <span key={b.label}
              className={`text-xs font-semibold px-3 py-1 rounded-full ${b.color}`}>
              {b.label}
            </span>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg
                          p-4 mb-6 text-sm">
            Error: {error}
          </div>
        )}

        {searched && !loading && results.length === 0 && !error && (
          <div className="text-center text-gray-400 py-16">
            No drugs found for &quot;{query}&quot;
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-400 mb-4">
              Showing {results.length} of {total} result{total !== 1 ? 's' : ''}
              {results.filter(r => r.general_benefit).length > 0 && (
                <span className="ml-2 text-blue-600 font-medium">
                  · {results.filter(r => r.general_benefit).length} general benefit
                </span>
              )}
              {results.filter(r => r.eds).length > 0 && (
                <span className="ml-2 text-amber-600 font-medium">
                  · {results.filter(r => r.eds).length} EDS
                </span>
              )}
            </p>

            {results.map(drug => (
              <DrugCard key={drug.din} drug={drug} />
            ))}

            {hasMore && (
              <div className="text-center pt-4 pb-8">
                <button
                  onClick={() => search(page + 1)}
                  disabled={loading}
                  className="bg-white border border-gray-300 text-gray-700 text-sm
                             font-semibold px-8 py-3 rounded-lg hover:bg-gray-50
                             disabled:opacity-50 transition-colors shadow-sm"
                >
                  {loading
                    ? 'Loading...'
                    : `Load more · ${total - results.length} remaining`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function DrugCard({ drug }: { drug: Drug }) {
  return (
    <div className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow-md
                     transition-shadow ${
      drug.eds
        ? 'border-amber-200'
        : drug.general_benefit
        ? 'border-blue-100'
        : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-mono text-xs bg-gray-100 text-gray-600
                             px-2 py-0.5 rounded">
              DIN {drug.din}
            </span>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5
                             rounded-full font-semibold">
              Interchangeable
            </span>
            {drug.general_benefit && !drug.eds && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5
                               rounded-full font-semibold">
                General Benefit
              </span>
            )}
            {drug.eds && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5
                               rounded-full font-semibold">
                EDS Required
              </span>
            )}
          </div>

          <h3 className="font-bold text-gray-900 text-lg leading-tight">
            {drug.product_name}
          </h3>
          <p className="text-gray-500 text-sm mt-0.5">
  {drug.drug_name}
  {drug.strength ? ` · ${drug.strength}` : ''}
  {drug.dosage_form ? ` · ${drug.dosage_form}` : ''}
</p>
{drug.dpd?.active_ingredients && (
  <p className="text-xs text-gray-400 mt-0.5">
    {drug.dpd.active_ingredients}
  </p>
)}
<p className="text-xs text-gray-400 mt-1">
  Interchangeable group: {drug.interchangeable_group}
</p>
        </div>

        <div className="text-right shrink-0">
          {drug.price && (
            <>
              <p className="text-xl font-bold text-gray-900">
                ${Number(drug.price).toFixed(4)}
              </p>
              <p className="text-xs text-gray-400">per unit · CAD</p>
            </>
          )}
          {drug.manufacturer_code && (
  <div className="mt-3 text-right">
    <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
      {drug.manufacturer_code}
    </span>
    <p className="text-xs text-gray-400 mt-1 max-w-[160px] text-right">
      {drug.dpd?.company_name || drug.manufacturer_name || ''}
    </p>
    {drug.dpd?.last_update && (
      <p className="text-xs text-gray-300 mt-0.5">
        DPD: {drug.dpd.last_update}
      </p>
    )}
  </div>
)}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        {drug.general_benefit && !drug.eds && (
          <div className="bg-blue-50 rounded-lg px-4 py-2.5">
            <p className="text-xs font-semibold text-blue-800 mb-0.5">
              Manitoba Drug Benefits Formulary — General Benefit
            </p>
            <p className="text-xs text-blue-600">
              Covered for all eligible Manitoba Pharmacare recipients without
              special approval.
            </p>
          </div>
        )}
        {drug.eds && (
          <div className="bg-amber-50 rounded-lg px-4 py-2.5">
            <p className="text-xs font-semibold text-amber-800 mb-0.5">
              Exception Drug Status — {drug.eds.therapeutic_category}
            </p>
            <p className="text-xs text-amber-600">
              Coverage requires MDSTC clinical criteria approval. EDS
              application must be submitted by prescriber.
            </p>
          </div>
        )}
        {!drug.general_benefit && !drug.eds && (
          <div className="bg-gray-50 rounded-lg px-4 py-2.5">
            <p className="text-xs font-semibold text-gray-600 mb-0.5">
              Not on Manitoba Benefits Formulary
            </p>
            <p className="text-xs text-gray-400">
              Patient may be paying out of pocket. Verify coverage status
              with Manitoba Drug Programs.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
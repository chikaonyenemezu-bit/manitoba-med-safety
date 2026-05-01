'use client'

import { useState, useEffect } from 'react'
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

const CATEGORY_COLORS: Record<string, string> = {
  'CARDIOVASCULAR': 'bg-red-50 text-red-700 border-red-200',
  'AUTONOMIC DRUGS': 'bg-blue-50 text-blue-700 border-blue-200',
  'BLOOD FORMING AND COAGULATION': 'bg-rose-50 text-rose-700 border-rose-200',
  'IRON PREPARATIONS': 'bg-orange-50 text-orange-700 border-orange-200',
  'CENTRAL NERVOUS SYSTEM': 'bg-purple-50 text-purple-700 border-purple-200',
  'ELECTROLYTIC, CALORIC AND WATER BALANCE': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'EYE, EAR, NOSE AND THROAT': 'bg-teal-50 text-teal-700 border-teal-200',
  'GASTROINTESTINAL DRUGS': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'HORMONES AND SYNTHETIC SUBSTITUTES': 'bg-blue-50 text-blue-700 border-blue-200',
  'MISCELLANEOUS SKIN AND MUCOUS MEMBRANE AGENTS': 'bg-pink-50 text-pink-700 border-pink-200',
  'SMOOTH MUSCLE RELAXANTS': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'MISCELLANEOUS THERAPEUTIC AGENTS': 'bg-gray-50 text-gray-700 border-gray-200',
  'RESPIRATORY TRACT AGENTS': 'bg-sky-50 text-sky-700 border-sky-200',
  'ANTI-INFECTIVE AGENTS': 'bg-green-50 text-green-700 border-green-200',
}

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || 'bg-gray-50 text-gray-700 border-gray-200'
}

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
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    supabase
      .from('mb_eds')
      .select('*')
      .order('therapeutic_category')
      .then(({ data }) => {
        const d = data || []
        setDrugs(d)
        const cats = Array.from(
          new Set(d.map(x => x.therapeutic_category).filter(Boolean))
        ).sort() as string[]
        setCategories(cats)
        setLoading(false)
      })
  }, [])

  const filtered = drugs.filter(d => {
    const matchesCategory =
      selectedCategory === 'ALL' || d.therapeutic_category === selectedCategory
    const matchesSearch =
      !searchQuery ||
      d.brand_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.generic_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.din.includes(searchQuery)
    return matchesCategory && matchesSearch
  })

  const grouped = filtered.reduce((acc, drug) => {
    const cat = drug.therapeutic_category || 'OTHER'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(drug)
    return acc
  }, {} as Record<string, EDSDrug[]>)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-amber-600 text-white px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <p className="text-amber-200 text-xs font-bold tracking-widest uppercase mb-2">
            Manitoba Drug Programs
          </p>
          <h1 className="text-3xl font-bold mb-2">Exception Drug Status (EDS)</h1>
          <p className="text-amber-100 text-sm max-w-2xl leading-relaxed">
            Drugs approved for coverage when specific clinical criteria are met,
            as recommended by the Manitoba Drug Standards and Therapeutics
            Committee (MDSTC). Coverage requires prior approval.
          </p>
          <div className="flex gap-6 mt-6">
            <div>
              <div className="text-2xl font-bold">{drugs.length}</div>
              <div className="text-amber-200 text-xs">EDS drug entries</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{categories.length}</div>
              <div className="text-amber-200 text-xs">therapeutic categories</div>
            </div>
          </div>
        </div>
      </div>

      {/* What is EDS */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="grid grid-cols-3 gap-8">
            {[
              {
                title: 'What is EDS?',
                desc: 'The Exception Drug Status program covers drugs not listed on the general Manitoba Drug Benefits Formulary when specific clinical criteria are met.',
              },
              {
                title: 'Who approves it?',
                desc: 'The Manitoba Drug Standards and Therapeutics Committee (MDSTC) reviews and recommends drugs for EDS coverage based on clinical evidence.',
              },
              {
                title: 'How to apply?',
                desc: 'Prescribers submit an EDS application to Manitoba Drug Programs. Coverage is granted when the patient meets the approved clinical criteria.',
              },
            ].map((item, i) => (
              <div key={i}>
                <h3 className="font-bold text-gray-900 text-sm mb-2">{item.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by drug name, generic name, or DIN..."
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm
                       focus:outline-none focus:ring-2 focus:ring-amber-500"
            style={{ color: '#111827', backgroundColor: '#ffffff' }}
          />
        </div>

        {/* Category filter */}
        <div className="mb-6">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
            Filter by therapeutic category
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border
                          transition-colors ${selectedCategory === 'ALL'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'}`}
            >
              All ({drugs.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border
                            transition-colors ${selectedCategory === cat
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'}`}
              >
                {cat} ({drugs.filter(d => d.therapeutic_category === cat).length})
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="text-center text-gray-400 py-16">Loading EDS data...</div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center text-gray-400 py-16">
            No drugs found for &quot;{searchQuery}&quot;
          </div>
        )}

        {!loading && Object.entries(grouped).map(([category, categoryDrugs]) => (
          <div key={category} className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-xs font-bold px-3 py-1 rounded-full border
                               ${getCategoryColor(category)}`}>
                {category}
              </span>
              <span className="text-xs text-gray-400">
                {categoryDrugs.length} drug{categoryDrugs.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-2">
              {categoryDrugs.map(drug => (
                <div key={drug.din}
                  className="bg-white border border-gray-200 rounded-xl px-5 py-4
                             flex items-center justify-between hover:border-amber-300
                             transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs bg-gray-100 text-gray-600
                                     px-2 py-0.5 rounded shrink-0">
                      DIN {drug.din}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {displayName(drug)}
                      </p>
                      {displaySubtitle(drug) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {displaySubtitle(drug)}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-semibold bg-amber-100 text-amber-700
                                   px-2 py-0.5 rounded-full shrink-0">
                    EDS
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
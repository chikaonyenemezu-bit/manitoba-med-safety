import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">

      <div className="relative min-h-[580px] flex items-center overflow-hidden">
        <Image src="/images/pharmacist-counter.jpg" alt="Pharmacist at pharmacy counter" fill className="object-cover object-center" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/90 via-[#0a1628]/70 to-transparent" />
        <div className="relative z-10 max-w-6xl mx-auto px-8 py-20 w-full">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-white/90 text-xs font-medium tracking-wide">Live · Manitoba Drug Benefits Formulary · April 1, 2026</span>
            </div>
            <h1 className="text-5xl font-bold text-white leading-tight mb-4">
              Manitoba<br />
              <span className="text-blue-300">Medication Safety</span><br />
              Platform
            </h1>
            <p className="text-white/70 text-base leading-relaxed mb-8 max-w-md">
              FHIR R4 medication reconciliation demonstrating DPIN-integrated admission workflow for Manitoba hospital pharmacists and clinical informaticists.
            </p>
            <div className="flex gap-3">
              <Link href="/formulary" className="bg-white text-blue-900 font-semibold text-sm px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors">Search Formulary</Link>
              <Link href="/reconciliation" className="bg-white/10 border border-white/25 text-white font-semibold text-sm px-6 py-3 rounded-lg hover:bg-white/20 transition-colors">Try Reconciliation</Link>
            </div>
          </div>
        </div>
        <div className="absolute right-8 bottom-10 z-10 hidden lg:block">
          <div className="bg-[#0a1628]/80 backdrop-blur border border-white/10 rounded-xl p-4 w-72 font-mono text-xs text-blue-300 leading-relaxed">
            <div className="text-white/40 text-[10px] mb-2 tracking-widest">FHIR R4 · LIVE</div>
            <span className="text-white/40">"resourceType": </span><span className="text-pink-300">"Medication"</span>,<br />
            <span className="text-white/40">"system": </span><span className="text-green-300 text-[10px]">"http://health.canada.ca/din"</span>,<br />
            <span className="text-white/40">"status": </span><span className="text-pink-300">"active"</span>,<br />
            <span className="text-white/40">"formulary": </span><span className="text-yellow-300">"interchangeable"</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-900 text-white">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-4 divide-x divide-white/10">
            {[
              { num: '4,075', label: 'Formulary DINs', sub: 'Manitoba Drug Benefits' },
              { num: '772', label: 'EDS Drugs', sub: 'Exception Drug Status' },
              { num: '550', label: 'Manufacturers', sub: 'Registered in Manitoba' },
              { num: 'FHIR R4', label: 'API Standard', sub: 'Canada Health Infoway' },
            ].map((s, i) => (
              <div key={i} className="px-8 py-5 text-center">
                <div className="text-2xl font-bold tracking-tight">{s.num}</div>
                <div className="text-blue-200 text-xs font-medium mt-0.5">{s.label}</div>
                <div className="text-blue-400 text-[10px] mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-16">
        <div className="text-center mb-12">
          <div className="text-blue-600 text-xs font-bold tracking-widest uppercase mb-3">Platform Modules</div>
          <h2 className="text-3xl font-bold text-gray-900">Four tools. One platform.</h2>
          <p className="text-gray-500 text-sm mt-3 max-w-xl mx-auto leading-relaxed">
            Built on real Manitoba Health data. Aligned with Canada Health Infoway ACCESS Health initiative and Accreditation Canada ROP standards.
          </p>
        </div>
        <div className="grid grid-cols-4 gap-5">
          {[
            { href: '/formulary', accent: 'bg-blue-600', iconBg: 'bg-blue-50', iconColor: 'text-blue-600', icon: '⌕', title: 'Formulary Search', desc: 'Search 4,075 DINs from the Manitoba Drug Benefits Formulary. Interchangeable groups, EDS status, and pricing.', tags: ['MDBIF', 'DIN', 'Interchangeable'], tagColor: 'bg-blue-50 text-blue-700' },
            { href: '/reconciliation', accent: 'bg-emerald-500', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', icon: '≠', title: 'Reconciliation', desc: 'Simulate DPIN-integrated admission reconciliation. Detect dose mismatches, unreported medications, and PRISCUS flags.', tags: ['DPIN', 'PRISCUS', 'ROP'], tagColor: 'bg-emerald-50 text-emerald-700' },
            { href: '/fhir', accent: 'bg-violet-600', iconBg: 'bg-violet-50', iconColor: 'text-violet-600', icon: '{}', title: 'FHIR API Explorer', desc: 'Live FHIR R4 Medication Bundle queries with Canadian DIN system URI and Canada Health Infoway pan-Canadian profiles.', tags: ['FHIR R4', 'HL7', 'Infoway'], tagColor: 'bg-violet-50 text-violet-700' },
            { href: '/eds', accent: 'bg-amber-500', iconBg: 'bg-amber-50', iconColor: 'text-amber-600', icon: '⚠', title: 'Exception Drug Status', desc: 'Browse all 772 EDS drugs by therapeutic category. Coverage criteria and MDSTC approval requirements.', tags: ['EDS', 'MDSTC', 'Part 3'], tagColor: 'bg-amber-50 text-amber-700' },
          ].map((f, i) => (
            <Link key={i} href={f.href} className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
              <div className={`h-1 ${f.accent}`} />
              <div className="p-5">
                <div className={`w-10 h-10 ${f.iconBg} rounded-xl flex items-center justify-center mb-4 text-xl ${f.iconColor} font-mono font-bold`}>{f.icon}</div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">{f.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {f.tags.map(t => (
                    <span key={t} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${f.tagColor}`}>{t}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-2 gap-16 items-center">
            <div className="relative h-80 rounded-2xl overflow-hidden shadow-xl">
              <Image src="/images/pharmacist-shelf.jpg" alt="Pharmacist reviewing medication" fill className="object-cover object-center" />
            </div>
            <div>
              <div className="text-blue-600 text-xs font-bold tracking-widest uppercase mb-3">DPIN Integration</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Medication reconciliation at hospital admission</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                The Manitoba Drug Programs Information Network connects every pharmacy in the province. This platform demonstrates how DPIN dispensing history would be used at hospital admission to detect discrepancies between what patients report and what was actually dispensed.
              </p>
              <div className="space-y-3">
                {[
                  { color: 'bg-red-500', label: 'Dose mismatches — reported vs DPIN dispensed' },
                  { color: 'bg-amber-500', label: 'Unreported medications found in DPIN history' },
                  { color: 'bg-purple-500', label: 'PRISCUS flags for patients aged 65+' },
                  { color: 'bg-blue-500', label: 'Exception Drug Status requirements flagged' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
                    <span className="text-sm text-gray-600">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-16">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-violet-600 text-xs font-bold tracking-widest uppercase mb-3">FHIR R4 API</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Canadian FHIR profiles implemented correctly</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Canada Health Infoway is mandating FHIR R4 through the ACCESS Health initiative. Shared Health Manitoba is actively implementing FHIR interfaces. This platform demonstrates a working FHIR R4 Medication API using real Manitoba formulary data and Canadian-specific profiles.
              </p>
              <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs leading-relaxed">
                <div className="text-gray-500 mb-1">GET /api/fhir/Medication?_text=metformin</div>
                <div><span className="text-gray-500">"system": </span><span className="text-green-400">"http://health.canada.ca/din"</span></div>
                <div><span className="text-gray-500">"profile": </span><span className="text-pink-400">"profile-medication-ca-core"</span></div>
                <div><span className="text-gray-500">"total": </span><span className="text-yellow-400">20</span><span className="text-gray-500"> results</span></div>
              </div>
            </div>
            <div className="relative h-80 rounded-2xl overflow-hidden shadow-xl">
              <Image src="/images/clinician-laptop.jpg" alt="Clinician using laptop" fill className="object-cover object-center" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 py-16">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-amber-600 text-xs font-bold tracking-widest uppercase mb-3">Exception Drug Status</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Coverage that requires clinical criteria approval</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Certain drugs are approved for coverage under the Manitoba EDS Program only when specific clinical criteria are met, as recommended by the Manitoba Drug Standards and Therapeutics Committee (MDSTC). This platform surfaces all 105 EDS drugs organised by therapeutic category so clinicians and pharmacists can quickly identify coverage requirements at point of care.
              </p>
              <div className="space-y-3 mb-6">
                {[
                  '772 EDS drug entries across Manitoba formulary',
                  'Organised by therapeutic category — Cardiovascular, Oncology, Neurology and more',
                  'MDSTC clinical criteria explained for each drug group',
                  'Cross-referenced with interchangeability formulary by DIN',
                ].map((label, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-sm text-gray-600">{label}</span>
                  </div>
                ))}
              </div>
              <Link href="/eds" className="inline-block bg-amber-500 text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-amber-600 transition-colors">
                Browse EDS Drugs
              </Link>
            </div>
            <div className="relative h-80 rounded-2xl overflow-hidden shadow-xl">
              <Image src="/images/clinical-team.jpg" alt="Clinical team reviewing medication criteria" fill className="object-cover object-center" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-900 py-16">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-2 gap-16 items-center">
            <div className="relative h-72 rounded-2xl overflow-hidden shadow-xl">
              <Image src="/images/pharmacist-lab.jpg" alt="Clinical pharmacists" fill className="object-cover object-center" />
            </div>
            <div>
              <div className="text-blue-300 text-xs font-bold tracking-widest uppercase mb-3">Manitoba Health IT Context</div>
              <h2 className="text-3xl font-bold text-white mb-4">Built for Shared Health Manitoba</h2>
              <p className="text-blue-200 text-sm leading-relaxed mb-6">
                This platform demonstrates knowledge of Manitoba provincial health infrastructure — DPIN, MHIN, the Manitoba Drug Benefits Formulary, and Canada Health Infoway interoperability standards.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {['DPIN', 'MHIN', 'Meditech Expanse', 'PHIA Manitoba', 'Accreditation Canada ROP', 'Canada Health Infoway'].map(tag => (
                  <div key={tag} className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-xs text-blue-200 font-medium">{tag}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-8 flex items-center justify-between">
          <div>
            <div className="text-white font-bold text-sm mb-1">Manitoba Medication Safety Platform</div>
            <div className="text-gray-500 text-xs">Synthetic patient data only · PHIA-compliant architecture · Real Manitoba formulary data</div>
          </div>
          <div className="flex gap-2">
            {['FHIR R4', 'HL7', 'DPIN', 'Next.js', 'Supabase'].map(tag => (
              <span key={tag} className="text-[10px] font-mono text-gray-500 bg-gray-800 px-2 py-1 rounded">{tag}</span>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
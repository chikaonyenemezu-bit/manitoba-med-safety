import Link from 'next/link'
import Image from 'next/image'

const STATS = [
  { num: '4,075', label: 'Formulary DINs', sub: 'Real Manitoba formulary data' },
  { num: '772', label: 'EDS Entries', sub: 'Exception Drug Status drugs' },
  { num: '10', label: 'Synthetic Cases', sub: 'Admission reconciliation scenarios' },
  { num: 'FHIR R4', label: 'Medication API', sub: 'DIN-based medication resources' },
]

const WORKFLOW = [
  {
    step: '01',
    title: 'Find the medication',
    desc: 'Search by generic name, brand name, DIN, manufacturer, or therapeutic category.',
  },
  {
    step: '02',
    title: 'Check coverage and flags',
    desc: 'Review formulary status, interchangeable groups, EDS requirements, and patient-specific alerts.',
  },
  {
    step: '03',
    title: 'Reconcile at admission',
    desc: 'Compare patient-reported medicines with DPIN-style dispensing history to identify discrepancies.',
  },
  {
    step: '04',
    title: 'Output structured data',
    desc: 'Represent medication records through a FHIR R4 API using Canadian DIN identifiers.',
  },
]

const MODULES = [
  {
    href: '/formulary',
    num: '01',
    title: 'Search Formulary',
    desc: 'Look up Manitoba formulary medications by name or DIN, including interchangeability, pricing, manufacturer, and coverage details.',
    tags: ['DIN', 'MDBIF', 'Pricing'],
    cta: 'Search Formulary',
  },
  {
    href: '/eds',
    num: '02',
    title: 'Check EDS Status',
    desc: 'Identify medications that require Exception Drug Status approval and review clinical criteria by therapeutic category.',
    tags: ['EDS', 'MDSTC', 'Coverage'],
    cta: 'Browse EDS',
  },
  {
    href: '/reconciliation',
    num: '03',
    title: 'Run Reconciliation',
    desc: 'Compare patient-reported medicines with DPIN-style dispensing history to detect dose mismatches and unreported medications.',
    tags: ['DPIN', 'ROP', 'Safety'],
    cta: 'Try Reconciliation',
  },
  {
    href: '/fhir',
    num: '04',
    title: 'Explore FHIR API',
    desc: 'View DIN-based FHIR R4 Medication resources and API responses built from the formulary dataset.',
    tags: ['FHIR R4', 'HL7', 'API'],
    cta: 'Explore API',
  },
]

const SAFETY_CHECKS = [
  'Reported dose does not match dispensing history',
  'Medication found in DPIN-style history but not reported by patient',
  'EDS medication requires clinical criteria review',
  'Age-related medication safety flag for older adults',
]

const EDS_FEATURES = [
  'Therapeutic category view',
  'DIN-linked records',
  'Coverage criteria',
  'Interchangeability context',
]

const IT_TAGS = [
  'DPIN-style workflow',
  'Manitoba formulary',
  'EDS coverage rules',
  'FHIR R4',
  'DIN identifiers',
  'Synthetic patients',
]

export default function Home() {
  return (
    <main
      className="min-h-screen bg-[#f8f7f4] text-[#0f1923]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Hero */}
      <section>
        <div className="relative min-h-[620px] flex items-center overflow-hidden">
          <Image
            src="/images/pharmacist-counter.jpg"
            alt="Pharmacist working in a pharmacy setting"
            fill
            className="object-cover object-center"
            priority
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#071527]/95 via-[#071527]/82 to-[#071527]/20" />

          <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 w-full">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6 backdrop-blur">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                <span className="text-white/90 text-[11px] font-medium tracking-wide">
                  Real Manitoba formulary data · Synthetic patient data only
                </span>
              </div>

              <h1 className="text-4xl md:text-[56px] font-bold text-white leading-[1.08] tracking-tight mb-5">
                Medication safety,
                <br />
                built around real
                <br />
                <span className="text-white/35">pharmacy workflows.</span>
              </h1>

              <p className="text-white/65 text-sm md:text-base leading-relaxed mb-8 max-w-xl">
                A Manitoba-focused medication reconciliation and formulary platform for exploring drug coverage, DPIN-style admission checks, EDS requirements, and FHIR R4 medication data.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <Link
                  href="/reconciliation"
                  className="bg-white text-[#071527] font-semibold text-sm px-6 py-3 rounded-lg hover:bg-white/90 transition-colors"
                >
                  Try Reconciliation
                </Link>

                <Link
                  href="/formulary"
                  className="bg-white/10 border border-white/25 text-white font-semibold text-sm px-6 py-3 rounded-lg hover:bg-white/20 transition-colors backdrop-blur"
                >
                  Search Formulary
                </Link>

                <Link
                  href="/fhir"
                  className="text-white/60 font-semibold text-sm px-2 py-3 hover:text-white transition-colors"
                >
                  View API →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg">
                {['Formulary lookup', 'Admission reconciliation', 'FHIR medication API'].map((item) => (
                  <div
                    key={item}
                    className="bg-white/8 border border-white/12 rounded-xl px-3 py-2.5 backdrop-blur"
                  >
                    <div className="text-white/70 text-[11px] font-medium">
                      {item}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-[#f8f7f4] border-b border-[#0f1923]/8">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#0f1923]/8">
              {STATS.map((s) => (
                <div key={s.label} className="px-6 py-6 first:pl-0">
                  <div className="text-2xl font-bold tracking-tight">{s.num}</div>
                  <div className="text-xs font-medium text-[#0f1923]/60 mt-0.5">
                    {s.label}
                  </div>
                  <div className="text-[10px] text-[#0f1923]/35 mt-0.5">
                    {s.sub}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-12">
            <p className="text-[11px] font-bold tracking-widest uppercase text-[#0f1923]/35 mb-2">
              How it works
            </p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight max-w-xl">
              One workflow from formulary search to medication reconciliation.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {WORKFLOW.map((item, index) => (
              <div
                key={item.step}
                className="relative bg-white border border-[#0f1923]/8 rounded-xl p-5"
              >
                {index < WORKFLOW.length - 1 && (
                  <div className="hidden md:block absolute top-8 -right-2 w-4 h-px bg-[#0f1923]/15 z-10" />
                )}

                <div className="text-[11px] font-bold text-[#0f1923]/25 tracking-widest mb-4">
                  {item.step}
                </div>

                <h3 className="text-sm font-bold text-[#0f1923] mb-2">
                  {item.title}
                </h3>

                <p className="text-xs text-[#0f1923]/50 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="bg-white border-y border-[#0f1923]/8 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div>
              <p className="text-[11px] font-bold tracking-widest uppercase text-[#0f1923]/35 mb-2">
                Platform Modules
              </p>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                Choose the task you want to perform.
              </h2>
            </div>

            <p className="hidden md:block text-xs text-[#0f1923]/40 max-w-xs text-right leading-relaxed">
              Each module is designed around a practical pharmacy or health informatics workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MODULES.map((module) => (
              <Link
                key={module.href}
                href={module.href}
                className="group bg-[#f8f7f4] border border-[#0f1923]/8 rounded-xl p-5 hover:border-[#0f1923]/20 hover:bg-[#f0efe9] transition-all duration-200 flex flex-col"
              >
                <div className="text-[11px] font-bold text-[#0f1923]/25 tracking-widest mb-4">
                  {module.num}
                </div>

                <h3 className="text-sm font-bold text-[#0f1923] mb-2">
                  {module.title}
                </h3>

                <p className="text-xs text-[#0f1923]/50 leading-relaxed flex-1">
                  {module.desc}
                </p>

                <div className="flex flex-wrap gap-1.5 mt-4">
                  {module.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-[#0f1923]/10 text-[#0f1923]/50"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-4 text-xs font-semibold text-[#0f1923] group-hover:underline">
                  {module.cta} →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Reconciliation */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="relative h-72 md:h-96 rounded-2xl overflow-hidden">
              <Image
                src="/images/pharmacist-shelf.jpg"
                alt="Pharmacist reviewing medicines"
                fill
                className="object-cover object-center"
              />
            </div>

            <div>
              <p className="text-[11px] font-bold tracking-widest uppercase text-[#0f1923]/35 mb-3">
                Medication Reconciliation
              </p>

              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
                Compare what the patient reports with what the pharmacy record shows.
              </h2>

              <p className="text-sm text-[#0f1923]/55 leading-relaxed mb-7">
                The reconciliation module uses synthetic patient cases and DPIN-style dispensing history to show how admission medication discrepancies can be identified before they become safety risks.
              </p>

              <div className="space-y-2.5 mb-8">
                {SAFETY_CHECKS.map((label) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0f1923]/30 shrink-0 mt-1.5" />
                    <span className="text-sm text-[#0f1923]/65">
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                href="/reconciliation"
                className="inline-block bg-[#0f1923] text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-[#1e2d3d] transition-colors"
              >
                Open Reconciliation Module
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* EDS + FHIR */}
      <section className="bg-[#0f1923] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[11px] font-bold tracking-widest uppercase text-white/30 mb-3">
                Coverage Intelligence
              </p>

              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-4">
                Surface EDS requirements before the medication decision is delayed.
              </h2>

              <p className="text-sm text-white/50 leading-relaxed mb-6">
                The EDS module helps users identify drugs that may require additional approval under Manitoba coverage rules. Drugs are organised by therapeutic category and linked back to formulary-level medication records.
              </p>

              <div className="grid grid-cols-2 gap-2.5 mb-8">
                {EDS_FEATURES.map((label) => (
                  <div
                    key={label}
                    className="bg-white/8 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/60 font-medium"
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/eds"
                  className="inline-block bg-white text-[#0f1923] text-sm font-semibold px-6 py-3 rounded-lg hover:bg-white/90 transition-colors"
                >
                  Browse EDS Drugs
                </Link>

                <Link
                  href="/fhir"
                  className="inline-block border border-white/20 text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Explore FHIR API
                </Link>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 font-mono text-xs leading-relaxed overflow-x-auto">
              <div className="text-white/30 text-[10px] mb-3 tracking-widest uppercase">
                FHIR R4 · Medication Response
              </div>

              <div>
                <span className="text-white/30">"resourceType": </span>
                <span className="text-pink-400">"Bundle"</span>
              </div>

              <div>
                <span className="text-white/30">"type": </span>
                <span className="text-emerald-400">"searchset"</span>
              </div>

              <div>
                <span className="text-white/30">"system": </span>
                <span className="text-emerald-400">"http://health.canada.ca/din"</span>
              </div>

              <div>
                <span className="text-white/30">"profile": </span>
                <span className="text-pink-400">"profile-medication-ca-core"</span>
              </div>

              <div>
                <span className="text-white/30">"total": </span>
                <span className="text-amber-400">20</span>
                <span className="text-white/30"> results</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Manitoba IT Context */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="relative h-72 md:h-80 rounded-2xl overflow-hidden">
              <Image
                src="/images/clinician-laptop.jpg"
                alt="Clinician reviewing digital medication information"
                fill
                className="object-cover object-center"
              />
            </div>

            <div>
              <p className="text-[11px] font-bold tracking-widest uppercase text-[#0f1923]/35 mb-3">
                Manitoba Health IT Context
              </p>

              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
                Designed around provincial pharmacy data concepts.
              </h2>

              <p className="text-sm text-[#0f1923]/55 leading-relaxed mb-6">
                This demonstration connects Manitoba formulary data, DPIN-style reconciliation logic, EDS coverage rules, and FHIR R4 medication resources into one portfolio-ready health informatics platform.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                {IT_TAGS.map((tag) => (
                  <div
                    key={tag}
                    className="bg-white border border-[#0f1923]/8 rounded-lg px-3 py-2 text-xs text-[#0f1923]/60 font-medium"
                  >
                    {tag}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#0f1923]/8 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <div>
            <div className="text-sm font-semibold mb-0.5">
              Manitoba Medication Safety Platform
            </div>
            <div className="text-xs text-[#0f1923]/40">
              Synthetic patient data only · PHIA-aware design · Real Manitoba formulary data
            </div>
          </div>

          <div className="text-xs text-[#0f1923]/30">
            Built with Next.js · Supabase · FHIR R4
          </div>
        </div>
      </footer>
    </main>
  )
}
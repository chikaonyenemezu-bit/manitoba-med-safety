'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { reconcile, buildFHIRBundle, ReconciliationResult } from '@/lib/reconciliation'

interface Patient {
  id: string
  patient_code: string
  age: number
  sex: string
  primary_diagnosis: string
  icd10ca_code: string
  reported_medications: any[]
  dpin_dispensing_history: any[]
  clinical_notes: string
}

type PatientFilter = 'all' | 'with-flags' | 'older-adult'

export default function ReconciliationSimulator() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selected, setSelected] = useState<Patient | null>(null)
  const [result, setResult] = useState<ReconciliationResult | null>(null)
  const [running, setRunning] = useState(false)
  const [showFHIR, setShowFHIR] = useState(false)
  const [fhirBundle, setFhirBundle] = useState<object | null>(null)
  const [patientFilter, setPatientFilter] = useState<PatientFilter>('all')
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    setLoadingPatients(true)
    supabase
      .from('synthetic_patients')
      .select('*')
      .order('patient_code')
      .then(({ data, error }) => {
        if (error) setLoadError(error.message)
        setPatients(data || [])
        setLoadingPatients(false)
      })
  }, [])

  function runReconciliation(patient: Patient) {
    setSelected(patient)
    setRunning(true)
    setShowFHIR(false)
    setFhirBundle(null)
    setResult(null)
    window.setTimeout(() => {
      const r = reconcile(patient.reported_medications, patient.dpin_dispensing_history, patient.age)
      const bundle = buildFHIRBundle(patient.patient_code, r.reconciledList)
      setResult(r)
      setFhirBundle(bundle)
      setRunning(false)
    }, 600)
  }

  const filteredPatients = useMemo(() => {
    if (patientFilter === 'older-adult') return patients.filter((p) => p.age >= 65)
    if (patientFilter === 'with-flags') {
      return patients.filter((p) => {
        const r = reconcile(p.reported_medications, p.dpin_dispensing_history, p.age)
        return r.discrepancies.length + r.clinicalFlags.length + r.priscusFlags.length > 0
      })
    }
    return patients
  }, [patients, patientFilter])

  const summary = result ? {
    discrepancies: result.discrepancies.length,
    clinicalFlags: result.clinicalFlags.length,
    priscusFlags: result.priscusFlags.length,
    reconciledMeds: result.reconciledList.length,
    totalFlags: result.clinicalFlags.length + result.priscusFlags.length,
  } : null

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-[#0f1923]" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Header ── */}
      <header className="bg-white border-b border-[#0f1923]/8">
        <div className="max-w-6xl mx-auto px-6 pt-10 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-end">
            <div>
              <p className="text-[11px] font-bold tracking-widest uppercase text-[#0f1923]/35 mb-2">
                DPIN-style admission workflow
              </p>
              <h1 className="text-3xl font-bold tracking-tight mb-1">Medication Reconciliation Simulator</h1>
              <p className="text-sm text-[#0f1923]/45 leading-relaxed max-w-2xl">
                Compare patient-reported medication use against synthetic DPIN-style dispensing history to identify discrepancies, safety flags, and a reconciled medication list.
              </p>
            </div>
            <div className="hidden lg:block text-right">
              <div className="inline-flex flex-col gap-1 text-[11px] text-[#0f1923]/35 text-right">
                <span>Synthetic patients only</span>
                <span>No real personal health information</span>
                <span>FHIR bundle output included</span>
              </div>
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
                  <h2 className="text-xs font-bold uppercase tracking-widest text-[#0f1923]/40">Patient Cases</h2>
                  <p className="text-[11px] text-[#0f1923]/35 mt-0.5">Select one to run reconciliation</p>
                </div>
                <span className="text-[11px] text-[#0f1923]/30 tabular-nums">{filteredPatients.length}</span>
              </div>

              {/* Filters */}
              <div className="flex flex-col gap-1.5 mb-4">
                {([
                  { value: 'all', label: 'All cases' },
                  { value: 'with-flags', label: 'Cases with flags' },
                  { value: 'older-adult', label: 'Age 65+' },
                ] as { value: PatientFilter; label: string }[]).map((f) => {
                  const active = patientFilter === f.value
                  return (
                    <button
                      key={f.value}
                      onClick={() => setPatientFilter(f.value)}
                      className={`text-left rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                        active
                          ? 'border-[#0f1923]/20 bg-[#0f1923] text-white'
                          : 'border-[#0f1923]/8 bg-[#f8f7f4] text-[#0f1923] hover:bg-[#f0efe9]'
                      }`}
                    >
                      {f.label}
                    </button>
                  )
                })}
              </div>

              {loadingPatients && (
                <div className="text-center text-[#0f1923]/35 text-xs py-6">Loading synthetic cases…</div>
              )}
              {loadError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-xs">{loadError}</div>
              )}

              <div className="space-y-1.5 max-h-[560px] overflow-y-auto pr-1">
                {filteredPatients.map((p) => (
                  <PatientCard
                    key={p.id}
                    patient={p}
                    active={selected?.id === p.id}
                    onSelect={() => runReconciliation(p)}
                  />
                ))}
              </div>
            </div>

            {/* Workflow steps */}
            <div className="bg-white border border-[#0f1923]/8 rounded-xl p-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#0f1923]/35 mb-3">Workflow</p>
              <ol className="space-y-2">
                {[
                  'Select a synthetic patient case',
                  'Compare reported medicines with dispensing history',
                  'Review discrepancies and clinical flags',
                  'Export structured FHIR medication data',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-[#0f1923]/55">
                    <span className="text-[10px] font-bold text-[#0f1923]/25 tabular-nums mt-0.5 shrink-0">0{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </aside>

          {/* ── Results ── */}
          <div className="space-y-3 min-w-0">

            {!selected && !running && <StartState />}
            {running && selected && <RunningState patient={selected} />}

            {selected && result && summary && !running && (
              <>
                <PatientSummary patient={selected} summary={summary} />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <SummaryMetric label="Discrepancies" value={summary.discrepancies} tone="red" />
                  <SummaryMetric label="Clinical flags" value={summary.clinicalFlags} tone="orange" />
                  <SummaryMetric label="PRISCUS alerts" value={summary.priscusFlags} tone="violet" />
                  <SummaryMetric label="Reconciled meds" value={summary.reconciledMeds} tone="green" />
                </div>

                {summary.discrepancies === 0 && summary.totalFlags === 0 && (
                  <div className="bg-white border border-[#0f1923]/8 rounded-xl p-5">
                    <p className="text-sm font-bold text-[#0f1923] mb-1">No reconciliation issues detected.</p>
                    <p className="text-xs text-[#0f1923]/50">
                      The patient-reported medications match the synthetic dispensing history based on the loaded rules.
                    </p>
                  </div>
                )}

                <DiscrepancySection discrepancies={result.discrepancies} />
                <ClinicalFlagsSection flags={result.clinicalFlags} />
                <PriscusSection flags={result.priscusFlags} age={selected.age} />
                <ReconciledListSection meds={result.reconciledList} />
                <FHIRSection showFHIR={showFHIR} setShowFHIR={setShowFHIR} fhirBundle={fhirBundle} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PatientCard({ patient, active, onSelect }: { patient: Patient; active: boolean; onSelect: () => void }) {
  const preview = reconcile(patient.reported_medications, patient.dpin_dispensing_history, patient.age)
  const issueCount = preview.discrepancies.length + preview.clinicalFlags.length + preview.priscusFlags.length

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3.5 rounded-lg border transition-all ${
        active
          ? 'border-[#0f1923]/25 bg-[#0f1923] text-white'
          : 'border-[#0f1923]/8 bg-[#f8f7f4] hover:bg-[#f0efe9] hover:border-[#0f1923]/15'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className={`font-mono text-[11px] ${active ? 'text-white/50' : 'text-[#0f1923]/35'}`}>
          {patient.patient_code}
        </span>
        <span className={`text-[11px] ${active ? 'text-white/50' : 'text-[#0f1923]/35'}`}>
          Age {patient.age} · {patient.sex === 'F' ? 'F' : 'M'}
        </span>
      </div>
      <p className={`text-xs font-semibold leading-snug mb-2 ${active ? 'text-white' : 'text-[#0f1923]'}`}>
        {patient.primary_diagnosis}
      </p>
      <div className="flex items-center justify-between">
        <span className={`text-[11px] ${active ? 'text-white/50' : 'text-[#0f1923]/35'}`}>
          {patient.reported_medications.length} reported meds
        </span>
        <span className={`text-[11px] font-semibold ${
          active ? 'text-white/70' : issueCount > 0 ? 'text-red-500' : 'text-emerald-600'
        }`}>
          {issueCount > 0 ? `${issueCount} issue${issueCount !== 1 ? 's' : ''}` : 'No issues'}
        </span>
      </div>
    </button>
  )
}

function StartState() {
  return (
    <div className="bg-white border border-[#0f1923]/8 rounded-xl p-6">
      <h2 className="text-sm font-bold text-[#0f1923] mb-1.5">Start by selecting a synthetic patient.</h2>
      <p className="text-xs text-[#0f1923]/50 leading-relaxed mb-5 max-w-xl">
        This simulator shows the admission medication reconciliation workflow: reported medication history is compared with DPIN-style dispensing history, then discrepancies and safety flags are displayed for review.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { title: 'Reported history', text: 'What the patient says they take' },
          { title: 'Dispensing history', text: 'What appears in DPIN-style records' },
          { title: 'Reconciled output', text: 'A reviewed medication list and FHIR bundle' },
        ].map((item) => (
          <div key={item.title} className="bg-[#f8f7f4] border border-[#0f1923]/8 rounded-lg p-3.5">
            <p className="text-xs font-semibold text-[#0f1923] mb-0.5">{item.title}</p>
            <p className="text-[11px] text-[#0f1923]/45">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function RunningState({ patient }: { patient: Patient }) {
  return (
    <div className="bg-white border border-[#0f1923]/8 rounded-xl py-16 text-center">
      <div className="flex items-center justify-center gap-2 text-sm text-[#0f1923]/40 mb-1.5">
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
        Running reconciliation for {patient.patient_code}…
      </div>
      <p className="text-[11px] text-[#0f1923]/30">
        Comparing reported medications, DPIN-style dispensing history, and age-related safety rules.
      </p>
    </div>
  )
}

function PatientSummary({ patient, summary }: { patient: Patient; summary: any }) {
  return (
    <div className="bg-white border border-[#0f1923]/8 rounded-xl p-5">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] text-[#0f1923]/35 mb-1">{patient.patient_code}</p>
          <h3 className="font-bold text-[#0f1923] text-lg leading-tight">{patient.primary_diagnosis}</h3>
          <p className="text-sm text-[#0f1923]/50 mt-0.5">
            Age {patient.age} · {patient.sex === 'F' ? 'Female' : 'Male'} · {patient.icd10ca_code}
          </p>
          {patient.clinical_notes && (
            <p className="text-xs text-[#0f1923]/40 mt-3 bg-[#f8f7f4] border border-[#0f1923]/8 rounded-lg p-3 italic">
              {patient.clinical_notes}
            </p>
          )}
        </div>
        <div className="bg-[#f8f7f4] border border-[#0f1923]/8 rounded-lg p-3 shrink-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#0f1923]/35 mb-1.5">Case outcome</p>
          <p className="text-sm font-semibold text-[#0f1923]">
            {summary.discrepancies + summary.totalFlags > 0 ? 'Review required' : 'No issues detected'}
          </p>
          <p className="text-[11px] text-[#0f1923]/35 mt-0.5">Based on loaded demo rules</p>
        </div>
      </div>
    </div>
  )
}

function SummaryMetric({ label, value, tone }: { label: string; value: number; tone: 'red' | 'orange' | 'violet' | 'green' }) {
  const styles = {
    red:    'text-red-700 bg-red-50 border-red-100',
    orange: 'text-orange-700 bg-orange-50 border-orange-100',
    violet: 'text-violet-700 bg-violet-50 border-violet-100',
    green:  'text-emerald-700 bg-emerald-50 border-emerald-100',
  }
  return (
    <div className={`border rounded-xl p-4 ${styles[tone]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-[11px] font-semibold mt-1">{label}</div>
    </div>
  )
}

function DiscrepancySection({ discrepancies }: { discrepancies: ReconciliationResult['discrepancies'] }) {
  if (discrepancies.length === 0) return null
  return (
    <div className="bg-white border border-[#0f1923]/8 rounded-xl p-5">
      <SectionHeading dot="bg-red-500" title="Discrepancies detected" subtitle="Differences between reported medication use and DPIN-style dispensing history." />
      <div className="space-y-2.5 mt-4">
        {discrepancies.map((d, i) => {
          const high = d.clinicalSignificance === 'high'
          return (
            <div key={i} className={`rounded-lg p-4 border-l-2 ${high ? 'bg-red-50 border-red-400' : 'bg-amber-50 border-amber-300'}`}>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${high ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {d.clinicalSignificance} significance
                </span>
                <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/80 border border-[#0f1923]/8 text-[#0f1923]/60">
                  {d.type.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-sm font-bold text-[#0f1923] mb-2">{d.medication}</p>
              {(d.reported || d.dispensed) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs mb-3">
                  <CompareBox label="Patient reported" value={d.reported || 'Not reported'} />
                  <CompareBox label="DPIN-style record" value={d.dispensed || 'Not found'} />
                </div>
              )}
              <p className="text-xs text-[#0f1923]/60 leading-relaxed">
                <span className="font-semibold">Suggested review:</span> {d.recommendation}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ClinicalFlagsSection({ flags }: { flags: ReconciliationResult['clinicalFlags'] }) {
  if (flags.length === 0) return null
  return (
    <div className="bg-white border border-[#0f1923]/8 rounded-xl p-5">
      <SectionHeading dot="bg-orange-400" title="Clinical safety flags" subtitle="Medication combinations or rule-based warnings from the demo reconciliation engine." />
      <div className="space-y-2 mt-4">
        {flags.map((f, i) => (
          <div key={i} className="bg-orange-50 border border-orange-100 rounded-lg p-3">
            <p className="text-sm font-semibold text-orange-900">{f.flag}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PriscusSection({ flags, age }: { flags: ReconciliationResult['priscusFlags']; age: number }) {
  if (flags.length === 0) return null
  return (
    <div className="bg-white border border-[#0f1923]/8 rounded-xl p-5">
      <SectionHeading dot="bg-violet-400" title="Age-related PRISCUS alerts" subtitle={`Potentially inappropriate medication alerts for an older adult case, age ${age}.`} />
      <div className="space-y-2 mt-4">
        {flags.map((f, i) => (
          <div key={i} className="bg-violet-50 border border-violet-100 rounded-lg p-3">
            <p className="text-sm font-semibold text-violet-900">{f.flag}</p>
            <p className="text-xs text-violet-600/80 mt-1 leading-relaxed">{f.details}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReconciledListSection({ meds }: { meds: ReconciliationResult['reconciledList'] }) {
  return (
    <div className="bg-white border border-[#0f1923]/8 rounded-xl p-5">
      <SectionHeading dot="bg-emerald-500" title="Reconciled medication list" subtitle="Medication list produced after applying the demo reconciliation rules." />
      <div className="mt-4 divide-y divide-[#0f1923]/6">
        {meds.map((med, i) => (
          <div key={i} className="py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <span className="text-sm font-semibold text-[#0f1923]">{med.name}</span>
              <span className="font-mono text-[11px] text-[#0f1923]/35 ml-2">DIN {med.din}</span>
            </div>
            <div className="md:text-right">
              <span className="text-sm text-[#0f1923]/65">{med.dose}</span>
              {med.frequency && <span className="text-[11px] text-[#0f1923]/35 ml-2">{med.frequency}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FHIRSection({ showFHIR, setShowFHIR, fhirBundle }: { showFHIR: boolean; setShowFHIR: (v: boolean) => void; fhirBundle: object | null }) {
  return (
    <div className="bg-white border border-[#0f1923]/8 rounded-xl p-5">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-3">
        <SectionHeading dot="bg-[#0f1923]/25" title="FHIR MedicationStatement bundle" subtitle="Structured output generated from the reconciled medication list." />
        <button
          onClick={() => setShowFHIR(!showFHIR)}
          className="text-xs font-semibold text-[#0f1923] bg-[#f8f7f4] border border-[#0f1923]/10 px-3 py-1.5 rounded-lg hover:bg-[#f0efe9] transition-colors shrink-0"
        >
          {showFHIR ? 'Hide FHIR JSON' : 'Show FHIR JSON'}
        </button>
      </div>
      <p className="text-[11px] text-[#0f1923]/35 mb-3">
        HL7 FHIR R4-style output · Canadian DIN identifier system · Synthetic patient code only
      </p>
      {showFHIR && fhirBundle && (
        <pre className="bg-[#0f1923] text-emerald-300 text-xs p-4 rounded-xl overflow-auto max-h-96 font-mono leading-relaxed">
          {JSON.stringify(fhirBundle, null, 2)}
        </pre>
      )}
    </div>
  )
}

function SectionHeading({ dot, title, subtitle }: { dot: string; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className={`w-1.5 h-1.5 rounded-full ${dot} mt-1.5 shrink-0`} />
      <div>
        <h4 className="text-sm font-bold text-[#0f1923]">{title}</h4>
        {subtitle && <p className="text-[11px] text-[#0f1923]/40 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

function CompareBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/80 border border-[#0f1923]/8 rounded-lg px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#0f1923]/35 mb-1">{label}</p>
      <p className="text-xs font-semibold text-[#0f1923]">{value}</p>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
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

export default function ReconciliationSimulator() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selected, setSelected] = useState<Patient | null>(null)
  const [result, setResult] = useState<ReconciliationResult | null>(null)
  const [running, setRunning] = useState(false)
  const [showFHIR, setShowFHIR] = useState(false)
  const [fhirBundle, setFhirBundle] = useState<object | null>(null)

  useEffect(() => {
    supabase
      .from('synthetic_patients')
      .select('*')
      .order('patient_code')
      .then(({ data }) => setPatients(data || []))
  }, [])

  function runReconciliation(patient: Patient) {
    setSelected(patient)
    setRunning(true)
    setShowFHIR(false)
    setFhirBundle(null)
    setTimeout(() => {
      const r = reconcile(
        patient.reported_medications,
        patient.dpin_dispensing_history,
        patient.age
      )
      const bundle = buildFHIRBundle(patient.patient_code, r.reconciledList)
      setResult(r)
      setFhirBundle(bundle)
      setRunning(false)
    }, 600)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-900 text-white px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <p className="text-blue-300 text-xs font-bold tracking-widest uppercase mb-1">
            DPIN-Integrated Admission Workflow
          </p>
          <h1 className="text-3xl font-bold mb-2">Medication Reconciliation Simulator</h1>
          <p className="text-blue-200 text-sm">
            Synthetic patients only · No real patient health information
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Patient list */}
          <div>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
              Select Patient
            </h2>
            <div className="space-y-2">
              {patients.map(p => (
                <button
                  key={p.id}
                  onClick={() => runReconciliation(p)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selected?.id === p.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs text-gray-400">{p.patient_code}</span>
                    <span className="text-xs text-gray-400">
                      {p.age}{p.sex} · {p.icd10ca_code}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 leading-tight">
                    {p.primary_diagnosis}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {p.reported_medications.length} medications reported
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-4">
            {!selected && (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">
                Select a patient to run reconciliation
              </div>
            )}

            {running && (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">
                Running reconciliation against DPIN...
              </div>
            )}

            {selected && result && !running && (
              <>
                {/* Patient header */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-xs text-gray-400 mb-1">{selected.patient_code}</p>
                      <h3 className="font-bold text-gray-900 text-lg">{selected.primary_diagnosis}</h3>
                      <p className="text-sm text-gray-500">
                        Age {selected.age} · {selected.sex === 'F' ? 'Female' : 'Male'} · {selected.icd10ca_code}
                      </p>
                      <p className="text-xs text-gray-400 mt-2 italic">{selected.clinical_notes}</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <div className="text-2xl font-bold text-red-600">{result.discrepancies.length}</div>
                      <div className="text-xs text-gray-400">discrepancies</div>
                      <div className="text-2xl font-bold text-amber-600 mt-1">
                        {result.clinicalFlags.length + result.priscusFlags.length}
                      </div>
                      <div className="text-xs text-gray-400">flags</div>
                    </div>
                  </div>
                </div>

                {/* Discrepancies */}
                {result.discrepancies.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                      Discrepancies Detected
                    </h4>
                    <div className="space-y-3">
                      {result.discrepancies.map((d, i) => (
                        <div key={i} className={`rounded-lg p-4 border-l-4 ${
                          d.clinicalSignificance === 'high'
                            ? 'bg-red-50 border-red-500'
                            : 'bg-amber-50 border-amber-400'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                              d.clinicalSignificance === 'high'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {d.clinicalSignificance} · {d.type.replace(/_/g, ' ')}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">{d.medication}</span>
                          </div>
                          {d.reported && d.dispensed && (
                            <div className="flex gap-4 text-xs text-gray-600 mb-1">
                              <span>Reported: <strong>{d.reported}</strong></span>
                              <span>DPIN: <strong>{d.dispensed}</strong></span>
                            </div>
                          )}
                          <p className="text-xs text-gray-600">{d.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clinical flags */}
                {result.clinicalFlags.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
                      Drug Interaction Flags
                    </h4>
                    <div className="space-y-2">
                      {result.clinicalFlags.map((f, i) => (
                        <div key={i} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                          <p className="text-sm font-semibold text-orange-900">{f.flag}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PRISCUS flags */}
                {result.priscusFlags.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                      PRISCUS Alerts
                      <span className="text-xs text-gray-400 font-normal">(potentially inappropriate for age 65+)</span>
                    </h4>
                    <div className="space-y-2">
                      {result.priscusFlags.map((f, i) => (
                        <div key={i} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                          <p className="text-sm font-semibold text-purple-900">{f.flag}</p>
                          <p className="text-xs text-purple-700 mt-1">{f.details}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reconciled list */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                    Reconciled Medication List
                  </h4>
                  <div className="space-y-2">
                    {result.reconciledList.map((med, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <span className="text-sm font-semibold text-gray-900">{med.name}</span>
                          <span className="text-xs text-gray-400 ml-2 font-mono">DIN {med.din}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-gray-600">{med.dose}</span>
                          {med.frequency && (
                            <span className="text-xs text-gray-400 ml-2">{med.frequency}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FHIR output */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
                      FHIR MedicationStatement Bundle
                    </h4>
                    <button
                      onClick={() => setShowFHIR(!showFHIR)}
                      className="text-xs font-semibold text-violet-600 bg-violet-50 px-3 py-1.5 rounded-lg hover:bg-violet-100 transition-colors"
                    >
                      {showFHIR ? 'Hide' : 'Show'} FHIR JSON
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">
                    HL7 FHIR R4 · Canada Health Infoway pan-Canadian profile ·
                    system: http://health.canada.ca/din
                  </p>
                  {showFHIR && fhirBundle && (
                    <pre className="bg-gray-900 text-green-300 text-xs p-4 rounded-xl overflow-auto max-h-96 font-mono leading-relaxed">
                      {JSON.stringify(fhirBundle, null, 2)}
                    </pre>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
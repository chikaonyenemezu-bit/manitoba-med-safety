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

export default function FHIRExplorer() {
  const [url, setUrl] = useState('')
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeExample, setActiveExample] = useState<string | null>(null)

  async function query(queryUrl: string) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-900 text-white px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <p className="text-blue-300 text-sm font-medium mb-1">
            HL7 FHIR R4 · Canada Health Infoway pan-Canadian profiles
          </p>
          <h1 className="text-3xl font-bold mb-2">FHIR API Explorer</h1>
          <p className="text-blue-200 text-sm">
            Live queries against Manitoba Drug Benefits Formulary data ·{' '}
            <span className="font-mono">http://health.canada.ca/din</span>
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Example queries */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase
                           tracking-wide mb-3">
              Example Queries
            </h2>
            <div className="space-y-2">
              {EXAMPLE_QUERIES.map(example => (
                <button
                  key={example.url}
                  onClick={() => {
                    setActiveExample(example.url)
                    query(example.url)
                  }}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    activeExample === example.url
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">
                    {example.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {example.description}
                  </p>
                  <p className="font-mono text-xs text-blue-600 mt-1 break-all">
                    {example.url}
                  </p>
                </button>
              ))}
            </div>

            {/* Info box */}
            <div className="mt-4 bg-blue-50 border border-blue-200
                            rounded-lg p-4">
              <p className="text-xs font-semibold text-blue-900 mb-2">
                Canadian FHIR Context
              </p>
              <p className="text-xs text-blue-700 mb-1">
                DIN system URI:
              </p>
              <p className="font-mono text-xs text-blue-600 break-all">
                http://health.canada.ca/din
              </p>
              <p className="text-xs text-blue-700 mt-2 mb-1">
                Supported profile:
              </p>
              <p className="font-mono text-xs text-blue-600 break-all">
                ca.infoway.io CA-Core
              </p>
              <p className="text-xs text-blue-700 mt-2">
                Aligned with Canada Health Infoway ACCESS Health initiative
                pan-Canadian FHIR R4 implementation guidance.
              </p>
            </div>
          </div>

          {/* Response panel */}
          <div className="lg:col-span-2">
            {/* URL bar */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="/api/fhir/Medication?_text=metformin"
                className="flex-1 font-mono text-sm border border-gray-300
                           rounded-lg px-4 py-2.5 focus:outline-none
                           focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => query(url)}
                disabled={loading || !url}
                className="bg-blue-900 text-white px-5 py-2.5 rounded-lg
                           text-sm font-medium hover:bg-blue-800
                           disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Send'}
              </button>
            </div>

            {/* Response */}
            {!response && !loading && !error && (
              <div className="bg-white border border-gray-200 rounded-xl p-8
                              text-center text-gray-400">
                Select an example query or enter a URL above
              </div>
            )}

            {loading && (
              <div className="bg-white border border-gray-200 rounded-xl p-8
                              text-center text-gray-400">
                Querying FHIR endpoint...
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4
                              text-red-700 text-sm">
                Error: {error}
              </div>
            )}

            {response && !loading && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {/* Response meta */}
                <div className="border-b border-gray-100 px-5 py-3 flex
                                items-center justify-between bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-green-700
                                     bg-green-100 px-2 py-0.5 rounded">
                      200 OK
                    </span>
                    <span className="text-xs text-gray-500 font-mono">
                      application/fhir+json
                    </span>
                  </div>
                  {response.resourceType && (
                    <span className="text-xs text-gray-500">
                      resourceType: <strong>{response.resourceType}</strong>
                      {response.total !== undefined && (
                        <> · total: <strong>{response.total}</strong></>
                      )}
                    </span>
                  )}
                </div>

                {/* JSON output */}
                <pre className="p-5 text-xs overflow-auto max-h-[600px]
                                font-mono text-gray-800 leading-relaxed">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
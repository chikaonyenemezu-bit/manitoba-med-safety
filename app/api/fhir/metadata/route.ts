import { NextResponse } from 'next/server'

export async function GET() {
  const capability = {
    resourceType: 'CapabilityStatement',
    id: 'manitoba-med-safety',
    status: 'active',
    date: '2026-04-01',
    kind: 'instance',
    fhirVersion: '4.0.1',
    format: ['json'],
    name: 'ManitobaMedicationSafetyFHIRServer',
    title: 'Manitoba Medication Safety FHIR R4 Server',
    description:
      'FHIR R4 medication API using Manitoba Drug Benefits Formulary data. ' +
      'Aligned with Canada Health Infoway pan-Canadian FHIR profiles.',
    publisher: 'Manitoba Medication Safety Platform',
    software: {
      name: 'Manitoba Medication Safety Platform',
      version: '1.0.0',
    },
    implementation: {
      description: 'Manitoba Drug Benefits Formulary FHIR R4 API',
      url: 'https://manitoba-med-safety.vercel.app/api/fhir',
    },
    rest: [
      {
        mode: 'server',
        resource: [
          {
            type: 'Medication',
            profile:
              'http://hl7.org/fhir/StructureDefinition/Medication',
            supportedProfile: [
              'http://infoway-inforoute.ca/fhir/StructureDefinition/profile-medication-ca-core',
            ],
            interaction: [
              { code: 'read' },
              { code: 'search-type' },
            ],
            searchParam: [
              {
                name: 'identifier',
                type: 'token',
                documentation:
                  'Search by DIN using system http://health.canada.ca/din',
              },
              {
                name: '_text',
                type: 'string',
                documentation: 'Search by drug name',
              },
            ],
          },
          {
            type: 'MedicationKnowledge',
            profile:
              'http://hl7.org/fhir/StructureDefinition/MedicationKnowledge',
            interaction: [{ code: 'read' }],
          },
        ],
      },
    ],
  }

  return NextResponse.json(capability, {
    headers: {
      'Content-Type': 'application/fhir+json',
    },
  })
}
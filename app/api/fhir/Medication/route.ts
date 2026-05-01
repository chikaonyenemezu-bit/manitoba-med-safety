import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function buildMedicationResource(drug: any) {
  return {
    resourceType: 'Medication',
    id: drug.din,
    meta: {
      profile: [
        'http://hl7.org/fhir/StructureDefinition/Medication',
        'http://infoway-inforoute.ca/fhir/StructureDefinition/profile-medication-ca-core',
      ],
      source: 'https://www.gov.mb.ca/health/mdbif/',
    },
    identifier: [
      {
        system: 'http://health.canada.ca/din',
        value: drug.din,
      },
    ],
    code: {
      coding: [
        {
          system: 'http://health.canada.ca/din',
          code: drug.din,
          display: drug.generic_name || drug.drug_name,
        },
      ],
      text: drug.product_name,
    },
    status: 'active',
    manufacturer: {
      display: drug.manufacturer_code,
    },
    form: {
      coding: [
        {
          system:
            'http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm',
          display: drug.dosage_form,
        },
      ],
      text: drug.dosage_form,
    },
    ingredient: [
      {
        itemCodeableConcept: {
          text: drug.drug_name,
        },
        strength: {
          numerator: {
            value: drug.strength,
            unit: drug.strength,
          },
        },
      },
    ],
    extension: [
      {
        url: 'http://manitoba-med-safety.ca/fhir/StructureDefinition/formulary-status',
        valueString: drug.formulary_status,
      },
      {
        url: 'http://manitoba-med-safety.ca/fhir/StructureDefinition/interchangeable-group',
        valueString: drug.interchangeable_group,
      },
      {
        url: 'http://manitoba-med-safety.ca/fhir/StructureDefinition/unit-price',
        valueMoney: {
          value: drug.price,
          currency: 'CAD',
        },
      },
    ],
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const identifier = searchParams.get('identifier')
  const text = searchParams.get('_text')
  const id = searchParams.get('id')

  let query = supabase.from('mb_interchangeability').select('*').limit(20)

  if (identifier) {
    // Format: http://health.canada.ca/din|02229453
    const din = identifier.includes('|')
      ? identifier.split('|')[1]
      : identifier
    query = query.eq('din', din)
  } else if (id) {
    query = query.eq('din', id)
  } else if (text) {
    query = query.or(
      `drug_name.ilike.%${text}%,product_name.ilike.%${text}%`
    )
  } else {
    return NextResponse.json(
      {
        resourceType: 'OperationOutcome',
        issue: [
          {
            severity: 'error',
            code: 'required',
            details: {
              text: 'At least one search parameter is required: identifier, _text, or id',
            },
          },
        ],
      },
      { status: 400 }
    )
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json(
      {
        resourceType: 'OperationOutcome',
        issue: [{ severity: 'error', code: 'exception', details: { text: error.message } }],
      },
      { status: 500 }
    )
  }

  const bundle = {
    resourceType: 'Bundle',
    id: crypto.randomUUID(),
    type: 'searchset',
    total: data?.length || 0,
    timestamp: new Date().toISOString(),
    link: [
      {
        relation: 'self',
        url: request.url,
      },
    ],
    entry: (data || []).map(drug => ({
      fullUrl: `https://manitoba-med-safety.vercel.app/api/fhir/Medication/${drug.din}`,
      resource: buildMedicationResource(drug),
      search: { mode: 'match' },
    })),
  }

  return NextResponse.json(bundle, {
    headers: { 'Content-Type': 'application/fhir+json' },
  })
}
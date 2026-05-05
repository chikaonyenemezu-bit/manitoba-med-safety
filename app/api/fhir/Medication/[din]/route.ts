import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function buildMedicationResource(drug: any, dpd: any) {
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
    identifier: [{ system: 'http://health.canada.ca/din', value: drug.din }],
    code: {
      coding: [{ system: 'http://health.canada.ca/din', code: drug.din, display: drug.drug_name }],
      text: drug.product_name,
    },
    status: 'active',
    manufacturer: { display: dpd?.company_name || drug.manufacturer_code },
    form: {
      coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm', display: drug.dosage_form }],
      text: drug.dosage_form,
    },
    ingredient: dpd?.active_ingredients
      ? dpd.active_ingredients.split(' / ').map((ing: string) => ({ itemCodeableConcept: { text: ing } }))
      : [{ itemCodeableConcept: { text: drug.drug_name } }],
    extension: [
      { url: 'http://manitoba-med-safety.ca/fhir/StructureDefinition/formulary-status', valueString: drug.formulary_status },
      { url: 'http://manitoba-med-safety.ca/fhir/StructureDefinition/interchangeable-group', valueString: drug.interchangeable_group },
      { url: 'http://manitoba-med-safety.ca/fhir/StructureDefinition/unit-price', valueMoney: { value: drug.price, currency: 'CAD' } },
    ],
  }
}

function buildMedicationKnowledge(drug: any, eds: any) {
  return {
    resourceType: 'MedicationKnowledge',
    id: `mk-${drug.din}`,
    code: {
      coding: [{ system: 'http://health.canada.ca/din', code: drug.din, display: drug.drug_name }],
      text: drug.product_name,
    },
    status: 'active',
    regulatory: [
      {
        regulatoryAuthority: { display: 'Manitoba Drug Programs' },
        substitution: [{ type: { coding: [{ code: drug.formulary_status }] }, allowed: true }],
        schedule: eds ? [{ schedule: { coding: [{ code: 'EDS', display: 'Exception Drug Status' }], text: eds.therapeutic_category } }] : [],
      },
    ],
    cost: drug.price ? [{ type: { coding: [{ code: 'formulary' }] }, cost: { value: drug.price, currency: 'CAD' } }] : [],
  }
}

export async function GET(
  request: NextRequest,
  segmentData: { params: Promise<{ din: string }> }
) {
  const { din: dinParam } = await segmentData.params
  const din = dinParam.padStart(8, '0')

  const { data: drug, error } = await supabase
    .from('mb_interchangeability')
    .select('*')
    .eq('din', din)
    .single()

  if (error || !drug) {
    return NextResponse.json(
      {
        resourceType: 'OperationOutcome',
        issue: [{ severity: 'error', code: 'not-found', details: { text: `Medication with DIN ${din} not found` } }],
      },
      { status: 404, headers: { 'Content-Type': 'application/fhir+json' } }
    )
  }

  const [dpdRes, edsRes] = await Promise.all([
    supabase.from('dpd_drugs').select('*').eq('din', din).single(),
    supabase.from('mb_eds').select('*').eq('din', din).single(),
  ])

  const wantsMK = request.nextUrl.searchParams.get('_type') === 'MedicationKnowledge'

  if (wantsMK) {
    return NextResponse.json(
      buildMedicationKnowledge(drug, edsRes.data),
      { headers: { 'Content-Type': 'application/fhir+json' } }
    )
  }

  return NextResponse.json(
    buildMedicationResource(drug, dpdRes.data),
    { headers: { 'Content-Type': 'application/fhir+json' } }
  )
}

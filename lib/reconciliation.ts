export interface MedicationEntry {
  name: string
  din: string
  dose: string
  frequency?: string
}

export interface DispensedMedication {
  name: string
  din: string
  dose: string
  lastDispensed: string
  daysSupply: number
}

export interface Discrepancy {
  type: 'dose_mismatch' | 'not_in_dpin' | 'not_reported' | 'discontinued'
  medication: string
  din: string
  reported: string | null
  dispensed: string | null
  clinicalSignificance: 'high' | 'moderate' | 'low'
  recommendation: string
}

export interface ClinicalFlag {
  flag: string
  medication: string
  clinicalSignificance: 'high' | 'moderate' | 'low'
  details: string
}

export interface ReconciliationResult {
  discrepancies: Discrepancy[]
  clinicalFlags: ClinicalFlag[]
  priscusFlags: ClinicalFlag[]
  reconciledList: MedicationEntry[]
}

const PRISCUS_DRUGS = [
  'amitriptyline', 'nortriptyline', 'doxepin',
  'diazepam', 'lorazepam', 'nitrazepam', 'flurazepam', 'triazolam',
  'diphenhydramine', 'hydroxyzine',
  'digoxin', 'amiodarone',
  'glibenclamide', 'chlorpropamide',
  'indomethacin', 'piroxicam',
  'methyldopa', 'clonidine', 'reserpine',
  'haloperidol', 'thioridazine',
  'meperidine', 'pentazocine',
  'muscle relaxants', 'cyclobenzaprine',
]

const HIGH_RISK_COMBINATIONS = [
  {
    drugs: ['warfarin', 'aspirin'],
    flag: 'Warfarin + Aspirin — increased bleeding risk',
    significance: 'high' as const,
  },
  {
    drugs: ['warfarin', 'clarithromycin'],
    flag: 'Warfarin + Clarithromycin — CYP2C9 inhibition, elevated INR risk',
    significance: 'high' as const,
  },
  {
    drugs: ['metformin', 'furosemide'],
    flag: 'Metformin + Furosemide — risk of lactic acidosis with dehydration',
    significance: 'moderate' as const,
  },
  {
    drugs: ['digoxin', 'amiodarone'],
    flag: 'Digoxin + Amiodarone — amiodarone increases digoxin levels, toxicity risk',
    significance: 'high' as const,
  },
  {
    drugs: ['ramipril', 'spironolactone'],
    flag: 'Ramipril + Spironolactone — hyperkalemia risk',
    significance: 'high' as const,
  },
  {
    drugs: ['lisinopril', 'spironolactone'],
    flag: 'Lisinopril + Spironolactone — hyperkalemia risk',
    significance: 'high' as const,
  },
  {
    drugs: ['methotrexate', 'celecoxib'],
    flag: 'Methotrexate + Celecoxib — NSAID interaction, methotrexate toxicity risk',
    significance: 'high' as const,
  },
  {
    drugs: ['methotrexate', 'ibuprofen'],
    flag: 'Methotrexate + Ibuprofen — NSAID reduces methotrexate clearance, toxicity risk',
    significance: 'high' as const,
  },
  {
    drugs: ['mercaptopurine', 'allopurinol'],
    flag: 'Mercaptopurine + Allopurinol — allopurinol inhibits mercaptopurine metabolism, severe toxicity risk — dose reduction required',
    significance: 'high' as const,
  },
  {
    drugs: ['sertraline', 'topiramate'],
    flag: 'Sertraline + Topiramate — additive CNS effects, monitor closely',
    significance: 'moderate' as const,
  },
  {
    drugs: ['sildenafil', 'nitrate'],
    flag: 'Sildenafil + Nitrates — severe hypotension risk, contraindicated',
    significance: 'high' as const,
  },
]

function daysSinceDispensed(dateStr: string): number {
  const dispensed = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - dispensed.getTime()) / (1000 * 60 * 60 * 24))
}

function isRecentDispensing(med: DispensedMedication): boolean {
  return daysSinceDispensed(med.lastDispensed) <= med.daysSupply + 30
}

function normalizeName(name: string): string {
  return name.toLowerCase().trim()
}

function medicationMatch(a: string, b: string): boolean {
  const na = normalizeName(a)
  const nb = normalizeName(b)
  return na.includes(nb) || nb.includes(na)
}

export function reconcile(
  reported: MedicationEntry[],
  dpinHistory: DispensedMedication[],
  patientAge: number
): ReconciliationResult {
  const discrepancies: Discrepancy[] = []
  const clinicalFlags: ClinicalFlag[] = []
  const priscusFlags: ClinicalFlag[] = []

  for (const med of reported) {
    const dpinMatch = dpinHistory.find(
      d => d.din === med.din || medicationMatch(d.name, med.name)
    )
    if (!dpinMatch) {
      discrepancies.push({
        type: 'not_in_dpin',
        medication: med.name,
        din: med.din,
        reported: med.dose,
        dispensed: null,
        clinicalSignificance: 'moderate',
        recommendation:
          'Medication not found in DPIN dispensing history. ' +
          'Verify with patient — may be purchased out of province or OTC.',
      })
    } else if (
      dpinMatch.dose !== med.dose &&
      dpinMatch.dose.toLowerCase() !== med.dose.toLowerCase()
    ) {
      discrepancies.push({
        type: 'dose_mismatch',
        medication: med.name,
        din: med.din,
        reported: med.dose,
        dispensed: dpinMatch.dose,
        clinicalSignificance: 'high',
        recommendation:
          `DPIN shows ${dpinMatch.dose} dispensed on ${dpinMatch.lastDispensed}. ` +
          `Patient reports ${med.dose}. Clarify current dose with patient and prescriber.`,
      })
    }
  }

  for (const dispensed of dpinHistory) {
    if (!isRecentDispensing(dispensed)) continue
    const reportedMatch = reported.find(
      r => r.din === dispensed.din || medicationMatch(r.name, dispensed.name)
    )
    if (!reportedMatch) {
      discrepancies.push({
        type: 'not_reported',
        medication: dispensed.name,
        din: dispensed.din,
        reported: null,
        dispensed: dispensed.dose,
        clinicalSignificance: 'high',
        recommendation:
          `DPIN shows ${dispensed.dose} dispensed on ${dispensed.lastDispensed}. ` +
          `Patient did not report this medication. Confirm whether still taking.`,
      })
    }
  }

  const allMedNames = [
    ...reported.map(m => normalizeName(m.name)),
    ...dpinHistory.map(m => normalizeName(m.name)),
  ]

  for (const combo of HIGH_RISK_COMBINATIONS) {
    const allPresent = combo.drugs.every(drug =>
      allMedNames.some(name => name.includes(drug))
    )
    if (allPresent) {
      clinicalFlags.push({
        flag: combo.flag,
        medication: combo.drugs.join(' + '),
        clinicalSignificance: combo.significance,
        details: combo.flag,
      })
    }
  }

  if (patientAge >= 65) {
    for (const med of [
      ...reported,
      ...dpinHistory.map(d => ({ name: d.name, din: d.din, dose: d.dose })),
    ]) {
      const isPriscus = PRISCUS_DRUGS.some(p =>
        normalizeName(med.name).includes(p)
      )
      if (isPriscus) {
        priscusFlags.push({
          flag: `PRISCUS: ${med.name} — potentially inappropriate for patients aged 65+`,
          medication: med.name,
          clinicalSignificance: 'moderate',
          details:
            'Listed on PRISCUS criteria for potentially inappropriate medications ' +
            'in elderly patients. Review risk-benefit with prescriber.',
        })
      }
    }
  }

  const reconciledList: MedicationEntry[] = [...reported]
  for (const dispensed of dpinHistory) {
    if (!isRecentDispensing(dispensed)) continue
    const alreadyIncluded = reconciledList.find(
      r => r.din === dispensed.din || medicationMatch(r.name, dispensed.name)
    )
    if (!alreadyIncluded) {
      reconciledList.push({
        name: dispensed.name,
        din: dispensed.din,
        dose: dispensed.dose,
        frequency: 'confirm with patient',
      })
    }
  }

  return { discrepancies, clinicalFlags, priscusFlags, reconciledList }
}

export function buildFHIRBundle(
  patientCode: string,
  reconciledList: MedicationEntry[]
): object {
  return {
    resourceType: 'Bundle',
    id: crypto.randomUUID(),
    type: 'collection',
    timestamp: new Date().toISOString(),
    meta: {
      profile: [
        'http://infoway-inforoute.ca/fhir/StructureDefinition/profile-medicationstatement-ca-core',
      ],
    },
    entry: reconciledList.map(med => ({
      fullUrl: `urn:uuid:${crypto.randomUUID()}`,
      resource: {
        resourceType: 'MedicationStatement',
        status: 'active',
        subject: {
          identifier: {
            system: 'http://manitoba-med-safety.ca/patient',
            value: patientCode,
          },
        },
        medicationCodeableConcept: {
          coding: [
            {
              system: 'http://health.canada.ca/din',
              code: med.din,
              display: med.name,
            },
          ],
          text: med.name,
        },
        dosage: [
          {
            text: `${med.dose}${med.frequency ? ` — ${med.frequency}` : ''}`,
          },
        ],
        dateAsserted: new Date().toISOString(),
        informationSource: {
          display: 'Medication reconciliation — Manitoba hospital admission',
        },
      },
    })),
  }
}
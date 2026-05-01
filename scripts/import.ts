import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DATA_DIR = path.join(process.cwd(), 'data')

function readCSV(filename: string) {
  const content = fs.readFileSync(path.join(DATA_DIR, filename), 'utf-8')
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    cast: true,
  })
}

async function importManufacturers() {
  console.log('Importing manufacturers...')
  const rows = readCSV('manufacturers.csv')
  const cleaned = rows
    .map((r: any) => ({
      abbreviation: r.abbreviation || null,
      manufacturer_name: r.manufacturer_name || null,
    }))
    .filter((r: any) => r.abbreviation)
  for (let i = 0; i < cleaned.length; i += 500) {
    const batch = cleaned.slice(i, i + 500)
    const { error } = await supabase
      .from('mb_manufacturers')
      .upsert(batch, { onConflict: 'abbreviation' })
    if (error) console.error(`Batch ${i} error:`, error.message)
    else console.log(`  Inserted rows ${i}–${i + batch.length}`)
  }
}

async function importInterchangeability() {
  console.log('Importing interchangeability formulary...')
  const rows = readCSV('interchangeability.csv')
  const cleaned = rows.map((r: any) => ({
    din: String(r.din).padStart(8, '0'),
    drug_name: r.drug_name || null,
    strength: r.strength || null,
    dosage_form: r.dosage_form || null,
    product_name: r.product_name || null,
    manufacturer_code: r.manufacturer_code || null,
    price: r.price ? parseFloat(r.price) : null,
    interchangeable_group: r.interchangeable_group || null,
    formulary_status: 'interchangeable',
  }))
  for (let i = 0; i < cleaned.length; i += 500) {
    const batch = cleaned.slice(i, i + 500)
    const { error } = await supabase
      .from('mb_interchangeability')
      .upsert(batch, { onConflict: 'din' })
    if (error) console.error(`Batch ${i} error:`, error.message)
    else console.log(`  Inserted rows ${i}–${i + batch.length}`)
  }
}

async function importBenefits() {
  console.log('Importing benefits formulary...')
  const rows = readCSV('benefits_formulary.csv')
  const cleaned = rows
    .map((r: any) => ({
      product_name: r.product_name || null,
      details: r.details || null,
      formulary_status: 'general_benefit',
    }))
    .filter((r: any) => r.product_name)
  for (let i = 0; i < cleaned.length; i += 500) {
    const batch = cleaned.slice(i, i + 500)
    const { error } = await supabase
      .from('mb_benefits')
      .upsert(batch, { onConflict: 'product_name' })
    if (error) console.error(`Batch ${i} error:`, error.message)
    else console.log(`  Inserted rows ${i}–${i + batch.length}`)
  }
}

async function importEDS() {
  console.log('Importing EDS...')
  const rows = readCSV('eds.csv')
  const cleaned = rows.map((r: any) => ({
    din: String(r.din).padStart(8, '0'),
    therapeutic_category: r.therapeutic_category || null,
    brand_name: r.brand_name || null,
    generic_name: r.generic_name || null,
    strength: r.strength || null,
    dosage_form: r.dosage_form || null,
    eds_status: true,
  }))
  for (let i = 0; i < cleaned.length; i += 500) {
    const batch = cleaned.slice(i, i + 500)
    const { error } = await supabase
      .from('mb_eds')
      .upsert(batch, { onConflict: 'din' })
    if (error) console.error(`Batch ${i} error:`, error.message)
    else console.log(`  Inserted rows ${i}–${i + batch.length}`)
  }
}

async function importDPD() {
  console.log('Importing Health Canada DPD...')
  const rows = readCSV('dpd_drugs.csv')
  const cleaned = rows.map((r: any) => ({
    din: String(r.din).padStart(8, '0'),
    brand_name: r.brand_name || null,
    company_name: r.company_name || null,
    active_ingredients: r.active_ingredients || null,
    last_update: r.last_update || null,
  }))
  for (let i = 0; i < cleaned.length; i += 500) {
    const batch = cleaned.slice(i, i + 500)
    const { error } = await supabase
      .from('dpd_drugs')
      .upsert(batch, { onConflict: 'din' })
    if (error) console.error(`Batch ${i} error:`, error.message)
    else console.log(`  Inserted rows ${i}–${i + batch.length}`)
  }
}

async function main() {
  console.log('Starting import...\n')
  await importManufacturers()
  await importInterchangeability()
  await importBenefits()
  await importEDS()
  await importDPD()
  console.log('\nImport complete.')
}

main().catch(console.error)
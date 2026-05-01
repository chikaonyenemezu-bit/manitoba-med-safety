import { createClient } from '@supabase/supabase-js'

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await sb
    .from('mb_eds')
    .select('din, brand_name, therapeutic_category')
    .order('therapeutic_category')

  for (const row of data || []) {
    console.log(`${row.din}\t${row.therapeutic_category}\t${row.brand_name || 'NULL'}`)
  }
}

main()

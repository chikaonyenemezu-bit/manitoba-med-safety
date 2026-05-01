import { createClient } from '@supabase/supabase-js'

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await sb
    .from('mb_eds')
    .select('din, brand_name, generic_name, therapeutic_category')
    .not('brand_name', 'is', null)
    .limit(10)

  const { count } = await sb
    .from('mb_eds')
    .select('*', { count: 'exact', head: true })
    .not('brand_name', 'is', null)

  console.log('Rows with brand names:', count)
  console.log('Sample:', JSON.stringify(data, null, 2))
}

main()

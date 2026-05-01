import { createClient } from '@supabase/supabase-js'

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await sb
    .from('mb_eds')
    .select('din, therapeutic_category, brand_name')
    .limit(10)
    .order('din')

  console.log(JSON.stringify(data, null, 2))
}

main()

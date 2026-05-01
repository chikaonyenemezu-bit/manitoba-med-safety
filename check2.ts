import { createClient } from '@supabase/supabase-js'

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await sb
    .from('mb_benefits')
    .select('*')
    .ilike('product_name', '%metformin%')
    .limit(10)
  console.log(JSON.stringify(data, null, 2))
}

main()

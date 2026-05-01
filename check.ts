import { createClient } from '@supabase/supabase-js'

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data, count } = await sb
    .from('mb_benefits')
    .select('*', { count: 'exact' })
    .limit(5)
  console.log('Count:', count)
  console.log('Sample:', JSON.stringify(data, null, 2))
}

main()

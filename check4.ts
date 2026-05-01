import { createClient } from '@supabase/supabase-js'

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await sb
    .from('mb_eds')
    .select('therapeutic_category')
    .order('therapeutic_category')

  const counts: Record<string, number> = {}
  for (const row of data || []) {
    const cat = row.therapeutic_category || 'NULL'
    counts[cat] = (counts[cat] || 0) + 1
  }

  for (const [cat, count] of Object.entries(counts).sort()) {
    console.log(`${count}\t${cat}`)
  }
}

main()

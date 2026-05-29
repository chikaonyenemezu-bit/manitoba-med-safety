// app/api/ping/route.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  await supabase.from('mb_benefits').select('id').limit(1)
  return Response.json({ status: 'ok' })
}
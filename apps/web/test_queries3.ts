import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://xfuodetotbpmiqzlcmbx.supabase.co"
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmdW9kZXRvdGJwbWlxemxjbWJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njk5MDkxNywiZXhwIjoyMDkyNTY2OTE3fQ.lsSU5uaiDk46ukRpsZamgKGfzKisTCr_kxVKxo0W32g"

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function test() {
  console.log("Testing Zones query with Service Role...")
  const { data: zones, error: zErr } = await supabase
    .from('zones')
    .select('*')
  if (zErr) console.error("Zones Error:", zErr)
  else console.log(`Zones Success: ${zones.length} zones found`)

  console.log("\nTesting Seats query with Service Role...")
  const { data: seats, error: sErr } = await supabase
    .from('seats')
    .select('*')
  if (sErr) console.error("Seats Error:", sErr)
  else console.log(`Seats Success: ${seats.length} seats found`)
}

test()

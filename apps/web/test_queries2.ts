import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://xfuodetotbpmiqzlcmbx.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmdW9kZXRvdGJwbWlxemxjbWJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5OTA5MTcsImV4cCI6MjA5MjU2NjkxN30.BNLzfXaIJqCvjojAyDlbSnuU8sl9JP4EnboavOTOgDw"

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  console.log("Testing Zones query...")
  const { data: zones, error: zErr } = await supabase
    .from('zones')
    .select(`
      id,
      name,
      type,
      color,
      "gridBlockSize",
      "canvasWidth",
      "canvasHeight",
      seats(count)
    `)
  if (zErr) console.error("Zones Error:", zErr)
  else console.log(`Zones Success: ${zones.length} zones found`)

  console.log("\nTesting Seats query...")
  const { data: seats, error: sErr } = await supabase
    .from('seats')
    .select('*')
    .order('seatNumber')
  if (sErr) console.error("Seats Error:", sErr)
  else console.log(`Seats Success: ${seats.length} seats found`)

  console.log("\nTesting Reservations query...")
  const { data: res, error: rErr } = await supabase
    .from('reservations')
    .select('*')
    .in('status', ['ACTIVE', 'UPCOMING'])
  if (rErr) console.error("Reservations Error:", rErr)
  else console.log(`Reservations Success: ${res.length} reservations found`)
}

test()

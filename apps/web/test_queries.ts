import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const envPath = path.resolve(__dirname, '../../.env')
const envData = fs.readFileSync(envPath, 'utf8')
let supabaseUrl = ''
let supabaseAnonKey = ''

envData.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim().replace(/^['"]|['"]$/g, '')
  }
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    supabaseAnonKey = line.split('=')[1].trim().replace(/^['"]|['"]$/g, '')
  }
})

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing env vars in .env")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  console.log("Testing Zones query...")
  const { data: zones, error: zErr } = await supabase
    .from('zones')
    .select('*, seats(count)')
  if (zErr) console.error("Zones Error:", zErr.message)
  else console.log(`Zones Success: ${zones.length} zones found`)

  console.log("\nTesting Seats query...")
  const { data: seats, error: sErr } = await supabase
    .from('seats')
    .select('*')
    .order('seatNumber')
  if (sErr) console.error("Seats Error:", sErr.message)
  else console.log(`Seats Success: ${seats.length} seats found`)

  console.log("\nTesting Reservations query...")
  const { data: res, error: rErr } = await supabase
    .from('reservations')
    .select('*')
    .in('status', ['ACTIVE', 'UPCOMING'])
  if (rErr) console.error("Reservations Error:", rErr.message)
  else console.log(`Reservations Success: ${res.length} reservations found`)
}

test()

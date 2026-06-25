import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://xfuodetotbpmiqzlcmbx.supabase.co"
const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmdW9kZXRvdGJwbWlxemxjbWJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njk5MDkxNywiZXhwIjoyMDkyNTY2OTE3fQ.lsSU5uaiDk46ukRpsZamgKGfzKisTCr_kxVKxo0W32g"

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function testJoin() {
  const { data, error } = await supabase
    .from('reservations')
    .select('*, users(full_name, email, matric_number), seats(seatNumber, zoneId, zones(name))')
    .limit(1)
  
  if (error) {
    console.error(error)
    return
  }
  console.log(JSON.stringify(data, null, 2))
}

testJoin()

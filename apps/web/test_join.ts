import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = "https://xfuodetotbpmiqzlcmbx.supabase.co"
const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmdW9kZXRvdGJwbWlxemxjbWJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njk5MDkxNywiZXhwIjoyMDkyNTY2OTE3fQ.lsSU5uaiDk46ukRpsZamgKGfzKisTCr_kxVKxo0W32g"

async function testJoin() {
  const query = `select=*,users(full_name,email,matric_number),seats(seatNumber,zones(name,color))&limit=1`;
  const res = await fetch(`${supabaseUrl}/rest/v1/reservations?${query}`, {
    headers: {
      'apikey': supabaseServiceRoleKey,
      'Authorization': `Bearer ${supabaseServiceRoleKey}`
    }
  });
  
  if (!res.ok) {
    console.error(res.status, await res.text());
    return;
  }
  
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

testJoin().catch(console.error);

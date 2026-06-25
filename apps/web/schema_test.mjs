const supabaseUrl = "https://xfuodetotbpmiqzlcmbx.supabase.co"
const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmdW9kZXRvdGJwbWlxemxjbWJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njk5MDkxNywiZXhwIjoyMDkyNTY2OTE3fQ.lsSU5uaiDk46ukRpsZamgKGfzKisTCr_kxVKxo0W32g"

async function getSchema() {
  const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseServiceRoleKey}`)
  const json = await res.json()
  console.log(JSON.stringify(json.definitions?.users?.properties || json.components?.schemas?.users?.properties || json, null, 2))
}

getSchema().catch(console.error)

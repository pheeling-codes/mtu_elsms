const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Fixing Supabase permissions...");
  
  // Grant usage on public schema
  await prisma.$executeRawUnsafe(`GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;`);
  
  // Grant privileges on all existing tables
  await prisma.$executeRawUnsafe(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;`);
  
  // Grant privileges on all existing sequences
  await prisma.$executeRawUnsafe(`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;`);
  
  // Alter default privileges for future tables
  await prisma.$executeRawUnsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;`);
  await prisma.$executeRawUnsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;`);
  
  console.log("Permissions successfully fixed!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrateDatabase() {
  try {
    console.log('Starting database migration...');
    
    // Add fullName column if it doesn't exist
    const { error: fullNameError } = await supabase.rpc('add_full_name_column');
    if (fullNameError && !fullNameError.message.includes('already exists')) {
      console.error('Error adding fullName column:', fullNameError);
    }
    
    // Add email column if it doesn't exist  
    const { error: emailError } = await supabase.rpc('add_email_column');
    if (emailError && !emailError.message.includes('already exists')) {
      console.error('Error adding email column:', emailError);
    }
    
    // Create indexes
    await supabase.rpc('create_email_index');
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateDatabase();

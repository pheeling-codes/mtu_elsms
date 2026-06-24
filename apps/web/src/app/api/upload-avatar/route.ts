import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Ensure env vars exist
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase env vars in upload-avatar route. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.')
}

// Service role client (server-side only) - bypasses RLS
const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: { 
      autoRefreshToken: false, 
      persistSession: false 
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string

    if (!file || !userId) {
      return NextResponse.json(
        { error: 'Missing file or userId' }, 
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large (max 5MB)' }, 
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files allowed' }, 
        { status: 400 }
      )
    }

    // Upload using service role (bypasses RLS)
    const filePath = `avatars/${userId}/${Date.now()}.png`
    const { data, error } = await supabaseAdmin.storage
      .from('profiles')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      })

    if (error) {
      console.error('Storage upload error:', error)
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('profiles')
      .getPublicUrl(filePath)

    return NextResponse.json({ 
      success: true, 
      path: filePath,
      url: publicUrl 
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' }, 
      { status: 500 }
    )
  }
}

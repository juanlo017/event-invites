import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const db = supabaseAdmin()

  const { data, error } = await db
    .from('invitations')
    .select('*')
    .eq('token', token)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 })
  }

  const expired = new Date(data.expires_at) < new Date()
  return NextResponse.json({ ...data, expired })
}

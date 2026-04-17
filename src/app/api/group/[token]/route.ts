import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const db = supabaseAdmin()

  const { data: group, error } = await db
    .from('group_invitations')
    .select('*, group_registrations(id)')
    .eq('token', token)
    .single()

  if (error || !group) {
    return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 })
  }

  const count = (group.group_registrations as { id: string }[]).length
  const expired = new Date(group.expires_at) < new Date()
  const full = count >= group.capacity

  return NextResponse.json({ ...group, count, expired, full })
}

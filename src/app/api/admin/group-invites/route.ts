import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

function checkAuth(req: NextRequest) {
  return req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('group_invitations')
    .select('*, group_registrations(*)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { label, capacity } = await req.json()
  if (!label?.trim()) return NextResponse.json({ error: 'Label requerido' }, { status: 400 })

  const expiresAt = process.env.NEXT_PUBLIC_EVENT_EXPIRES
    ? new Date(`${process.env.NEXT_PUBLIC_EVENT_EXPIRES}T23:59:59Z`).toISOString()
    : new Date('2026-04-24T23:59:59Z').toISOString()

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('group_invitations')
    .insert({ token: uuidv4(), label: label.trim(), capacity: capacity ?? 50, expires_at: expiresAt })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const db = supabaseAdmin()
  const { error } = await db.from('group_invitations').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

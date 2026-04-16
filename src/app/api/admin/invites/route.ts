import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

function checkAuth(req: NextRequest) {
  const auth = req.headers.get('x-admin-password')
  return auth === process.env.ADMIN_PASSWORD
}

// GET /api/admin/invites — list all invitations
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('invitations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/admin/invites — generate invitations from a list of labels
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const { labels }: { labels: string[] } = body

  if (!Array.isArray(labels) || labels.length === 0) {
    return NextResponse.json({ error: 'Se requiere un listado de invitados' }, { status: 400 })
  }

  const expiresAt = process.env.NEXT_PUBLIC_EVENT_EXPIRES
    ? new Date(`${process.env.NEXT_PUBLIC_EVENT_EXPIRES}T23:59:59Z`).toISOString()
    : new Date('2026-04-24T23:59:59Z').toISOString()

  const rows = labels
    .map((l) => l.trim())
    .filter(Boolean)
    .map((label) => ({
      token: uuidv4(),
      label,
      expires_at: expiresAt,
    }))

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('invitations')
    .insert(rows)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// DELETE /api/admin/invites — delete a single invitation by id
export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const db = supabaseAdmin()
  const { error } = await db.from('invitations').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

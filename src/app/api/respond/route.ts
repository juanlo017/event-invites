import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { token, confirmado, asistente_principal_nombre, acompanante_nombre } = body

  if (typeof token !== 'string' || token.trim() === '') {
    return NextResponse.json({ error: 'Token requerido' }, { status: 400 })
  }

  const db = supabaseAdmin()

  // Fetch invitation
  const { data: invite, error: fetchError } = await db
    .from('invitations')
    .select('*')
    .eq('token', token)
    .single()

  if (fetchError || !invite) {
    return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 })
  }

  // Check expiry
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'La invitación ha expirado' }, { status: 410 })
  }

  // Validate
  if (typeof confirmado !== 'boolean') {
    return NextResponse.json({ error: 'Respuesta requerida' }, { status: 400 })
  }

  if (confirmado && (!asistente_principal_nombre || asistente_principal_nombre.trim() === '')) {
    return NextResponse.json({ error: 'El nombre del asistente principal es obligatorio' }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {
    confirmado,
    responded_at: new Date().toISOString(),
    asistente_principal_nombre: confirmado ? asistente_principal_nombre.trim() : null,
    acompanante_nombre: confirmado && acompanante_nombre?.trim() ? acompanante_nombre.trim() : null,
  }

  const { error: updateError } = await db
    .from('invitations')
    .update(updateData)
    .eq('token', token)

  if (updateError) {
    return NextResponse.json({ error: 'Error al guardar la respuesta' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendConfirmationEmail } from '@/lib/email'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const { nombre, acompanante_nombre, email } = await req.json()

  if (!nombre?.trim()) {
    return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
  }
  if (!email?.trim()) {
    return NextResponse.json({ error: 'El correo electrónico es obligatorio' }, { status: 400 })
  }

  const db = supabaseAdmin()

  const { data: group, error: fetchError } = await db
    .from('group_invitations')
    .select('*, group_registrations(id)')
    .eq('token', token)
    .single()

  if (fetchError || !group) {
    return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 })
  }

  if (new Date(group.expires_at) < new Date()) {
    return NextResponse.json({ error: 'La invitación ha expirado' }, { status: 410 })
  }

  const count = (group.group_registrations as { id: string }[]).length
  if (count >= group.capacity) {
    return NextResponse.json({ error: 'El aforo está completo' }, { status: 409 })
  }

  // Prevent duplicate registration by email within the same group
  const { data: existing } = await db
    .from('group_registrations')
    .select('id')
    .eq('group_id', group.id)
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Ya existe un registro con este correo electrónico.' }, { status: 409 })
  }

  const { error: insertError } = await db.from('group_registrations').insert({
    group_id: group.id,
    nombre: nombre.trim(),
    acompanante_nombre: acompanante_nombre?.trim() || null,
    email: email.trim().toLowerCase(),
  })

  if (insertError) {
    return NextResponse.json({ error: 'Error al registrar la asistencia' }, { status: 500 })
  }

  try {
    await sendConfirmationEmail({
      to: email.trim().toLowerCase(),
      principal: nombre.trim(),
      acompanante: acompanante_nombre?.trim() || null,
      token,
    })
  } catch (err) {
    console.error('Email send failed:', err)
  }

  return NextResponse.json({ success: true })
}

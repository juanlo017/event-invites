import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function checkAuth(req: NextRequest) {
  return req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD
}

function esc(value: string | null | undefined) {
  return `"${(value ?? '').replace(/"/g, '""')}"`
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('group_invitations')
    .select('label, group_registrations(nombre, acompanante_nombre, email, registered_at)')
    .order('label', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const now = new Date()
  const extractedAt = now.toLocaleDateString('es-ES', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const lines: string[] = [
    `"Datos extraídos: ${extractedAt}"`,
    '',
    '"Grupo","Asistente principal","Acompañante","Email"',
  ]

  for (const group of data ?? []) {
    const regs = (group.group_registrations ?? []) as {
      nombre: string
      acompanante_nombre: string | null
      email: string | null
      registered_at: string
    }[]

    const sorted = [...regs].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

    for (const r of sorted) {
      lines.push(`${esc(group.label)},${esc(r.nombre)},${esc(r.acompanante_nombre)},${esc(r.email)}`)
    }
  }

  const csv = '\uFEFF' + lines.join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="asistentes_grupales.csv"',
    },
  })
}

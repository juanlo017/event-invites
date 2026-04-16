import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function checkAuth(req: NextRequest) {
  const auth = req.headers.get('x-admin-password')
  return auth === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('invitations')
    .select('asistente_principal_nombre, acompanante_nombre')
    .eq('confirmado', true)
    .order('asistente_principal_nombre')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const header = 'Asistente principal,Acompañante\n'
  const rows = (data ?? [])
    .map((r) => {
      const principal = `"${(r.asistente_principal_nombre ?? '').replace(/"/g, '""')}"`
      const companion = `"${(r.acompanante_nombre ?? '').replace(/"/g, '""')}"`
      return `${principal},${companion}`
    })
    .join('\n')

  const csv = header + rows

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="asistentes.csv"',
    },
  })
}

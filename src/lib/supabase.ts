import { createClient } from '@supabase/supabase-js'

export type Invitation = {
  id: string
  token: string
  label: string | null
  confirmado: boolean | null
  asistente_principal_nombre: string | null
  acompanante_nombre: string | null
  created_at: string
  responded_at: string | null
  expires_at: string
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Public client (browser-safe, uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client (server-only, uses service role key)
export function supabaseAdmin() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })
}

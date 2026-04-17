'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'

type GroupData = {
  id: string
  token: string
  label: string
  capacity: number
  expires_at: string
  count: number
  expired: boolean
  full: boolean
}

const AGENDA = [
  { time: '10:30 – 11:00', title: 'Recepción y Bienvenida' },
  { time: '11:00', title: 'Apertura Institucional' },
  { time: '13:30', title: 'Clausura y Foto Familiar' },
  { time: '14:00', title: 'Cóctel' },
]

export default function GroupPage() {
  const { token } = useParams<{ token: string }>()

  const [group, setGroup] = useState<GroupData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [nombre, setNombre] = useState('')
  const [acompanante, setAcompanante] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/group/${token}`)
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); return }
        setGroup(await res.json())
      })
      .finally(() => setLoading(false))
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!nombre.trim()) { setError('El nombre es obligatorio.'); return }
    if (!email.trim()) { setError('El correo electrónico es obligatorio.'); return }

    setSubmitting(true)
    const res = await fetch(`/api/group/${token}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, acompanante_nombre: acompanante, email }),
    })
    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) { setError(data.error ?? 'Error al registrar'); return }
    setSubmitted(true)
  }

  const eventName     = process.env.NEXT_PUBLIC_EVENT_NAME     ?? 'Evento'
  const eventDate     = process.env.NEXT_PUBLIC_EVENT_DATE     ?? ''
  const eventTime     = process.env.NEXT_PUBLIC_EVENT_TIME     ?? ''
  const eventLocation = process.env.NEXT_PUBLIC_EVENT_LOCATION ?? ''
  const eventType     = process.env.NEXT_PUBLIC_EVENT_TYPE     ?? ''
  const eventExpires  = process.env.NEXT_PUBLIC_EVENT_EXPIRES  ?? '24/04/2026'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="text-stone-400 text-lg">Cargando…</p>
      </div>
    )
  }
  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-semibold text-stone-700">Invitación no encontrada</h1>
          <p className="text-stone-400">Este enlace no es válido o ha sido eliminado.</p>
        </div>
      </div>
    )
  }
  if (group?.expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-semibold text-stone-700">Invitación expirada</h1>
          <p className="text-stone-400">El plazo de confirmación ha finalizado.</p>
        </div>
      </div>
    )
  }
  if (group?.full) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-semibold text-stone-700">Aforo completo</h1>
          <p className="text-stone-400">Se ha alcanzado el número máximo de asistentes.</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-stone-100 pb-16">
      {/* Confirmed banner */}
      {submitted && (
        <div className="bg-emerald-600 text-white px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white text-emerald-600 text-xs font-bold shrink-0">✓</span>
          Asistencia registrada — recibirás un correo de confirmación
        </div>
      )}

      {/* Hero */}
      <div className="bg-stone-900 text-white">
        <div className="max-w-2xl mx-auto px-6 pt-10 pb-12 text-center space-y-5">
          <div className="flex justify-center">
            <div className="bg-white rounded-2xl px-6 py-4 shadow-lg inline-block">
              <Image src="/BULNESGROUP.jpeg" alt="Bulnes Eurogroup" width={220} height={80}
                className="object-contain h-14 w-auto" priority />
            </div>
          </div>
          <div className="space-y-1.5">
            {eventType && <p className="text-stone-400 text-xs uppercase tracking-[0.2em] font-medium">{eventType}</p>}
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{eventName}</h1>
          </div>
          {group?.label && (
            <p className="text-stone-300 text-sm">
              Invitación para <span className="font-semibold text-white">{group.label}</span>
            </p>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-4 space-y-4">

        {/* Date / Time / Location strip */}
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-stone-100 sm:divide-y-0 sm:divide-x sm:flex">
          {eventDate     && <InfoCell label="Fecha"   value={eventDate} />}
          {eventTime     && <InfoCell label="Horario" value={eventTime} />}
          {eventLocation && <InfoCell label="Lugar"   value={eventLocation} />}
        </div>

        {/* Description */}
        <Section>
          <SectionTitle>Información general</SectionTitle>
          <p className="text-stone-600 text-sm leading-relaxed">
            70 Aniversario de Bulnes Eurogroup, un hito con el que conmemoramos siete décadas de
            trayectoria, crecimiento y compromiso compartido.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge icon="🕐">5 horas</Badge>
            <Badge icon="👤">En persona</Badge>
            <Badge icon="🅿️">Aparcamiento de pago</Badge>
            <Badge icon="🎟️">Gratis</Badge>
          </div>
          <div className="mt-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <span className="text-amber-500 text-lg mt-0.5">👔</span>
            <div>
              <p className="text-xs text-amber-600 uppercase tracking-wide font-medium">Código de vestimenta</p>
              <p className="text-stone-700 font-semibold text-sm mt-0.5">Media etiqueta</p>
            </div>
          </div>
          <div className="mt-3 flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
            <span className="text-rose-400 text-lg mt-0.5">📅</span>
            <div>
              <p className="text-xs text-rose-500 uppercase tracking-wide font-medium">Fecha límite confirmación</p>
              <p className="text-stone-700 font-semibold text-sm mt-0.5">{eventExpires}</p>
            </div>
          </div>
        </Section>

        {/* Agenda */}
        <Section>
          <SectionTitle>Agenda</SectionTitle>
          <ol className="space-y-0">
            {AGENDA.map((item, i) => (
              <li key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-stone-700 mt-1.5 shrink-0" />
                  {i < AGENDA.length - 1 && <div className="w-px flex-1 bg-stone-200 my-1" />}
                </div>
                <div className="pb-5">
                  <p className="text-xs text-stone-400 font-mono">{item.time}</p>
                  <p className="text-stone-700 font-medium text-sm">{item.title}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        {/* Capacity indicator */}
        {group && (
          <div className="bg-white rounded-2xl shadow-sm px-6 py-4 flex items-center justify-between">
            <span className="text-sm text-stone-500">Plazas disponibles (sin contar acompañantes)</span>
            <span className="text-sm font-semibold text-stone-800">
              {group.capacity - group.count} / {group.capacity}
            </span>
          </div>
        )}

        {/* Registration form */}
        <Section>
          <SectionTitle>Registro de asistencia</SectionTitle>
          {submitted ? (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 text-base font-bold">✓</span>
                <h3 className="text-lg font-semibold text-stone-700">¡Registro completado!</h3>
              </div>
              <p className="text-stone-500 text-sm text-center">
                Tu asistencia ha quedado registrada. Recibirás un correo de confirmación en <span className="font-medium text-stone-700">{email}</span>.
              </p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-start gap-3">
                <span className="text-emerald-500 text-lg mt-0.5">✅</span>
                <div>
                  <p className="text-emerald-700 font-medium text-sm">Asistencia registrada</p>
                  <p className="text-emerald-600 text-xs mt-0.5">No es necesario hacer nada más.</p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">
                  Tu nombre <span className="text-rose-500">*</span>
                </label>
                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre completo"
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 text-stone-800 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">
                  Correo electrónico <span className="text-rose-500">*</span>
                  <span className="text-stone-400 text-xs font-normal ml-1">(recibirás la confirmación aquí)</span>
                </label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 text-stone-800 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-600 mb-1">
                  Acompañante <span className="text-stone-400 text-xs font-normal">(opcional, máx. 1)</span>
                </label>
                <input type="text" value={acompanante} onChange={(e) => setAcompanante(e.target.value)}
                  placeholder="Nombre del acompañante"
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 text-stone-800 text-sm" />
                <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                  <span>⚠️</span> Una vez confirmado no podrás modificar el nombre del acompañante.
                </p>
              </div>
              {error && <p className="text-rose-500 text-sm">{error}</p>}
              <button type="submit" disabled={submitting}
                className="w-full py-3 bg-stone-800 hover:bg-stone-700 disabled:opacity-60 text-white font-medium rounded-xl transition-colors text-sm">
                {submitting ? 'Registrando…' : 'Confirmar asistencia'}
              </button>
            </form>
          )}
        </Section>

      </div>
    </main>
  )
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 px-5 py-4 text-center">
      <p className="text-xs text-stone-400 uppercase tracking-wide">{label}</p>
      <p className="text-stone-800 font-medium text-sm mt-0.5">{value}</p>
    </div>
  )
}
function Section({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl shadow-sm px-6 py-6">{children}</div>
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs uppercase tracking-widest text-stone-400 font-semibold mb-4">{children}</h2>
}
function Badge({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-stone-100 text-stone-600 text-xs font-medium px-3 py-1.5 rounded-full">
      <span>{icon}</span>{children}
    </span>
  )
}

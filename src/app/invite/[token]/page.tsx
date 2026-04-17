'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import type { Invitation } from '@/lib/supabase'

type InviteData = Invitation & { expired: boolean }

const AGENDA = [
  { time: '10:30 – 11:00', title: 'Recepción y Bienvenida' },
  { time: '11:00', title: 'Apertura Institucional' },
  { time: '13:30', title: 'Clausura y Foto Familiar' },
  { time: '14:00', title: 'Cóctel' },
]

const MAPS_EMBED =
  'https://maps.google.com/maps?q=Espacio+Exploraterra+Nao+Victoria+Sevilla+Paseo+Alcalde+Marques+del+Contadero&output=embed&hl=es&z=17'

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()

  const [invite, setInvite] = useState<InviteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [confirmado, setConfirmado] = useState<boolean | null>(null)
  const [principal, setPrincipal] = useState('')
  const [acompanante, setAcompanante] = useState('')
  const [email, setEmail] = useState('')
  const [privacidad, setPrivacidad] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/invite/${token}`)
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); return }
        const data = await res.json()
        setInvite(data)
        if (data.confirmado !== null) setSubmitted(true)
      })
      .finally(() => setLoading(false))
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (confirmado === null) { setError('Por favor, elige si asistirás o no.'); return }
    if (confirmado && !principal.trim()) { setError('El nombre del asistente principal es obligatorio.'); return }
    if (confirmado && !email.trim()) { setError('El correo electrónico es obligatorio para recibir la confirmación.'); return }
    if (confirmado && !privacidad) { setError('Debes aceptar la política de privacidad para continuar.'); return }

    setSubmitting(true)
    const res = await fetch('/api/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, confirmado, asistente_principal_nombre: principal, acompanante_nombre: acompanante, email }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) { setError(data.error ?? 'Error al enviar'); return }
    setSubmitted(true)
    setInvite((prev) => prev ? { ...prev, confirmado, asistente_principal_nombre: principal, acompanante_nombre: acompanante } : prev)
  }

  const eventName = process.env.NEXT_PUBLIC_EVENT_NAME ?? 'Evento'
  const eventDate = process.env.NEXT_PUBLIC_EVENT_DATE ?? ''
  const eventTime = process.env.NEXT_PUBLIC_EVENT_TIME ?? ''
  const eventLocation = process.env.NEXT_PUBLIC_EVENT_LOCATION ?? ''
  const eventType = process.env.NEXT_PUBLIC_EVENT_TYPE ?? ''
  const eventExpires = process.env.NEXT_PUBLIC_EVENT_EXPIRES ?? '24/04/2026'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="text-stone-400 text-lg">Cargando invitación…</p>
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
  if (invite?.expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-semibold text-stone-700">Invitación expirada</h1>
          <p className="text-stone-400">El plazo de confirmación ha finalizado.</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-stone-100 pb-16">
      {/* Confirmed banner */}
      {submitted && (invite?.confirmado ?? confirmado) && (
        <div className="bg-emerald-600 text-white px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white text-emerald-600 text-xs font-bold shrink-0">✓</span>
          Asistencia registrada — tu respuesta ha quedado guardada
        </div>
      )}

      {/* Hero */}
      <div className="bg-stone-900 text-white">
        <div className="max-w-2xl mx-auto px-6 pt-10 pb-12 text-center space-y-5">
          <div className="flex justify-center">
            <div className="bg-white rounded-2xl px-6 py-4 shadow-lg inline-block">
              <Image
                src="/BULNESGROUP.jpeg"
                alt="Bulnes Eurogroup"
                width={220}
                height={80}
                className="object-contain h-14 w-auto"
                priority
              />
            </div>
          </div>
          <div className="space-y-1.5">
            {eventType && (
              <p className="text-stone-400 text-xs uppercase tracking-[0.2em] font-medium">{eventType}</p>
            )}
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{eventName}</h1>
          </div>
          {invite?.label && (
            <p className="text-stone-300 text-sm">
              Invitación personal para{' '}
              <span className="font-semibold text-white">{invite.label}</span>
            </p>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-4 space-y-4">

        {/* Date / Time / Location strip */}
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-stone-100 sm:divide-y-0 sm:divide-x sm:flex">
          <InfoCell label="Fecha" value={eventDate} />
          <InfoCell label="Horario" value={eventTime} />
          <InfoCell label="Lugar" value={eventLocation} />
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
                {/* Timeline */}
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

        {/* Location + Map */}
        <Section>
          <SectionTitle>Ubicación</SectionTitle>
          <div className="space-y-1 mb-4">
            <p className="text-stone-800 font-semibold text-sm">Espacio Exploraterra · Centro Nao Victoria</p>
            <p className="text-stone-500 text-sm">Paseo Alcalde Marqués del Contadero, s/n</p>
            <p className="text-stone-500 text-sm">Edificio 1 · 41001 Sevilla</p>
          </div>
          {/* Google Maps embed */}
          <div className="rounded-xl overflow-hidden border border-stone-200 h-56">
            <iframe
              src={MAPS_EMBED}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicación del evento"
            />
          </div>
          <a
            href="https://maps.google.com/?q=Espacio+Exploraterra+Nao+Victoria+Sevilla"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 transition-colors"
          >
            <span>↗</span> Abrir en Google Maps
          </a>

          {/* Parking */}
          <div className="mt-4 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 space-y-1">
            <p className="text-xs text-stone-400 uppercase tracking-wide font-medium">🅿️ Parking más cercano</p>
            <p className="text-stone-700 text-sm font-medium">Parking Paseo de Colón</p>
            <p className="text-stone-500 text-xs">Paseo de Cristóbal Colón, 41001 Sevilla</p>
            <a
              href="https://maps.google.com/?q=Parking+Paseo+de+Colon+Sevilla"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 transition-colors mt-0.5"
            >
              <span>↗</span> Cómo llegar
            </a>
          </div>
        </Section>

        {/* Confirmation form */}
        <div ref={formRef}>
          <Section>
            <SectionTitle>Confirmación de asistencia</SectionTitle>
            {submitted ? (
              <ConfirmationMessage
                confirmado={invite?.confirmado ?? confirmado}
                principal={invite?.asistente_principal_nombre ?? principal}
                acompanante={invite?.acompanante_nombre ?? acompanante}
              />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmado(true)}
                    className={`py-3 rounded-xl font-medium border-2 text-sm transition-colors ${
                      confirmado === true
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-stone-200 text-stone-600 hover:border-emerald-400'
                    }`}
                  >
                    ✓ Asistiré
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmado(false)}
                    className={`py-3 rounded-xl font-medium border-2 text-sm transition-colors ${
                      confirmado === false
                        ? 'bg-rose-600 border-rose-600 text-white'
                        : 'border-stone-200 text-stone-600 hover:border-rose-400'
                    }`}
                  >
                    ✕ No podré ir
                  </button>
                </div>

                {confirmado === true && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-stone-600 mb-1">
                        Tu nombre <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={principal}
                        onChange={(e) => setPrincipal(e.target.value)}
                        placeholder="Nombre completo"
                        className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 text-stone-800 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-600 mb-1">
                        Correo electrónico <span className="text-rose-500">*</span>
                        <span className="text-stone-400 text-xs font-normal ml-1">(recibirás la confirmación aquí)</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 text-stone-800 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-600 mb-1">
                        Acompañante{' '}
                        <span className="text-stone-400 text-xs font-normal">(opcional, máx. 1)</span>
                      </label>
                      <input
                        type="text"
                        value={acompanante}
                        onChange={(e) => setAcompanante(e.target.value)}
                        placeholder="Nombre del acompañante"
                        className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 text-stone-800 text-sm"
                      />
                      <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                        <span>⚠️</span> Una vez confirmado no podrás modificar el nombre del acompañante.
                      </p>
                    </div>
                  </div>
                )}

                {confirmado === true && (
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={privacidad}
                      onChange={(e) => setPrivacidad(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-stone-800 shrink-0"
                    />
                    <span className="text-xs text-stone-500 leading-relaxed">
                      He leído y acepto la{' '}
                      <a href="/privacidad" target="_blank"
                        className="underline text-stone-700 hover:text-stone-900">
                        política de privacidad
                      </a>
                      . Consiento el tratamiento de mis datos para la gestión de este evento.
                    </span>
                  </label>
                )}

                {error && <p className="text-rose-500 text-sm">{error}</p>}

                {confirmado !== null && (
                  <button
                    type="submit"
                    disabled={submitting || !privacidad}
                    className="w-full py-3 text-white font-medium rounded-xl transition-colors text-sm disabled:cursor-not-allowed bg-stone-800 hover:bg-stone-700 disabled:bg-stone-300 disabled:text-stone-400"
                  >
                    {submitting ? 'Enviando…' : 'Confirmar respuesta'}
                  </button>
                )}
              </form>
            )}
          </Section>
        </div>

      </div>
    </main>
  )
}

// ─── Small reusable components ──────────────────────────────────────────────

function InfoCell({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="flex-1 px-5 py-4 text-center">
      <p className="text-xs text-stone-400 uppercase tracking-wide">{label}</p>
      <p className="text-stone-800 font-medium text-sm mt-0.5">{value}</p>
    </div>
  )
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm px-6 py-6">
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs uppercase tracking-widest text-stone-400 font-semibold mb-4">{children}</h2>
  )
}

function Badge({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-stone-100 text-stone-600 text-xs font-medium px-3 py-1.5 rounded-full">
      <span>{icon}</span>
      {children}
    </span>
  )
}

function ConfirmationMessage({
  confirmado,
  principal,
  acompanante,
}: {
  confirmado: boolean | null
  principal: string | null
  acompanante: string | null
}) {
  if (!confirmado) {
    return (
      <div className="text-center space-y-2 py-4">
        <div className="text-4xl">😔</div>
        <h3 className="text-lg font-semibold text-stone-700">¡Lo sentimos!</h3>
        <p className="text-stone-500 text-sm">Has indicado que no podrás asistir. ¡Esperamos verte en otra ocasión!</p>
      </div>
    )
  }
  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-center gap-2">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 text-base font-bold">✓</span>
        <h3 className="text-lg font-semibold text-stone-700">¡Asistencia confirmada!</h3>
      </div>
      <p className="text-stone-500 text-sm text-center">
        Nos vemos allí, <span className="font-semibold text-stone-700">{principal}</span>
        {acompanante && (
          <> y <span className="font-semibold text-stone-700">{acompanante}</span></>
        )}.
      </p>
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-start gap-3">
        <span className="text-emerald-500 text-lg mt-0.5">✅</span>
        <div>
          <p className="text-emerald-700 font-medium text-sm">Asistencia registrada</p>
          <p className="text-emerald-600 text-xs mt-0.5">Tu respuesta ha quedado guardada. No es necesario hacer nada más.</p>
        </div>
      </div>
    </div>
  )
}

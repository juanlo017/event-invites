import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-semibold text-stone-700">
          {process.env.NEXT_PUBLIC_EVENT_NAME ?? 'Gestión de Invitaciones'}
        </h1>
        <p className="text-stone-400">Los invitados acceden mediante su enlace personal.</p>
        <Link
          href="/admin"
          className="inline-block mt-4 px-6 py-2.5 bg-stone-800 hover:bg-stone-700 text-white rounded-lg font-medium transition-colors text-sm"
        >
          Panel de administración →
        </Link>
      </div>
    </main>
  )
}

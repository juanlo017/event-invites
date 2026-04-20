'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Invitation, GroupInvitation, GroupRegistration } from '@/lib/supabase'

type Tab = 'individual' | 'group'

const ADMIN_PASSWORD_KEY = 'admin_pw'

function downloadCsv(url: string, filename: string, auth: string) {
  fetch(url, { headers: { 'x-admin-password': auth } })
    .then((r) => r.blob())
    .then((blob) => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      URL.revokeObjectURL(a.href)
    })
}

type Filter = 'all' | 'pending' | 'accepted' | 'rejected'
type SortCol = 'label' | 'confirmado' | 'asistente_principal_nombre' | 'acompanante_nombre' | 'responded_at'
type SortDir = 'asc' | 'desc'

function statusLabel(inv: Invitation) {
  if (inv.confirmado === null) return 'Pendiente'
  return inv.confirmado ? 'Aceptado' : 'Rechazado'
}

function statusBadge(inv: Invitation) {
  if (inv.confirmado === null)
    return 'bg-amber-100 text-amber-700'
  return inv.confirmado
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-rose-100 text-rose-700'
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [auth, setAuth] = useState('')
  const [authError, setAuthError] = useState('')

  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')

  // Generate panel state
  const [labelList, setLabelList] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [newInvites, setNewInvites] = useState<Invitation[]>([])

  const [copyId, setCopyId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [tab, setTab] = useState<Tab>('individual')
  const [groupInvites, setGroupInvites] = useState<(GroupInvitation & { group_registrations: GroupRegistration[] })[]>([])
  const [groupLabel, setGroupLabel] = useState('')
  const [groupCapacity, setGroupCapacity] = useState('50')
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [groupError, setGroupError] = useState('')
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
  const [groupCopyId, setGroupCopyId] = useState<string | null>(null)

  const [sortCol, setSortCol] = useState<SortCol>('responded_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [companionSearch, setCompanionSearch] = useState('')

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortCol(col); setSortDir('asc') }
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const fetchInvites = useCallback(async (pw: string) => {
    setLoading(true)
    const res = await fetch('/api/admin/invites', {
      headers: { 'x-admin-password': pw },
    })
    if (res.ok) {
      const data = await res.json()
      setInvitations(data)
    }
    setLoading(false)
  }, [])

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setAuthError('')
    // Validate against a real call
    fetch('/api/admin/invites', { headers: { 'x-admin-password': password } }).then((res) => {
      if (res.ok) {
        setAuth(password)
        sessionStorage.setItem(ADMIN_PASSWORD_KEY, password)
        fetchInvites(password)
        fetchGroupInvites(password)
      } else {
        setAuthError('Contraseña incorrecta')
      }
    })
  }

  const fetchGroupInvites = useCallback(async (pw: string) => {
    const res = await fetch('/api/admin/group-invites', { headers: { 'x-admin-password': pw } })
    if (res.ok) setGroupInvites(await res.json())
  }, [])

  // Restore session password
  useEffect(() => {
    const saved = sessionStorage.getItem(ADMIN_PASSWORD_KEY)
    if (saved) {
      setAuth(saved)
      fetchInvites(saved)
      fetchGroupInvites(saved)
    }
  }, [fetchInvites, fetchGroupInvites])

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault()
    setGroupError('')
    if (!groupLabel.trim()) { setGroupError('El nombre es obligatorio'); return }
    setCreatingGroup(true)
    const res = await fetch('/api/admin/group-invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': auth },
      body: JSON.stringify({ label: groupLabel, capacity: parseInt(groupCapacity) || 50 }),
    })
    const data = await res.json()
    setCreatingGroup(false)
    if (!res.ok) { setGroupError(data.error ?? 'Error'); return }
    setGroupLabel('')
    setGroupCapacity('50')
    fetchGroupInvites(auth)
  }

  async function handleDeleteGroup(id: string) {
    if (!confirm('¿Eliminar esta invitación grupal y todos sus registros?')) return
    await fetch('/api/admin/group-invites', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': auth },
      body: JSON.stringify({ id }),
    })
    fetchGroupInvites(auth)
  }

  function copyGroupLink(token: string, id: string) {
    navigator.clipboard.writeText(`${baseUrl}/group/${token}`)
    setGroupCopyId(id)
    setTimeout(() => setGroupCopyId(null), 1500)
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setGenerateError('')
    setNewInvites([])
    const labels = labelList.split('\n').map((l) => l.trim()).filter(Boolean)
    if (labels.length === 0) { setGenerateError('Escribe al menos un nombre'); return }

    setGenerating(true)
    const res = await fetch('/api/admin/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': auth },
      body: JSON.stringify({ labels }),
    })
    const data = await res.json()
    setGenerating(false)
    if (!res.ok) { setGenerateError(data.error ?? 'Error'); return }
    setNewInvites(data)
    setLabelList('')
    fetchInvites(auth)
  }

  async function handleDelete(id: string) {
    setDeleteId(id)
    await fetch('/api/admin/invites', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': auth },
      body: JSON.stringify({ id }),
    })
    setDeleteId(null)
    fetchInvites(auth)
  }

  function copyLink(token: string, id: string) {
    navigator.clipboard.writeText(`${baseUrl}/invite/${token}`)
    setCopyId(id)
    setTimeout(() => setCopyId(null), 1500)
  }

  function handleExport() {
    downloadCsv('/api/admin/export', 'asistentes.csv', auth)
  }

  function handleExportGroups() {
    downloadCsv('/api/admin/export-groups', 'asistentes_grupales.csv', auth)
  }

  const filtered = invitations
    .filter((inv) => {
      if (filter === 'pending') return inv.confirmado === null
      if (filter === 'accepted') return inv.confirmado === true
      if (filter === 'rejected') return inv.confirmado === false
      return true
    })
    .filter((inv) => {
      if (!companionSearch.trim()) return true
      const q = companionSearch.trim().toLowerCase()
      return (
        (inv.label ?? '').toLowerCase().includes(q) ||
        (inv.asistente_principal_nombre ?? '').toLowerCase().includes(q) ||
        (inv.acompanante_nombre ?? '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      let av: string | number | null = null
      let bv: string | number | null = null
      if (sortCol === 'confirmado') {
        av = a.confirmado === null ? -1 : a.confirmado ? 1 : 0
        bv = b.confirmado === null ? -1 : b.confirmado ? 1 : 0
      } else {
        av = (a[sortCol] as string | null) ?? ''
        bv = (b[sortCol] as string | null) ?? ''
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })

  const counts = {
    all: invitations.length,
    pending: invitations.filter((i) => i.confirmado === null).length,
    accepted: invitations.filter((i) => i.confirmado === true).length,
    rejected: invitations.filter((i) => i.confirmado === false).length,
  }

  // Login screen
  if (!auth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-lg w-80 space-y-4">
          <h1 className="text-xl font-semibold text-stone-700 text-center">Panel de administración</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 text-stone-800"
          />
          {authError && <p className="text-rose-500 text-sm text-center">{authError}</p>}
          <button
            type="submit"
            className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-white rounded-lg font-medium transition-colors"
          >
            Entrar
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-stone-800 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Panel de Invitaciones</h1>
        <button
          onClick={() => { setAuth(''); sessionStorage.removeItem(ADMIN_PASSWORD_KEY) }}
          className="px-4 py-1.5 bg-stone-600 hover:bg-stone-500 text-white text-sm rounded-lg transition-colors"
        >
          Salir
        </button>
      </header>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <div className="flex gap-1 bg-stone-200 rounded-xl p-1 w-fit">
          {(['individual', 'group'] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
              {t === 'individual' ? 'Invitaciones individuales' : 'Invitaciones grupales'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">

        {tab === 'group' ? (
          <GroupPanel
            auth={auth}
            baseUrl={baseUrl}
            groupInvites={groupInvites}
            groupLabel={groupLabel}
            setGroupLabel={setGroupLabel}
            groupCapacity={groupCapacity}
            setGroupCapacity={setGroupCapacity}
            creatingGroup={creatingGroup}
            groupError={groupError}
            expandedGroup={expandedGroup}
            setExpandedGroup={setExpandedGroup}
            groupCopyId={groupCopyId}
            onSubmit={handleCreateGroup}
            onDelete={handleDeleteGroup}
            onCopy={copyGroupLink}
            onRefresh={() => fetchGroupInvites(auth)}
            onExport={handleExportGroups}
          />
        ) : (<>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(['all', 'pending', 'accepted', 'rejected'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`bg-white rounded-xl shadow-sm p-4 text-center border-2 transition-colors ${filter === f ? 'border-stone-700' : 'border-transparent hover:border-stone-200'}`}
            >
              <p className="text-3xl font-bold text-stone-800">{counts[f]}</p>
              <p className="text-sm text-stone-500 mt-0.5 capitalize">
                {f === 'all' ? 'Total' : f === 'pending' ? 'Pendientes' : f === 'accepted' ? 'Aceptados' : 'Rechazados'}
              </p>
            </button>
          ))}
        </div>

        {/* Generate invitations */}
        <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-stone-700">Generar invitaciones</h2>
          <form onSubmit={handleGenerate} className="space-y-3">
            <textarea
              value={labelList}
              onChange={(e) => setLabelList(e.target.value)}
              rows={5}
              placeholder={"Juan García\nMaría López\nPedro Martínez"}
              className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 text-stone-800 text-sm font-mono"
            />
            <p className="text-xs text-stone-400">Un invitado por línea. Pega o escribe los nombres.</p>
            {generateError && <p className="text-rose-500 text-sm">{generateError}</p>}
            <button
              type="submit"
              disabled={generating}
              className="px-6 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {generating ? 'Generando…' : 'Generar enlaces'}
            </button>
          </form>

          {newInvites.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-stone-600">Enlaces generados:</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {newInvites.map((inv) => (
                  <div key={inv.id} className="flex items-center gap-2 text-sm bg-stone-50 rounded-lg px-3 py-2">
                    <span className="text-stone-600 w-32 truncate">{inv.label}</span>
                    <span className="text-stone-400 flex-1 truncate font-mono text-xs">{baseUrl}/invite/{inv.token}</span>
                    <button
                      onClick={() => copyLink(inv.token, inv.id)}
                      className="text-stone-500 hover:text-stone-800 text-xs px-2 py-0.5 rounded border border-stone-200 hover:border-stone-400 transition-colors shrink-0"
                    >
                      {copyId === inv.id ? '¡Copiado!' : 'Copiar'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Invitations table */}
        <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-stone-700">Listado de invitaciones</h2>
              <div className="flex items-center gap-3">
                {loading && <span className="text-xs text-stone-400">Actualizando…</span>}
                <button
                  onClick={handleExport}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg font-medium transition-colors"
                >
                  Exportar CSV
                </button>
                <button
                  onClick={() => fetchInvites(auth)}
                  title="Recargar"
                  className="text-stone-400 hover:text-stone-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                    <path d="M3 3v5h5"/>
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={companionSearch}
                onChange={(e) => setCompanionSearch(e.target.value)}
                placeholder="Buscar por invitado, asistente o acompañante…"
                className="w-64 px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 text-stone-700"
              />
              {companionSearch && (
                <button
                  onClick={() => setCompanionSearch('')}
                  className="text-xs text-stone-400 hover:text-stone-700 transition-colors"
                >
                  ✕ Limpiar
                </button>
              )}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="px-6 py-12 text-center text-stone-400">No hay invitaciones</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-sky-50 border-b border-sky-100">
                  <tr>
                    <SortTh col="label" current={sortCol} dir={sortDir} onSort={toggleSort}>Invitado</SortTh>
                    <SortTh col="confirmado" current={sortCol} dir={sortDir} onSort={toggleSort}>Estado</SortTh>
                    <SortTh col="asistente_principal_nombre" current={sortCol} dir={sortDir} onSort={toggleSort} className="min-w-[180px]">Asistente principal</SortTh>
                    <SortTh col="acompanante_nombre" current={sortCol} dir={sortDir} onSort={toggleSort} className="min-w-[180px]">Acompañante</SortTh>
                    <SortTh col="responded_at" current={sortCol} dir={sortDir} onSort={toggleSort}>Respondido</SortTh>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {filtered.map((inv) => (
                    <tr key={inv.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3 text-stone-700">{inv.label ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge(inv)}`}>
                          {statusLabel(inv)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-600">{inv.asistente_principal_nombre ?? '—'}</td>
                      <td className="px-4 py-3 text-stone-600">{inv.acompanante_nombre ?? '—'}</td>
                      <td className="px-4 py-3 text-stone-400 text-xs">
                        {inv.responded_at ? new Date(inv.responded_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => copyLink(inv.token, inv.id)}
                            className="text-xs text-stone-500 hover:text-stone-800 px-2 py-0.5 rounded border border-stone-200 hover:border-stone-400 transition-colors"
                          >
                            {copyId === inv.id ? '✓' : 'Enlace'}
                          </button>
                          <button
                            onClick={() => { if (confirm('¿Eliminar esta invitación?')) handleDelete(inv.id) }}
                            disabled={deleteId === inv.id}
                            className="text-xs text-rose-400 hover:text-rose-600 px-2 py-0.5 rounded border border-rose-100 hover:border-rose-300 transition-colors disabled:opacity-40"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        </>)}
      </div>
    </div>
  )
}

// ─── Group Panel ─────────────────────────────────────────────────────────────

function GroupPanel({
  auth, baseUrl, groupInvites, groupLabel, setGroupLabel, groupCapacity, setGroupCapacity,
  creatingGroup, groupError, expandedGroup, setExpandedGroup, groupCopyId,
  onSubmit, onDelete, onCopy, onRefresh, onExport,
}: {
  auth: string
  baseUrl: string
  groupInvites: (GroupInvitation & { group_registrations: GroupRegistration[] })[]
  groupLabel: string
  setGroupLabel: (v: string) => void
  groupCapacity: string
  setGroupCapacity: (v: string) => void
  creatingGroup: boolean
  groupError: string
  expandedGroup: string | null
  setExpandedGroup: (v: string | null) => void
  groupCopyId: string | null
  onSubmit: (e: React.FormEvent) => void
  onDelete: (id: string) => void
  onCopy: (token: string, id: string) => void
  onRefresh: () => void
  onExport: () => void
}) {
  return (
    <div className="space-y-6">
      {/* Create group invite */}
      <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-stone-700">Crear invitación grupal</h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="flex gap-3">
            <input type="text" value={groupLabel} onChange={(e) => setGroupLabel(e.target.value)}
              placeholder="Nombre del grupo (ej. Equipo Comercial)"
              className="flex-1 px-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 text-stone-800 text-sm" />
            <input type="number" value={groupCapacity} onChange={(e) => setGroupCapacity(e.target.value)}
              min={1} max={500}
              className="w-24 px-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 text-stone-800 text-sm text-center"
              title="Aforo máximo" />
          </div>
          <p className="text-xs text-stone-400">El número indica el aforo máximo de personas que pueden registrarse.</p>
          {groupError && <p className="text-rose-500 text-sm">{groupError}</p>}
          <button type="submit" disabled={creatingGroup}
            className="px-6 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors">
            {creatingGroup ? 'Creando…' : 'Crear enlace grupal'}
          </button>
        </form>
      </section>

      {/* Group invites list */}
      <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-semibold text-stone-700">Invitaciones grupales</h2>
          <div className="flex items-center gap-3">
          <button onClick={onExport}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg font-medium transition-colors">
            Exportar CSV
          </button>
          <button onClick={onRefresh} title="Recargar"
            className="text-stone-400 hover:text-stone-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
          </button>
          </div>
        </div>

        {groupInvites.length === 0 ? (
          <div className="px-6 py-12 text-center text-stone-400">No hay invitaciones grupales</div>
        ) : (
          <div className="divide-y divide-stone-100">
            {groupInvites.map((g) => {
              const count = g.group_registrations.length
              const pct = Math.round((count / g.capacity) * 100)
              const isOpen = expandedGroup === g.id
              return (
                <div key={g.id}>
                  <div className="px-6 py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-700 truncate">{g.label}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex-1 bg-stone-100 rounded-full h-1.5 max-w-32">
                          <div className="bg-stone-700 h-1.5 rounded-full transition-all"
                            style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span className="text-xs text-stone-500">{count} / {g.capacity}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => onCopy(g.token, g.id)}
                        className="text-xs text-stone-500 hover:text-stone-800 px-2 py-1 rounded border border-stone-200 hover:border-stone-400 transition-colors">
                        {groupCopyId === g.id ? '✓ Copiado' : 'Copiar enlace'}
                      </button>
                      <button onClick={() => setExpandedGroup(isOpen ? null : g.id)}
                        className="text-xs text-stone-500 hover:text-stone-800 px-2 py-1 rounded border border-stone-200 hover:border-stone-400 transition-colors">
                        {isOpen ? 'Ocultar' : `Ver registros (${count})`}
                      </button>
                      <button onClick={() => onDelete(g.id)}
                        className="text-xs text-rose-400 hover:text-rose-600 px-2 py-1 rounded border border-rose-100 hover:border-rose-300 transition-colors">
                        Eliminar
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-stone-100 bg-stone-50 px-6 py-4">
                      {g.group_registrations.length === 0 ? (
                        <p className="text-stone-400 text-sm">Sin registros aún.</p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs text-sky-600 uppercase tracking-wide bg-sky-50">
                              <th className="pb-2 font-medium">Nombre</th>
                              <th className="pb-2 font-medium">Acompañante</th>
                              <th className="pb-2 font-medium">Email</th>
                              <th className="pb-2 font-medium">Registrado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100">
                            {g.group_registrations.map((r) => (
                              <tr key={r.id}>
                                <td className="py-2 text-stone-700 font-medium">{r.nombre}</td>
                                <td className="py-2 text-stone-500">{r.acompanante_nombre ?? '—'}</td>
                                <td className="py-2 text-stone-500">{r.email ?? '—'}</td>
                                <td className="py-2 text-stone-400 text-xs">
                                  {new Date(r.registered_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function SortTh({
  col, current, dir, onSort, children, className,
}: {
  col: SortCol
  current: SortCol
  dir: SortDir
  onSort: (col: SortCol) => void
  children: React.ReactNode
  className?: string
}) {
  const active = col === current
  return (
    <th
      className={`text-left px-4 py-3 text-sky-700 font-medium cursor-pointer select-none hover:text-sky-900 whitespace-nowrap${className ? ` ${className}` : ''}`}
      onClick={() => onSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <span className={`text-xs transition-opacity ${active ? 'opacity-100' : 'opacity-20'}`}>
          {active && dir === 'asc' ? '↑' : '↓'}
        </span>
      </span>
    </th>
  )
}

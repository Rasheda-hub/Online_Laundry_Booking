import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { stats, approveProvider, rejectProvider, banUser, unbanUser, deleteUser } from '../../api/admin.js'
import { apiFetch } from '../../api/client.js'

export default function AdminPanel(){
  const { token } = useAuth()
  const [summary, setSummary] = useState({ total_users: 0, total_providers: 0, total_bookings: 0 })
  const [pending, setPending] = useState([])
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')

  async function refresh(){
    setError('')
    try {
      const [s, p, u] = await Promise.all([
        stats(token),
        apiFetch('/admin/providers/pending', { token }),
        apiFetch('/admin/users', { token }),
      ])
      setSummary(s)
      setPending(p)
      setUsers(u)
    } catch(e){ setError(e.message) }
  }

  useEffect(()=>{ refresh() }, [token])

  async function onApprove(id){ try { await approveProvider(token, id); refresh() } catch(e){ setError(e.message) } }
  async function onReject(id){ try { await rejectProvider(token, id); refresh() } catch(e){ setError(e.message) } }
  async function onBan(id){ try { await banUser(token, id); refresh() } catch(e){ setError(e.message) } }
  async function onUnban(id){ try { await unbanUser(token, id); refresh() } catch(e){ setError(e.message) } }
  async function onDelete(id){ try { await deleteUser(token, id); refresh() } catch(e){ setError(e.message) } }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Admin Panel</h2>
      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid md:grid-cols-3 gap-3">
        <Stat title="Users" value={summary.total_users} emoji="👥" />
        <Stat title="Providers" value={summary.total_providers} emoji="🧺" />
        <Stat title="Bookings" value={summary.total_bookings} emoji="📦" />
      </div>

      <section className="card">
        <h3 className="font-semibold mb-3">Pending Providers</h3>
        <div className="grid gap-2">
          {pending.length === 0 && <div className="text-sm opacity-70">No pending providers.</div>}
          {pending.map(p => (
            <div key={p.id} className="flex items-center justify-between bg-white rounded p-3">
              <div>
                <div className="font-medium">{p.shop_name || p.email}</div>
                <div className="text-xs opacity-70">{p.contact_number} • {p.shop_address}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>onApprove(p.id)} className="btn-white px-3 py-1">Approve</button>
                <button onClick={()=>onReject(p.id)} className="btn-danger px-3 py-1">Reject</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h3 className="font-semibold mb-3">Users</h3>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">Role</th>
                <th className="p-2">Name/Shop</th>
                <th className="p-2">Email</th>
                <th className="p-2">Status</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t">
                  <td className="p-2">{u.role}</td>
                  <td className="p-2">{u.full_name || u.shop_name || '-'}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">{u.role==='provider' ? (u.provider_status || 'pending') : (u.banned ? 'banned':'active')}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      {!u.banned && <button onClick={()=>onBan(u.id)} className="btn-danger px-3 py-1">Ban</button>}
                      {u.banned && <button onClick={()=>onUnban(u.id)} className="btn-white px-3 py-1">Unban</button>}
                      <button onClick={()=>onDelete(u.id)} className="btn-white px-3 py-1">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function Stat({ title, value, emoji }){
  return (
    <div className="card">
      <div className="text-3xl">{emoji}</div>
      <div className="text-xs opacity-70">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}

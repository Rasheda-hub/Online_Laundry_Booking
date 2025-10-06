import React from 'react'
import { listMyNotifications, markNotificationRead } from '../api/notifications'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'

export default function NotificationsBell(){
  const { token } = useAuth()
  const nav = useNavigate()
  const [open, setOpen] = React.useState(false)
  const [items, setItems] = React.useState([])
  const [error, setError] = React.useState('')

  async function load(){
    setError('')
    try{ const res = await listMyNotifications(token); setItems(res) } catch(e){ setError(e.message) }
  }
  React.useEffect(()=>{ if (open) load() }, [open, token])

  const unread = items.filter(n=>!n.read).length

  async function onMark(id){
    try{ await markNotificationRead(token, id); setItems(prev=>prev.map(n=>n.id===id?{...n, read:true}:n)) }catch(e){ setError(e.message) }
  }

  async function onOpenItem(n){
    // mark read and deep-link to receipt if present
    if (!n.read){ try { await markNotificationRead(token, n.id) } catch(e){} }
    if (n.receipt_id){
      nav(`/receipts?rid=${encodeURIComponent(n.receipt_id)}`)
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <button type="button" className="btn-white relative" onClick={()=>setOpen(o=>!o)} aria-label="Notifications">
        🔔{unread>0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full px-1">{unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow p-2 z-50">
          <div className="flex items-center justify-between mb-1">
            <div className="font-semibold text-sm">Notifications</div>
            <button className="text-xs underline" onClick={load}>Refresh</button>
          </div>
          {error && <div className="text-xs text-red-600 mb-1">{error}</div>}
          <div className="max-h-72 overflow-auto grid gap-1">
            {items.length===0 && <div className="text-xs opacity-60 p-2">No notifications</div>}
            {items.map(n=> (
              <div key={n.id} className={`p-2 rounded ${n.read? 'bg-slate-50':'bg-purple-50'}`}>
                <div className="text-xs opacity-70">{new Date(n.created_at).toLocaleString()}</div>
                <button onClick={()=>onOpenItem(n)} className="text-left w-full text-sm underline">
                  {n.message}{n.receipt_id ? ' (open receipt)' : ''}
                </button>
                {!n.read && <button onClick={()=>onMark(n.id)} className="btn-white mt-1 px-2 py-1 text-xs">Mark as read</button>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

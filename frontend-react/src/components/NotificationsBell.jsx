import React, { useState, useEffect, useCallback } from 'react'
import { listMyNotifications, markNotificationRead } from '../api/notifications'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'
import { formatDateTime } from './RealTimeClock.jsx'

export default function NotificationsBell(){
  const { token } = useAuth()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setError('')
    setLoading(true)
    try { 
      const res = await listMyNotifications(token)
      setItems(res)
    } catch(e) { 
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  // Load notifications on mount and when token changes
  useEffect(() => {
    load()
  }, [load])

  // Auto-refresh notifications every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      load()
    }, 10000) // Poll every 10 seconds
    
    return () => clearInterval(interval)
  }, [load])

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
      <button 
        type="button" 
        className="btn-white relative" 
        onClick={()=>setOpen(o=>!o)} 
        aria-label="Notifications"
      >
        <span className="text-xl">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      
      {open && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setOpen(false)}
          />
          
          {/* Notification Panel */}
          <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-xl border z-50 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔔</span>
                <div className="font-semibold">Notifications</div>
                {unread > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                    {unread} new
                  </span>
                )}
              </div>
              <button 
                className="text-xs text-bubble-dark font-semibold hover:underline" 
                onClick={load}
                disabled={loading}
              >
                {loading ? '⏳ Loading...' : '🔄 Refresh'}
              </button>
            </div>
            
            {/* Error */}
            {error && (
              <div className="mx-4 mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                ⚠️ {error}
              </div>
            )}
            
            {/* Notifications List */}
            <div className="overflow-y-auto flex-1 p-2">
              {items.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🔔</div>
                  <div className="text-sm">No notifications yet</div>
                </div>
              )}
              
              <div className="grid gap-2">
                {items.map(n => (
                  <div 
                    key={n.id} 
                    className={`p-3 rounded-lg border transition-all ${
                      n.read 
                        ? 'bg-gray-50 border-gray-200' 
                        : 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="text-xs text-gray-600">
                        📅 {formatDateTime(n.created_at)}
                      </div>
                      {!n.read && (
                        <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                          NEW
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm mb-2">{n.message}</div>
                    
                    <div className="flex gap-2">
                      {n.receipt_id && (
                        <button 
                          onClick={() => onOpenItem(n)} 
                          className="text-xs bg-bubble-dark text-white px-3 py-1 rounded-lg hover:opacity-90 transition-opacity"
                        >
                          🧾 View Receipt
                        </button>
                      )}
                      {n.booking_id && !n.receipt_id && (
                        <button 
                          onClick={() => { 
                            if (!n.read) onMark(n.id)
                            nav('/customer/orders')
                            setOpen(false)
                          }} 
                          className="text-xs bg-blue-500 text-white px-3 py-1 rounded-lg hover:opacity-90 transition-opacity"
                        >
                          📦 View Order
                        </button>
                      )}
                      {!n.read && (
                        <button 
                          onClick={() => onMark(n.id)} 
                          className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          ✔️ Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

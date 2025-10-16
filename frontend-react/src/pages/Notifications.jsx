import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { listMyNotifications, markNotificationRead } from '../api/notifications'
import { useAuth } from '../context/AuthContext.jsx'
import { formatDateTime } from '../components/RealTimeClock.jsx'

export default function Notifications() {
  const { token, user } = useAuth()
  const nav = useNavigate()
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const getEmptyMessage = () => {
    if (user?.role === 'admin') {
      return 'System notifications will appear here'
    } else if (user?.role === 'provider') {
      return "You'll see notifications here when you receive new bookings or updates"
    } else {
      return "You'll see notifications here when there are updates to your orders"
    }
  }

  const load = useCallback(async (silent = false) => {
    if (!token) return
    setError('')
    if (!silent) {
      setLoading(true)
    } else {
      setIsRefreshing(true)
    }
    try {
      const res = await listMyNotifications(token)
      setItems(res)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  // Auto-refresh notifications every 10 seconds
  useEffect(() => {
    if (!token) return

    const interval = setInterval(() => {
      load(true) // Silent refresh - doesn't show loading spinner
    }, 10000) // Refresh every 10 seconds

    return () => clearInterval(interval)
  }, [load, token])

  const unread = items.filter(n => !n.read).length

  async function onMark(id) {
    try {
      await markNotificationRead(token, id)
      setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch (e) {
      setError(e.message)
    }
  }

  async function onMarkAll() {
    try {
      const unreadIds = items.filter(n => !n.read).map(n => n.id)
      await Promise.all(unreadIds.map(id => markNotificationRead(token, id)))
      setItems(prev => prev.map(n => ({ ...n, read: true })))
    } catch (e) {
      setError(e.message)
    }
  }

  async function onOpenItem(n) {
    if (!n.read) {
      try {
        await markNotificationRead(token, n.id)
        setItems(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item))
      } catch (e) { }
    }
    if (n.receipt_id) {
      nav(`/receipts?rid=${encodeURIComponent(n.receipt_id)}`)
    } else if (n.booking_id) {
      // Navigate based on user role
      if (user?.role === 'provider') {
        // For providers, go to provider dashboard bookings tab
        nav('/provider?tab=bookings')
      } else {
        // For customers, go to orders page
        nav('/customer/orders')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-4xl mb-2">⏳</div>
          <div className="text-gray-600">Loading notifications...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">🔔 Notifications</h2>
          {unread > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              You have <span className="font-semibold text-bubble-dark">{unread}</span> unread notification{unread !== 1 ? 's' : ''}
            </p>
          )}
          {isRefreshing && (
            <p className="text-xs text-gray-500 mt-1 animate-pulse">
              🔄 Auto-refreshing...
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {unread > 0 && (
            <button
              onClick={onMarkAll}
              className="btn-white text-xs md:text-sm"
            >
              ✔️ Mark All Read
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">
          ⚠️ {error}
        </div>
      )}

      {items.length === 0 && (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🔔</div>
          <div className="text-xl font-semibold text-gray-700 mb-2">No notifications yet</div>
          <p className="text-sm text-gray-500">
            {getEmptyMessage()}
          </p>
        </div>
      )}

      <div className="grid gap-3">
        {items.map(n => (
          <div
            key={n.id}
            className={`card transition-all ${
              n.read
                ? 'bg-white/80'
                : 'bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="text-xs text-gray-600">
                📅 {formatDateTime(n.created_at)}
              </div>
              {!n.read && (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-2 py-0.5 whitespace-nowrap">
                  NEW
                </span>
              )}
            </div>

            <div className="text-sm md:text-base mb-3 break-words">{n.message}</div>

            <div className="flex flex-wrap gap-2">
              {n.receipt_id && (
                <button
                  onClick={() => onOpenItem(n)}
                  className="btn-primary text-xs md:text-sm flex-1 min-w-[120px]"
                >
                  🧾 View Receipt
                </button>
              )}
              {n.booking_id && !n.receipt_id && (
                <button
                  onClick={() => onOpenItem(n)}
                  className="bg-blue-500 text-white px-3 py-2 rounded-lg text-xs md:text-sm hover:opacity-90 transition-opacity flex-1 min-w-[120px]"
                >
                  📦 View Order
                </button>
              )}
              {!n.read && (
                <button
                  onClick={() => onMark(n.id)}
                  className="btn-white text-xs md:text-sm flex-1 min-w-[100px]"
                >
                  ✔️ Mark Read
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

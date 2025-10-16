import React, { useState, useEffect, useCallback } from 'react'
import { listMyNotifications } from '../api/notifications'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'

export default function NotificationsBell(){
  const { token } = useAuth()
  const nav = useNavigate()
  const [items, setItems] = useState([])

  const load = useCallback(async () => {
    if (!token) return
    try { 
      const res = await listMyNotifications(token)
      setItems(res)
    } catch(e) { 
      // If unauthorized, stop trying
      if (e.message?.includes('401') || e.message?.includes('Unauthorized')) {
        console.log('Token expired, stopping notification polling')
        return
      }
      // Silently fail for other errors
    }
  }, [token])

  // Load notifications on mount and when token changes
  useEffect(() => {
    load()
  }, [load])

  // Auto-refresh notifications every 10 seconds
  useEffect(() => {
    if (!token) return // Don't poll if no token
    
    const interval = setInterval(() => {
      load()
    }, 10000) // Poll every 10 seconds
    
    return () => clearInterval(interval)
  }, [load, token])

  const unread = items.filter(n=>!n.read).length

  return (
    <button 
      type="button" 
      className="btn-white relative" 
      onClick={() => nav('/notifications')} 
      aria-label="Notifications"
    >
      <span className="text-xl">🔔</span>
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  )
}

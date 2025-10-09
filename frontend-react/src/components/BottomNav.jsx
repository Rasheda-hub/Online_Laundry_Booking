import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { listMyNotifications } from '../api/notifications.js'

export default function BottomNav(){
  const { pathname } = useLocation()
  const { user, logout, token } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  
  useEffect(() => {
    if (!user || !token) return
    
    // Fetch unread notifications count
    const fetchUnreadCount = async () => {
      try {
        const notifications = await listMyNotifications(token)
        const unread = notifications.filter(n => !n.read).length
        setUnreadCount(unread)
      } catch (e) {
        console.error('Failed to fetch notifications:', e)
      }
    }
    
    fetchUnreadCount()
    
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [user, token])
  
  if (!user) return null
  
  const Item = ({ to, label, emoji, onClick, badge }) => (
    <Link 
      to={to} 
      onClick={onClick}
      className={`flex-1 text-center py-2 transition-colors relative ${pathname===to? 'text-bubble-dark font-semibold':'opacity-80 hover:opacity-100'}`}
    >
      <div className="text-xl relative inline-block">
        {emoji}
        {badge > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      <div className="text-xs">{label}</div>
    </Link>
  )
  
  const LogoutButton = () => (
    <button 
      onClick={logout}
      className="flex-1 text-center py-2 opacity-80 hover:opacity-100 transition-colors text-red-600"
    >
      <div className="text-xl">🚪</div>
      <div className="text-xs">Logout</div>
    </button>
  )
  
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-md border-t flex items-center justify-around z-50 shadow-lg">
      {user.role === 'customer' && (
        <>
          <Item to="/customer/orders" label="Orders" emoji="📦" />
          <Item to="/receipts" label="Receipts" emoji="🧾" />
          <Item to="/customer" label="Home" emoji="🏠" />
          <Item to="/notifications" label="Alerts" emoji="🔔" badge={unreadCount} />
          <Item to="/profile" label="Profile" emoji="👤" />
          <LogoutButton />
        </>
      )}
      {user.role === 'provider' && (
        <>
          <Item to="/provider" label="Home" emoji="🏠" />
          <Item to="/receipts" label="Receipts" emoji="🧾" />
          <Item to="/notifications" label="Alerts" emoji="🔔" badge={unreadCount} />
          <Item to="/profile" label="Profile" emoji="👤" />
          <LogoutButton />
        </>
      )}
      {user.role === 'admin' && (
        <>
          <Item to="/admin" label="Admin" emoji="🛠️" />
          <Item to="/notifications" label="Alerts" emoji="🔔" badge={unreadCount} />
          <Item to="/profile" label="Profile" emoji="👤" />
          <LogoutButton />
        </>
      )}
    </nav>
  )
}

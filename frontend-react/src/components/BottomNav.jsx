import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function BottomNav(){
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  
  if (!user) return null
  
  const Item = ({ to, label, emoji, onClick }) => (
    <Link 
      to={to} 
      onClick={onClick}
      className={`flex-1 text-center py-2 transition-colors ${pathname===to? 'text-bubble-dark font-semibold':'opacity-80 hover:opacity-100'}`}
    >
      <div className="text-xl">{emoji}</div>
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
          <Item to="/notifications" label="Alerts" emoji="🔔" />
          <Item to="/profile" label="Profile" emoji="👤" />
          <LogoutButton />
        </>
      )}
      {user.role === 'provider' && (
        <>
          <Item to="/provider" label="Home" emoji="🏠" />
          <Item to="/receipts" label="Receipts" emoji="🧾" />
          <Item to="/notifications" label="Alerts" emoji="🔔" />
          <Item to="/profile" label="Profile" emoji="👤" />
          <LogoutButton />
        </>
      )}
      {user.role === 'admin' && (
        <>
          <Item to="/admin" label="Admin" emoji="🛠️" />
          <Item to="/profile" label="Profile" emoji="👤" />
          <LogoutButton />
        </>
      )}
    </nav>
  )
}

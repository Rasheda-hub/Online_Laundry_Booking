import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import Avatar from './Avatar.jsx'
import { useAuth } from '../context/AuthContext.jsx'

function Item({ to, label, emoji, onClick }){
  const { pathname } = useLocation()
  const active = pathname === to
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
        active 
          ? 'bg-bubble-dark text-white font-semibold shadow-sm' 
          : 'hover:bg-white/70'
      }`}
    >
      <span className="text-lg" aria-hidden>{emoji}</span>
      <span className="truncate">{label}</span>
    </Link>
  )
}

export default function Sidebar({ mobileOpen = false, onClose = ()=>{} }){
  const { user, logout } = useAuth()
  if (!user) return null
  return (
    <>
      {/* Overlay for mobile */}
      {mobileOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen md:h-auto
        w-64 shrink-0 p-4 z-50
        transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl md:shadow-none h-full md:h-auto overflow-y-auto">
          {/* Close button for mobile */}
          {mobileOpen && (
            <button 
              onClick={onClose}
              className="md:hidden absolute top-4 right-4 text-2xl text-gray-600 hover:text-gray-900"
              aria-label="Close menu"
            >
              ✕
            </button>
          )}
          
          <div className="flex items-center gap-2 mb-4 pr-8 md:pr-0">
            <Avatar name={user.full_name || user.shop_name || user.email} size={32} />
            <div className="text-sm">
              <div className="font-semibold truncate max-w-[160px]">{user.full_name || user.shop_name || user.email}</div>
              <div className="opacity-60 text-xs capitalize">{user.role}</div>
            </div>
          </div>
          
          <nav className="grid gap-1 text-sm">
            {user.role === 'customer' && (
              <>
                <Item to="/customer" label="Dashboard" emoji="🏠" onClick={onClose} />
                <Item to="/customer/orders" label="My Orders" emoji="📦" onClick={onClose} />
                <Item to="/receipts" label="Receipts" emoji="🧾" onClick={onClose} />
                <Item to="/profile" label="Profile" emoji="👤" onClick={onClose} />
              </>
            )}
            {user.role === 'provider' && (
              <>
                <Item to="/provider" label="Dashboard" emoji="🏠" onClick={onClose} />
                <Item to="/receipts" label="Receipts" emoji="🧾" onClick={onClose} />
                <Item to="/profile" label="Profile" emoji="👤" onClick={onClose} />
              </>
            )}
            {user.role === 'admin' && (
              <>
                <Item to="/admin" label="Admin Dashboard" emoji="🛠️" onClick={onClose} />
                <Item to="/profile" label="Profile" emoji="👤" onClick={onClose} />
              </>
            )}
            <button 
              onClick={() => { logout(); onClose(); }} 
              className="mt-2 text-left flex items-center gap-2 px-3 py-2 rounded bg-red-50 hover:bg-red-100 transition-colors text-red-700 font-medium"
            >
              🚪 Logout
            </button>
          </nav>
        </div>
      </aside>
    </>
  )
}

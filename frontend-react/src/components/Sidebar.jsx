import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import Avatar from './Avatar.jsx'
import { useAuth } from '../context/AuthContext.jsx'

function Item({ to, label, emoji }){
  const { pathname } = useLocation()
  const active = pathname === to
  return (
    <Link to={to} className={`flex items-center gap-2 px-3 py-2 rounded ${active? 'bg-white/90 font-semibold':'hover:bg-white/70'}`}>
      <span className="text-lg" aria-hidden>{emoji}</span>
      <span className="truncate">{label}</span>
    </Link>
  )
}

export default function Sidebar({ mobileOpen = false, onClose = ()=>{} }){
  const { user, logout } = useAuth()
  if (!user) return null
  return (
    <aside className={`w-64 shrink-0 p-4 ${mobileOpen ? 'fixed inset-y-0 left-0 z-50 block' : 'hidden md:block'}`}>
      {/* overlay for mobile */}
      {mobileOpen && <div onClick={onClose} className="fixed inset-0 bg-black/40 z-40 md:hidden"></div>}
      <div className={`bg-white/80 rounded-2xl p-4 relative z-50 ${mobileOpen ? 'h-full md:h-auto' : ''}`}>
        <div className="flex items-center gap-2 mb-4">
          <Avatar name={user.full_name || user.shop_name || user.email} size={28} />
          <div className="text-sm">
            <div className="font-semibold truncate max-w-[160px]">{user.full_name || user.shop_name || user.email}</div>
            <div className="opacity-60 text-xs">{user.role}</div>
          </div>
        </div>
        <nav className="grid gap-1 text-sm">
          {user.role === 'customer' && (
            <>
              <Item to="/customer" label="Dashboard" emoji="🏠" />
              <Item to="/customer/orders" label="My Orders" emoji="📦" />
              <Item to="/receipts" label="Receipts" emoji="🧾" />
              <Item to="/profile" label="Profile" emoji="👤" />
            </>
          )}
          {user.role === 'provider' && (
            <>
              <Item to="/provider" label="Dashboard" emoji="🏠" />
              <Item to="/receipts" label="Receipts" emoji="🧾" />
              <Item to="/profile" label="Profile" emoji="👤" />
            </>
          )}
          {user.role === 'admin' && (
            <>
              <Item to="/admin" label="Admin" emoji="🛠️" />
              <Item to="/receipts" label="Receipts" emoji="🧾" />
              <Item to="/profile" label="Profile" emoji="👤" />
            </>
          )}
          <button onClick={logout} className="mt-2 text-left flex items-center gap-2 px-3 py-2 rounded bg-red-100">🚪 Logout</button>
        </nav>
      </div>
    </aside>
  )
}

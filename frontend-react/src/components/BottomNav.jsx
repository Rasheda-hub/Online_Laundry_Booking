import React from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function BottomNav(){
  const { pathname } = useLocation()
  const Item = ({ to, label, emoji }) => (
    <Link to={to} className={`flex-1 text-center py-2 ${pathname===to? 'text-bubble-dark font-semibold':'opacity-80'}`}>
      <div className="text-xl">{emoji}</div>
      <div className="text-xs">{label}</div>
    </Link>
  )
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur border-t flex items-center justify-around z-20">
      <Item to="/customer" label="Home" emoji="🏠" />
      <Item to="/customer/orders" label="My Orders" emoji="📦" />
      <Item to="/profile" label="Profile" emoji="👤" />
    </nav>
  )
}

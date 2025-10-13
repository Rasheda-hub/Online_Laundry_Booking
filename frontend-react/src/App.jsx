import React, { useState } from 'react'
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import OAuthCallback from './pages/OAuthCallback.jsx'
import CustomerDashboard from './pages/customer/Dashboard.jsx'
import ProviderShop from './pages/customer/ProviderShop.jsx'
import BookingForm from './pages/customer/BookingForm.jsx'
import Orders from './pages/customer/Orders.jsx'
import ProviderDashboard from './pages/provider/Dashboard.jsx'
import AdminPanel from './pages/admin/AdminPanel.jsx'
import Profile from './pages/Profile.jsx'
import Receipts from './pages/Receipts.jsx'
import Notifications from './pages/Notifications.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Avatar from './components/Avatar.jsx'
import BottomNav from './components/BottomNav.jsx'
import Bubbles from './components/Bubbles.jsx'

function ProtectedRoute({ children, allow }) {
  const { user, token, loading } = useAuth()
  if (loading) return <div className="p-6 text-center">Loading…</div>
  if (!token || !user) return <Navigate to="/login" replace />
  if (allow && !allow.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function Layout({ children }) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const isAuthPage = pathname === '/login' || pathname === '/register'
  
  return (
    <div className="min-h-screen bg-gradient-bubble relative font-rounded text-slate-800">
      <Bubbles />
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-md border-b border-white/20 shadow-sm">
        <div className="flex items-center justify-between px-4 md:px-6 py-3">
          {/* Brand */}
          {user ? (
            <div className="flex items-center gap-2 text-lg md:text-xl font-semibold select-none cursor-default">
              <span className="inline-flex h-8 w-8 rounded-full bg-gradient-to-br from-bubble-dark to-bubble-mid items-center justify-center shadow-sm">🧺</span>
              <span className="hidden sm:inline">LaundryApp</span>
            </div>
          ) : (
            <Link to="/" className="flex items-center gap-2 text-lg md:text-xl font-semibold hover:opacity-80 transition-opacity">
              <span className="inline-flex h-8 w-8 rounded-full bg-gradient-to-br from-bubble-dark to-bubble-mid items-center justify-center shadow-sm">🧺</span>
              <span className="hidden sm:inline">LaundryApp</span>
            </Link>
          )}
        </div>
      </header>
      
      {/* Main content area */}
      <div className="relative z-10">
        <div className="max-w-6xl mx-auto">
          <main className={`px-4 py-6 ${user ? 'pb-24' : ''}`}>
            {children}
          </main>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      {user && <BottomNav />}
      
      <footer className={`px-6 py-6 text-xs text-center opacity-70 mt-8 ${user ? 'mb-16' : ''}`}>
        © {new Date().getFullYear()} LaundryApp • Made with 💙
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/login" element={<Layout><Login /></Layout>} />
        <Route path="/register" element={<Layout><Register /></Layout>} />
        <Route path="/oauth/callback" element={<Layout><OAuthCallback /></Layout>} />
        {/* Customer */}
        <Route path="/customer" element={<Layout><ProtectedRoute allow={["customer","admin"]}><CustomerDashboard /></ProtectedRoute></Layout>} />
        <Route path="/customer/shop/:providerId" element={<Layout><ProtectedRoute allow={["customer","admin"]}><ProviderShop /></ProtectedRoute></Layout>} />
        <Route path="/customer/book" element={<Layout><ProtectedRoute allow={["customer","admin"]}><BookingForm /></ProtectedRoute></Layout>} />
        <Route path="/customer/orders" element={<Layout><ProtectedRoute allow={["customer","admin"]}><Orders /></ProtectedRoute></Layout>} />
        {/* Provider */}
        <Route path="/provider" element={<Layout><ProtectedRoute allow={["provider","admin"]}><ProviderDashboard /></ProtectedRoute></Layout>} />
        {/* Admin */}
        <Route path="/admin" element={<Layout><ProtectedRoute allow={["admin"]}><AdminPanel /></ProtectedRoute></Layout>} />
        {/* Profile for any logged-in user */}
        <Route path="/profile" element={<Layout><ProtectedRoute allow={["customer","provider","admin"]}><Profile /></ProtectedRoute></Layout>} />
        {/* Receipts for any logged-in user */}
        <Route path="/receipts" element={<Layout><ProtectedRoute allow={["customer","provider","admin"]}><Receipts /></ProtectedRoute></Layout>} />
        {/* Notifications for any logged-in user */}
        <Route path="/notifications" element={<Layout><ProtectedRoute allow={["customer","provider","admin"]}><Notifications /></ProtectedRoute></Layout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

function Home(){
  return (
    <div className="grid md:grid-cols-2 gap-6 items-center">
      <div className="space-y-4">
        <h1 className="text-3xl md:text-5xl font-bold">Online Laundry Booking</h1>
        <p className="opacity-80">Book laundry, explore shop services, and track your orders easily.</p>
        <div className="flex gap-3">
          <Link to="/login" className="px-4 py-2 rounded-lg bg-bubble-dark text-white">Login</Link>
          <Link to="/register" className="px-4 py-2 rounded-lg bg-white/80">Register</Link>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 text-5xl">
        <div className="p-6 bg-white/70 rounded-2xl text-center">🧼</div>
        <div className="p-6 bg-white/70 rounded-2xl text-center">👕</div>
        <div className="p-6 bg-white/70 rounded-2xl text-center">🧺</div>
        <div className="p-6 bg-white/70 rounded-2xl text-center">🫧</div>
        <div className="p-6 bg-white/70 rounded-2xl text-center">🧴</div>
        <div className="p-6 bg-white/70 rounded-2xl text-center">🧦</div>
      </div>
    </div>
  )
}

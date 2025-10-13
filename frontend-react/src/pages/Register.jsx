import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerCustomer, registerProvider } from '../api/users.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function Register(){
  const nav = useNavigate()
  const { login } = useAuth()
  const [tab, setTab] = useState('customer')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Customer fields
  const [cFullName, setCFullName] = useState('')
  const [cEmail, setCEmail] = useState('')
  const [cPassword, setCPassword] = useState('')
  const [cContact, setCContact] = useState('')
  const [cAddress, setCAddress] = useState('')

  // Provider fields
  const [pShopName, setPShopName] = useState('')
  const [pEmail, setPEmail] = useState('')
  const [pPassword, setPPassword] = useState('')
  const [pContact, setPContact] = useState('')
  const [pShopAddress, setPShopAddress] = useState('')

  async function onSubmit(e){
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const email = tab === 'customer' ? cEmail : pEmail
      const password = tab === 'customer' ? cPassword : pPassword
      
      if (tab === 'customer'){
        await registerCustomer({
          full_name: cFullName,
          email: cEmail,
          password: cPassword,
          contact_number: cContact,
          address: cAddress,
        })
      } else {
        await registerProvider({
          shop_name: pShopName,
          email: pEmail,
          password: pPassword,
          contact_number: pContact,
          shop_address: pShopAddress,
        })
      }
      
      // Auto-login after successful registration
      await login({ email, password })
      
      // Navigate to appropriate dashboard
      if (tab === 'customer') {
        nav('/customer')
      } else {
        nav('/provider')
      }
    } catch (err){
      setError(err.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="text-center mb-6">
          <div className="inline-flex h-16 w-16 rounded-full bg-gradient-to-br from-bubble-dark to-bubble-mid items-center justify-center text-4xl shadow-lg mb-3">
            ✨
          </div>
          <h2 className="text-2xl md:text-3xl font-bold">Create Account</h2>
          <p className="text-sm text-gray-600 mt-1">Join us today!</p>
        </div>
        
        <div className="flex justify-center gap-2 mb-6">
          <button 
            type="button"
            onClick={()=>setTab('customer')} 
            className={`btn ${tab==='customer'?'btn-primary':'btn-white'}`}
          >
            👤 Customer
          </button>
          <button 
            type="button"
            onClick={()=>setTab('provider')} 
            className={`btn ${tab==='provider'?'btn-primary':'btn-white'}`}
          >
            🏪 Provider
          </button>
        </div>
        
        {error && (
          <div className="mb-4 bg-red-50 text-red-700 text-sm p-3 rounded-lg text-center">
            ⚠️ {error}
          </div>
        )}
        
        <form onSubmit={onSubmit} className="space-y-4">
          {tab==='customer' ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">👤 Full Name *</label>
                <input value={cFullName} onChange={e=>setCFullName(e.target.value)} placeholder="Juan Dela Cruz" className="input" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">📧 Email *</label>
                <input type="email" value={cEmail} onChange={e=>setCEmail(e.target.value)} placeholder="your@email.com" className="input" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">🔒 Password *</label>
                <input type="password" value={cPassword} onChange={e=>setCPassword(e.target.value)} placeholder="Create a password" className="input" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">📞 Contact Number *</label>
                <input value={cContact} onChange={e=>setCContact(e.target.value)} placeholder="09XX XXX XXXX" className="input" required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">📍 Address *</label>
                <input value={cAddress} onChange={e=>setCAddress(e.target.value)} placeholder="Complete address" className="input" required />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">🏪 Shop Name *</label>
                <input value={pShopName} onChange={e=>setPShopName(e.target.value)} placeholder="Your Shop Name" className="input" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">📧 Email *</label>
                <input type="email" value={pEmail} onChange={e=>setPEmail(e.target.value)} placeholder="shop@email.com" className="input" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">🔒 Password *</label>
                <input type="password" value={pPassword} onChange={e=>setPPassword(e.target.value)} placeholder="Create a password" className="input" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">📞 Contact Number *</label>
                <input value={pContact} onChange={e=>setPContact(e.target.value)} placeholder="09XX XXX XXXX" className="input" required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">📍 Shop Address *</label>
                <input value={pShopAddress} onChange={e=>setPShopAddress(e.target.value)} placeholder="Complete shop address" className="input" required />
              </div>
            </>
          )}
          
          <button disabled={loading} className="btn-primary w-full">
            {loading ? '⏳ Creating...' : '✨ Sign Up'}
          </button>
        </form>
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>
          
          <div className="mt-4">
            <button
              type="button"
              onClick={() => window.location.href = 'http://localhost:8000/oauth/google/login'}
              className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm font-medium text-gray-700">Sign up with Google</span>
            </button>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-bubble-dark font-semibold hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

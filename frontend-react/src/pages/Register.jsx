import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerCustomer, registerProvider } from '../api/users.js'

export default function Register(){
  const nav = useNavigate()
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
      nav('/login')
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

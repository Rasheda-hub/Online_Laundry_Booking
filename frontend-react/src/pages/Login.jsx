import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { loginJson } from '../api/auth.js'

export default function Login(){
  const { setToken, setUser, user } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e){
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const tok = await loginJson(email, password)
      setToken(tok.access_token)
      setUser(null) // AuthProvider will fetch /auth/me and update user
    } catch (err){
      setError(err.message)
    } finally { setLoading(false) }
  }

  // Navigate after AuthProvider fetches the user
  useEffect(() => {
    if (!user) return
    if (user.role === 'provider') nav('/provider')
    else if (user.role === 'admin') nav('/admin')
    else nav('/customer')
  }, [user, nav])

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <div className="text-center mb-6">
          <div className="inline-flex h-16 w-16 rounded-full bg-gradient-to-br from-bubble-dark to-bubble-mid items-center justify-center text-4xl shadow-lg mb-3">
            🧺
          </div>
          <h2 className="text-2xl md:text-3xl font-bold">Welcome Back!</h2>
          <p className="text-sm text-gray-600 mt-1">Sign in to continue</p>
        </div>
        
        {error && (
          <div className="mb-4 bg-red-50 text-red-700 text-sm p-3 rounded-lg">
            ⚠️ {error}
          </div>
        )}
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">📧 Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e=>setEmail(e.target.value)} 
              placeholder="your@email.com" 
              className="input" 
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">🔒 Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
              placeholder="Enter your password" 
              className="input" 
              required 
            />
          </div>
          
          <button disabled={loading} className="btn-primary w-full">
            {loading ? '⏳ Signing in...' : '✨ Login'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-bubble-dark font-semibold hover:underline">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

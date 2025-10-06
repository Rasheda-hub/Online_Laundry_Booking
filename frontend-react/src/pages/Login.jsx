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
    <div className="max-w-md mx-auto card">
      <div className="text-center text-4xl mb-4">🧺</div>
      <h2 className="text-xl font-semibold mb-4 text-center">Login</h2>
      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-3">
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="input" required />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="input" required />
        <button disabled={loading} className="btn-primary w-full">{loading ? 'Signing in...' : 'Login'}</button>
      </form>
      <div className="mt-4 text-sm text-center">
        Don’t have an account? <Link to="/register" className="underline">Sign up</Link>
      </div>
    </div>
  )
}

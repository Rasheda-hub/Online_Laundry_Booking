import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api/client.js'

// Safe storage wrapper to avoid environments where localStorage is unavailable or overridden
const storage = (() => {
  try {
    const ls = window.localStorage
    if (ls && typeof ls.setItem === 'function' && typeof ls.getItem === 'function' && typeof ls.removeItem === 'function') {
      return ls
    }
  } catch {}
  // in-memory fallback
  const mem = {}
  return {
    getItem: (k) => (k in mem ? mem[k] : ''),
    setItem: (k, v) => { mem[k] = String(v) },
    removeItem: (k) => { delete mem[k] },
  }
})()

const AuthCtx = createContext(null)

export function AuthProvider({ children }){
  const [token, setToken] = useState(() => storage.getItem('token') || '')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const logout = () => { setToken(''); setUser(null); try { storage.removeItem('token') } catch {} }
  const value = useMemo(() => ({ token, setToken, user, setUser, loading, setLoading, logout }), [token, user, loading])

  useEffect(() => {
    if (token) {
      setLoading(true)
      storage.setItem('token', token)
      // fetch current user
      ;(async () => {
        try {
          const me = await apiFetch('/auth/me', { token })
          setUser(me)
        } catch {
          setToken(''); setUser(null)
          storage.removeItem('token')
        } finally { setLoading(false) }
      })()
    } else {
      storage.removeItem('token')
      setLoading(false)
    }
  }, [token])

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth(){
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

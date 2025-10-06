import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

// Safe storage wrapper (avoids environments without localStorage)
const storage = (() => {
  try {
    const ls = window.localStorage
    if (ls && typeof ls.setItem === 'function' && typeof ls.getItem === 'function' && typeof ls.removeItem === 'function') {
      return ls
    }
  } catch {}
  const mem = {}
  return {
    getItem: (k) => (k in mem ? mem[k] : ''),
    setItem: (k, v) => { mem[k] = String(v) },
    removeItem: (k) => { delete mem[k] },
  }
})()

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => storage.getItem('token') || '')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  // Save token in storage whenever it changes
  useEffect(() => {
    if (token) {
      storage.setItem('token', token)
    } else {
      storage.removeItem('token')
    }
  }, [token])

  // Fetch current user when token exists
  useEffect(() => {
    if (token) {
      setLoading(true)
      ;(async () => {
        try {
          const res = await fetch("/auth/me", {
            headers: { "Authorization": `Bearer ${token}` }
          })
          if (!res.ok) throw new Error("Failed to fetch user")
          const me = await res.json()
          setUser(me)
        } catch (err) {
          console.error(err)
          setToken('')
          setUser(null)
        } finally {
          setLoading(false)
        }
      })()
    } else {
      setUser(null)
      setLoading(false)
    }
  }, [token])

  const register = async (data) => {
    try {
      const res = await fetch("/users/register/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Registration failed")
      const result = await res.json()
      return result
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  const login = async (data) => {
    try {
      const res = await fetch("/auth/login_json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Login failed")
      const result = await res.json()
      setToken(result.access_token)  // Backend returns 'access_token', not 'token'
      return result
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  const logout = () => {
    setToken('')
    setUser(null)
    try { storage.removeItem('token') } catch {}
  }

  const value = useMemo(() => ({
    token,
    setToken,
    user,
    setUser,
    loading,
    setLoading,
    register,
    login,
    logout
  }), [token, user, loading])

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

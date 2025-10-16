import React, { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react'

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
  const [error, setError] = useState(null)
  const fetchingRef = useRef(false)

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
    const fetchCurrentUser = async () => {
      if (!token) {
        setUser(null)
        setLoading(false)
        fetchingRef.current = false
        return
      }

      // Prevent duplicate requests
      if (fetchingRef.current) {
        return
      }
      fetchingRef.current = true

      setLoading(true)
      setError(null)
      
      try {
        const res = await fetch("/auth/me", {
          headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        })
        
        // Check if response is JSON
        const contentType = res.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          const textResponse = await res.text()
          
          if (res.status === 401) {
            console.log('Token expired or invalid, logging out')
            setToken('')
            setUser(null)
            setLoading(false)
            return
          } else if (res.status === 404) {
            throw new Error("Authentication endpoint not found")
          } else {
            throw new Error(`Server error: ${res.status} ${res.statusText}`)
          }
        }
        
        if (!res.ok) {
          if (res.status === 401) {
            console.log('Token expired or invalid, logging out')
            setToken('')
            setUser(null)
            setLoading(false)
            return
          }
          const errorData = await res.json()
          throw new Error(errorData.detail || `Authentication failed: ${res.status}`)
        }
        
        const userData = await res.json()
        setUser(userData)
        
      } catch (err) {
        console.error("Auth error:", err)
        setError(err.message)
        // Only clear token if it's an authentication error
        if (err.message.includes('token') || err.message.includes('401') || err.message.includes('Unauthorized')) {
          setToken('')
        }
        setUser(null)
      } finally {
        setLoading(false)
        fetchingRef.current = false
      }
    }

    fetchCurrentUser()
  }, [token])

  const register = async (data) => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/users/register/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      
      const contentType = res.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await res.text()
        throw new Error(`Server returned unexpected response: ${res.status}`)
      }
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || "Registration failed")
      }
      
      const result = await res.json()
      return result
    } catch (err) {
      console.error("Registration error:", err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const login = async (data) => {
    setError(null)
    setLoading(true)
    try {
      console.log('Attempting login with:', data.email)
      
      const res = await fetch("/auth/login_json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      
      console.log('Login response status:', res.status)
      const contentType = res.headers.get("content-type")
      console.log('Login content-type:', contentType)
      
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await res.text()
        console.error("Login HTML response:", textResponse.substring(0, 500))
        throw new Error(`Server error: ${res.status} - Please check backend logs`)
      }
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || `Login failed: ${res.status}`)
      }
      
      const result = await res.json()
      console.log('Login successful, token received:', result.access_token ? 'Yes' : 'No')
      
      // Set the token - this will trigger the useEffect to fetch user data
      setToken(result.access_token)
      return result
    } catch (err) {
      console.error("Login error:", err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setToken('')
    setUser(null)
    setError(null)
    try { 
      storage.removeItem('token') 
    } catch {}
  }

  const value = useMemo(() => ({
    token,
    setToken,
    user,
    setUser,
    loading,
    setLoading,
    error,
    setError,
    register,
    login,
    logout,
    isAuthenticated: !!token && !!user
  }), [token, user, loading, error])

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
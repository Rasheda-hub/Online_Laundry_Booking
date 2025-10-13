import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function OAuthCallback() {
  const [searchParams] = useSearchParams()
  const { setToken, user } = useAuth()
  const nav = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    const errorMsg = searchParams.get('error')
    const provider = searchParams.get('provider')

    if (errorMsg) {
      setError(errorMsg)
      setTimeout(() => nav('/login'), 3000)
      return
    }

    if (token) {
      console.log('OAuth token received:', token.substring(0, 20) + '...')
      setToken(token)
    } else {
      setError('No token received')
      setTimeout(() => nav('/login'), 3000)
    }
  }, [searchParams, setToken, nav])

  // Redirect once user is loaded
  useEffect(() => {
    if (user) {
      console.log('User loaded, redirecting...', user.role)
      if (user.role === 'provider') {
        nav('/provider')
      } else if (user.role === 'admin') {
        nav('/admin')
      } else {
        nav('/customer')
      }
    }
  }, [user, nav])

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <div className="card text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Authentication Failed</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-20">
      <div className="card text-center">
        <div className="text-5xl mb-4">🔄</div>
        <h2 className="text-xl font-bold mb-2">Signing you in...</h2>
        <p className="text-gray-600">Please wait a moment</p>
        <div className="mt-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-bubble-dark"></div>
        </div>
      </div>
    </div>
  )
}

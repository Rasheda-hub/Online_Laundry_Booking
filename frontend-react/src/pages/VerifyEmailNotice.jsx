import React, { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import api from '../api/axios'

export default function VerifyEmailNotice() {
  const location = useLocation()
  const email = location.state?.email || ''
  const [resending, setResending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleResend() {
    if (!email) return
    setResending(true)
    setMessage('')
    setError('')
    try {
      await api.post('/users/resend-verification', null, { params: { email } })
      setMessage('Verification email sent! Please check your inbox.')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to resend email')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card text-center">
        <div className="inline-flex h-20 w-20 rounded-full bg-gradient-to-br from-bubble-dark to-bubble-mid items-center justify-center text-5xl shadow-lg mb-6 mx-auto">
          📧
        </div>
        
        <h2 className="text-3xl font-bold mb-4">Check Your Email</h2>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <p className="text-lg text-gray-700 mb-3">
            We've sent a verification email to:
          </p>
          <p className="text-xl font-semibold text-bubble-dark mb-4">
            {email}
          </p>
          <p className="text-sm text-gray-600">
            Please click the verification link in the email to activate your account.
          </p>
        </div>

        <div className="space-y-4 text-left bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-2">📋 Next Steps:</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Check your email inbox (and spam folder)</li>
            <li>Click the verification link in the email</li>
            <li>Return here to log in</li>
          </ol>
        </div>

        {message && (
          <div className="mb-4 bg-green-50 text-green-700 text-sm p-3 rounded-lg">
            ✅ {message}
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-50 text-red-700 text-sm p-3 rounded-lg">
            ⚠️ {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleResend}
            disabled={resending || !email}
            className="btn-white w-full"
          >
            {resending ? '⏳ Sending...' : '📨 Resend Verification Email'}
          </button>

          <Link to="/login" className="btn-primary w-full block">
            Go to Login
          </Link>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          💡 The verification link will expire in 24 hours
        </p>
      </div>
    </div>
  )
}

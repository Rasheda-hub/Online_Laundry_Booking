import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { apiFetch } from '../api/client'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const nav = useNavigate()
  const token = searchParams.get('token')
  
  const [status, setStatus] = useState('verifying') // verifying, success, error
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid verification link')
      return
    }

    async function verifyEmail() {
      try {
        const response = await apiFetch(`/users/verify-email?token=${token}`)
        setStatus('success')
        setMessage(response.message || 'Email verified successfully!')
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          nav('/login')
        }, 3000)
      } catch (err) {
        setStatus('error')
        setMessage(err.message || 'Verification failed. The link may be invalid or expired.')
      }
    }

    verifyEmail()
  }, [token, nav])

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card text-center">
        {status === 'verifying' && (
          <>
            <div className="inline-flex h-20 w-20 rounded-full bg-gradient-to-br from-bubble-dark to-bubble-mid items-center justify-center text-5xl shadow-lg mb-6 mx-auto animate-pulse">
              ⏳
            </div>
            <h2 className="text-3xl font-bold mb-4">Verifying Your Email...</h2>
            <p className="text-gray-600">Please wait while we verify your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="inline-flex h-20 w-20 rounded-full bg-green-100 items-center justify-center text-5xl shadow-lg mb-6 mx-auto">
              ✅
            </div>
            <h2 className="text-3xl font-bold text-green-600 mb-4">Email Verified!</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <p className="text-lg text-gray-700 mb-3">{message}</p>
              <p className="text-sm text-gray-600">
                Redirecting you to login page in 3 seconds...
              </p>
            </div>
            <Link to="/login" className="btn-primary w-full">
              Go to Login Now
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="inline-flex h-20 w-20 rounded-full bg-red-100 items-center justify-center text-5xl shadow-lg mb-6 mx-auto">
              ❌
            </div>
            <h2 className="text-3xl font-bold text-red-600 mb-4">Verification Failed</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <p className="text-lg text-gray-700 mb-3">{message}</p>
              <p className="text-sm text-gray-600">
                The verification link may have expired or is invalid.
              </p>
            </div>
            <div className="space-y-3">
              <Link to="/verify-email-notice" className="btn-white w-full block">
                📨 Resend Verification Email
              </Link>
              <Link to="/login" className="btn-primary w-full block">
                Go to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

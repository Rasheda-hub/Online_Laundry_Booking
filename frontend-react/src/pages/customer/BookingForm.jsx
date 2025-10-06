import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { createBooking } from '../../api/bookings.js'

export default function BookingForm(){
  const { state } = useLocation()
  const nav = useNavigate()
  const { token } = useAuth()
  const providerId = state?.provider_id
  const category = state?.category
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!providerId || !category){
    return <div className="text-sm">Missing provider/category context. Go back to dashboard and select a category.</div>
  }

  async function onSubmit(e){
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await createBooking(token, {
        provider_id: providerId,
        category_id: category.id,
        weight_kg: parseFloat(weight),
        notes,
      })
      nav('/customer/orders')
    } catch (err){ setError(err.message) } finally { setLoading(false) }
  }

  return (
    <div className="max-w-xl mx-auto bg-white/80 p-5 rounded-2xl">
      <h2 className="text-xl font-semibold mb-2">Booking</h2>
      <div className="text-sm opacity-80 mb-4">{category.name} — {category.pricing_type === 'per_kilo' ? `₱${category.price} / kg` : `₱${category.price} for ${category.min_kilo||'?'}–${category.max_kilo||'?'} kg`}</div>
      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="text-sm">Weight (kg)</label>
          <input type="number" step="0.1" min="0.1" value={weight} onChange={e=>setWeight(e.target.value)} className="w-full px-3 py-2 rounded border" required />
        </div>
        <div className="text-xs opacity-70">Schedule will be set automatically based on current time.</div>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes (optional)" className="w-full px-3 py-2 rounded border" rows={3} />
        <button disabled={loading} className="px-4 py-2 rounded bg-bubble-dark text-white w-full">{loading ? 'Booking...' : 'Book Now'}</button>
      </form>
    </div>
  )
}

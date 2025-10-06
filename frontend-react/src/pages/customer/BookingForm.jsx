import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { createBooking } from '../../api/bookings.js'
import RealTimeClock from '../../components/RealTimeClock.jsx'

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

  const estimatedPrice = weight && category.pricing_type === 'per_kilo' 
    ? (parseFloat(weight) * category.price).toFixed(2)
    : category.pricing_type === 'fixed' ? category.price : '0.00'

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <button onClick={() => nav(-1)} className="btn-white text-sm">
        ← Back
      </button>
      
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-1">📝 Book Service</h2>
            <RealTimeClock className="text-xs text-gray-600" />
          </div>
          <div className="text-3xl">🧺</div>
        </div>
        
        <div className="bg-gradient-to-br from-bubble-light to-bubble-mid/30 rounded-xl p-4 mb-4">
          <div className="font-semibold text-lg mb-1">{category.name}</div>
          <div className="text-sm text-gray-700">
            {category.pricing_type === 'per_kilo' 
              ? `₱${category.price} per kilogram` 
              : `₱${category.price} fixed price (${category.min_kilo||'?'}–${category.max_kilo||'?'} kg)`
            }
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">
            ⚠️ {error}
          </div>
        )}
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Weight (kg) *</label>
            <input 
              type="number" 
              step="0.1" 
              min="0.1" 
              value={weight} 
              onChange={e=>setWeight(e.target.value)} 
              className="input text-lg" 
              placeholder="Enter weight in kg"
              required 
            />
            {category.pricing_type === 'fixed' && category.min_kilo && category.max_kilo && (
              <div className="text-xs text-gray-600 mt-1">
                Must be between {category.min_kilo} kg and {category.max_kilo} kg
              </div>
            )}
          </div>
          
          {weight && parseFloat(weight) > 0 && (
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-sm text-green-800 font-medium">Estimated Price</div>
              <div className="text-2xl font-bold text-green-900">₱{estimatedPrice}</div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-2">Notes (optional)</label>
            <textarea 
              value={notes} 
              onChange={e=>setNotes(e.target.value)} 
              placeholder="Any special instructions or requests..." 
              className="input" 
              rows={3} 
            />
          </div>
          
          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
            ℹ️ Your booking will be scheduled automatically based on the current time.
          </div>
          
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => nav(-1)}
              className="btn-white flex-1"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading} 
              className="btn-primary flex-1"
            >
              {loading ? '⏳ Booking...' : '✅ Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

export default function ProviderShop() {
  const { providerId } = useParams()
  const { token } = useAuth()
  const nav = useNavigate()
  
  const [provider, setProvider] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [weights, setWeights] = useState({}) // Track weight input for each category
  const [notes, setNotes] = useState({}) // Track notes for each category
  const [booking, setBooking] = useState(null) // Track which category is being booked

  useEffect(() => {
    fetchProviderAndCategories()
  }, [providerId])

  const fetchProviderAndCategories = async () => {
    try {
      setLoading(true)
      
      // Fetch provider details
      const providerRes = await fetch(`/users/${providerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!providerRes.ok) throw new Error('Failed to fetch provider')
      const providerData = await providerRes.json()
      setProvider(providerData)
      
      // Fetch provider's categories
      const categoriesRes = await fetch(`/categories/provider/${providerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!categoriesRes.ok) throw new Error('Failed to fetch categories')
      const categoriesData = await categoriesRes.json()
      setCategories(categoriesData)
      
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBookNow = async (category) => {
    const weight = parseFloat(weights[category.id])
    
    // Validate weight is entered
    if (!weight || weight <= 0) {
      alert('Please enter a valid weight')
      return
    }
    
    // Validate minimum weight
    if (category.min_kilo && weight < category.min_kilo) {
      alert(`Minimum weight is ${category.min_kilo} kg`)
      return
    }
    
    if (!provider.is_available) {
      alert('This shop is currently closed')
      return
    }

    setBooking(category.id)

    try {
      // Create booking directly
      const res = await fetch('/bookings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          provider_id: providerId,
          category_id: category.id,
          weight_kg: weight,
          notes: notes[category.id] || ''
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to create booking')
      }

      alert('✅ Booking placed successfully! The provider will review your order.')
      
      // Reset inputs for this category
      setWeights({ ...weights, [category.id]: category.min_kilo || 1 })
      setNotes({ ...notes, [category.id]: '' })
      
    } catch (err) {
      alert('❌ ' + err.message)
    } finally {
      setBooking(null)
    }
  }

  const handleWeightChange = (categoryId, value) => {
    setWeights({ ...weights, [categoryId]: value })
  }

  const handleNotesChange = (categoryId, value) => {
    setNotes({ ...notes, [categoryId]: value })
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-bubble-dark"></div>
        <p className="mt-4 text-gray-600">Loading shop...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card bg-red-50 text-red-700">
        <p>⚠️ {error}</p>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="card">
        <p>Provider not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/customer" className="btn-secondary">
          ← Back to Providers
        </Link>
        
        <Link to="/customer/orders" className="btn-primary">
          📋 My Orders
        </Link>
      </div>

      {/* Shop Header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold">{provider.shop_name}</h1>
              {provider.is_available ? (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                  🟢 Open
                </span>
              ) : (
                <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
                  🔴 Closed
                </span>
              )}
            </div>
            <p className="text-gray-600 mb-1">📍 {provider.shop_address}</p>
            <p className="text-gray-600">📞 {provider.contact_number}</p>
          </div>
        </div>
      </div>

      {!provider.is_available && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
            ⚠️ This shop is currently closed. You cannot place orders until the shop opens.
          </p>
        </div>
      )}

      {/* Services/Categories */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">🧺 Available Services</h2>
        
        {categories.length === 0 ? (
          <div className="card text-center text-gray-500">
            <p>No services available yet</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {categories.map(category => {
              const weight = weights[category.id] || ''
              const weightNum = parseFloat(weight) || 0
              
              // Calculate price based on type
              let price
              if (category.pricing_type === 'per_kilo') {
                price = category.price * weightNum
              } else {
                // Fixed price - multiply if weight exceeds max
                if (category.max_kilo && weightNum > category.max_kilo) {
                  const numBatches = Math.ceil(weightNum / category.max_kilo)
                  price = category.price * numBatches
                } else {
                  price = weightNum > 0 ? category.price : 0
                }
              }

              return (
                <div key={category.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Service Info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-1">{category.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">
                        {category.pricing_type === 'per_kilo' 
                          ? `₱${category.price.toFixed(2)} per kilo`
                          : `₱${category.price.toFixed(2)} fixed price`
                        }
                      </p>
                      {(category.min_kilo || category.max_kilo) && (
                        <p className="text-xs text-gray-500">
                          {category.min_kilo && `Min: ${category.min_kilo}kg`}
                          {category.min_kilo && category.max_kilo && ' • '}
                          {category.max_kilo && category.pricing_type === 'fixed' 
                            ? `${category.max_kilo}kg per batch (price multiplies if exceeded)`
                            : category.max_kilo && `Max: ${category.max_kilo}kg`
                          }
                        </p>
                      )}
                    </div>

                    {/* Booking Form */}
                    <div className="w-full md:w-auto">
                      <div className="flex flex-col gap-3">
                        {/* Weight Input */}
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium">Weight:</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={weight}
                            onChange={(e) => {
                              const val = e.target.value
                              // Allow empty, numbers, and decimal point
                              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                handleWeightChange(category.id, val)
                              }
                            }}
                            className="input w-24 text-center"
                            placeholder="0"
                          />
                          <span className="text-sm text-gray-600">kg</span>
                        </div>

                        {/* Notes Input */}
                        <textarea
                          value={notes[category.id] || ''}
                          onChange={(e) => handleNotesChange(category.id, e.target.value)}
                          placeholder="Special instructions (optional)"
                          className="input text-sm min-h-[60px]"
                          rows="2"
                        />

                        {/* Price & Book Button */}
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xl font-bold text-bubble-dark">
                            ₱{price.toFixed(2)}
                          </p>
                          <button
                            onClick={() => handleBookNow(category)}
                            disabled={booking === category.id || !provider.is_available}
                            className={`btn-primary ${
                              booking === category.id ? 'opacity-50' : ''
                            } ${!provider.is_available ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {booking === category.id ? '⏳ Booking...' : '📝 Book Now'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

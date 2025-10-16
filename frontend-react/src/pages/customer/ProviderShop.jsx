import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { getProviderReviews, getProviderRatingStats } from '../../api/reviews.js'

export default function ProviderShop() {
  const { providerId } = useParams()
  const { token } = useAuth()
  const nav = useNavigate()
  
  const [provider, setProvider] = useState(null)
  const [categories, setCategories] = useState([])
  const [reviews, setReviews] = useState([])
  const [ratingStats, setRatingStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [weights, setWeights] = useState({}) // Track weight input for each category
  const [notes, setNotes] = useState({}) // Track notes for each category
  const [booking, setBooking] = useState(null) // Track which category is being booked
  const [showAllReviews, setShowAllReviews] = useState(false)

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
      
      // Fetch reviews and rating stats
      const [reviewsData, statsData] = await Promise.all([
        getProviderReviews(providerId),
        getProviderRatingStats(providerId)
      ])
      setReviews(reviewsData)
      setRatingStats(statsData)
      
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
    <div className="max-w-4xl mx-auto px-2 sm:px-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-6">
        <Link to="/customer" className="btn-secondary text-xs sm:text-sm whitespace-nowrap">
          ← Back
        </Link>
        
        <Link to="/customer/orders" className="btn-primary text-xs sm:text-sm whitespace-nowrap">
          📋 Orders
        </Link>
      </div>

      {/* Shop Header */}
      <div className="card mb-6 overflow-hidden">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2 min-w-0">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">{provider.shop_name}</h1>
              {ratingStats && ratingStats.total_reviews > 0 && (
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-700">
                  <span className="font-semibold text-bubble-dark">{ratingStats.average_rating}</span>
                  <span className="text-yellow-500">{'⭐'.repeat(Math.round(ratingStats.average_rating))}</span>
                  <span className="text-gray-500">({ratingStats.total_reviews})</span>
                </div>
              )}
            </div>
            {provider.is_available ? (
              <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-700 text-xs sm:text-sm font-semibold rounded-full whitespace-nowrap flex-shrink-0">
                🟢 Open
              </span>
            ) : (
              <span className="px-2 sm:px-3 py-1 bg-red-100 text-red-700 text-xs sm:text-sm font-semibold rounded-full whitespace-nowrap flex-shrink-0">
                🔴 Closed
              </span>
            )}
          </div>
          <p className="text-sm sm:text-base text-gray-600 break-words">📍 {provider.shop_address}</p>
          <p className="text-sm sm:text-base text-gray-600 break-words">📞 {provider.contact_number}</p>
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
        <h2 className="text-lg sm:text-xl font-bold mb-4">🧺 Available Services</h2>
        
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
                <div key={category.id} className="card hover:shadow-lg transition-shadow overflow-hidden">
                  <div className="flex flex-col gap-4">
                    {/* Service Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold mb-1 truncate">{category.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">
                        {category.pricing_type === 'per_kilo' 
                          ? `₱${category.price.toFixed(2)} per kilo`
                          : `₱${category.price.toFixed(2)} fixed price`
                        }
                      </p>
                      {(category.min_kilo || category.max_kilo) && (
                        <p className="text-xs text-gray-500 break-words">
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
                    <div className="w-full">
                      <div className="flex flex-col gap-3">
                        {/* Weight Input */}
                        <div className="flex items-center gap-2">
                          <label className="text-xs sm:text-sm font-medium whitespace-nowrap">Weight:</label>
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
                            className="input w-20 sm:w-24 text-center text-sm"
                            placeholder="0"
                          />
                          <span className="text-xs sm:text-sm text-gray-600">kg</span>
                        </div>

                        {/* Notes Input */}
                        <textarea
                          value={notes[category.id] || ''}
                          onChange={(e) => handleNotesChange(category.id, e.target.value)}
                          placeholder="Special instructions (optional)"
                          className="input text-xs sm:text-sm min-h-[60px] w-full"
                          rows="2"
                        />

                        {/* Price & Book Button */}
                        <div className="flex items-center justify-between gap-2 sm:gap-3">
                          <p className="text-lg sm:text-xl font-bold text-bubble-dark truncate">
                            ₱{price.toFixed(2)}
                          </p>
                          <button
                            onClick={() => handleBookNow(category)}
                            disabled={booking === category.id || !provider.is_available}
                            className={`btn-primary text-xs sm:text-sm whitespace-nowrap ${
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

      {/* Reviews Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold">⭐ Reviews & Ratings</h2>
        </div>

        {ratingStats && ratingStats.total_reviews > 0 ? (
          <div className="space-y-4">
            {/* Rating Summary */}
            <div className="card">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-bubble-dark">{ratingStats.average_rating}</div>
                  <div className="text-yellow-500 text-2xl">
                    {'⭐'.repeat(Math.round(ratingStats.average_rating))}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {ratingStats.total_reviews} review{ratingStats.total_reviews !== 1 ? 's' : ''}
                  </div>
                </div>
                
                <div className="flex-1 space-y-1">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = ratingStats.rating_distribution[star] || 0
                    const percentage = ratingStats.total_reviews > 0 
                      ? (count / ratingStats.total_reviews * 100).toFixed(0) 
                      : 0
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-8">{star}⭐</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-yellow-500 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="w-8 text-gray-600">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-3">
              {(showAllReviews ? reviews : reviews.slice(0, 3)).map(review => (
                <div key={review.id} className="card">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold text-sm">{review.customer_name || 'Customer'}</div>
                      <div className="text-yellow-500 text-sm">
                        {'⭐'.repeat(review.rating)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-700 break-words">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>

            {reviews.length > 3 && (
              <button
                onClick={() => setShowAllReviews(!showAllReviews)}
                className="btn-white w-full text-sm"
              >
                {showAllReviews ? 'Show Less' : `Show All ${reviews.length} Reviews`}
              </button>
            )}
          </div>
        ) : (
          <div className="card text-center text-gray-500">
            <div className="text-4xl mb-2">⭐</div>
            <p>No reviews yet</p>
            <p className="text-xs mt-1">Be the first to review this shop!</p>
          </div>
        )}
      </div>
    </div>
  )
}

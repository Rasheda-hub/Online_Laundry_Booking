import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { listMyBookings } from '../../api/bookings.js'
import { checkBookingReview, getReview } from '../../api/reviews.js'
import { formatDateTime } from '../../components/RealTimeClock.jsx'
import ReviewForm from '../../components/ReviewForm.jsx'

export default function Orders(){
  const { token } = useAuth()
  const nav = useNavigate()
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [reviewedBookings, setReviewedBookings] = useState(new Set())
  const [reviewIdByBooking, setReviewIdByBooking] = useState({})
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [existingReview, setExistingReview] = useState(null)

  useEffect(()=>{
    (async ()=>{
      try {
        const data = await listMyBookings(token)
        setOrders(data)
        
        // Check which completed bookings have reviews
        const completedOrders = data.filter(o => o.status === 'completed')
        const reviewChecks = await Promise.all(
          completedOrders.map(o => checkBookingReview(token, o.id).catch(() => ({ has_review: false })))
        )
        const reviewed = new Set()
        const map = {}
        completedOrders.forEach((o, idx) => {
          if (reviewChecks[idx]?.has_review) {
            reviewed.add(o.id)
            if (reviewChecks[idx]?.review_id) map[o.id] = reviewChecks[idx].review_id
          }
        })
        setReviewedBookings(reviewed)
        setReviewIdByBooking(map)

        // Auto-open review modal for the first completed booking without a review
        const firstUnreviewed = completedOrders.find(o => !reviewed.has(o.id))
        if (firstUnreviewed) {
          setSelectedBooking(firstUnreviewed)
          setExistingReview(null)
          setShowReviewForm(true)
        }
      } catch(e){ setError(e.message) } finally { setLoading(false) }
    })()
  }, [token])

  const handleReviewClick = (booking) => {
    setSelectedBooking(booking)
    setExistingReview(null)
    setShowReviewForm(true)
  }

  const handleEditReviewClick = async (booking) => {
    try {
      const rid = reviewIdByBooking[booking.id]
      if (!rid) return
      const rev = await getReview(token, rid)
      setExistingReview(rev)
      setSelectedBooking(booking)
      setShowReviewForm(true)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleReviewSuccess = () => {
    setShowReviewForm(false)
    setReviewedBookings(prev => new Set([...prev, selectedBooking.id]))
    setSelectedBooking(null)
    setExistingReview(null)
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-sm text-red-600">{error}</div>

  return (
    <div className="space-y-4 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">My Orders</h2>
        <button onClick={() => nav('/receipts')} className="btn-white text-xs sm:text-sm whitespace-nowrap">
          🧾 View Receipts
        </button>
      </div>
      
      {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}
      
      {orders.length === 0 && (
        <div className="card text-center py-8">
          <div className="text-4xl mb-2">📦</div>
          <div className="text-gray-600">No orders yet</div>
          <button onClick={() => nav('/customer')} className="btn-primary mt-4">Book Now</button>
        </div>
      )}
      
      <div className="grid gap-3">
        {orders.map(o => (
          <div key={o.id} className="card hover:shadow-lg transition-shadow overflow-hidden">
            <div className="flex items-start justify-between mb-2 gap-2">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-base sm:text-lg truncate">{o.category_name}</div>
                <div className="text-xs text-gray-500">Order #{o.id.slice(0,8)}</div>
                {o.provider_shop_name && (
                  <div className="text-xs text-gray-600 mt-1">
                    🏪 {o.provider_shop_name}
                  </div>
                )}
              </div>
              <div className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${statusColor(o.status)}`}>
                {formatStatus(o.status)}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div className="bg-gray-50 p-2 rounded min-w-0">
                <div className="text-xs text-gray-500">Weight</div>
                <div className="font-semibold truncate">{o.weight_kg} kg</div>
              </div>
              <div className="bg-gray-50 p-2 rounded min-w-0">
                <div className="text-xs text-gray-500">Total</div>
                <div className="font-semibold text-bubble-dark truncate">₱{o.total_price}</div>
              </div>
            </div>
            
            <div className="text-xs text-gray-600 mb-3 break-words">
              📅 {formatDateTime(o.schedule_at)}
            </div>
            
            {o.status === 'pending' && (
              <div className="bg-yellow-50 text-yellow-800 text-xs p-2 rounded break-words">
                ⏳ Waiting for provider to accept your booking
              </div>
            )}
            
            {o.status === 'confirmed' && (
              <div className="bg-green-50 text-green-800 text-xs p-2 rounded break-words">
                ✅ Booking accepted! Please pay and deliver your laundry to the shop.
              </div>
            )}
            
            {o.status === 'in_progress' && (
              <div className="bg-blue-50 text-blue-800 text-xs p-2 rounded break-words">
                🌀 Your laundry is being processed
              </div>
            )}
            
            {o.status === 'ready' && (
              <div className="bg-purple-50 text-purple-800 text-xs p-2 rounded break-words">
                📦 Your laundry is ready for pickup!
              </div>
            )}
            
            {o.status === 'completed' && (
              <div className="flex gap-2">
                <button 
                  onClick={() => nav('/receipts')}
                  className="btn-white flex-1 text-sm"
                >
                  🧾 View Receipt
                </button>
                {!reviewedBookings.has(o.id) ? (
                  <button 
                    onClick={() => handleReviewClick(o)}
                    className="btn-primary flex-1 text-sm"
                  >
                    ⭐ Leave Review
                  </button>
                ) : (
                  <button
                    onClick={() => handleEditReviewClick(o)}
                    className="btn-white flex-1 text-sm"
                  >
                    ✏️ Edit Review
                  </button>
                )}
              </div>
            )}
            
            {o.status === 'rejected' && (
              <div className="bg-red-50 text-red-800 text-xs p-2 rounded break-words">
                ❌ This booking was rejected by the provider
              </div>
            )}
          </div>
        ))}
      </div>

      {showReviewForm && selectedBooking && (
        <ReviewForm
          booking={selectedBooking}
          existingReview={existingReview}
          onSuccess={handleReviewSuccess}
          onCancel={() => {
            setShowReviewForm(false)
            setSelectedBooking(null)
            setExistingReview(null)
          }}
        />
      )}
    </div>
  )
}

function statusColor(s){
  switch(s){
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'confirmed': return 'bg-green-100 text-green-800'
    case 'in_progress': return 'bg-blue-100 text-blue-800'
    case 'ready': return 'bg-purple-100 text-purple-800'
    case 'completed': return 'bg-gray-100 text-gray-800'
    case 'rejected': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function formatStatus(s) {
  switch(s){
    case 'pending': return '⏳ Pending'
    case 'confirmed': return '✅ Confirmed'
    case 'in_progress': return '🌀 In Progress'
    case 'ready': return '📦 Ready'
    case 'completed': return '✔️ Completed'
    case 'rejected': return '❌ Rejected'
    default: return s
  }
}

import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCart } from '../../context/CartContext.jsx'

export default function Cart() {
  const { token } = useAuth()
  const { cart, removeFromCart, updateItemWeight, clearCart, getCartTotal, getCartItemCount } = useCart()
  const nav = useNavigate()
  
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleRemoveItem = (itemId) => {
    if (window.confirm('Remove this item from cart?')) {
      removeFromCart(itemId)
    }
  }

  const handleWeightChange = (itemId, newWeight) => {
    updateItemWeight(itemId, newWeight)
  }

  const handleSubmitOrder = async () => {
    if (cart.items.length === 0) {
      alert('Your cart is empty')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      // Create booking with multiple items (real-time, no schedule needed)
      const bookingData = {
        provider_id: cart.providerId,
        items: cart.items.map(item => ({
          category_id: item.categoryId,
          weight_kg: item.weight
        })),
        notes: notes || 'No special instructions'
      }

      const res = await fetch('/bookings/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || 'Failed to create booking')
      }

      const result = await res.json()
      
      // Clear cart
      clearCart()
      
      // Navigate to orders page
      nav('/customer/orders', { 
        state: { message: 'Order placed successfully! Waiting for provider confirmation.' }
      })
      
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold mb-2">Your Cart is Empty</h2>
          <p className="text-gray-600 mb-6">Browse laundry shops and add services to your cart</p>
          <Link to="/customer" className="btn-primary inline-block">
            Browse Shops
          </Link>
        </div>
      </div>
    )
  }

  const total = getCartTotal()
  const itemCount = getCartItemCount()

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">🛒 Your Cart</h1>

      {/* Provider Info */}
      <div className="card mb-6 bg-bubble-light">
        <h2 className="font-bold text-lg mb-1">📍 {cart.providerName}</h2>
        <p className="text-sm text-gray-600">📞 {cart.providerContact}</p>
      </div>

      {error && (
        <div className="card bg-red-50 text-red-700 mb-6">
          ⚠️ {error}
        </div>
      )}

      {/* Cart Items */}
      <div className="card mb-6">
        <h2 className="font-bold text-lg mb-4">Order Items ({itemCount})</h2>
        
        <div className="space-y-4">
          {cart.items.map((item, index) => (
            <div key={item.id} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
              <div className="flex-1">
                <h3 className="font-semibold">{item.categoryName}</h3>
                <p className="text-sm text-gray-600">
                  {item.pricingType === 'per_kilo' 
                    ? `₱${item.price.toFixed(2)} per kilo`
                    : `₱${item.price.toFixed(2)} fixed`
                  }
                </p>
                
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    min={item.minKilo || 0.5}
                    max={item.maxKilo || 100}
                    step="0.5"
                    value={item.weight}
                    onChange={(e) => handleWeightChange(item.id, e.target.value)}
                    className="input w-24 text-sm"
                  />
                  <span className="text-sm text-gray-600">kg</span>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-bold text-lg text-bubble-dark mb-2">
                  ₱{item.subtotal.toFixed(2)}
                </p>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  🗑️ Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Details */}
      <div className="card mb-6">
        <h2 className="font-bold text-lg mb-4">📝 Order Details</h2>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <p className="text-blue-800">
              📅 <strong>Order Time:</strong> Your order will be placed immediately. 
              You can drop off your laundry anytime during shop hours.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              📋 Special Instructions (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests or instructions..."
              className="input min-h-[100px]"
              rows="4"
            />
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="card mb-6 bg-gradient-to-br from-bubble-light to-white">
        <h2 className="font-bold text-lg mb-4">💰 Order Summary</h2>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
            <span>₱{total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Service Fee</span>
            <span>₱0.00</span>
          </div>
          <div className="border-t pt-2 flex justify-between text-xl font-bold">
            <span>Total Amount</span>
            <span className="text-bubble-dark">₱{total.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          <p className="font-semibold mb-1">💵 Payment Method: Cash</p>
          <p className="text-xs">
            After the provider accepts your order, bring your laundry to the shop and pay ₱{total.toFixed(2)} in cash. 
            Your order status will update to "In Progress" once payment is confirmed.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={() => nav('/customer')}
          className="btn-secondary flex-1"
        >
          ← Continue Shopping
        </button>
        <button
          onClick={handleSubmitOrder}
          disabled={submitting}
          className="btn-primary flex-1"
        >
          {submitting ? '⏳ Placing Order...' : '✅ Place Order Now'}
        </button>
      </div>

      {/* Clear Cart */}
      <div className="text-center">
        <button
          onClick={() => {
            if (window.confirm('Clear all items from cart?')) {
              clearCart()
            }
          }}
          className="text-red-600 hover:text-red-700 text-sm"
        >
          🗑️ Clear Cart
        </button>
      </div>
    </div>
  )
}

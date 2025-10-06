import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { listMyBookings } from '../../api/bookings.js'

export default function Orders(){
  const { token } = useAuth()
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    (async ()=>{
      try {
        const data = await listMyBookings(token)
        setOrders(data)
      } catch(e){ setError(e.message) } finally { setLoading(false) }
    })()
  }, [token])

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-sm text-red-600">{error}</div>

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold">My Orders</h2>
      <div className="grid gap-3">
        {orders.map(o => (
          <div key={o.id} className="card">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{o.category_name}</div>
              <div className={`px-2 py-1 rounded text-xs ${statusColor(o.status)}`}>{o.status}</div>
            </div>
            <div className="text-sm opacity-80">Weight: {o.weight_kg} kg • Total: ₱{o.total_price}</div>
            <div className="text-xs opacity-60">#{o.id.slice(0,8)} • {new Date(o.schedule_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function statusColor(s){
  switch(s){
    case 'pending': return 'bg-yellow-100'
    case 'in_progress': return 'bg-blue-100'
    case 'ready': return 'bg-purple-100'
    case 'completed': return 'bg-green-100'
    case 'rejected': return 'bg-red-100'
    default: return 'bg-gray-100'
  }
}

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { apiFetch } from '../../api/client.js'
import { searchProviders } from '../../api/users.js'
import NotificationsBell from '../../components/NotificationsBell.jsx'
import RealTimeClock from '../../components/RealTimeClock.jsx'

export default function CustomerDashboard(){
  const { user, token } = useAuth()
  const nav = useNavigate()
  const [providers, setProviders] = useState([])
  const [selectedProvider, setSelectedProvider] = useState('')
  const [categories, setCategories] = useState([])
  const [error, setError] = useState('')

  useEffect(()=>{
    // Use dedicated endpoint for approved providers
    (async ()=>{
      try {
        const res = await apiFetch('/users/providers/approved')
        setProviders(res)
      } catch(e){ setError(e.message) }
    })()
  }, [])

  async function loadCategories(pid){
    setError('')
    try {
      const list = await apiFetch(`/categories/provider/${pid}`)
      setCategories(list)
    } catch(e){ setError(e.message) }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Welcome{user?.full_name ? `, ${user.full_name}`:''} 👋</h2>
          <RealTimeClock className="text-xs text-gray-600 mt-1" />
        </div>
        <div className="flex gap-2">
          <NotificationsBell />
          <button onClick={()=>nav('/customer/orders')} className="btn-white text-sm">📦 My Orders</button>
        </div>
      </div>

      <div className="card">
        <div className="mb-3 font-semibold text-lg">🏪 Choose Provider</div>
        <ProviderSearch onResults={setProviders} />
        {providers.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <div className="text-3xl mb-2">🔍</div>
            <div className="text-sm">No providers found. Try searching!</div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {providers.map(p=> (
            <button 
              key={p.id} 
              onClick={()=>{setSelectedProvider(p.id); loadCategories(p.id)}} 
              className={`p-3 rounded-xl text-left transition-all ${
                selectedProvider===p.id 
                  ? 'bg-gradient-to-br from-bubble-dark to-bubble-mid text-white shadow-lg scale-105' 
                  : 'bg-white hover:shadow-md hover:scale-102'
              }`}
            >
              <div className="font-semibold">{p.shop_name || p.email}</div>
              {p.shop_address && <div className="text-xs mt-1 opacity-80">📍 {p.shop_address}</div>}
              {p.contact_number && <div className="text-xs opacity-80">📞 {p.contact_number}</div>}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {selectedProvider && categories.length === 0 && (
        <div className="card text-center py-6">
          <div className="text-3xl mb-2">🧖</div>
          <div className="text-gray-600">No services available from this provider</div>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="card hover:shadow-xl transition-all hover:scale-105">
            <div className="text-4xl mb-2">{iconFor(cat.name)}</div>
            <div className="font-semibold text-lg">{cat.name}</div>
            <div className="text-sm text-gray-600 mb-3">
              {cat.pricing_type === 'per_kilo' ? `₱${cat.price} / kg` : `₱${cat.price} for ${cat.min_kilo||'?'}–${cat.max_kilo||'?'} kg`}
            </div>
            <button 
              onClick={()=>nav('/customer/book', { state: { provider_id: cat.provider_id, category: cat } })} 
              className="btn-primary w-full"
            >
              📝 Book Now
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function iconFor(name){
  const n = name.toLowerCase()
  if (n.includes('comforter') || n.includes('blanket')) return '🛏️'
  if (n.includes('towel')) return '🧻'
  if (n.includes('dry')) return '👔'
  return '🧺'
}

// Search component for providers by name/address
function ProviderSearch({ onResults }){
  const [q, setQ] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [err, setErr] = React.useState('')
  async function onSearch(e){
    e?.preventDefault?.()
    setErr(''); setLoading(true)
    try {
      const list = await searchProviders(q)
      onResults(list)
    } catch(e){ setErr(e.message) } finally { setLoading(false) }
  }
  return (
    <div className="mb-3">
      <form onSubmit={onSearch} className="flex gap-2">
        <input 
          value={q} 
          onChange={e=>setQ(e.target.value)} 
          placeholder="Search by shop name or address" 
          className="input flex-1 text-sm" 
        />
        <button className="btn-primary text-sm whitespace-nowrap">
          {loading ? '🔍 Searching…' : '🔍 Search'}
        </button>
      </form>
      {err && <div className="text-xs text-red-600 mt-2">{err}</div>}
    </div>
  )
}

// removed Orders cart UI; restored booking flow

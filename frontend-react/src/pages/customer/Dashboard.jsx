import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { apiFetch } from '../../api/client.js'
import { searchProviders } from '../../api/users.js'
import BottomNav from '../../components/BottomNav.jsx'
import NotificationsBell from '../../components/NotificationsBell.jsx'

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
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Welcome{user?.full_name ? `, ${user.full_name}`:''}</h2>
        <div className="flex gap-2">
          <NotificationsBell />
          <button onClick={()=>nav('/customer/orders')} className="btn-white">My Orders</button>
        </div>
      </div>

      <div className="card">
        <div className="mb-3 font-medium">Choose Provider</div>
        <ProviderSearch onResults={setProviders} />
        <div className="flex gap-2 flex-wrap">
          {providers.map(p=> (
            <button key={p.id} onClick={()=>{setSelectedProvider(p.id); loadCategories(p.id)}} className={`chip ${selectedProvider===p.id? 'bg-bubble-dark text-white':'bg-white'}`}>
              <div className="text-left">
                <div className="font-medium">{p.shop_name || p.email}</div>
                {p.shop_address && <div className="text-[11px] opacity-70">{p.shop_address}</div>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid md:grid-cols-3 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="card">
            <div className="text-2xl">{iconFor(cat.name)}</div>
            <div className="font-semibold mt-2">{cat.name}</div>
            <div className="text-sm opacity-80">
              {cat.pricing_type === 'per_kilo' ? `₱${cat.price} / kg` : `₱${cat.price} for ${cat.min_kilo||'?'}–${cat.max_kilo||'?'} kg`}
            </div>
            <button onClick={()=>nav('/customer/book', { state: { provider_id: cat.provider_id, category: cat } })} className="mt-3 btn-primary w-full">Book</button>
          </div>
        ))}
      </div>
      <BottomNav />
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
    <form onSubmit={onSearch} className="mb-3 flex gap-2">
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by shop name or address" className="input flex-1" />
      <button className="btn-primary">{loading ? 'Searching…' : 'Search'}</button>
      {err && <div className="text-xs text-red-600 ml-2 self-center">{err}</div>}
    </form>
  )
}

// removed Orders cart UI; restored booking flow

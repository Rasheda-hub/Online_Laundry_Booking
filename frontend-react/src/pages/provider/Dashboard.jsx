import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { listMyCategories, createCategory, updateCategory, deleteCategory } from '../../api/categories.js'
import { listMyBookings, acceptBooking, rejectBooking, updateBookingStatus } from '../../api/bookings.js'
import NotificationsBell from '../../components/NotificationsBell.jsx'
import RealTimeClock, { formatDateTime } from '../../components/RealTimeClock.jsx'

export default function ProviderDashboard(){
  const { user, token } = useAuth()
  const [tab, setTab] = useState('summary')
  const [error, setError] = useState('')

  // Categories
  const emptyCat = { name:'', pricing_type:'per_kilo', price:'', min_kilo:'', max_kilo:'' }
  const [categories, setCategories] = useState([])
  const [catForm, setCatForm] = useState(emptyCat)
  const [editingId, setEditingId] = useState('')

  // Bookings
  const [bookings, setBookings] = useState([])

  async function refreshAll(){
    setError('')
    try {
      const [cats, bks] = await Promise.all([
        listMyCategories(token),
        listMyBookings(token),
      ])
      setCategories(cats)
      setBookings(bks)
    } catch(e){ setError(e.message) }
  }

  useEffect(()=>{ refreshAll() }, [token])

  async function saveCategory(e){
    e.preventDefault()
    setError('')
    try {
      if (editingId){
        await updateCategory(token, editingId, normalizeCat(catForm))
      } else {
        await createCategory(token, normalizeCat(catForm))
      }
      setCatForm(emptyCat); setEditingId('')
      refreshAll()
    } catch(e){ setError(e.message) }
  }

  function normalizeCat(c){
    const out = { name: c.name, pricing_type: c.pricing_type, price: parseFloat(c.price) }
    if (c.pricing_type === 'fixed'){
      out.min_kilo = c.min_kilo ? parseFloat(c.min_kilo) : null
      out.max_kilo = c.max_kilo ? parseFloat(c.max_kilo) : null
    }
    return out
  }

  function startEdit(cat){
    setEditingId(cat.id)
    setCatForm({
      name: cat.name,
      pricing_type: cat.pricing_type,
      price: String(cat.price),
      min_kilo: cat.min_kilo ?? '',
      max_kilo: cat.max_kilo ?? '',
    })
  }

  async function removeCategory(id){
    setError('')
    try { await deleteCategory(token, id); refreshAll() } catch(e){ setError(e.message) }
  }

  async function onAccept(id){
    setError('')
    try { await acceptBooking(token, id); refreshAll() } catch(e){ setError(e.message) }
  }
  async function onReject(id){
    setError('')
    try { await rejectBooking(token, id); refreshAll() } catch(e){ setError(e.message) }
  }
  async function onStatus(id, st){
    setError('')
    try { await updateBookingStatus(token, id, st); refreshAll() } catch(e){ setError(e.message) }
  }

  const stats = summarize(bookings)

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Provider Dashboard</h2>
          <RealTimeClock className="text-xs text-gray-600 mt-1" />
        </div>
        <div className="flex items-center gap-2">
          <NotificationsBell />
        </div>
      </div>
      
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button onClick={()=>setTab('summary')} className={`btn whitespace-nowrap ${tab==='summary'?'bg-bubble-dark text-white':'btn-white'}`}>📊 Dashboard</button>
        <button onClick={()=>setTab('categories')} className={`btn whitespace-nowrap ${tab==='categories'?'bg-bubble-dark text-white':'btn-white'}`}>🏷️ Categories</button>
        <button onClick={()=>setTab('bookings')} className={`btn whitespace-nowrap ${tab==='bookings'?'bg-bubble-dark text-white':'btn-white'}`}>📦 Bookings</button>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {tab === 'summary' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard title="Total" value={stats.total} emoji="📦" color="bg-gradient-to-br from-blue-100 to-blue-50" />
          <StatCard title="Pending" value={stats.pending} emoji="⏳" color="bg-gradient-to-br from-yellow-100 to-yellow-50" />
          <StatCard title="In Progress" value={stats.in_progress} emoji="🌀" color="bg-gradient-to-br from-purple-100 to-purple-50" />
          <StatCard title="Completed" value={stats.completed} emoji="✅" color="bg-gradient-to-br from-green-100 to-green-50" />
        </div>
      )}

      {tab === 'categories' && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="font-semibold mb-3">{editingId ? 'Edit' : 'Create'} Category</h3>
            <form onSubmit={saveCategory} className="space-y-3">
              <input value={catForm.name} onChange={e=>setCatForm({...catForm, name:e.target.value})} placeholder="Name" className="input" required />
              <select value={catForm.pricing_type} onChange={e=>setCatForm({...catForm, pricing_type:e.target.value})} className="input">
                <option value="per_kilo">Per Kilo</option>
                <option value="fixed">Fixed</option>
              </select>
              <input type="number" step="0.1" min="0" value={catForm.price} onChange={e=>setCatForm({...catForm, price:e.target.value})} placeholder="Price" className="input" required />
              {catForm.pricing_type === 'fixed' && (
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" step="0.1" min="0" value={catForm.min_kilo} onChange={e=>setCatForm({...catForm, min_kilo:e.target.value})} placeholder="Min kg" className="input" />
                  <input type="number" step="0.1" min="0" value={catForm.max_kilo} onChange={e=>setCatForm({...catForm, max_kilo:e.target.value})} placeholder="Max kg" className="input" />
                </div>
              )}
              <div className="flex gap-2">
                <button className="btn-primary">{editingId? 'Update':'Create'}</button>
                {editingId && <button type="button" onClick={()=>{setEditingId('');setCatForm(emptyCat)}} className="btn-white">Cancel</button>}
              </div>
            </form>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-3">Your Categories</h3>
            <div className="grid gap-2">
              {categories.map(c => (
                <div key={c.id} className="flex items-center justify-between bg-white rounded p-3">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs opacity-70">{c.pricing_type === 'per_kilo' ? `₱${c.price} / kg` : `₱${c.price} for ${c.min_kilo||'?'}–${c.max_kilo||'?'} kg`}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>startEdit(c)} className="btn-white px-3 py-1">Edit</button>
                    <button onClick={()=>removeCategory(c.id)} className="btn-danger px-3 py-1">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'bookings' && (
        <div className="grid gap-3">
          {bookings.length === 0 && (
            <div className="card text-center py-8">
              <div className="text-4xl mb-2">📦</div>
              <div className="text-gray-600">No bookings yet</div>
            </div>
          )}
          {bookings.map(b => (
            <div key={b.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-semibold text-lg">{b.category_name}</div>
                  <div className="text-xs text-gray-500">Booking #{b.id.slice(0,8)}</div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(b.status)}`}>
                  {getStatusLabel(b.status)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-xs text-gray-500">Weight</div>
                  <div className="font-semibold">{b.weight_kg} kg</div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-xs text-gray-500">Total</div>
                  <div className="font-semibold text-bubble-dark">₱{b.total_price}</div>
                </div>
              </div>
              
              <div className="text-xs text-gray-600 mb-3">
                📅 {formatDateTime(b.schedule_at)}
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Status:</label>
                <select
                  value={b.status}
                  onChange={(e)=>{
                    const st = e.target.value
                    if (st === 'rejected') return onReject(b.id)
                    if (st === 'in_progress' && b.status === 'pending') return onAccept(b.id)
                    onStatus(b.id, st)
                  }}
                  className="input flex-1 text-sm"
                >
                  <option value="pending">⏳ Pending</option>
                  <option value="in_progress">🌀 In Progress</option>
                  <option value="ready">✅ Ready to Pickup</option>
                  <option value="completed">✔️ Completed</option>
                  <option value="rejected">❌ Rejected</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, emoji, color }){
  return (
    <div className={`${color} p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow`}>
      <div className="text-3xl mb-1">{emoji}</div>
      <div className="text-xs text-gray-600 font-medium">{title}</div>
      <div className="text-2xl md:text-3xl font-bold text-gray-800">{value}</div>
    </div>
  )
}

function getStatusColor(s){
  switch(s){
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'in_progress': return 'bg-blue-100 text-blue-800'
    case 'ready': return 'bg-purple-100 text-purple-800'
    case 'completed': return 'bg-green-100 text-green-800'
    case 'rejected': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getStatusLabel(s) {
  switch(s){
    case 'pending': return '⏳ Pending'
    case 'in_progress': return '🌀 In Progress'
    case 'ready': return '✅ Ready'
    case 'completed': return '✔️ Completed'
    case 'rejected': return '❌ Rejected'
    default: return s
  }
}

function summarize(items){
  const s = { total: items.length, pending:0, in_progress:0, completed:0 }
  items.forEach(b=>{ if (s[b.status] !== undefined) s[b.status]++ })
  return s
}

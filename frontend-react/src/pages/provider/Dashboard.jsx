import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { listMyCategories, createCategory, updateCategory, deleteCategory } from '../../api/categories.js'
import { listMyBookings, acceptBooking, rejectBooking, updateBookingStatus, confirmPayment, updateBookingDetails } from '../../api/bookings.js'
import { toggleAvailability } from '../../api/users.js'
import RealTimeClock, { formatDateTime } from '../../components/RealTimeClock.jsx'

export default function ProviderDashboard(){
  const { user, token } = useAuth()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState('summary')
  const [error, setError] = useState('')

  // Categories
  const emptyCat = { name:'', pricing_type:'per_kilo', price:'', min_kilo:'', max_kilo:'' }
  const [categories, setCategories] = useState([])
  const [catForm, setCatForm] = useState(emptyCat)
  const [editingId, setEditingId] = useState('')

  // Bookings
  const [bookings, setBookings] = useState([])
  const [editingBooking, setEditingBooking] = useState(null)
  const [editForm, setEditForm] = useState({ weight_kg: '', notes: '' })

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

  // Check if we should open bookings tab from URL parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'bookings') {
      setTab('bookings')
    }
  }, [searchParams])

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
  async function onConfirmPayment(id){
    setError('')
    try { await confirmPayment(token, id); refreshAll() } catch(e){ setError(e.message) }
  }

  function startEditBooking(booking){
    setEditingBooking(booking.id)
    setEditForm({
      weight_kg: String(booking.weight_kg),
      notes: booking.notes || ''
    })
  }

  function cancelEditBooking(){
    setEditingBooking(null)
    setEditForm({ weight_kg: '', notes: '' })
  }

  async function saveBookingEdit(e){
    e.preventDefault()
    setError('')
    try {
      const payload = {}
      if (editForm.weight_kg) payload.weight_kg = parseFloat(editForm.weight_kg)
      if (editForm.notes !== undefined) payload.notes = editForm.notes
      await updateBookingDetails(token, editingBooking, payload)
      cancelEditBooking()
      refreshAll()
    } catch(e){ setError(e.message) }
  }

  async function onToggleAvailability(){
    setError('')
    try { 
      await toggleAvailability(token)
      // Refresh user data to get updated availability status
      window.location.reload()
    } catch(e){ setError(e.message) }
  }

  const stats = summarize(bookings)

  return (
    <div className="space-y-4 max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl md:text-3xl font-bold truncate">Provider Dashboard</h2>
          <RealTimeClock className="text-xs text-gray-600 mt-1" />
        </div>
        <button 
          onClick={onToggleAvailability}
          className={`btn text-sm whitespace-nowrap ${
            user?.is_available === false 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {user?.is_available === false ? '🔴 Shop Closed - Click to Open' : '🟢 Shop Open - Click to Close'}
        </button>
      </div>
      
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
        <button onClick={()=>setTab('summary')} className={`btn whitespace-nowrap ${tab==='summary'?'bg-bubble-dark text-white':'btn-white'}`}>📊 Dashboard</button>
        <button onClick={()=>setTab('categories')} className={`btn whitespace-nowrap ${tab==='categories'?'bg-bubble-dark text-white':'btn-white'}`}>🏷️ Categories</button>
        <button onClick={()=>setTab('bookings')} className={`btn whitespace-nowrap ${tab==='bookings'?'bg-bubble-dark text-white':'btn-white'}`}>📦 Bookings</button>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {tab === 'summary' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard title="Total" value={stats.total} emoji="📊" color="bg-gradient-to-br from-blue-100 to-blue-50" />
          <StatCard title="Pending" value={stats.pending} emoji="⏳" color="bg-gradient-to-br from-yellow-100 to-yellow-50" />
          <StatCard title="In Progress" value={stats.in_progress} emoji="🌀" color="bg-gradient-to-br from-purple-100 to-purple-50" />
          <StatCard title="Ready for Pickup" value={stats.ready} emoji="📦" color="bg-gradient-to-br from-orange-100 to-orange-50" />
          <StatCard title="Completed" value={stats.completed} emoji="✅" color="bg-gradient-to-br from-green-100 to-green-50" />
        </div>
      )}

      {tab === 'categories' && (
        <div className="grid md:grid-cols-2 gap-3 md:gap-4 max-w-full">
          <div className="card min-w-0">
            <h3 className="font-semibold text-base md:text-lg mb-3 truncate">🏷️ {editingId ? 'Edit' : 'Create'} Category</h3>
            <form onSubmit={saveCategory} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Category Name *</label>
                <input value={catForm.name} onChange={e=>setCatForm({...catForm, name:e.target.value})} placeholder="e.g., Wash & Fold" className="input text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pricing Type *</label>
                <select value={catForm.pricing_type} onChange={e=>setCatForm({...catForm, pricing_type:e.target.value})} className="input text-sm">
                  <option value="per_kilo">Per Kilogram</option>
                  <option value="fixed">Fixed Price</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price (₱) *</label>
                <input type="number" step="0.1" min="0" value={catForm.price} onChange={e=>setCatForm({...catForm, price:e.target.value})} placeholder="0.00" className="input text-sm" required />
              </div>
              {catForm.pricing_type === 'fixed' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium mb-1">Min kg</label>
                    <input type="number" step="0.1" min="0" value={catForm.min_kilo} onChange={e=>setCatForm({...catForm, min_kilo:e.target.value})} placeholder="0" className="input text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Max kg</label>
                    <input type="number" step="0.1" min="0" value={catForm.max_kilo} onChange={e=>setCatForm({...catForm, max_kilo:e.target.value})} placeholder="0" className="input text-sm" />
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1 text-sm">{editingId? '✅ Update':'➕ Create'}</button>
                {editingId && <button type="button" onClick={()=>{setEditingId('');setCatForm(emptyCat)}} className="btn-white flex-1 text-sm">❌ Cancel</button>}
              </div>
            </form>
          </div>
          <div className="card min-w-0">
            <h3 className="font-semibold text-base md:text-lg mb-3 truncate">📝 Your Categories</h3>
            {categories.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                <div className="text-3xl mb-2">🏷️</div>
                <div className="text-sm">No categories yet</div>
              </div>
            )}
            <div className="grid gap-2 max-w-full">
              {categories.map(c => (
                <div key={c.id} className="bg-white rounded-lg p-2 md:p-3 border hover:shadow-md transition-shadow min-w-0">
                  <div className="flex flex-col gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-sm md:text-base truncate">{c.name}</div>
                      <div className="text-xs text-gray-600 break-words">{c.pricing_type === 'per_kilo' ? `₱${c.price} / kg` : `₱${c.price} for ${c.min_kilo||'?'}–${c.max_kilo||'?'} kg`}</div>
                    </div>
                    <div className="flex gap-1 md:gap-2 flex-wrap">
                      <button onClick={()=>startEdit(c)} className="btn-white text-xs px-2 md:px-3 py-1 flex-1 min-w-[70px]">✏️ Edit</button>
                      <button onClick={()=>removeCategory(c.id)} className="btn-danger text-xs px-2 md:px-3 py-1 flex-1 min-w-[70px]">🗑️ Del</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'bookings' && (
        <div className="grid gap-3 max-w-full">
          {bookings.length === 0 && (
            <div className="card text-center py-8">
              <div className="text-4xl mb-2">📦</div>
              <div className="text-gray-600">No bookings yet</div>
            </div>
          )}
          {bookings.map(b => (
            <div key={b.id} className="card hover:shadow-lg transition-shadow min-w-0">
              <div className="flex flex-col gap-2 mb-3">
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm md:text-base truncate">{b.category_name}</div>
                    <div className="text-xs text-gray-500">#{b.id.slice(0,8)}</div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-[10px] md:text-xs font-medium whitespace-nowrap shrink-0 ${getStatusColor(b.status)}`}>
                    {getStatusLabel(b.status)}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div className="bg-gray-50 p-2 rounded min-w-0">
                  <div className="text-xs text-gray-500">Weight</div>
                  <div className="font-semibold truncate">{b.weight_kg} kg</div>
                </div>
                <div className="bg-gray-50 p-2 rounded min-w-0">
                  <div className="text-xs text-gray-500">Total</div>
                  <div className="font-semibold text-bubble-dark truncate">₱{b.total_price}</div>
                </div>
              </div>
              
              <div className="text-xs text-gray-600 mb-3 break-words">
                📅 {formatDateTime(b.schedule_at)}
              </div>

              {b.notes && (
                <div className="text-xs text-gray-600 mb-3 bg-gray-50 p-2 rounded break-words">
                  📝 Notes: {b.notes}
                </div>
              )}

              {/* Edit Form */}
              {editingBooking === b.id && (
                <form onSubmit={saveBookingEdit} className="bg-blue-50 p-3 rounded-lg mb-3 space-y-2">
                  <div className="font-medium text-sm text-blue-900 mb-2">✏️ Edit Booking Details</div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Weight (kg)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      min="0.1"
                      value={editForm.weight_kg} 
                      onChange={e=>setEditForm({...editForm, weight_kg:e.target.value})} 
                      className="input text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Notes</label>
                    <textarea 
                      value={editForm.notes} 
                      onChange={e=>setEditForm({...editForm, notes:e.target.value})} 
                      className="input text-sm min-h-[60px]"
                      placeholder="Add notes..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary flex-1 text-xs">💾 Save Changes</button>
                    <button type="button" onClick={cancelEditBooking} className="btn-white flex-1 text-xs">❌ Cancel</button>
                  </div>
                  <div className="text-[10px] text-blue-700 mt-1">
                    ℹ️ Customer will be notified of any changes
                  </div>
                </form>
              )}

              {/* Edit Button - Show for non-completed/rejected bookings */}
              {!editingBooking && b.status !== 'completed' && b.status !== 'rejected' && (
                <button 
                  onClick={() => startEditBooking(b)}
                  className="btn-white text-xs w-full mb-2"
                >
                  ✏️ Edit Booking Details
                </button>
              )}
              
              <div className="flex flex-col gap-2 min-w-0">
                {b.status === 'pending' && (
                  <>
                    <div className="text-xs md:text-sm font-medium text-yellow-700 bg-yellow-50 p-2 rounded">
                      ⚠️ Awaiting your response
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onAccept(b.id)}
                        className="btn-primary flex-1 text-xs md:text-sm"
                      >
                        ✅ Accept
                      </button>
                      <button 
                        onClick={() => onReject(b.id)}
                        className="btn-danger flex-1 text-xs md:text-sm"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </>
                )}
                
                {b.status === 'confirmed' && (
                  <>
                    <div className="text-xs md:text-sm text-blue-700 bg-blue-50 p-2 rounded mb-2">
                      ⏳ Waiting for customer to pay and deliver laundry
                    </div>
                    <button 
                      onClick={() => onConfirmPayment(b.id)}
                      className="btn-primary w-full text-xs md:text-sm"
                    >
                      💰 Confirm Payment Received
                    </button>
                  </>
                )}
                
                {(b.status === 'in_progress' || b.status === 'ready') && (
                  <>
                    <label className="text-xs md:text-sm font-medium">Update Status:</label>
                    <select
                      value={b.status}
                      onChange={(e)=> onStatus(b.id, e.target.value)}
                      className="input text-xs md:text-sm w-full"
                    >
                      <option value="in_progress">🌀 In Progress</option>
                      <option value="ready">✅ Ready for Pickup</option>
                      <option value="completed">✔️ Completed</option>
                    </select>
                  </>
                )}
                
                {(b.status === 'completed' || b.status === 'rejected') && (
                  <div className={`text-xs md:text-sm p-2 rounded ${
                    b.status === 'completed' 
                      ? 'text-green-700 bg-green-50' 
                      : 'text-red-700 bg-red-50'
                  }`}>
                    {b.status === 'completed' ? '✔️ Order completed' : '❌ Booking rejected'}
                  </div>
                )}
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
    case 'confirmed': return 'bg-blue-100 text-blue-800'
    case 'in_progress': return 'bg-indigo-100 text-indigo-800'
    case 'ready': return 'bg-purple-100 text-purple-800'
    case 'completed': return 'bg-green-100 text-green-800'
    case 'rejected': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getStatusLabel(s) {
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

function summarize(items){
  const s = { total: items.length, pending:0, in_progress:0, ready:0, completed:0 }
  items.forEach(b=>{ if (s[b.status] !== undefined) s[b.status]++ })
  return s
}

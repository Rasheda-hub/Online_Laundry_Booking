import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { listMyReceipts } from '../api/receipts.js'
import { formatDateTime } from '../components/RealTimeClock.jsx'

export default function Receipts(){
  const { token, user } = useAuth()
  const [receipts, setReceipts] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(()=>{
    (async ()=>{
      try {
        const data = await listMyReceipts(token)
        setReceipts(data)
      } catch(e){ setError(e.message) } finally { setLoading(false) }
    })()
  }, [token])

  // Auto-open a receipt when navigated with ?rid=...
  useEffect(()=>{
    const rid = searchParams.get('rid')
    if (!rid || receipts.length===0) return
    const r = receipts.find(x=>x.id === rid)
    if (r){ setCurrent(r); setOpen(true) }
  }, [searchParams, receipts])

  if (loading) return <div>Loading receipts…</div>
  if (error) return <div className="text-sm text-red-600">{error}</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-bold">Receipts</h2>
        <div className="text-xs text-gray-600">{receipts.length} receipt{receipts.length !== 1 ? 's' : ''}</div>
      </div>
      
      {receipts.length === 0 && (
        <div className="card text-center py-8">
          <div className="text-4xl mb-2">🧾</div>
          <div className="text-gray-600">No receipts yet</div>
          <p className="text-sm text-gray-500 mt-2">Receipts will appear here when orders are completed</p>
        </div>
      )}
      
      <div className="grid gap-3">
        {receipts.map(r => (
          <div key={r.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-lg">🧾 Receipt #{r.id.slice(0,8)}</div>
                <div className="text-xs text-gray-500">📦 Order #{r.order_id?.slice(0,8)}</div>
                <div className="text-xs text-gray-500">📅 {formatDateTime(r.created_at)}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-bubble-dark">₱{Number(r.total).toFixed(2)}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
            </div>
            
            {user?.role !== 'customer' && (
              <div className="bg-blue-50 rounded-lg p-3 mb-3 text-sm">
                <div className="font-medium text-blue-900 mb-1">👤 Customer</div>
                <div className="text-blue-800">{r.customer_name || r.customer_id}</div>
                {r.customer_contact && <div className="text-blue-700 text-xs">📞 {r.customer_contact}</div>}
                {r.customer_address && <div className="text-blue-700 text-xs">📍 {r.customer_address}</div>}
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-3 text-sm mb-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="font-medium mb-2 text-gray-700">📦 Items</div>
                {(r.items || []).length === 0 && <div className="text-gray-500 text-xs">No items recorded</div>}
                {(r.items || []).map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs mb-1">
                    <div className="text-gray-700">{it.service_name || `Service ${it.service_id?.slice(0,8) || '-'}`}</div>
                    <div className="font-medium">{it.weight_kg ? `${it.weight_kg} kg` : ''}</div>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="font-medium mb-2 text-gray-700">💰 Summary</div>
                <div className="flex items-center justify-between font-semibold text-bubble-dark">
                  <span>Total Amount</span>
                  <span>₱{Number(r.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button onClick={()=>{ setCurrent(r); setOpen(true) }} className="btn-primary text-sm">
                🖎️ View / Print
              </button>
            </div>
          </div>
        ))}
      </div>

      {open && current && (
        <ReceiptModal user={user} receipt={current} onClose={()=>setOpen(false)} />)
      }
    </div>
  )
}

function ReceiptModal({ user, receipt, onClose }){
  const shopLabel = useMemo(() => (
    receipt?.provider_name || (user?.shop_name || 'Laundry Shop')
  ), [user, receipt])
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center print:static print:bg-white">
      <div className="bg-white w-[700px] max-w-[95vw] rounded-2xl shadow-lg print:shadow-none print:w-full print:rounded-none">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between print:border-none">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 rounded-full items-center justify-center" style={{background:'linear-gradient(135deg,#60A5FA,#A78BFA)'}}>🧺</span>
            <div>
              <div className="font-semibold">{shopLabel}</div>
              <div className="text-xs opacity-70">Receipt #{receipt.id.slice(0,8)}</div>
              {(receipt.provider_address || receipt.provider_contact) && (
                <div className="text-[11px] opacity-70">
                  {receipt.provider_address && <div>{receipt.provider_address}</div>}
                  {receipt.provider_contact && <div>{receipt.provider_contact}</div>}
                </div>
              )}
            </div>
          </div>
          <div className="text-xs opacity-70">{formatDateTime(receipt.created_at)}</div>
        </div>

        {/* Body */}
        <div className="p-4">
          {user?.role !== 'customer' && (
            <div className="mb-3 text-sm">
              <div className="font-medium">Customer</div>
              <div>{receipt.customer_name || receipt.customer_id}</div>
              {receipt.customer_contact && <div className="opacity-80">{receipt.customer_contact}</div>}
              {receipt.customer_address && <div className="opacity-70 text-xs">{receipt.customer_address}</div>}
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div className="border rounded p-2">
              <div className="font-medium mb-1">Items</div>
              {(receipt.items || []).length === 0 && <div className="opacity-60 text-xs">No items recorded</div>}
              {(receipt.items || []).map((it, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div>{it.service_name || `Service ${it.service_id?.slice(0,8) || '-'}`}</div>
                  <div>{it.weight_kg ? `${it.weight_kg} kg` : ''}</div>
                </div>
              ))}
            </div>
            <div className="border rounded p-2">
              <div className="font-medium mb-1">Total</div>
              <div className="flex items-center justify-between text-lg font-semibold text-bubble-dark"><span>Total Amount</span><span>₱{Number(receipt.total).toFixed(2)}</span></div>
            </div>
          </div>
        </div>

        {/* Footer (hidden in print) */}
        <div className="p-4 border-t flex items-center justify-end gap-2 print:hidden">
          <button onClick={onClose} className="btn-white">Close</button>
          <button onClick={()=>window.print()} className="btn-primary">Print</button>
        </div>
      </div>
    </div>
  )
}

import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { listMyReceipts } from '../api/receipts.js'

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
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold">Receipts</h2>
      {receipts.length === 0 && <div className="text-sm opacity-70">No receipts yet.</div>}
      <div className="grid gap-3">
        {receipts.map(r => (
          <div key={r.id} className="card">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Receipt #{r.id.slice(0,8)}</div>
              <div className="text-xs opacity-60">{new Date(r.created_at).toLocaleString()}</div>
            </div>
            <div className="mt-1 text-sm">
              <span className="opacity-70">Order:</span> <span>#{r.order_id?.slice(0,8)}</span>
            </div>
            {user?.role !== 'customer' && (
              <div className="mt-1 text-sm">
                <span className="opacity-70">Customer:</span> <span>{r.customer_name || r.customer_id}</span>
                {r.customer_contact && <span className="ml-2">• {r.customer_contact}</span>}
                {r.customer_address && <div className="text-xs opacity-70">{r.customer_address}</div>}
              </div>
            )}
            <div className="mt-2 grid md:grid-cols-2 gap-2 text-sm">
              <div className="bg-white rounded p-2">
                <div className="font-medium mb-1">Items</div>
                {(r.items || []).length === 0 && <div className="opacity-60 text-xs">No items recorded</div>}
                {(r.items || []).map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div>{it.service_name || `Service ${it.service_id?.slice(0,8) || '-'}`}</div>
                    <div>{it.weight_kg ? `${it.weight_kg} kg` : ''}</div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded p-2">
                <div className="font-medium mb-1">Totals</div>
                <div className="flex items-center justify-between text-sm"><span className="opacity-70">Subtotal</span><span>₱{Number(r.subtotal).toFixed(2)}</span></div>
                <div className="flex items-center justify-between text-sm"><span className="opacity-70">Delivery Fee</span><span>₱{Number(r.delivery_fee).toFixed(2)}</span></div>
                <div className="flex items-center justify-between text-base font-semibold mt-1"><span>Total</span><span>₱{Number(r.total).toFixed(2)}</span></div>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button onClick={()=>{ setCurrent(r); setOpen(true) }} className="btn-white">View / Print</button>
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
          <div className="text-xs opacity-70">{new Date(receipt.created_at).toLocaleString()}</div>
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
              <div className="font-medium mb-1">Totals</div>
              <div className="flex items-center justify-between text-sm"><span className="opacity-70">Subtotal</span><span>₱{Number(receipt.subtotal).toFixed(2)}</span></div>
              <div className="flex items-center justify-between text-sm"><span className="opacity-70">Delivery Fee</span><span>₱{Number(receipt.delivery_fee).toFixed(2)}</span></div>
              <div className="flex items-center justify-between text-base font-semibold mt-1"><span>Total</span><span>₱{Number(receipt.total).toFixed(2)}</span></div>
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

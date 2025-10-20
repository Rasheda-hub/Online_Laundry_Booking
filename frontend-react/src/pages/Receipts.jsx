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
    receipt?.provider_name || (user?.shop_name || 'DAKDAK')
  ), [user, receipt])
  
  const handlePrint = () => {
    // Create a new window with only the receipt content
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Receipt - ${receipt.id.slice(0,8)}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 600px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #333;
            }
            .header h1 {
              font-size: 32px;
              margin-bottom: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
            }
            .header p {
              font-size: 14px;
              color: #666;
              margin: 5px 0;
            }
            .receipt-info {
              margin-bottom: 30px;
              font-size: 14px;
            }
            .receipt-info div {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .receipt-info strong {
              font-weight: 600;
            }
            .section {
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 1px solid #ddd;
            }
            .section-title {
              font-weight: 600;
              font-size: 14px;
              margin-bottom: 10px;
              text-transform: uppercase;
            }
            .customer-info div {
              font-size: 14px;
              margin-bottom: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th {
              text-align: left;
              padding: 10px 0;
              border-bottom: 2px solid #333;
              font-weight: 600;
              font-size: 14px;
            }
            th:last-child {
              text-align: right;
            }
            td {
              padding: 10px 0;
              border-bottom: 1px solid #ddd;
              font-size: 14px;
            }
            td:last-child {
              text-align: right;
            }
            .totals {
              margin-top: 20px;
              border-top: 2px solid #333;
              padding-top: 20px;
            }
            .totals div {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              font-size: 14px;
            }
            .total-amount {
              font-size: 20px;
              font-weight: bold;
              margin-top: 15px;
              padding-top: 15px;
              border-top: 1px solid #999;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
            }
            .footer p {
              margin: 5px 0;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1><span>🧺</span> ${shopLabel}</h1>
            ${receipt.provider_address ? `<p>${receipt.provider_address}</p>` : ''}
            ${receipt.provider_contact ? `<p>Tel: ${receipt.provider_contact}</p>` : ''}
          </div>

          <div class="receipt-info">
            <div><strong>Receipt No:</strong> <span>#${receipt.id.slice(0,8)}</span></div>
            <div><strong>Date:</strong> <span>${formatDateTime(receipt.created_at)}</span></div>
            ${receipt.order_id ? `<div><strong>Order No:</strong> <span>#${receipt.order_id.slice(0,8)}</span></div>` : ''}
          </div>

          <div class="section">
            <div class="section-title">Customer Information</div>
            <div class="customer-info">
              <div><strong>Name:</strong> ${receipt.customer_name || 'N/A'}</div>
              ${receipt.customer_contact ? `<div><strong>Contact:</strong> ${receipt.customer_contact}</div>` : ''}
              ${receipt.customer_address ? `<div><strong>Address:</strong> ${receipt.customer_address}</div>` : ''}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Items</div>
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Weight</th>
                </tr>
              </thead>
              <tbody>
                ${(receipt.items || []).length === 0 
                  ? '<tr><td colspan="2" style="text-align: center; color: #999;">No items recorded</td></tr>'
                  : (receipt.items || []).map(item => `
                    <tr>
                      <td>${item.service_name || `Service ${item.service_id?.slice(0,8) || '-'}`}</td>
                      <td>${item.weight_kg ? `${item.weight_kg} kg` : '-'}</td>
                    </tr>
                  `).join('')
                }
              </tbody>
            </table>
          </div>

          <div class="totals">
            ${receipt.subtotal !== undefined ? `
              <div>
                <span>Subtotal:</span>
                <span>₱${Number(receipt.subtotal).toFixed(2)}</span>
              </div>
            ` : ''}
            ${receipt.delivery_fee !== undefined && receipt.delivery_fee > 0 ? `
              <div>
                <span>Delivery Fee:</span>
                <span>₱${Number(receipt.delivery_fee).toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="total-amount">
              <span>TOTAL AMOUNT:</span>
              <span>₱${Number(receipt.total).toFixed(2)}</span>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for choosing our laundry service!</p>
            <p>Please keep this receipt for your records.</p>
            ${receipt.provider_contact ? `<p style="margin-top: 15px; font-weight: 600;">For inquiries, please contact us at ${receipt.provider_contact}</p>` : ''}
          </div>

          <script>
            // Auto-print when loaded
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `
    
    printWindow.document.write(receiptHTML)
    printWindow.document.close()
  }
  
  return (
    <>
      {/* Modal Overlay - Hidden when printing */}
      <div className="fixed inset-0 bg-black/40 z-50 p-4 print:hidden overflow-y-auto">
        <div className="min-h-full flex items-center justify-center">
          <div className="bg-white w-full max-w-[700px] flex flex-col rounded-2xl shadow-lg" style={{maxHeight: 'calc(100vh - 4rem)', height: 'auto'}}>
            {/* Header */}
            <div className="p-3 md:p-4 border-b flex items-center justify-between shrink-0 bg-white rounded-t-2xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 md:h-10 md:w-10 rounded-full items-center justify-center text-xl md:text-2xl" style={{background:'linear-gradient(135deg,#60A5FA,#A78BFA)'}}>🧺</span>
                <div>
                  <div className="font-semibold text-sm md:text-base">DAKDAK</div>
                  <div className="text-xs opacity-70">Receipt #{receipt.id.slice(0,8)}</div>
                </div>
              </div>
              <div className="text-xs opacity-70 hidden md:block">{formatDateTime(receipt.created_at)}</div>
            </div>

            {/* Body Preview - Scrollable */}
            <div className="p-4 md:p-6 overflow-y-auto" style={{maxHeight: 'calc(100vh - 14rem)'}}>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">{shopLabel}</h3>
              {receipt.provider_address && <p className="text-sm text-gray-600">{receipt.provider_address}</p>}
              {receipt.provider_contact && <p className="text-sm text-gray-600">📞 {receipt.provider_contact}</p>}
              <div className="mt-2 pt-2 border-t">
                <p className="text-xs text-gray-500">Receipt #{receipt.id.slice(0,8)}</p>
                <p className="text-xs text-gray-500">{formatDateTime(receipt.created_at)}</p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="mb-4 pb-4 border-b">
              <div className="text-sm font-semibold text-gray-700 mb-1">Customer Information</div>
              <div className="text-sm text-gray-600">{receipt.customer_name || 'N/A'}</div>
              {receipt.customer_contact && <div className="text-sm text-gray-600">📞 {receipt.customer_contact}</div>}
              {receipt.customer_address && <div className="text-sm text-gray-600">📍 {receipt.customer_address}</div>}
            </div>

            {/* Items */}
            <div className="mb-4">
              <div className="text-sm font-semibold text-gray-700 mb-2">Items</div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Service</th>
                    <th className="text-right py-2">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {(receipt.items || []).length === 0 && (
                    <tr><td colSpan="2" className="text-center py-4 text-gray-500">No items recorded</td></tr>
                  )}
                  {(receipt.items || []).map((it, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-2">{it.service_name || `Service ${it.service_id?.slice(0,8) || '-'}`}</td>
                      <td className="text-right py-2">{it.weight_kg ? `${it.weight_kg} kg` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t pt-4">
              {receipt.subtotal !== undefined && (
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">₱{Number(receipt.subtotal).toFixed(2)}</span>
                </div>
              )}
              {receipt.delivery_fee !== undefined && receipt.delivery_fee > 0 && (
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Delivery Fee:</span>
                  <span className="font-medium">₱{Number(receipt.delivery_fee).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t">
                <span>Total Amount:</span>
                <span className="text-bubble-dark">₱{Number(receipt.total).toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t text-center text-xs text-gray-500">
              <p>Thank you for choosing our laundry service!</p>
              <p className="mt-1">Please keep this receipt for your records.</p>
            </div>
          </div>

            {/* Footer - Always visible */}
            <div className="p-3 md:p-4 border-t flex items-center justify-end gap-2 shrink-0 bg-white rounded-b-2xl shadow-lg">
              <button onClick={onClose} className="btn-white text-sm">Close</button>
              <button onClick={handlePrint} className="btn-primary text-sm">🖨️ Print</button>
            </div>
          </div>
        </div>
      </div>

      {/* Print-only content */}
      <div className="hidden print:block print-receipt p-8">
        <div className="max-w-[600px] mx-auto">
          {/* Header */}
          <div className="text-center mb-6 pb-4 border-b-2 border-gray-800">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-3xl">🧺</span>
              <h1 className="text-3xl font-bold text-gray-800">{shopLabel}</h1>
            </div>
            {receipt.provider_address && <p className="text-sm text-gray-700">{receipt.provider_address}</p>}
            {receipt.provider_contact && <p className="text-sm text-gray-700">Tel: {receipt.provider_contact}</p>}
          </div>

          {/* Receipt Info */}
          <div className="mb-6 text-sm">
            <div className="flex justify-between mb-1">
              <span className="font-semibold">Receipt No:</span>
              <span>#{receipt.id.slice(0,8)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold">Date:</span>
              <span>{formatDateTime(receipt.created_at)}</span>
            </div>
            {receipt.order_id && (
              <div className="flex justify-between">
                <span className="font-semibold">Order No:</span>
                <span>#{receipt.order_id.slice(0,8)}</span>
              </div>
            )}
          </div>

          {/* Customer Info */}
          <div className="mb-6 pb-4 border-b border-gray-300">
            <div className="font-semibold text-sm mb-2">CUSTOMER INFORMATION</div>
            <div className="text-sm">
              <div><strong>Name:</strong> {receipt.customer_name || 'N/A'}</div>
              {receipt.customer_contact && <div><strong>Contact:</strong> {receipt.customer_contact}</div>}
              {receipt.customer_address && <div><strong>Address:</strong> {receipt.customer_address}</div>}
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-800">
                  <th className="text-left py-2 font-semibold">SERVICE</th>
                  <th className="text-right py-2 font-semibold">WEIGHT</th>
                </tr>
              </thead>
              <tbody>
                {(receipt.items || []).length === 0 && (
                  <tr><td colSpan="2" className="text-center py-4 text-gray-500">No items recorded</td></tr>
                )}
                {(receipt.items || []).map((it, idx) => (
                  <tr key={idx} className="border-b border-gray-300">
                    <td className="py-2">{it.service_name || `Service ${it.service_id?.slice(0,8) || '-'}`}</td>
                    <td className="text-right py-2">{it.weight_kg ? `${it.weight_kg} kg` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mb-6 border-t-2 border-gray-800 pt-4">
            {receipt.subtotal !== undefined && (
              <div className="flex justify-between text-sm mb-2">
                <span>Subtotal:</span>
                <span>₱{Number(receipt.subtotal).toFixed(2)}</span>
              </div>
            )}
            {receipt.delivery_fee !== undefined && receipt.delivery_fee > 0 && (
              <div className="flex justify-between text-sm mb-2">
                <span>Delivery Fee:</span>
                <span>₱{Number(receipt.delivery_fee).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold mt-3 pt-3 border-t border-gray-400">
              <span>TOTAL AMOUNT:</span>
              <span>₱{Number(receipt.total).toFixed(2)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-600 border-t border-gray-300 pt-4">
            <p className="mb-1">Thank you for choosing our laundry service!</p>
            <p className="mb-1">Please keep this receipt for your records.</p>
            <p className="mt-3 font-semibold">For inquiries, please contact us at {receipt.provider_contact || 'our shop'}</p>
          </div>
        </div>
      </div>
    </>
  )
}

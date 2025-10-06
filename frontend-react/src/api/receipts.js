import { apiFetch } from './client.js'

export async function listMyReceipts(token){
  return apiFetch('/receipts/mine', { token })
}

export async function generateReceipt(token, orderId){
  return apiFetch(`/receipts/generate/${orderId}`, { method: 'POST', token })
}

import { apiFetch } from './client.js'

export async function listMyReceipts(token){
  return apiFetch('/receipts/mine', { token })
}

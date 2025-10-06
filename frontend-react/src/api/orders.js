import { apiFetch } from './client'

export async function createOrder(token, payload){
  // payload: { provider_id, items: [{service_id, weight_kg}], delivery_option, notes }
  return apiFetch('/orders/', { method: 'POST', token, json: payload })
}

export async function getMyOrders(token){
  return apiFetch('/orders/mine/list', { token })
}

export async function getOrder(token, id){
  return apiFetch(`/orders/${id}`, { token })
}

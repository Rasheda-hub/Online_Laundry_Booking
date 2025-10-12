import { apiFetch } from './client.js'

export async function registerCustomer(payload){
  return apiFetch('/users/register/customer', { method: 'POST', json: payload })
}

export async function registerProvider(payload){
  return apiFetch('/users/register/provider', { method: 'POST', json: payload })
}

export async function updateMe(token, payload){
  return apiFetch('/users/me', { method: 'PATCH', token, json: payload })
}

export async function changePassword(token, payload){
  return apiFetch('/users/change_password', { method: 'POST', token, json: payload })
}

export async function searchProviders(query){
  const qp = encodeURIComponent(query || '')
  return apiFetch(`/users/providers/search?q=${qp}`)
}

export async function toggleAvailability(token){
  return apiFetch('/users/toggle_availability', { method: 'POST', token })
}

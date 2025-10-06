import { apiFetch } from './client.js'

export async function approveProvider(token, providerId){
  return apiFetch(`/admin/providers/${providerId}/approve`, { method: 'POST', token })
}
export async function rejectProvider(token, providerId){
  return apiFetch(`/admin/providers/${providerId}/reject`, { method: 'POST', token })
}
export async function banUser(token, userId){
  return apiFetch(`/admin/users/${userId}/ban`, { method: 'POST', token })
}
export async function unbanUser(token, userId){
  return apiFetch(`/admin/users/${userId}/unban`, { method: 'POST', token })
}
export async function deleteUser(token, userId){
  return apiFetch(`/admin/users/${userId}`, { method: 'DELETE', token })
}
export async function stats(token){
  return apiFetch('/admin/stats', { token })
}

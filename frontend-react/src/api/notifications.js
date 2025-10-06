import { apiFetch } from './client'

export async function listMyNotifications(token){
  return apiFetch('/notifications/mine', { token })
}

export async function markNotificationRead(token, id){
  return apiFetch(`/notifications/${id}/read`, { method: 'PATCH', token })
}

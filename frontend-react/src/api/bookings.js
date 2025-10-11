import { apiFetch } from './client.js'

export async function createBooking(token, payload){
  return apiFetch('/bookings/', { method: 'POST', token, json: payload })
}

export async function listMyBookings(token){
  return apiFetch('/bookings/mine', { token })
}

export async function acceptBooking(token, id){
  return apiFetch(`/bookings/${id}/accept`, { method: 'POST', token })
}

export async function rejectBooking(token, id){
  return apiFetch(`/bookings/${id}/reject`, { method: 'POST', token })
}

export async function updateBookingStatus(token, id, status){
  return apiFetch(`/bookings/${id}/status`, { method: 'PATCH', token, json: { status } })
}

export async function confirmPayment(token, id){
  return apiFetch(`/bookings/${id}/confirm-payment`, { method: 'POST', token })
}

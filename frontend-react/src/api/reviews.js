import { apiFetch } from './client'

export async function createReview(token, data) {
  return apiFetch('/reviews/', { method: 'POST', token, json: data })
}

export async function getProviderReviews(providerId) {
  return apiFetch(`/reviews/provider/${providerId}`)
}

export async function getProviderRatingStats(providerId) {
  return apiFetch(`/reviews/provider/${providerId}/stats`)
}

export async function checkBookingReview(token, bookingId) {
  return apiFetch(`/reviews/booking/${bookingId}/check`, { token })
}

export async function getReview(token, reviewId) {
  return apiFetch(`/reviews/${reviewId}`, { token })
}

export async function updateReview(token, reviewId, data) {
  return apiFetch(`/reviews/${reviewId}`, { method: 'PATCH', token, json: data })
}

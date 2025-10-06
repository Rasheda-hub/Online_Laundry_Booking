import { apiFetch } from './client.js'

export async function listProviderCategories(providerId){
  return apiFetch(`/categories/provider/${providerId}`)
}
export async function listMyCategories(token){
  return apiFetch('/categories/mine', { token })
}
export async function createCategory(token, payload){
  return apiFetch('/categories/', { method: 'POST', token, json: payload })
}
export async function updateCategory(token, id, payload){
  return apiFetch(`/categories/${id}`, { method: 'PATCH', token, json: payload })
}
export async function deleteCategory(token, id){
  return apiFetch(`/categories/${id}`, { method: 'DELETE', token })
}

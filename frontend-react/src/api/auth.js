import { apiFetch } from './client.js'

export async function loginJson(email, password){
  return apiFetch('/auth/login_json', { method: 'POST', json: { email, password } })
}

export async function me(token){
  return apiFetch('/auth/me', { token })
}

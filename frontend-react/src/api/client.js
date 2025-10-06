const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000'

export function getAuthHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiFetch(path, { method = 'GET', token, json, form } = {}) {
  const headers = { ...getAuthHeaders(token) }
  let body
  if (json) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(json)
  }
  if (form) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
    body = new URLSearchParams(form).toString()
  }
  const res = await fetch(`${API_BASE}${path}`, { method, headers, body })
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`
    try { const data = await res.json(); msg = data.detail || msg } catch {}
    throw new Error(msg)
  }
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return res.json()
  return res.text()
}

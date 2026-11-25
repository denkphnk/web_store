import { request } from './http.js'

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` }
}

export function adminLogin(username, password) {
  return request('/admin/auth/login', {
    method: 'POST',
    body: { username, password },
  })
}

export function getAdminIdentity(token) {
  return request('/admin/auth/me', { headers: authHeaders(token) })
}

export function getAdminCategories(token) {
  return request('/admin/categories', { headers: authHeaders(token) })
}

export function createAdminCategory(token, category) {
  return request('/admin/categories', {
    method: 'POST',
    headers: authHeaders(token),
    body: category,
  })
}

export function updateAdminCategory(token, id, category) {
  return request(`/admin/categories/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: category,
  })
}

export function getAdminProducts(token) {
  return request('/admin/products', { headers: authHeaders(token) })
}

export function createAdminProduct(token, product) {
  return request('/admin/products', {
    method: 'POST',
    headers: authHeaders(token),
    body: product,
  })
}

export function updateAdminProduct(token, id, product) {
  return request(`/admin/products/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: product,
  })
}

export function getAdminOrders(token) {
  return request('/admin/orders', { headers: authHeaders(token) })
}

export function updateAdminOrderStatus(token, id, status) {
  return request(`/admin/orders/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: { status },
  })
}

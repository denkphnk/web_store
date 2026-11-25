import { request } from './http.js'

export function getCategories(signal) {
  return request('/categories', { signal })
}

export function getFilterOptions(signal) {
  return request('/filters', { signal })
}

export function getProducts(searchParams, signal) {
  const query = searchParams.toString()
  return request(`/products${query ? `?${query}` : ''}`, { signal })
}

export function getProduct(productId, signal) {
  return request(`/products/${productId}`, { signal })
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

async function request(path, signal) {
  const response = await fetch(`${API_BASE_URL}${path}`, { signal })
  const payload = await response.json()

  if (!response.ok) {
    const message = typeof payload.detail === 'string'
      ? payload.detail
      : `Ошибка сервера: ${response.status}`
    throw new Error(message)
  }

  return payload
}

export function getCategories(signal) {
  return request('/categories', signal)
}

export function getFilterOptions(signal) {
  return request('/filters', signal)
}

export function getProducts(searchParams, signal) {
  const query = searchParams.toString()
  return request(`/products${query ? `?${query}` : ''}`, signal)
}

export function getProduct(productId, signal) {
  return request(`/products/${productId}`, signal)
}

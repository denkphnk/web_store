import { request } from './http.js'

export function validateCart(items, signal) {
  return request('/cart/validate', {
    method: 'POST',
    body: { items },
    signal,
  })
}

export function createOrder(order) {
  return request('/orders', {
    method: 'POST',
    body: order,
  })
}

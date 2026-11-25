import { useEffect, useState } from 'react'
import { getAdminOrders, updateAdminOrderStatus } from '../../api/admin.js'

const currency = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})
const dateTime = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'medium',
  timeStyle: 'short',
})
const statuses = [
  { id: 'new', label: 'Новый' },
  { id: 'processing', label: 'В обработке' },
  { id: 'cancelled', label: 'Отменён' },
]

export default function AdminOrders({ token }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingIds, setUpdatingIds] = useState([])

  useEffect(() => {
    let active = true
    getAdminOrders(token)
      .then((result) => {
        if (active) {
          setOrders(result)
          setError('')
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message)
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [token])

  async function changeStatus(order, status) {
    setError('')
    setUpdatingIds((current) => [...current, order.id])
    try {
      const updatedOrder = await updateAdminOrderStatus(token, order.id, status)
      setOrders((current) => current.map((item) => (
        item.id === updatedOrder.id ? updatedOrder : item
      )))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setUpdatingIds((current) => current.filter((id) => id !== order.id))
    }
  }

  return (
    <div className="admin-orders">
      <div className="admin-subheading">
        <div>
          <h2>Заказы</h2>
          <p>Контактные данные, состав и текущий статус заказов.</p>
        </div>
      </div>
      {error && <div className="notice notice--error" role="alert">{error}</div>}
      {loading ? (
        <p role="status">Загружаем заказы…</p>
      ) : orders.length === 0 ? (
        <p className="admin-empty">Заказов пока нет.</p>
      ) : (
        <div className="admin-order-list">
          {orders.map((order) => (
            <article className="admin-order" key={order.id}>
              <div className="admin-order__heading">
                <div>
                  <h3>{order.number}</h3>
                  <p>{dateTime.format(new Date(order.created_at))}</p>
                </div>
                <label>
                  Статус
                  <select
                    disabled={updatingIds.includes(order.id)}
                    value={order.status}
                    onChange={(event) => changeStatus(order, event.target.value)}
                  >
                    {statuses.map((status) => (
                      <option key={status.id} value={status.id}>{status.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="admin-order__customer">
                <strong>{order.customer_name}</strong>
                <a href={`tel:${order.phone}`}>{order.phone}</a>
                <a href={`mailto:${order.email}`}>{order.email}</a>
                <span>{order.delivery_address}</span>
              </div>
              <ul className="admin-order__items">
                {order.items.map((item, index) => (
                  <li key={`${order.id}-${index}`}>
                    {item.product_name} · {item.variant_size}, {item.variant_color}
                    {' '}× {item.quantity}
                    <span>{currency.format(Number(item.unit_price) * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="admin-order__total">
                <span>{order.is_test ? 'Тестовый заказ' : 'Заказ'}</span>
                <strong>{currency.format(Number(order.total_amount))}</strong>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

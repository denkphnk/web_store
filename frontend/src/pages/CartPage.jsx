import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { createOrder, validateCart } from '../api/orders.js'
import { useCart } from '../cart/useCart.js'

const currency = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

export default function CartPage() {
  const {
    items,
    cartError,
    cartNotice,
    setQuantity,
    updatePrices,
    removeItem,
    clearCart,
  } = useCart()
  const [quoteState, setQuoteState] = useState(null)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [checkoutError, setCheckoutError] = useState('')
  const [checkoutNotice, setCheckoutNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [completedOrder, setCompletedOrder] = useState(null)

  const itemsKey = JSON.stringify(
    items.map(({ variantId, quantity, price }) => [variantId, quantity, price]),
  )
  const validationKey = `${itemsKey}:${refreshVersion}`
  const quote = quoteState?.key === validationKey ? quoteState.quote : null
  const validationError = quoteState?.key === validationKey
    ? quoteState.error
    : ''
  const validating = items.length > 0 && !quote && !validationError

  useEffect(() => {
    if (items.length === 0) {
      return undefined
    }

    const controller = new AbortController()
    const requestItems = items.map((item) => ({
      variant_id: item.variantId,
      quantity: item.quantity,
      expected_unit_price: item.price,
    }))
    validateCart(requestItems, controller.signal)
      .then((result) => {
        setQuoteState({ key: validationKey, quote: result, error: '' })
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setQuoteState({
            key: validationKey,
            quote: null,
            error: requestError.message,
          })
        }
      })

    return () => controller.abort()
  }, [items, itemsKey, refreshVersion, validationKey])

  async function submitOrder(event) {
    event.preventDefault()
    setCheckoutError('')
    setCheckoutNotice('')

    if (!quote || !quote.can_checkout) {
      return
    }
    if (quote.prices_changed) {
      setCheckoutNotice('Цена изменилась. Проверьте обновлённую сумму перед заказом.')
      updatePrices(quote.items)
      return
    }

    setSubmitting(true)
    try {
      const order = await createOrder({
        customer_name: customerName,
        phone,
        email,
        delivery_address: deliveryAddress,
        items: items.map((item) => ({
          variant_id: item.variantId,
          quantity: item.quantity,
          expected_unit_price: item.price,
        })),
      })
      setCompletedOrder(order)
      clearCart()
    } catch (requestError) {
      setCheckoutError(requestError.message)
      if (requestError.status === 409) {
        setRefreshVersion((version) => version + 1)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (completedOrder) {
    return (
      <section className="checkout-success">
        <p className="eyebrow">ЗАКАЗ СОЗДАН</p>
        <h1>Спасибо за заказ!</h1>
        <p>
          Номер заказа: <strong>{completedOrder.number}</strong>
        </p>
        <p>
          Тестовый заказ на сумму {currency.format(Number(completedOrder.total_amount))}.
          Оплата не проводилась.
        </p>
        <Link className="button button--dark" to="/">Вернуться в каталог</Link>
      </section>
    )
  }

  if (items.length === 0) {
    return (
      <section className="cart-page">
        <h1>Корзина</h1>
        {cartError ? (
          <div className="notice notice--error" role="alert">
            <p>{cartError}</p>
            <button className="button button--outline" type="button" onClick={clearCart}>
              Очистить повреждённую корзину
            </button>
          </div>
        ) : (
          <div className="notice notice--empty">
            <h2>В корзине пока пусто</h2>
            <p>Добавьте понравившиеся вещи из каталога.</p>
            <Link to="/">Перейти в каталог</Link>
          </div>
        )}
      </section>
    )
  }

  const quoteByVariant = new Map(
    (quote?.items || []).map((item) => [item.variant_id, item]),
  )
  const displayedTotal = quote
    ? Number(quote.total_amount)
    : items.reduce((total, item) => total + Number(item.price) * item.quantity, 0)

  return (
    <section className="cart-page">
      <div className="cart-heading">
        <div>
          <p className="eyebrow">ВАШ ВЫБОР</p>
          <h1>Корзина</h1>
        </div>
        <Link className="back-link" to="/">Продолжить покупки</Link>
      </div>

      {cartError && (
        <div className="notice notice--error" role="alert">
          <p>{cartError}</p>
          <button className="button button--outline" type="button" onClick={clearCart}>
            Очистить корзину
          </button>
        </div>
      )}
      {cartNotice && (
        <div className="notice notice--warning" role="status">{cartNotice}</div>
      )}
      {validationError && (
        <div className="notice notice--error" role="alert">{validationError}</div>
      )}
      {quote?.prices_changed && (
        <div className="notice notice--warning" role="status">
          Цена одного или нескольких товаров изменилась. Примените актуальные цены,
          затем подтвердите заказ.
          <button
            className="button button--outline"
            type="button"
            onClick={() => updatePrices(quote.items)}
          >
            Применить новые цены
          </button>
        </div>
      )}
      {quote?.items.some((item) => !item.available) && (
        <div className="notice notice--warning" role="alert">
          Проверьте наличие и количество товаров перед оформлением.
        </div>
      )}
      {checkoutNotice && (
        <div className="notice notice--warning" role="status">{checkoutNotice}</div>
      )}
      {checkoutError && (
        <div className="notice notice--error" role="alert">{checkoutError}</div>
      )}

      <div className="cart-layout">
        <div className="cart-items">
          {items.map((item) => {
            const quotedItem = quoteByVariant.get(item.variantId)
            const currentPrice = quotedItem?.unit_price ?? item.price
            const unavailable = quotedItem && !quotedItem.available

            return (
              <article className="cart-item" key={item.variantId}>
                <div className="cart-item__visual">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" />
                  ) : (
                    <span aria-hidden="true">{item.name.slice(0, 1)}</span>
                  )}
                </div>
                <div className="cart-item__body">
                  <div className="cart-item__top">
                    <div>
                      <h2>{quotedItem?.product_name || item.name}</h2>
                      <p>{item.size} · {item.color}</p>
                    </div>
                    <strong>{currency.format(Number(currentPrice))}</strong>
                  </div>
                  {unavailable && (
                    <p className="field-error" role="alert">
                      {quotedItem.product_name
                        ? `Доступно: ${quotedItem.available_stock} шт.`
                        : 'Вариант больше недоступен.'}
                    </p>
                  )}
                  <div className="cart-item__controls">
                    <div className="quantity-control" aria-label="Количество">
                      <button
                        type="button"
                        aria-label={`Уменьшить количество ${item.name}`}
                        disabled={item.quantity <= 1}
                        onClick={() => setQuantity(item.variantId, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        aria-label={`Увеличить количество ${item.name}`}
                        disabled={item.quantity >= 99}
                        onClick={() => setQuantity(item.variantId, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => removeItem(item.variantId)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        <aside className="checkout-panel">
          <h2>Оформление тестового заказа</h2>
          <p className="checkout-panel__caption">
            Оплата не проводится. Заказ будет сохранён в системе.
          </p>

          <form className="checkout-form" onSubmit={submitOrder}>
            <label>
              Имя
              <input
                autoComplete="name"
                maxLength="200"
                minLength="2"
                required
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
              />
            </label>
            <label>
              Телефон
              <input
                autoComplete="tel"
                maxLength="32"
                minLength="7"
                required
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </label>
            <label>
              Электронная почта
              <input
                autoComplete="email"
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label>
              Адрес доставки
              <textarea
                autoComplete="street-address"
                maxLength="1000"
                minLength="8"
                required
                rows="3"
                value={deliveryAddress}
                onChange={(event) => setDeliveryAddress(event.target.value)}
              />
            </label>

            <div className="checkout-total">
              <span>Итого</span>
              <strong>{currency.format(displayedTotal)}</strong>
            </div>
            <button
              className="button button--dark checkout-submit"
              type="submit"
              disabled={
                submitting ||
                validating ||
                !quote?.can_checkout ||
                quote.prices_changed ||
                Boolean(cartError) ||
                Boolean(validationError)
              }
            >
              {submitting ? 'Создаём заказ…' : 'Оформить тестовый заказ'}
            </button>
            {validating && <p className="checkout-hint">Проверяем цены и наличие…</p>}
          </form>
        </aside>
      </div>
    </section>
  )
}

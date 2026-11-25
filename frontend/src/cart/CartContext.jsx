import { useState } from 'react'
import { CartContext } from './cartContext.js'

const STORAGE_KEY = 'forma-cart-v1'

function isCartItem(value) {
  return (
    value &&
    typeof value.variantId === 'string' &&
    typeof value.productId === 'string' &&
    typeof value.name === 'string' &&
    typeof value.size === 'string' &&
    typeof value.color === 'string' &&
    typeof value.price === 'string' &&
    Number.isInteger(value.quantity) &&
    value.quantity > 0
  )
}

function readStoredCart() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return { items: [], error: '' }
    }

    const items = JSON.parse(stored)
    if (!Array.isArray(items) || !items.every(isCartItem)) {
      return {
        items: [],
        error: 'Сохранённая корзина повреждена. Очистите её, чтобы продолжить.',
      }
    }
    return { items, error: '' }
  } catch {
    return {
      items: [],
      error: 'Не удалось прочитать сохранённую корзину. Очистите её, чтобы продолжить.',
    }
  }
}

export function CartProvider({ children }) {
  const [initialCart] = useState(readStoredCart)
  const [items, setItems] = useState(initialCart.items)
  const [cartError, setCartError] = useState(initialCart.error)
  const [cartNotice, setCartNotice] = useState('')

  function save(nextItems) {
    if (cartError) {
      return false
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems))
      setItems(nextItems)
      setCartNotice('')
      return true
    } catch {
      setCartError('Не удалось сохранить корзину в браузере.')
      return false
    }
  }

  function addItem(product, variant) {
    if (cartError) {
      return false
    }
    const existing = items.find((item) => item.variantId === variant.id)
    const quantity = (existing?.quantity || 0) + 1
    if (quantity > 99) {
      setCartNotice('В корзине не может быть больше 99 единиц одного варианта.')
      return false
    }

    const newItem = {
      variantId: variant.id,
      productId: product.id,
      name: product.name,
      size: variant.size,
      color: variant.color,
      price: String(product.price),
      imageUrl: product.images[0]?.url || '',
      quantity,
    }
    const nextItems = existing
      ? items.map((item) => item.variantId === variant.id ? newItem : item)
      : [...items, newItem]
    return save(nextItems)
  }

  function setQuantity(variantId, quantity) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return false
    }
    return save(
      items.map((item) => (
        item.variantId === variantId ? { ...item, quantity } : item
      )),
    )
  }

  function updatePrices(quoteItems) {
    const pricesByVariant = new Map(
      quoteItems
        .filter((item) => item.unit_price !== null)
        .map((item) => [item.variant_id, String(item.unit_price)]),
    )
    return save(
      items.map((item) => pricesByVariant.has(item.variantId)
        ? { ...item, price: pricesByVariant.get(item.variantId) }
        : item),
    )
  }

  function removeItem(variantId) {
    return save(items.filter((item) => item.variantId !== variantId))
  }

  function clearCart() {
    try {
      localStorage.removeItem(STORAGE_KEY)
      setItems([])
      setCartError('')
    } catch {
      setItems([])
      setCartError('Корзина очищена в приложении, но не удалена из хранилища браузера.')
    }
  }

  const itemCount = items.reduce((total, item) => total + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        cartError,
        cartNotice,
        addItem,
        setQuantity,
        updatePrices,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

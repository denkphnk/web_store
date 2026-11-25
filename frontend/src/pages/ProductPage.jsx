import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getProduct } from '../api/catalog.js'
import { useCart } from '../cart/useCart.js'

const currency = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

export default function ProductPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { addItem, cartError, cartNotice } = useCart()
  const [productState, setProductState] = useState(null)
  const [selectedVariantId, setSelectedVariantId] = useState('')
  const loading = productState?.id !== productId
  const product = productState?.id === productId ? productState.product : null
  const error = productState?.id === productId ? productState.error : ''

  useEffect(() => {
    const controller = new AbortController()
    getProduct(productId, controller.signal)
      .then((loadedProduct) => {
        setProductState({ id: productId, product: loadedProduct, error: '' })
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setProductState({
            id: productId,
            product: null,
            error: requestError.message,
          })
        }
      })

    return () => controller.abort()
  }, [productId])

  if (loading) {
    return <p className="notice">Загружаем товар…</p>
  }
  if (error) {
    return (
      <div className="notice notice--error" role="alert">
        <p>{error}</p>
        <Link to="/catalog">Вернуться в каталог</Link>
      </div>
    )
  }
  if (!product) {
    return null
  }

  const selectedVariant = product.variants.find(
    (variant) => variant.id === selectedVariantId && variant.stock > 0,
  ) || product.variants.find((variant) => variant.stock > 0)
  const image = product.images[0]?.url

  return (
    <section className="product-page">
      <Link className="back-link" to="/catalog">← Вернуться в каталог</Link>
      <div className="product-detail">
        <div className="product-detail__visual">
          {image ? (
            <img src={image} alt={product.name} />
          ) : (
            <div className="product-detail__placeholder" aria-hidden="true">
              <span>{product.category.name}</span>
              <strong>{product.name.slice(0, 1)}</strong>
            </div>
          )}
        </div>
        <div className="product-detail__content">
          <p className="eyebrow">{product.category.name}</p>
          <h1>{product.name}</h1>
          <p className="product-detail__price">
            {currency.format(Number(product.price))}
          </p>
          <p className="product-detail__description">{product.description}</p>

          <div className="variant-picker">
            <h2>Размер и цвет</h2>
            {product.variants.length === 0 ? (
              <p>Варианты пока не добавлены.</p>
            ) : (
              <div className="variant-list">
                {product.variants.map((variant) => (
                  <button
                    className={`variant-option ${selectedVariant?.id === variant.id ? 'is-selected' : ''}`}
                    key={variant.id}
                    type="button"
                    disabled={variant.stock === 0}
                    onClick={() => setSelectedVariantId(variant.id)}
                  >
                    {variant.size} · {variant.color}
                  </button>
                ))}
              </div>
            )}
            {selectedVariant && (
              <p className="stock-status" role="status">
                {selectedVariant.stock > 0
                  ? `В наличии: ${selectedVariant.stock} шт.`
                  : 'Нет в наличии'}
              </p>
            )}
          </div>
          <button
            className="button button--dark add-to-cart"
            type="button"
            disabled={!selectedVariant}
            onClick={() => {
              if (selectedVariant && addItem(product, selectedVariant)) {
                navigate('/cart')
              }
            }}
          >
            Добавить в корзину
          </button>
          {cartError && <p className="field-error" role="alert">{cartError}</p>}
          {cartNotice && <p className="field-error" role="status">{cartNotice}</p>}
        </div>
      </div>
    </section>
  )
}

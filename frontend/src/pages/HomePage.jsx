import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCategories, getProducts } from '../api/catalog.js'

const currency = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

export default function HomePage() {
  const [homeState, setHomeState] = useState({
    categories: [],
    products: [],
    error: '',
    loading: true,
  })

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams({ limit: '4', sort: 'newest' })
    Promise.all([
      getCategories(controller.signal),
      getProducts(params, controller.signal),
    ])
      .then(([categories, result]) => {
        setHomeState({
          categories,
          products: result.items,
          error: '',
          loading: false,
        })
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setHomeState({
            categories: [],
            products: [],
            error: requestError.message,
            loading: false,
          })
        }
      })

    return () => controller.abort()
  }, [])

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero__content">
          <p className="eyebrow">FORMA · НОВАЯ КОЛЛЕКЦИЯ</p>
          <h1>Одежда, которая становится своей</h1>
          <p>
            Спокойные цвета, удобные формы и вещи, которые легко собрать
            в образ на каждый день.
          </p>
          <Link className="button button--dark home-hero__cta" to="/catalog">
            Открыть каталог
          </Link>
        </div>
        <div className="home-hero__visual" aria-hidden="true">
          <img src="/images/products/light-jacket.jpg" alt="" />
          <span>ЛИНИЯ · ОСЕНЬ / ЗИМА</span>
        </div>
        <div className="home-hero__index" aria-hidden="true">01 / 06</div>
      </section>

      <section className="home-section home-categories" aria-labelledby="home-categories-title">
        <div className="home-section__heading">
          <div>
            <p className="eyebrow">ВЫБИРАЙТЕ СВОЁ</p>
            <h2 id="home-categories-title">Категории</h2>
          </div>
          <Link to="/catalog">Весь каталог <span aria-hidden="true">→</span></Link>
        </div>
        {homeState.error && (
          <div className="notice notice--error" role="alert">{homeState.error}</div>
        )}
        {homeState.loading ? (
          <p className="home-loading" role="status">Загружаем категории…</p>
        ) : (
          <div className="home-category-grid">
            {homeState.categories.map((category, index) => (
              <Link
                className={`home-category-card home-category-card--${index % 5}`}
                key={category.id}
                to={`/catalog?category=${encodeURIComponent(category.slug)}`}
              >
                <span aria-hidden="true">{category.name.slice(0, 1)}</span>
                <strong>{category.name}</strong>
                <span className="home-category-card__arrow" aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="home-section home-featured" aria-labelledby="home-featured-title">
        <div className="home-section__heading">
          <div>
            <p className="eyebrow">ПОДБОРКА FORMA</p>
            <h2 id="home-featured-title">В центре внимания</h2>
          </div>
          <Link to="/catalog">Смотреть всё <span aria-hidden="true">→</span></Link>
        </div>
        {homeState.loading ? (
          <p className="home-loading" role="status">Загружаем подборку…</p>
        ) : (
          <div className="home-featured-grid">
            {homeState.products.map((product, index) => (
              <article className="home-product-card" key={product.id}>
                <Link to={`/products/${product.id}`}>
                  <div className={`home-product-card__visual tone-${index % 5}`}>
                    {product.images[0]?.url ? (
                      <img src={product.images[0].url} alt={product.name} />
                    ) : (
                      <span aria-hidden="true">{product.name.slice(0, 1)}</span>
                    )}
                    <small>{product.category.name}</small>
                  </div>
                  <div className="home-product-card__details">
                    <h3>{product.name}</h3>
                    <strong>{currency.format(Number(product.price))}</strong>
                  </div>
                </Link>
              </article>
            ))}
            {!homeState.error && homeState.products.length === 0 && (
              <p className="home-loading">Скоро здесь появятся товары.</p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

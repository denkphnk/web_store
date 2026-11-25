import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getCategories, getFilterOptions, getProducts } from '../api/catalog.js'

const currency = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

function ProductCard({ product, index }) {
  const image = product.images[0]?.url

  return (
    <article className="product-card">
      <Link className="product-card__link" to={`/products/${product.id}`}>
        <div className={`product-card__visual tone-${index % 5}`}>
          {image ? (
            <img src={image} alt={product.name} />
          ) : (
            <span className="product-card__initials" aria-hidden="true">
              {product.name.slice(0, 1)}
            </span>
          )}
          <span className="product-card__category">{product.category.name}</span>
        </div>
        <div className="product-card__details">
          <h2>{product.name}</h2>
          <span>{currency.format(Number(product.price))}</span>
        </div>
      </Link>
    </article>
  )
}

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filtersKey = searchParams.toString()
  const [categories, setCategories] = useState([])
  const [filterOptions, setFilterOptions] = useState({ sizes: [], colors: [] })
  const [categoriesError, setCategoriesError] = useState('')
  const [catalogState, setCatalogState] = useState(null)
  const result = catalogState?.key === filtersKey
    ? catalogState.result
    : { items: [], total: 0 }
  const loading = catalogState?.key !== filtersKey
  const error = catalogState?.key === filtersKey ? catalogState.error : ''
  const searchText = searchParams.get('q') || ''
  const minPrice = searchParams.get('min_price') || ''
  const maxPrice = searchParams.get('max_price') || ''

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      getCategories(controller.signal),
      getFilterOptions(controller.signal),
    ])
      .then(([loadedCategories, loadedOptions]) => {
        setCategories(loadedCategories)
        setFilterOptions(loadedOptions)
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setCategoriesError(requestError.message)
        }
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams(filtersKey)
    getProducts(params, controller.signal)
      .then((data) => {
        setCatalogState({ key: filtersKey, result: data, error: '' })
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setCatalogState({
            key: filtersKey,
            result: { items: [], total: 0 },
            error: requestError.message,
          })
        }
      })

    return () => controller.abort()
  }, [filtersKey])

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    if (key !== 'skip') {
      next.delete('skip')
    }
    setSearchParams(next, { replace: true })
  }

  function submitSearch(event) {
    event.preventDefault()
    updateFilter('q', searchText.trim())
  }

  return (
    <section className="catalog-page" id="catalog">
      <div className="catalog-heading">
        <div>
          <p className="eyebrow">НОВАЯ КОЛЛЕКЦИЯ</p>
          <h1>Одежда на каждый день</h1>
          <p className="catalog-heading__description">
            Продуманные вещи, которые легко сочетаются между собой.
          </p>
        </div>
        <p className="catalog-heading__count">
          {loading ? 'Загружаем каталог…' : `${result.total} моделей`}
        </p>
      </div>

      <form className="search-form" onSubmit={submitSearch}>
        <label className="visually-hidden" htmlFor="catalog-search">
          Поиск по товарам
        </label>
        <input
          id="catalog-search"
          type="search"
          placeholder="Найти вещь"
          value={searchText}
          onChange={(event) => updateFilter('q', event.target.value)}
        />
        <button className="button button--dark" type="submit">
          Найти
        </button>
      </form>

      <div className="catalog-layout">
        <aside className="filters" aria-label="Фильтры каталога">
          <div className="filter-group">
            <label htmlFor="category-filter">Категория</label>
            <select
              id="category-filter"
              value={searchParams.get('category') || ''}
              onChange={(event) => updateFilter('category', event.target.value)}
            >
              <option value="">Все категории</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
            {categoriesError && (
              <p className="field-error" role="alert">{categoriesError}</p>
            )}
          </div>

          <div className="filter-group">
            <label htmlFor="size-filter">Размер</label>
            <select
              id="size-filter"
              value={searchParams.get('size') || ''}
              onChange={(event) => updateFilter('size', event.target.value)}
            >
              <option value="">Любой размер</option>
              {filterOptions.sizes.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="color-filter">Цвет</label>
            <select
              id="color-filter"
              value={searchParams.get('color') || ''}
              onChange={(event) => updateFilter('color', event.target.value)}
            >
              <option value="">Любой цвет</option>
              {filterOptions.colors.map((color) => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>

          <div className="filter-group price-filter">
            <label>Цена, ₽</label>
            <div className="price-filter__inputs">
              <input
                type="number"
                min="0"
                placeholder="От"
                aria-label="Минимальная цена"
                value={minPrice}
                onChange={(event) => updateFilter('min_price', event.target.value)}
              />
              <input
                type="number"
                min="0"
                placeholder="До"
                aria-label="Максимальная цена"
                value={maxPrice}
                onChange={(event) => updateFilter('max_price', event.target.value)}
              />
            </div>
          </div>

          <Link className="clear-filters" to="/catalog">
            Сбросить фильтры
          </Link>
        </aside>

        <div className="catalog-results">
          <div className="results-toolbar">
            <p>{loading ? ' ' : `Показано ${result.items.length} из ${result.total}`}</p>
            <label>
              <span className="visually-hidden">Сортировка</span>
              <select
                value={searchParams.get('sort') || 'newest'}
                onChange={(event) => updateFilter('sort', event.target.value === 'newest' ? '' : event.target.value)}
              >
                <option value="newest">Сначала новинки</option>
                <option value="price_asc">Сначала дешевле</option>
                <option value="price_desc">Сначала дороже</option>
              </select>
            </label>
          </div>

          {error && <div className="notice notice--error" role="alert">{error}</div>}
          {loading && <div className="notice">Загружаем товары…</div>}
          {!loading && !error && result.items.length === 0 && (
            <div className="notice notice--empty">
              <h2>Ничего не найдено</h2>
              <p>Измените запрос или сбросьте фильтры.</p>
            </div>
          )}

          {!error && result.items.length > 0 && (
            <div className="product-grid">
              {result.items.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}

          {!loading && !error && result.total > Number(searchParams.get('limit') || 24) && (
            <nav className="pagination" aria-label="Страницы каталога">
              <button
                className="button button--outline"
                type="button"
                disabled={Number(searchParams.get('skip') || 0) === 0}
                onClick={() => updateFilter(
                  'skip',
                  String(Math.max(0, Number(searchParams.get('skip') || 0) - Number(searchParams.get('limit') || 24))),
                )}
              >
                Назад
              </button>
              <span>
                {Number(searchParams.get('skip') || 0) + 1}–{Math.min(
                  Number(searchParams.get('skip') || 0) + result.items.length,
                  result.total,
                )} из {result.total}
              </span>
              <button
                className="button button--outline"
                type="button"
                disabled={Number(searchParams.get('skip') || 0) + result.items.length >= result.total}
                onClick={() => updateFilter(
                  'skip',
                  String(Number(searchParams.get('skip') || 0) + Number(searchParams.get('limit') || 24)),
                )}
              >
                Далее
              </button>
            </nav>
          )}
        </div>
      </div>
    </section>
  )
}

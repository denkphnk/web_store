import { useEffect, useState } from 'react'
import {
  createAdminProduct,
  getAdminCategories,
  getAdminProducts,
  updateAdminProduct,
} from '../../api/admin.js'

function newProduct(categoryId = '') {
  return {
    name: '',
    description: '',
    price: '',
    categoryId,
    isPublished: false,
    images: '',
    variants: [{ size: 'M', color: 'Чёрный', stock: '0' }],
  }
}

function editProduct(product) {
  return {
    name: product.name,
    description: product.description,
    price: String(product.price),
    categoryId: product.category.id,
    isPublished: product.is_published,
    images: product.images.map((image) => image.url).join('\n'),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      size: variant.size,
      color: variant.color,
      stock: String(variant.stock),
    })),
  }
}

export default function AdminProducts({ token }) {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(newProduct())
  const [editingId, setEditingId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([getAdminCategories(token), getAdminProducts(token)])
      .then(([loadedCategories, loadedProducts]) => {
        if (active) {
          setCategories(loadedCategories)
          setProducts(loadedProducts)
          setForm((current) => (
            current.categoryId
              ? current
              : { ...current, categoryId: loadedCategories[0]?.id || '' }
          ))
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
  }, [token, refreshVersion])

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function updateVariant(index, key, value) {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) => (
        variantIndex === index ? { ...variant, [key]: value } : variant
      )),
    }))
  }

  function addVariant() {
    setForm((current) => ({
      ...current,
      variants: [...current.variants, { size: '', color: '', stock: '0' }],
    }))
  }

  function removeVariant(index) {
    setForm((current) => ({
      ...current,
      variants: current.variants.filter((_, variantIndex) => variantIndex !== index),
    }))
  }

  function startNewProduct() {
    setEditingId('')
    setForm(newProduct(categories[0]?.id || ''))
    setError('')
    setNotice('')
  }

  function startEditing(product) {
    setEditingId(product.id)
    setForm(editProduct(product))
    setError('')
    setNotice('')
  }

  async function submitProduct(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setSaving(true)

    const payload = {
      name: form.name,
      description: form.description,
      price: form.price,
      category_id: form.categoryId,
      is_published: form.isPublished,
      images: form.images
        .split('\n')
        .map((url) => url.trim())
        .filter(Boolean)
        .map((url) => ({ url })),
      variants: form.variants.map((variant) => ({
        ...(variant.id ? { id: variant.id } : {}),
        size: variant.size,
        color: variant.color,
        stock: Number(variant.stock),
      })),
    }

    try {
      if (editingId) {
        await updateAdminProduct(token, editingId, payload)
        setNotice('Изменения товара сохранены.')
      } else {
        await createAdminProduct(token, payload)
        setNotice('Товар создан.')
      }
      setEditingId('')
      setForm(newProduct(categories[0]?.id || ''))
      setRefreshVersion((version) => version + 1)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-products">
      <div className="admin-subheading">
        <div>
          <h2>Товары</h2>
          <p>Создавайте карточки, управляйте вариантами и скрывайте товары.</p>
        </div>
        <button className="button button--outline" type="button" onClick={startNewProduct}>
          Новый товар
        </button>
      </div>

      {error && <div className="notice notice--error" role="alert">{error}</div>}
      {notice && <div className="notice notice--success" role="status">{notice}</div>}
      {loading ? (
        <p role="status">Загружаем товары…</p>
      ) : (
        <div className="admin-product-layout">
          <div className="admin-list">
            {products.length === 0 && <p>Товаров пока нет.</p>}
            {products.map((product) => (
              <article className="admin-list-item" key={product.id}>
                <div>
                  <strong>{product.name}</strong>
                  <span>{product.category.name} · {product.price} ₽</span>
                  <span className={product.is_published ? 'admin-badge is-visible' : 'admin-badge'}>
                    {product.is_published ? 'Опубликован' : 'Скрыт'}
                  </span>
                </div>
                <button
                  className="button button--outline"
                  type="button"
                  onClick={() => startEditing(product)}
                >
                  Изменить
                </button>
              </article>
            ))}
          </div>

          <form className="admin-form admin-product-form" onSubmit={submitProduct}>
            <h3>{editingId ? 'Редактировать товар' : 'Новый товар'}</h3>
            <label>
              Название
              <input
                maxLength="250"
                required
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
              />
            </label>
            <label>
              Описание
              <textarea
                maxLength="10000"
                rows="4"
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
              />
            </label>
            <div className="admin-form-row">
              <label>
                Цена, ₽
                <input
                  min="0.01"
                  required
                  step="0.01"
                  type="number"
                  value={form.price}
                  onChange={(event) => updateField('price', event.target.value)}
                />
              </label>
              <label>
                Категория
                <select
                  required
                  value={form.categoryId}
                  onChange={(event) => updateField('categoryId', event.target.value)}
                >
                  <option value="">Выберите категорию</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Ссылки на изображения (по одной на строку)
              <textarea
                rows="3"
                value={form.images}
                onChange={(event) => updateField('images', event.target.value)}
              />
            </label>
            <div className="admin-variants">
              <div className="admin-variants__heading">
                <h4>Размеры, цвета и остатки</h4>
                <button className="text-button" type="button" onClick={addVariant}>
                  Добавить вариант
                </button>
              </div>
              {form.variants.map((variant, index) => (
                <div className="admin-variant-row" key={variant.id || index}>
                  <label>
                    Размер
                    <input
                      maxLength="40"
                      required
                      value={variant.size}
                      onChange={(event) => updateVariant(index, 'size', event.target.value)}
                    />
                  </label>
                  <label>
                    Цвет
                    <input
                      maxLength="80"
                      required
                      value={variant.color}
                      onChange={(event) => updateVariant(index, 'color', event.target.value)}
                    />
                  </label>
                  <label>
                    Остаток
                    <input
                      min="0"
                      required
                      type="number"
                      value={variant.stock}
                      onChange={(event) => updateVariant(index, 'stock', event.target.value)}
                    />
                  </label>
                  <button
                    aria-label={`Удалить вариант ${variant.size} ${variant.color}`}
                    className="text-button"
                    disabled={form.variants.length <= 1}
                    type="button"
                    onClick={() => removeVariant(index)}
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
            <label className="admin-checkbox">
              <input
                checked={form.isPublished}
                type="checkbox"
                onChange={(event) => updateField('isPublished', event.target.checked)}
              />
              Опубликовать товар
            </label>
            <div className="admin-form-actions">
              <button className="button button--dark" type="submit" disabled={saving || categories.length === 0}>
                {saving ? 'Сохраняем…' : 'Сохранить товар'}
              </button>
              {editingId && (
                <button className="button button--outline" type="button" onClick={startNewProduct}>
                  Отмена
                </button>
              )}
            </div>
            {categories.length === 0 && (
              <p className="field-error">Сначала создайте категорию товара.</p>
            )}
          </form>
        </div>
      )}
    </div>
  )
}

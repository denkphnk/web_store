import { useEffect, useState } from 'react'
import {
  createAdminCategory,
  getAdminCategories,
  updateAdminCategory,
} from '../../api/admin.js'

export default function AdminCategories({ token }) {
  const [categories, setCategories] = useState([])
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [editingId, setEditingId] = useState('')
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    getAdminCategories(token)
      .then((result) => {
        if (active) {
          setCategories(result)
          setError('')
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message)
        }
      })
    return () => {
      active = false
    }
  }, [token, refreshVersion])

  function editCategory(category) {
    setEditingId(category.id)
    setName(category.name)
    setSlug(category.slug)
    setError('')
    setNotice('')
  }

  function clearForm() {
    setEditingId('')
    setName('')
    setSlug('')
  }

  async function submitCategory(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setSaving(true)
    try {
      const category = { name, slug }
      if (editingId) {
        await updateAdminCategory(token, editingId, category)
        setNotice('Категория обновлена.')
      } else {
        await createAdminCategory(token, category)
        setNotice('Категория создана.')
      }
      clearForm()
      setRefreshVersion((version) => version + 1)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-categories">
      <div className="admin-subheading">
        <div>
          <h2>Категории</h2>
          <p>Категории, используемые в карточках товаров.</p>
        </div>
      </div>
      {error && <div className="notice notice--error" role="alert">{error}</div>}
      {notice && <div className="notice notice--success" role="status">{notice}</div>}
      <div className="admin-category-layout">
        <div className="admin-list">
          {categories.map((category) => (
            <article className="admin-list-item" key={category.id}>
              <div>
                <strong>{category.name}</strong>
                <span>/{category.slug}</span>
              </div>
              <button
                className="button button--outline"
                type="button"
                onClick={() => editCategory(category)}
              >
                Изменить
              </button>
            </article>
          ))}
          {categories.length === 0 && <p>Категорий пока нет.</p>}
        </div>

        <form className="admin-form" onSubmit={submitCategory}>
          <h3>{editingId ? 'Изменить категорию' : 'Новая категория'}</h3>
          <label>
            Название
            <input
              maxLength="120"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label>
            Адресный идентификатор
            <input
              maxLength="120"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              required
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
            />
          </label>
          <p className="admin-form-hint">Используйте латиницу, цифры и дефисы.</p>
          <div className="admin-form-actions">
            <button className="button button--dark" type="submit" disabled={saving}>
              {saving ? 'Сохраняем…' : 'Сохранить категорию'}
            </button>
            {editingId && (
              <button className="button button--outline" type="button" onClick={clearForm}>
                Отмена
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import {
  adminLogin,
  getAdminIdentity,
} from '../api/admin.js'
import AdminCategories from './admin/AdminCategories.jsx'
import AdminOrders from './admin/AdminOrders.jsx'
import AdminProducts from './admin/AdminProducts.jsx'

const TOKEN_KEY = 'forma-admin-token'
const sections = [
  { id: 'products', label: 'Товары' },
  { id: 'categories', label: 'Категории' },
  { id: 'orders', label: 'Заказы' },
]

export default function AdminPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || '')
  const [username, setUsername] = useState('')
  const [checkingToken, setCheckingToken] = useState(Boolean(token))
  const [activeSection, setActiveSection] = useState('products')
  const [loginName, setLoginName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) {
      return undefined
    }

    let active = true
    getAdminIdentity(token)
      .then((identity) => {
        if (active) {
          setUsername(identity.username)
          setError('')
          setCheckingToken(false)
        }
      })
      .catch((requestError) => {
        if (active) {
          sessionStorage.removeItem(TOKEN_KEY)
          setToken('')
          setUsername('')
          setError(requestError.message)
          setCheckingToken(false)
        }
      })

    return () => {
      active = false
    }
  }, [token])

  async function submitLogin(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const response = await adminLogin(loginName, password)
      sessionStorage.setItem(TOKEN_KEY, response.access_token)
      setCheckingToken(true)
      setToken(response.access_token)
      setPassword('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY)
    setToken('')
    setUsername('')
    setCheckingToken(false)
    setError('')
  }

  if (checkingToken) {
    return (
      <section className="admin-page">
        <p role="status">Проверяем доступ…</p>
      </section>
    )
  }

  if (!token || !username) {
    return (
      <section className="admin-page admin-login">
        <div className="admin-panel">
          <p className="eyebrow">УПРАВЛЕНИЕ МАГАЗИНОМ</p>
          <h1>Вход администратора</h1>
          <p className="admin-intro">
            Войдите с учётными данными, настроенными в backend/.env.
          </p>
          {error && <div className="notice notice--error" role="alert">{error}</div>}
          <form className="admin-form" onSubmit={submitLogin}>
            <label>
              Логин
              <input
                autoComplete="username"
                required
                value={loginName}
                onChange={(event) => setLoginName(event.target.value)}
              />
            </label>
            <label>
              Пароль
              <input
                autoComplete="current-password"
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <button
              className="button button--dark"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Входим…' : 'Войти'}
            </button>
          </form>
        </div>
      </section>
    )
  }

  const activeLabel = sections.find((section) => section.id === activeSection)?.label

  return (
    <section className="admin-page">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">УПРАВЛЕНИЕ МАГАЗИНОМ</p>
          <h1>Админ-панель</h1>
          <p className="admin-intro">Вы вошли как {username}</p>
        </div>
        <button className="button button--outline" type="button" onClick={logout}>
          Выйти
        </button>
      </div>

      <nav className="admin-tabs" aria-label="Разделы админ-панели">
        {sections.map((section) => (
          <button
            aria-current={activeSection === section.id ? 'page' : undefined}
            className={activeSection === section.id ? 'is-active' : ''}
            key={section.id}
            type="button"
            onClick={() => setActiveSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </nav>

      <div className="admin-section" aria-label={activeLabel}>
        {activeSection === 'products' && <AdminProducts token={token} />}
        {activeSection === 'categories' && <AdminCategories token={token} />}
        {activeSection === 'orders' && <AdminOrders token={token} />}
      </div>
    </section>
  )
}

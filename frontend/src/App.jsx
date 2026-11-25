import { Link, Route, Routes } from 'react-router-dom'
import { useCart } from './cart/useCart.js'
import AdminPage from './pages/AdminPage.jsx'
import CartPage from './pages/CartPage.jsx'
import CatalogPage from './pages/CatalogPage.jsx'
import HomePage from './pages/HomePage.jsx'
import ProductPage from './pages/ProductPage.jsx'
import './App.css'

function SiteHeader() {
  const { itemCount } = useCart()

  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="Forma — главная">
        <span className="brand__mark">F</span>
        <span>forma</span>
      </Link>
      <nav className="site-nav" aria-label="Главная навигация">
        <Link to="/">Главная</Link>
        <Link to="/catalog">Каталог</Link>
        <span>Демо-магазин одежды</span>
        <Link className="cart-link" to="/cart">
          Корзина <span className="cart-count">{itemCount}</span>
        </Link>
        <Link to="/admin">Админ</Link>
      </nav>
    </header>
  )
}

function NotFoundPage() {
  return (
    <section className="notice notice--empty">
      <h1>Страница не найдена</h1>
      <Link to="/catalog">Перейти в каталог</Link>
    </section>
  )
}

function App() {
  return (
    <div className="app-shell">
      <SiteHeader />

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/products/:productId" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <span>forma</span>
        <span>Демо интернет-магазина одежды</span>
      </footer>
    </div>
  )
}

export default App

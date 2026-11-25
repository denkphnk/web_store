import { Link, Route, Routes } from 'react-router-dom'
import CatalogPage from './pages/CatalogPage.jsx'
import ProductPage from './pages/ProductPage.jsx'
import './App.css'

function NotFoundPage() {
  return (
    <section className="notice notice--empty">
      <h1>Страница не найдена</h1>
      <Link to="/">Перейти в каталог</Link>
    </section>
  )
}

function App() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="Forma — главная">
          <span className="brand__mark">F</span>
          <span>forma</span>
        </Link>
        <nav className="site-nav" aria-label="Главная навигация">
          <Link to="/">Каталог</Link>
          <span>Демо-магазин одежды</span>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/products/:productId" element={<ProductPage />} />
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

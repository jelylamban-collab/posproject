import { type CSSProperties, useMemo, useState } from 'react'
import './App.css'

type Product = {
  id: number
  name: string
  category: string
  price: number
  stock: number
  color: string
}

type CartItem = Product & {
  quantity: number
}

const categories = ['All', 'Coffee', 'Meals', 'Pastry', 'Drinks']

const products: Product[] = [
  {
    id: 1,
    name: 'Iced Latte',
    category: 'Coffee',
    price: 145,
    stock: 18,
    color: '#d8a05f',
  },
  {
    id: 2,
    name: 'Americano',
    category: 'Coffee',
    price: 105,
    stock: 24,
    color: '#6f4f3a',
  },
  {
    id: 3,
    name: 'Chicken Rice Bowl',
    category: 'Meals',
    price: 189,
    stock: 11,
    color: '#ef7b45',
  },
  {
    id: 4,
    name: 'Tuna Melt',
    category: 'Meals',
    price: 169,
    stock: 9,
    color: '#3c8f7a',
  },
  {
    id: 5,
    name: 'Croissant',
    category: 'Pastry',
    price: 95,
    stock: 15,
    color: '#e4b95b',
  },
  {
    id: 6,
    name: 'Blueberry Danish',
    category: 'Pastry',
    price: 115,
    stock: 7,
    color: '#5b6fb5',
  },
  {
    id: 7,
    name: 'Lemon Tea',
    category: 'Drinks',
    price: 85,
    stock: 20,
    color: '#d8c642',
  },
  {
    id: 8,
    name: 'Sparkling Water',
    category: 'Drinks',
    price: 70,
    stock: 32,
    color: '#58a7c7',
  },
]

const formatPeso = (amount: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(amount)

function App() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([
    { ...products[0], quantity: 1 },
    { ...products[2], quantity: 2 },
  ])

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return products.filter((product) => {
      const matchesCategory =
        activeCategory === 'All' || product.category === activeCategory
      const matchesQuery = product.name.toLowerCase().includes(normalizedQuery)

      return matchesCategory && matchesQuery
    })
  }, [activeCategory, query])

  const subtotal = cart.reduce(
    (total, product) => total + product.price * product.quantity,
    0,
  )
  const serviceFee = Math.round(subtotal * 0.05)
  const total = subtotal + serviceFee

  const addToCart = (product: Product) => {
    setCart((currentCart) => {
      const existingProduct = currentCart.find((item) => item.id === product.id)

      if (existingProduct) {
        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      }

      return [...currentCart, { ...product, quantity: 1 }]
    })
  }

  const updateQuantity = (id: number, delta: number) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + delta } : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  return (
    <main className="pos-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <span className="brand-mark">P</span>
          <div>
            <strong>POS System</strong>
            <span>Front counter</span>
          </div>
        </div>

        <nav className="nav-list">
          <button className="nav-item is-active" type="button" title="Sales">
            <span aria-hidden="true">▦</span>
            Sales
          </button>
          <button className="nav-item" type="button" title="Inventory">
            <span aria-hidden="true">□</span>
            Inventory
          </button>
          <button className="nav-item" type="button" title="Reports">
            <span aria-hidden="true">↗</span>
            Reports
          </button>
          <button className="nav-item" type="button" title="Settings">
            <span aria-hidden="true">⚙</span>
            Settings
          </button>
        </nav>

        <div className="shift-card">
          <span>Today</span>
          <strong>{formatPeso(18420)}</strong>
          <small>128 completed orders</small>
        </div>
      </aside>

      <section className="catalog-panel" aria-label="Product catalog">
        <header className="topbar">
          <div>
            <p className="eyebrow">Order Station</p>
            <h1>New Sale</h1>
          </div>

          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search menu"
              type="search"
            />
          </label>
        </header>

        <div className="category-tabs" role="tablist" aria-label="Categories">
          {categories.map((category) => (
            <button
              aria-selected={activeCategory === category}
              className={activeCategory === category ? 'is-active' : ''}
              key={category}
              onClick={() => setActiveCategory(category)}
              role="tab"
              type="button"
            >
              {category}
            </button>
          ))}
        </div>

        <div className="product-grid">
          {filteredProducts.map((product) => (
            <button
              className="product-card"
              key={product.id}
              onClick={() => addToCart(product)}
              type="button"
            >
              <span
                className="product-art"
                style={{ '--product-color': product.color } as CSSProperties}
                aria-hidden="true"
              />
              <span className="product-meta">
                <strong>{product.name}</strong>
                <small>{product.stock} in stock</small>
              </span>
              <span className="product-price">{formatPeso(product.price)}</span>
            </button>
          ))}
        </div>
      </section>

      <aside className="order-panel" aria-label="Current order">
        <header className="order-header">
          <div>
            <p className="eyebrow">Table 04</p>
            <h2>Current Order</h2>
          </div>
          <button className="ghost-button" onClick={() => setCart([])} type="button">
            Clear
          </button>
        </header>

        <div className="customer-card">
          <span className="avatar" aria-hidden="true">
            AR
          </span>
          <div>
            <strong>Ari Reyes</strong>
            <small>Dine in customer</small>
          </div>
        </div>

        <div className="cart-list">
          {cart.length === 0 ? (
            <p className="empty-cart">No items yet.</p>
          ) : (
            cart.map((item) => (
              <article className="cart-item" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <small>{formatPeso(item.price)} each</small>
                </div>
                <div className="quantity-control">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    type="button"
                    aria-label={`Remove one ${item.name}`}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    type="button"
                    aria-label={`Add one ${item.name}`}
                  >
                    +
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="summary">
          <div>
            <span>Subtotal</span>
            <strong>{formatPeso(subtotal)}</strong>
          </div>
          <div>
            <span>Service</span>
            <strong>{formatPeso(serviceFee)}</strong>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <strong>{formatPeso(total)}</strong>
          </div>
        </div>

        <button className="checkout-button" type="button" disabled={cart.length === 0}>
          Pay {formatPeso(total)}
        </button>
      </aside>
    </main>
  )
}

export default App

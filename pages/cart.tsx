import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function Cart() {
  const { items, removeItem, updateQuantity, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="empty-cart">
        <div className="container">
          <h1>Tu Carrito está vacío</h1>
          <p className="text-muted">Agrega productos para comenzar</p>
          <Link href="/products" className="btn btn-primary">Ver Productos</Link>
        </div>
        <style jsx>{`
          .empty-cart {
            padding: 4rem 0;
            text-align: center;
          }
          .empty-cart h1 { margin-bottom: 1rem; }
          .empty-cart p { margin-bottom: 2rem; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <h1>Carrito de Compras</h1>
        
        <div className="cart-layout">
          <div className="cart-items">
            {items.map((item) => (
              <div key={item.product.id} className="cart-item">
                <div className="item-image">
                  {item.product.images?.[0] ? (
                    <img src={item.product.images[0]} alt={item.product.name} />
                  ) : (
                    <div className="placeholder">Sin imagen</div>
                  )}
                </div>
                <div className="item-info">
                  <h3>{item.product.name}</h3>
                  <p className="price">${item.product.price?.toFixed(2)}</p>
                </div>
                <div className="item-actions">
                  <div className="quantity-selector">
                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
                  </div>
                  <button className="remove-btn" onClick={() => removeItem(item.product.id)}>
                    Eliminar
                  </button>
                </div>
                <div className="item-total">
                  ${(item.product.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h2>Resumen del Pedido</h2>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Envío</span>
              <span>{total >= 50 ? 'Gratis' : '$5.00'}</span>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <span>${(total + (total >= 50 ? 0 : 5)).toFixed(2)}</span>
            </div>
            <Link href="/checkout" className="btn btn-accent btn-block">
              Proceder al Checkout
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .page { padding: 2rem 0; }
        h1 { margin-bottom: 2rem; }
        .cart-layout {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 2rem;
        }
        .cart-item {
          display: grid;
          grid-template-columns: 80px 1fr auto auto;
          gap: 1rem;
          align-items: center;
          padding: 1rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          margin-bottom: 1rem;
        }
        .item-image {
          width: 80px;
          height: 80px;
          background: var(--secondary);
          border-radius: 8px;
          overflow: hidden;
        }
        .item-image img { width: 100%; height: 100%; object-fit: cover; }
        .placeholder { display: flex; align-items: center; justify-content: center; height: 100%; font-size: 0.75rem; color: var(--text-muted); }
        .item-info h3 { font-size: 1rem; margin-bottom: 0.25rem; }
        .item-info .price { color: var(--accent); font-weight: 600; }
        .quantity-selector {
          display: flex;
          align-items: center;
          border: 1px solid var(--border);
          border-radius: 4px;
        }
        .quantity-selector button { padding: 0.5rem 0.75rem; }
        .quantity-selector span { padding: 0 0.5rem; }
        .remove-btn {
          color: var(--error);
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }
        .item-total { font-weight: 700; font-size: 1.125rem; }
        .cart-summary {
          background: var(--secondary);
          padding: 1.5rem;
          border-radius: 12px;
          height: fit-content;
        }
        .cart-summary h2 { margin-bottom: 1rem; font-size: 1.25rem; }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--border);
        }
        .summary-total {
          display: flex;
          justify-content: space-between;
          padding: 1rem 0;
          font-weight: 700;
          font-size: 1.25rem;
        }
        .btn-block {
          width: 100%;
          margin-top: 1rem;
        }
        @media (max-width: 768px) {
          .cart-layout { grid-template-columns: 1fr; }
          .cart-item { grid-template-columns: 60px 1fr; gap: 0.5rem; }
          .item-actions, .item-total { grid-column: span 2; }
        }
      `}</style>
    </div>
  );
}
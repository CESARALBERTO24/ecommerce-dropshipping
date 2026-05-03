import { useState, useEffect } from 'react';
import { supabase, Order } from '@/lib/supabase';
import { getUser } from '@/lib/auth';
import Link from 'next/link';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function fetchOrders() {
      const currentUser = await getUser();
      setUser(currentUser);

      if (currentUser) {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('client_id', currentUser.id)
          .order('created_at', { ascending: false });
        
        if (!error && data) setOrders(data);
      }
      setLoading(false);
    }
    fetchOrders();
  }, []);

  if (loading) return <div className="loading-page">Cargando...</div>;

  if (!user) {
    return (
      <div className="auth-required">
        <div className="container">
          <h1>Mis Pedidos</h1>
          <p>Debes iniciar sesión para ver tus pedidos</p>
          <Link href="/login" className="btn btn-primary">Iniciar Sesión</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <h1>Mis Pedidos</h1>
        
        {orders.length > 0 ? (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div>
                    <span className="order-number">{order.order_number}</span>
                    <span className={`status ${order.status}`}>{order.status}</span>
                  </div>
                  <span className="order-date">
                    {new Date(order.created_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <div className="order-items">
                  {order.items?.slice(0, 3).map((item: any, idx: number) => (
                    <div key={idx} className="item-preview">
                      <span>{item.quantity}x {item.name}</span>
                    </div>
                  ))}
                  {order.items?.length > 3 && (
                    <span className="more-items">+{order.items.length - 3} más</span>
                  )}
                </div>
                <div className="order-footer">
                  <span className="order-total">Total: ${order.total?.toFixed(2)}</span>
                  <Link href={`/orders/${order.id}`} className="btn btn-outline">
                    Ver Detalles
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-orders">
            <p>No tienes pedidos todavía</p>
            <Link href="/products" className="btn btn-primary">Ver Productos</Link>
          </div>
        )}
      </div>

      <style jsx>{`
        .page { padding: 2rem 0; }
        h1 { margin-bottom: 2rem; }
        .loading-page, .auth-required, .empty-orders {
          text-align: center;
          padding: 4rem 0;
        }
        .auth-required p, .empty-orders p {
          color: var(--text-muted);
          margin-bottom: 1.5rem;
        }
        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .order-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.5rem;
        }
        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .order-number {
          font-weight: 600;
          margin-right: 0.5rem;
        }
        .status {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .status.pending { background: #fef3c7; color: #d97706; }
        .status.processing { background: #dbeafe; color: #2563eb; }
        .status.shipped { background: #d1fae5; color: #059669; }
        .status.delivered { background: #d1fae5; color: #059669; }
        .status.cancelled { background: #fee2e2; color: #dc2626; }
        .order-date {
          color: var(--text-muted);
          font-size: 0.875rem;
        }
        .order-items {
          padding: 1rem 0;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        .item-preview {
          color: var(--text-muted);
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }
        .more-items {
          color: var(--text-muted);
          font-size: 0.875rem;
        }
        .order-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1rem;
        }
        .order-total {
          font-weight: 600;
          font-size: 1.125rem;
        }
      `}</style>
    </div>
  );
}
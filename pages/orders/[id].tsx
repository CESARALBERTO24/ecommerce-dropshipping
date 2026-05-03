import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase, Order } from '@/lib/supabase';
import { getUser } from '@/lib/auth';
import Link from 'next/link';

export default function OrderDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (!id) return;

    async function fetchOrder() {
      const currentUser = await getUser();
      setUser(currentUser);

      const { data, error } = await supabase
        .from('orders')
        .select('*, suppliers(name)')
        .eq('id', id)
        .single();

      if (!error && data) {
        if (currentUser && (data.client_id === currentUser.id || currentUser.email)) {
          setOrder(data);
        }
      }
      setLoading(false);
    }
    fetchOrder();
  }, [id]);

  if (loading) return <div className="loading-page">Cargando...</div>;
  if (!order) return <div className="error">Pedido no encontrado</div>;

  return (
    <div className="page">
      <div className="container">
        {router.query.success === 'true' && (
          <div className="success-alert">
            ¡Pedido creado exitosamente! Te enviaremos actualizaciones por email.
          </div>
        )}

        <div className="order-header">
          <div>
            <h1>Pedido {order.order_number}</h1>
            <p className="order-date">
              Fecha: {new Date(order.created_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <span className={`status-badge ${order.status}`}>{order.status}</span>
        </div>

        <div className="order-grid">
          <div className="order-section">
            <h2>Productos</h2>
            <div className="items-list">
              {(order.items as any[])?.map((item, idx) => (
                <div key={idx} className="order-item">
                  <div className="item-image">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <div className="placeholder">Sin imagen</div>
                    )}
                  </div>
                  <div className="item-details">
                    <h3>{item.name}</h3>
                    <p className="item-price">${item.price?.toFixed(2)}</p>
                    <p className="item-quantity">Cantidad: {item.quantity}</p>
                  </div>
                  <div className="item-total">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="order-sidebar">
            <div className="info-card">
              <h3>Resumen del Pedido</h3>
              <div className="info-row">
                <span>Subtotal</span>
                <span>${order.subtotal?.toFixed(2)}</span>
              </div>
              <div className="info-row">
                <span>Envío</span>
                <span>{order.shipping_cost === 0 ? 'Gratis' : `$${order.shipping_cost?.toFixed(2)}`}</span>
              </div>
              <div className="info-row total">
                <span>Total</span>
                <span>${order.total?.toFixed(2)}</span>
              </div>
            </div>

            {order.shipping_address && (
              <div className="info-card">
                <h3>Dirección de Envío</h3>
                <div className="address">
                  <p>{(order.shipping_address as any)?.name}</p>
                  <p>{(order.shipping_address as any)?.address}</p>
                  <p>{(order.shipping_address as any)?.city}, {(order.shipping_address as any)?.postalCode}</p>
                  <p>{(order.shipping_address as any)?.country}</p>
                  <p>Tel: {(order.shipping_address as any)?.phone}</p>
                </div>
              </div>
            )}

            {(order.tracking_number || order.supplier_order_id) && (
              <div className="info-card">
                <h3>Información de Seguimiento</h3>
                {order.supplier_order_id && (
                  <p className="info-item">
                    <strong>ID del proveedor:</strong> {order.supplier_order_id}
                  </p>
                )}
                {order.tracking_number && (
                  <p className="info-item">
                    <strong>Tracking:</strong> {order.tracking_number}
                  </p>
                )}
                {order.supplier_status && (
                  <p className="info-item">
                    <strong>Estado del proveedor:</strong> {order.supplier_status}
                  </p>
                )}
              </div>
            )}

            <div className="info-card">
              <h3>Proveedor</h3>
              <p>{(order.suppliers as any)?.name || 'No asignado'}</p>
            </div>
          </div>
        </div>

        <div className="order-actions">
          <Link href="/orders" className="btn btn-outline">Ver Todos los Pedidos</Link>
          <Link href="/products" className="btn btn-primary">Seguir Comprando</Link>
        </div>
      </div>

      <style jsx>{`
        .page { padding: 2rem 0; }
        .success-alert {
          background: #d1fae5;
          color: #065f46;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 2rem;
        }
        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .order-header h1 { margin-bottom: 0.5rem; }
        .order-date { color: var(--text-muted); }
        .status-badge {
          padding: 0.5rem 1rem;
          border-radius: 999px;
          font-weight: 500;
          font-size: 0.875rem;
        }
        .status-badge.pending { background: #fef3c7; color: #d97706; }
        .status-badge.processing { background: #dbeafe; color: #2563eb; }
        .status-badge.shipped { background: #d1fae5; color: #059669; }
        .status-badge.delivered { background: #d1fae5; color: #059669; }
        .status-badge.cancelled { background: #fee2e2; color: #dc2626; }
        .order-grid {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 2rem;
        }
        .order-section h2, .info-card h3 {
          font-size: 1.125rem;
          margin-bottom: 1rem;
        }
        .items-list { display: flex; flex-direction: column; gap: 1rem; }
        .order-item {
          display: grid;
          grid-template-columns: 80px 1fr auto;
          gap: 1rem;
          padding: 1rem;
          border: 1px solid var(--border);
          border-radius: 8px;
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
        .item-details h3 { font-size: 1rem; margin-bottom: 0.25rem; }
        .item-price { color: var(--accent); font-weight: 600; }
        .item-quantity { font-size: 0.875rem; color: var(--text-muted); }
        .item-total { font-weight: 700; font-size: 1.125rem; }
        .info-card {
          background: var(--secondary);
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--border);
        }
        .info-row.total { font-weight: 700; font-size: 1.125rem; border-bottom: none; }
        .address p { margin-bottom: 0.25rem; font-size: 0.875rem; }
        .info-item { font-size: 0.875rem; margin-bottom: 0.5rem; }
        .order-actions {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid var(--border);
        }
        .loading-page, .error { text-align: center; padding: 4rem; }
        @media (max-width: 768px) {
          .order-grid { grid-template-columns: 1fr; }
          .order-actions { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
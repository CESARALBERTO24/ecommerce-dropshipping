import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { getUser } from '@/lib/auth';

export default function Checkout() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (items.length === 0) {
    if (typeof window !== 'undefined') {
      router.push('/cart');
    }
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await getUser();
      
      const shippingAddress = {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        country: formData.country,
        phone: formData.phone,
      };

      const orderItems = items.map(item => ({
        product_id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.images?.[0],
      }));

      const shippingCost = total >= 50 ? 0 : 5;

      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          client_id: user?.id,
          supplier_id: items[0]?.product.supplier_id,
          status: 'pending',
          items: orderItems,
          subtotal: total,
          shipping_cost: shippingCost,
          total: total + shippingCost,
          shipping_address: shippingAddress,
          payment_status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      clearCart();
      router.push(`/orders/${order.id}?success=true`);
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error al crear el pedido. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <h1>Checkout</h1>
        
        <div className="checkout-layout">
          <form onSubmit={handleSubmit} className="checkout-form">
            <div className="form-section">
              <h2>Información de Contacto</h2>
              <div className="form-group">
                <label>Nombre completo</label>
                <input
                  type="text"
                  className="input"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  className="input"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  className="input"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            <div className="form-section">
              <h2>Dirección de Envío</h2>
              <div className="form-group">
                <label>Dirección</label>
                <input
                  type="text"
                  className="input"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Ciudad</label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Código Postal</label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={formData.postalCode}
                    onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>País</label>
                <input
                  type="text"
                  className="input"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-accent btn-block" disabled={loading}>
              {loading ? 'Procesando...' : `Pagar $${(total + (total >= 50 ? 0 : 5)).toFixed(2)}`}
            </button>
          </form>

          <div className="order-summary">
            <h2>Resumen del Pedido</h2>
            {items.map((item) => (
              <div key={item.product.id} className="summary-item">
                <span>{item.quantity}x {item.product.name}</span>
                <span>${(item.product.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
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
          </div>
        </div>
      </div>

      <style jsx>{`
        .page { padding: 2rem 0; }
        h1 { margin-bottom: 2rem; }
        .checkout-layout {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 2rem;
        }
        .form-section {
          margin-bottom: 2rem;
        }
        .form-section h2 {
          font-size: 1.25rem;
          margin-bottom: 1rem;
        }
        .form-group {
          margin-bottom: 1rem;
        }
        .form-group label {
          display: block;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .btn-block {
          width: 100%;
          padding: 1rem;
          font-size: 1.125rem;
        }
        .order-summary {
          background: var(--secondary);
          padding: 1.5rem;
          border-radius: 12px;
          height: fit-content;
        }
        .order-summary h2 { margin-bottom: 1rem; }
        .summary-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--border);
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
        }
        .summary-total {
          display: flex;
          justify-content: space-between;
          padding-top: 1rem;
          font-weight: 700;
          font-size: 1.25rem;
        }
        @media (max-width: 768px) {
          .checkout-layout { grid-template-columns: 1fr; }
          .form-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
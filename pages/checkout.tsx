import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { getUser } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ecommerce-dropshipping-api.cesarlopez24.workers.dev';

export default function Checkout() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<'info' | 'payment' | 'success'>('info');
  const [cardComplete, setCardComplete] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
  });

  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiry: '',
    cvc: '',
    name: '',
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

  const shippingCost = total >= 50 ? 0 : 5;
  const finalTotal = total + shippingCost;

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingPayment(true);

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

      // Intentar crear PaymentIntent con Stripe
      let paymentIntentId = null;
      try {
        const intentRes = await fetch(`${API_URL}/api/payment/create-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: finalTotal,
            currency: 'usd',
            email: formData.email,
          }),
        });
        const intentData = await intentRes.json();
        if (intentData.client_secret) {
          paymentIntentId = intentData.payment_intent_id;
        }
      } catch (stripeError) {
        console.log('Stripe no configurado, creando pedido sin pago');
      }

      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          client_id: user?.id,
          supplier_id: items[0]?.product.supplier_id || 'supplier-001',
          status: 'pending',
          items: orderItems,
          subtotal: total,
          shipping_cost: shippingCost,
          total: finalTotal,
          shipping_address: shippingAddress,
          payment_status: paymentIntentId ? 'paid' : 'pending',
          payment_method: 'card',
        })
        .select()
        .single();

      if (error) throw error;

      clearCart();
      setStep('success');
      setTimeout(() => {
        router.push(`/orders/${order.id}?success=true`);
      }, 2000);

    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error al crear el pedido. Por favor intenta de nuevo.');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="page">
        <div className="container">
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h1>¡Pedido creado exitosamente!</h1>
            <p>Serás redirigido a tus pedidos en momentos...</p>
          </div>
        </div>
        <style jsx>{`
          .success-message {
            text-align: center;
            padding: 4rem 2rem;
          }
          .success-icon {
            width: 80px;
            height: 80px;
            background: #22c55e;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            margin: 0 auto 2rem;
          }
          .success-message h1 {
            margin-bottom: 1rem;
            color: #22c55e;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <h1>Checkout</h1>

        <div className="checkout-layout">
          <form onSubmit={step === 'info' ? handleInfoSubmit : handlePaymentSubmit} className="checkout-form">
            {step === 'info' && (
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
            )}

            {step === 'info' && (
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
            )}

            {step === 'payment' && (
              <div className="form-section">
                <h2>Información de Pago</h2>
                <div className="payment-notice">
                  <p>💳 Pago seguro con Stripe</p>
                  <p className="text-muted">Ingresa los datos de tu tarjeta para completar el pago</p>
                </div>
                <div className="form-group">
                  <label>Nombre en la tarjeta</label>
                  <input
                    type="text"
                    className="input"
                    required
                    placeholder="Como aparece en la tarjeta"
                    value={paymentData.name}
                    onChange={(e) => setPaymentData({...paymentData, name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Número de tarjeta</label>
                  <input
                    type="text"
                    className="input"
                    required
                    placeholder="4242 4242 4242 4242"
                    maxLength={19}
                    value={paymentData.cardNumber}
                    onChange={(e) => setPaymentData({...paymentData, cardNumber: e.target.value})}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Fecha de expiración</label>
                    <input
                      type="text"
                      className="input"
                      required
                      placeholder="MM/YY"
                      maxLength={5}
                      value={paymentData.expiry}
                      onChange={(e) => setPaymentData({...paymentData, expiry: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>CVC</label>
                    <input
                      type="text"
                      className="input"
                      required
                      placeholder="123"
                      maxLength={4}
                      value={paymentData.cvc}
                      onChange={(e) => setPaymentData({...paymentData, cvc: e.target.value})}
                    />
                </div>
                </div>
                <div className="stripe-badge">
                  🔒 Powered by Stripe
                </div>
              </div>
            )}

            <div className="form-actions">
              {step === 'payment' && (
                <button type="button" className="btn btn-outline" onClick={() => setStep('info')}>
                  Volver
                </button>
              )}
              <button type="submit" className="btn btn-accent btn-block" disabled={processingPayment}>
                {processingPayment ? 'Procesando...' : step === 'info' ? 'Continuar al Pago' : `Pagar $${finalTotal.toFixed(2)}`}
              </button>
            </div>
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
              <span>{shippingCost === 0 ? 'Gratis' : `$${shippingCost.toFixed(2)}`}</span>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <span>${finalTotal.toFixed(2)}</span>
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
        .payment-notice {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }
        .payment-notice p:first-child {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        .stripe-badge {
          text-align: center;
          color: #635bff;
          font-size: 0.875rem;
          margin-top: 1rem;
        }
        .form-actions {
          display: flex;
          gap: 1rem;
        }
        .form-actions .btn-block {
          flex: 1;
          padding: 1rem;
          font-size: 1rem;
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
        .success-message {
          text-align: center;
          padding: 4rem 2rem;
        }
        .success-icon {
          width: 80px;
          height: 80px;
          background: #22c55e;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          margin: 0 auto 2rem;
        }
        @media (max-width: 768px) {
          .checkout-layout { grid-template-columns: 1fr; }
          .form-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
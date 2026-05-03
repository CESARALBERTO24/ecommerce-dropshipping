import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { getUser } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ecommerce-dropshipping-api.cesarlopez24.workers.dev';

interface CountryConfig {
  currency: string;
  currencySymbol: string;
  locale: string;
}

const COUNTRIES: Record<string, CountryConfig> = {
  CL: { currency: 'CLP', currencySymbol: '$', locale: 'es-CL' },
  US: { currency: 'USD', currencySymbol: '$', locale: 'en-US' },
};

export default function Checkout() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<'info' | 'payment' | 'success'>('info');
  const [country, setCountry] = useState('CL');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Chile',
    region: '',
    rut: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'mercadopago'>('mercadopago');

  const [cardData, setCardData] = useState({
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

  const countryConfig = COUNTRIES[country] || COUNTRIES.CL;
  const shippingCost = total >= 25000 ? 0 : 3000; // Envío gratis sobre 25000 CLP
  const finalTotal = total + shippingCost;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(countryConfig.locale, {
      style: 'currency',
      currency: countryConfig.currency,
    }).format(price);
  };

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
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
        region: formData.region,
        phone: formData.phone,
        rut: formData.rut,
      };

      const orderItems = items.map(item => ({
        product_id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.images?.[0],
      }));

      // Crear PaymentIntent con la moneda correcta
      let paymentIntentId = null;
      try {
        const intentRes = await fetch(`${API_URL}/api/payment/create-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: finalTotal,
            currency: countryConfig.currency.toLowerCase(),
            email: formData.email,
          }),
        });
        const intentData = await intentRes.json();
        if (intentData.client_secret) {
          paymentIntentId = intentData.payment_intent_id;
        }
      } catch (stripeError) {
        console.log('Stripe no configurado completamente');
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
          payment_method: paymentMethod === 'mercadopago' ? 'mercadopago' : 'card',
        })
        .select()
        .single();

      if (error) throw error;

      // Si es Mercado Libre, aquí redirigirías a Mercado Pago
      if (paymentMethod === 'mercadopago') {
        // En producción, integrarías con Mercado Pago
        alert('Serás redirigido a Mercado Libre para completar el pago');
      }

      clearCart();
      setStep('success');
      setTimeout(() => {
        router.push(`/orders/${order.id}?success=true`);
      }, 2000);

    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error al crear el pedido. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
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
          .success-message h1 { margin-bottom: 1rem; color: #22c55e; }
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
              <>
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
                      placeholder="+56 9 XXXX XXXX"
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
                      placeholder="Calle y número"
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
                      <label>Comuna</label>
                      <input
                        type="text"
                        className="input"
                        required
                        value={formData.postalCode}
                        onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Región</label>
                      <select 
                        className="input"
                        value={formData.region}
                        onChange={(e) => setFormData({...formData, region: e.target.value})}
                        required
                      >
                        <option value="">Selecciona región</option>
                        <option value="Arica y Parinacota">Arica y Parinacota</option>
                        <option value="Tarapacá">Tarapacá</option>
                        <option value="Antofagasta">Antofagasta</option>
                        <option value="Atacama">Atacama</option>
                        <option value="Coquimbo">Coquimbo</option>
                        <option value="Valparaíso">Valparaíso</option>
                        <option value="Metropolitana">Metropolitana</option>
                        <option value="O'Higgins">O'Higgins</option>
                        <option value="Maule">Maule</option>
                        <option value="Ñuble">Ñuble</option>
                        <option value="Biobío">Biobío</option>
                        <option value="La Araucanía">La Araucanía</option>
                        <option value="Los Ríos">Los Ríos</option>
                        <option value="Los Lagos">Los Lagos</option>
                        <option value="Aysén">Aysén</option>
                        <option value="Magallanes">Magallanes</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>País</label>
                      <select 
                        className="input"
                        value={country}
                        onChange={(e) => {
                          setCountry(e.target.value);
                          setFormData({...formData, country: 'Chile'});
                        }}
                      >
                        <option value="CL">🇨🇱 Chile</option>
                      </select>
                    </div>
                  </div>
                  {country === 'CL' && (
                    <div className="form-group">
                      <label>RUT (opcional para factura)</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="XX.XXX.XXX-X"
                        value={formData.rut}
                        onChange={(e) => setFormData({...formData, rut: e.target.value})}
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            {step === 'payment' && (
              <div className="form-section">
                <h2>Método de Pago</h2>
                
                <div className="payment-methods">
                  <label className={`payment-option ${paymentMethod === 'mercadopago' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="mercadopago"
                      checked={paymentMethod === 'mercadopago'}
                      onChange={() => setPaymentMethod('mercadopago')}
                    />
                    <div className="payment-content">
                      <span className="payment-icon">🛒</span>
                      <div>
                        <strong>Mercado Libre</strong>
                        <span className="payment-desc">Paga con tarjetas, transferencia o Mercado Pago</span>
                        </div>
                      </div>
                    </label>
                </div>

                {paymentMethod === 'mercadopago' && (
                  <div className="mercadopago-info">
                    <p>Serás redirigido a Mercado Libre para completar tu pago de forma segura.</p>
                    <div className="mercadopago-methods">
                      <span>💳 Tarjeta de crédito</span>
                      <span>💳 Tarjeta de débito</span>
                      <span>🏦 Transferencia bancaria</span>
                      <span>📱 Mercado Pago</span>
                    </div>
                    <div className="mercadopago-badge">
                      <img src="https://http2.mlstatic.com/frontend-assets/v1.0.4/mercadopago/logo-horizontal-lg.png" alt="Mercado Libre" />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="form-actions">
              {step === 'payment' && (
                <button type="button" className="btn btn-outline" onClick={() => setStep('info')}>
                  Volver
                </button>
              )}
              <button type="submit" className="btn btn-accent btn-block" disabled={loading}>
                {loading ? 'Procesando...' : step === 'info' ? 'Continuar al Pago' : `Pagar ${formatPrice(finalTotal)}`}
              </button>
            </div>
          </form>

          <div className="order-summary">
            <h2>Resumen del Pedido</h2>
            {items.map((item) => (
              <div key={item.product.id} className="summary-item">
                <span>{item.quantity}x {item.product.name}</span>
                <span>{formatPrice(item.product.price * item.quantity)}</span>
              </div>
            ))}
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="summary-row">
              <span>Envío</span>
              <span>{shippingCost === 0 ? 'Gratis' : formatPrice(shippingCost)}</span>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <span>{formatPrice(finalTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .page { padding: 2rem 0; }
        h1 { margin-bottom: 2rem; }
        .checkout-layout { display: grid; grid-template-columns: 1fr 350px; gap: 2rem; }
        .form-section { margin-bottom: 2rem; }
        .form-section h2 { font-size: 1.25rem; margin-bottom: 1rem; }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; font-size: 0.875rem; margin-bottom: 0.5rem; font-weight: 500; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        
        .payment-methods { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
        .payment-option {
          display: flex;
          align-items: center;
          padding: 1rem;
          border: 2px solid var(--border);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .payment-option:hover { border-color: var(--accent); }
        .payment-option.selected { border-color: var(--accent); background: #f0f9ff; }
        .payment-option input { display: none; }
        .payment-content { display: flex; align-items: center; gap: 1rem; width: 100%; }
        .payment-icon { font-size: 1.5rem; }
        .payment-content div { flex: 1; }
        .payment-content strong { display: block; }
        .payment-desc { font-size: 0.875rem; color: var(--text-muted); }

        .card-form { margin-top: 1.5rem; }
        .secure-badge { text-align: center; color: var(--text-muted); font-size: 0.875rem; margin-top: 1rem; }

        .webpay-info { text-align: center; padding: 2rem; background: #f0f9ff; border-radius: 8px; }
        .webpay-banks { display: flex; justify-content: center; gap: 1rem; margin-top: 1rem; flex-wrap: wrap; }
        .webpay-banks span { font-size: 0.875rem; color: var(--text-muted); }

        .mercadopago-info { text-align: center; padding: 2rem; background: #fff9e6; border-radius: 8px; border: 2px solid #ffe600; }
        .mercadopago-methods { display: flex; justify-content: center; gap: 1rem; margin-top: 1rem; flex-wrap: wrap; }
        .mercadopago-methods span { font-size: 0.875rem; color: var(--text-muted); }
        .mercadopago-badge { margin-top: 1.5rem; }
        .mercadopago-badge img { height: 30px; }

        .form-actions { display: flex; gap: 1rem; margin-top: 2rem; }
        .form-actions .btn-block { flex: 1; padding: 1rem; font-size: 1rem; }

        .order-summary { background: var(--secondary); padding: 1.5rem; border-radius: 12px; height: fit-content; }
        .order-summary h2 { margin-bottom: 1rem; }
        .summary-item { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border); }
        .summary-row { display: flex; justify-content: space-between; padding: 0.5rem 0; }
        .summary-total { display: flex; justify-content: space-between; padding-top: 1rem; font-weight: 700; font-size: 1.25rem; }

        .success-message { text-align: center; padding: 4rem 2rem; }
        .success-icon { width: 80px; height: 80px; background: #22c55e; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 40px; margin: 0 auto 2rem; }

        @media (max-width: 768px) {
          .checkout-layout { grid-template-columns: 1fr; }
          .form-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
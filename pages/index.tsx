import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  images: string | string[];
  category?: string;
  supplier_id?: string;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const data = await api.products.list({ limit: 8 });
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  return (
    <div>
      <section className="hero">
        <div className="container">
          <h1>Los mejores productos al mejor precio</h1>
          <p>Envíos rápidos directamente a tu puerta</p>
          <div className="hero-actions">
            <Link href="/products" className="btn btn-accent">Ver Productos</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Productos Destacados</h2>
          
          {loading ? (
            <div className="loading">Cargando...</div>
          ) : products.length > 0 ? (
            <div className="product-grid">
              {products.map((product) => {
                const images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
                return (
                <Link key={product.id} href={`/products/${product.id}`} className="product-card">
                  <div className="product-image">
                    {images?.[0] ? (
                      <img src={images[0]} alt={product.name} />
                    ) : (
                      <div className="placeholder-img">Sin imagen</div>
                    )}
                  </div>
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p className="product-price">${product.price?.toFixed(2)}</p>
                  </div>
                </Link>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <p>No hay productos disponibles</p>
              <Link href="/products" className="btn btn-outline">Ver todos los productos</Link>
            </div>
          )}

          <div className="section-cta">
            <Link href="/products" className="btn btn-outline">Ver Todos los Productos</Link>
          </div>
        </div>
      </section>

      <section className="features section">
        <div className="container">
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon">🚚</div>
              <h3>Envío Gratis</h3>
              <p className="text-muted">En pedidos mayores a $50</p>
            </div>
            <div className="feature">
              <div className="feature-icon">🔒</div>
              <h3>Compra Segura</h3>
              <p className="text-muted">Pagos protegidos</p>
            </div>
            <div className="feature">
              <div className="feature-icon">↩️</div>
              <h3>Devoluciones</h3>
              <p className="text-muted">30 días para devolver</p>
            </div>
            <div className="feature">
              <div className="feature-icon">💬</div>
              <h3>Soporte 24/7</h3>
              <p className="text-muted">Siempre disponibles</p>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .hero {
          background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
          color: white;
          padding: 6rem 0;
          text-align: center;
        }
        .hero h1 {
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }
        .hero p {
          font-size: 1.25rem;
          opacity: 0.9;
          margin-bottom: 2rem;
        }
        .hero-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }
        .section-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 2rem;
          text-align: center;
        }
        .product-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }
        .product-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.1);
        }
        .product-image {
          aspect-ratio: 1;
          background: var(--secondary);
          overflow: hidden;
        }
        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .placeholder-img {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--text-muted);
        }
        .product-info {
          padding: 1rem;
        }
        .product-info h3 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        .product-price {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--accent);
        }
        .section-cta {
          text-align: center;
          margin-top: 3rem;
        }
        .features {
          background: var(--secondary);
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
          text-align: center;
        }
        .feature-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }
        .feature h3 {
          font-size: 1.125rem;
          margin-bottom: 0.5rem;
        }
        .loading, .empty-state {
          text-align: center;
          padding: 4rem 0;
          color: var(--text-muted);
        }
        @media (max-width: 1024px) {
          .product-grid, .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .hero h1 {
            font-size: 2rem;
          }
          .product-grid, .features-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
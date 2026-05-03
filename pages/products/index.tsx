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

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchProducts() {
      try {
        const data = await api.products.list({
          category: category || undefined,
          search: search || undefined,
          limit: 50,
        });
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
      setLoading(false);
    }
    fetchProducts();
  }, [category, search]);

  return (
    <div className="page">
      <div className="container">
        <h1>Todos los Productos</h1>

        <div className="filters">
          <input
            type="text"
            placeholder="Buscar productos..."
            className="input search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select 
            className="input select-input" 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            <option value="electronics">Electrónicos</option>
            <option value="clothing">Ropa</option>
            <option value="home">Hogar</option>
            <option value="accessories">Accesorios</option>
          </select>
        </div>

        {loading ? (
          <div className="loading">Cargando productos...</div>
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
                    {product.category && <span className="category-tag">{product.category}</span>}
                    <p className="product-price">${product.price?.toFixed(2)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>No se encontraron productos</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .page {
          padding: 2rem 0;
        }
        h1 {
          font-size: 2rem;
          margin-bottom: 2rem;
        }
        .filters {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .search-input {
          flex: 1;
          max-width: 400px;
        }
        .select-input {
          width: 200px;
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
          transition: transform 0.2s;
        }
        .product-card:hover {
          transform: translateY(-4px);
        }
        .product-image {
          aspect-ratio: 1;
          background: var(--secondary);
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
          margin-bottom: 0.5rem;
        }
        .category-tag {
          display: inline-block;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          background: var(--secondary);
          border-radius: 4px;
          margin-bottom: 0.5rem;
        }
        .product-price {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--accent);
        }
        .loading, .empty-state {
          text-align: center;
          padding: 4rem;
          color: var(--text-muted);
        }
        @media (max-width: 1024px) {
          .product-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 768px) {
          .product-grid { grid-template-columns: repeat(2, 1fr); }
          .filters { flex-direction: column; }
          .search-input, .select-input { max-width: 100%; width: 100%; }
        }
      `}</style>
    </div>
  );
}
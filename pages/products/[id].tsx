import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { api } from '@/lib/api';
import { useCart } from '@/context/CartContext';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  images: string | string[];
  category?: string;
  supplier_id?: string;
}

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    async function fetchProduct() {
      try {
        const data = await api.products.get(id as string);
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product:', error);
      }
      setLoading(false);
    }
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      const images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
      const cartProduct = { ...product, images };
      addItem(cartProduct as any, quantity);
      router.push('/cart');
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;
  if (!product) return <div className="error">Producto no encontrado</div>;

  const images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;

  return (
    <div className="page">
      <div className="container">
        <div className="product-detail">
          <div className="product-gallery">
            {images?.[0] ? (
              <img src={images[0]} alt={product.name} />
            ) : (
              <div className="placeholder-img">Sin imagen</div>
            )}
          </div>

          <div className="product-info">
            <h1>{product.name}</h1>
            {product.category && <span className="category">{product.category}</span>}
            <p className="price">${product.price?.toFixed(2)}</p>
            
            {product.description && (
              <div className="description">
                <h3>Descripción</h3>
                <p>{product.description}</p>
              </div>
            )}

            <div className="actions">
              <div className="quantity-selector">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
              <button className="btn btn-accent" onClick={handleAddToCart}>
                Agregar al Carrito
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .page { padding: 2rem 0; }
        .product-detail {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
        }
        .product-gallery {
          aspect-ratio: 1;
          background: var(--secondary);
          border-radius: 12px;
          overflow: hidden;
        }
        .product-gallery img {
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
        .product-info h1 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }
        .category {
          display: inline-block;
          font-size: 0.875rem;
          padding: 0.25rem 0.75rem;
          background: var(--secondary);
          border-radius: 4px;
          margin-bottom: 1rem;
        }
        .price {
          font-size: 2rem;
          font-weight: 700;
          color: var(--accent);
          margin-bottom: 2rem;
        }
        .description {
          margin-bottom: 2rem;
        }
        .description h3 {
          font-size: 1rem;
          margin-bottom: 0.5rem;
        }
        .description p {
          color: var(--text-muted);
        }
        .actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }
        .quantity-selector {
          display: flex;
          align-items: center;
          border: 1px solid var(--border);
          border-radius: 8px;
        }
        .quantity-selector button {
          padding: 0.75rem 1rem;
          font-size: 1.25rem;
        }
        .quantity-selector span {
          padding: 0 1rem;
          font-weight: 600;
        }
        .loading, .error {
          text-align: center;
          padding: 4rem;
        }
        @media (max-width: 768px) {
          .product-detail { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
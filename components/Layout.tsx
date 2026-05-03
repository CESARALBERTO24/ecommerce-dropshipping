import Head from 'next/head';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useState, useEffect } from 'react';
import { getUser, onAuthStateChange } from '@/lib/auth';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { itemCount } = useCart();
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });
    getUser().then(setUser).catch(() => {});
    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <Head>
        <title>Mi Tienda Dropshipping</title>
        <meta name="description" content="Tienda online con los mejores productos" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <header className="header">
        <div className="container header-inner">
          <Link href="/" className="logo">
            MiTienda
          </Link>

          <nav className={`nav ${menuOpen ? 'nav-open' : ''}`}>
            <Link href="/" className="nav-link">Inicio</Link>
            <Link href="/products" className="nav-link">Productos</Link>
            <Link href="/orders" className="nav-link">Mis Pedidos</Link>
          </nav>

          <div className="header-actions">
            <Link href="/cart" className="cart-btn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
            </Link>

            {user ? (
              <div className="user-menu">
                <span className="user-email">{user.email}</span>
                <Link href="/account" className="btn btn-outline">Mi Cuenta</Link>
              </div>
            ) : (
              <Link href="/login" className="btn btn-primary">Iniciar Sesión</Link>
            )}

            <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <h4>MiTienda</h4>
              <p className="text-muted">Tu tienda de dropshipping favorita</p>
            </div>
            <div>
              <h4>Enlaces</h4>
              <Link href="/products">Productos</Link>
              <Link href="/orders">Pedidos</Link>
              <Link href="/contact">Contacto</Link>
            </div>
            <div>
              <h4>Legal</h4>
              <Link href="/privacy">Política de Privacidad</Link>
              <Link href="/terms">Términos y Condiciones</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 MiTienda. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .header {
          position: sticky;
          top: 0;
          background: var(--white);
          border-bottom: 1px solid var(--border);
          z-index: 100;
        }
        .header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 72px;
        }
        .logo {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--primary);
        }
        .nav {
          display: flex;
          gap: 2rem;
        }
        .nav-link {
          font-weight: 500;
          color: var(--text);
          transition: color 0.2s;
        }
        .nav-link:hover {
          color: var(--accent);
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .cart-btn {
          position: relative;
          padding: 0.5rem;
        }
        .cart-badge {
          position: absolute;
          top: 0;
          right: 0;
          background: var(--accent);
          color: white;
          font-size: 0.75rem;
          padding: 0.125rem 0.375rem;
          border-radius: 999px;
          min-width: 18px;
          text-align: center;
        }
        .user-menu {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .user-email {
          font-size: 0.875rem;
          color: var(--text-muted);
        }
        .menu-toggle {
          display: none;
          flex-direction: column;
          gap: 4px;
          padding: 0.5rem;
        }
        .menu-toggle span {
          width: 24px;
          height: 2px;
          background: var(--text);
        }
        .footer {
          background: var(--secondary);
          padding: 4rem 0 2rem;
          margin-top: 4rem;
        }
        .footer-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }
        .footer h4 {
          margin-bottom: 1rem;
          font-weight: 600;
        }
        .footer a {
          display: block;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
        }
        .footer-bottom {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid var(--border);
          text-align: center;
          color: var(--text-muted);
        }
        @media (max-width: 768px) {
          .nav {
            display: none;
            position: absolute;
            top: 72px;
            left: 0;
            right: 0;
            background: var(--white);
            flex-direction: column;
            padding: 1rem;
            border-bottom: 1px solid var(--border);
          }
          .nav-open {
            display: flex;
          }
          .menu-toggle {
            display: flex;
          }
          .footer-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
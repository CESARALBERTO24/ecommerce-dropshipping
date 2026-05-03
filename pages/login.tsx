import { useState } from 'react';
import { useRouter } from 'next/router';
import { signInWithGoogle, signInWithApple, signInWithEmail, signUpWithEmail } from '@/lib/auth';

export default function Login() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading('google');
    setError('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading('');
    }
  };

  const handleAppleLogin = async () => {
    setLoading('apple');
    setError('');
    try {
      await signInWithApple();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading('');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('email');
    setError('');
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        alert('Revisa tu email para confirmar tu cuenta');
      } else {
        await signInWithEmail(email, password);
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading('');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>{isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}</h1>

        <div className="social-buttons">
          <button 
            className="btn-social google" 
            onClick={handleGoogleLogin}
            disabled={!!loading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>
          
          <button 
            className="btn-social apple" 
            onClick={handleAppleLogin}
            disabled={!!loading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.58 2.35-1.18 3.1-.67.85-1.41 1.76-2.26 1.76-.82 0-1.54-.72-2.45-.72-1.27 0-2.3.85-3.04.86-.8.02-2.33-1.21-2.7-2.73-.98-3.98 3.04-5.48 4.69-5.48 1.37 0 2.46.77 3.2.77.76 0 1.92-.73 3.42-.73.34 0 .87.03 1.57.16-.66-.56-1.32-1.54-1.37-2.68-.13-.29-.46-1.02-.14-2.18.18-.67.52-1.37.52-1.41.02-.03-.05-.03-.15-.03s-.68.06-1.03.22c-.28.14-.49.34-.66.53-.07.09-.15.2-.15.38z"/>
            </svg>
            Continuar con Apple
          </button>
        </div>

        <div className="divider">
          <span>o</span>
        </div>

        <form onSubmit={handleEmailAuth} className="email-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={!!loading}>
            {loading === 'email' ? 'Cargando...' : (isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión')}
          </button>
        </form>

        <p className="toggle-auth">
          {isSignUp ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
          <button onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </button>
        </p>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        .auth-container {
          width: 100%;
          max-width: 400px;
        }
        h1 {
          text-align: center;
          margin-bottom: 2rem;
        }
        .social-buttons {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .btn-social {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.875rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-weight: 500;
          transition: background 0.2s;
        }
        .btn-social:hover {
          background: var(--secondary);
        }
        .btn-social:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .divider {
          display: flex;
          align-items: center;
          margin: 1.5rem 0;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }
        .divider span {
          padding: 0 1rem;
          color: var(--text-muted);
        }
        .email-form .form-group {
          margin-bottom: 1rem;
        }
        .email-form label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        .btn-block {
          width: 100%;
        }
        .error {
          color: var(--error);
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }
        .toggle-auth {
          text-align: center;
          margin-top: 1.5rem;
          color: var(--text-muted);
        }
        .toggle-auth button {
          color: var(--accent);
          font-weight: 500;
          margin-left: 0.5rem;
        }
      `}</style>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    async function handleCallback() {
      const { error: authError } = await supabase.auth.getSession();

      if (authError) {
        setError(authError.message);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .eq('auth_id', session.user.id)
          .single();

        if (!existingClient) {
          await supabase.from('clients').insert({
            auth_id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
            provider: session.user.app_metadata?.provider || 'email',
          });
        }

        router.push('/');
      } else {
        router.push('/login');
      }
    }

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="callback-page">
        <div className="error-message">
          <h2>Error de autenticación</h2>
          <p>{error}</p>
          <a href="/login" className="btn btn-primary">Volver a intentar</a>
        </div>
        <style jsx>{`
          .callback-page {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
          }
          .error-message {
            text-align: center;
            padding: 2rem;
          }
          .error-message h2 { margin-bottom: 1rem; }
          .error-message p { margin-bottom: 1.5rem; color: var(--text-muted); }
        `}</style>
      </div>
    );
  }

  return (
    <div className="callback-page">
      <div className="loading-message">
        <p>Iniciando sesión...</p>
      </div>
      <style jsx>{`
        .callback-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
        }
        .loading-message {
          text-align: center;
        }
      `}</style>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getUser, signOut } from '@/lib/auth';
import { supabase, Client } from '@/lib/supabase';

export default function Account() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });

  useEffect(() => {
    async function loadUser() {
      const currentUser = await getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('auth_id', currentUser.id)
        .single();

      if (data) {
        setProfile(data);
        setFormData({ name: data.name || '', phone: data.phone || '' });
      }
      setLoading(false);
    }
    loadUser();
  }, [router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('clients')
        .upsert({
          auth_id: user.id,
          email: user.email,
          name: formData.name,
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'auth_id' });

      if (error) throw error;
      alert('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) return <div className="loading-page">Cargando...</div>;

  return (
    <div className="page">
      <div className="container">
        <h1>Mi Cuenta</h1>

        <div className="account-layout">
          <div className="profile-section">
            <h2>Información Personal</h2>
            <form onSubmit={handleUpdate} className="profile-form">
              <div className="form-group">
                <label>Email</label>
                <input type="email" className="input" value={user?.email || ''} disabled />
              </div>
              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  className="input"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>
          </div>

          <div className="settings-section">
            <h2>Configuración</h2>
            <div className="settings-list">
              <button onClick={handleSignOut} className="btn btn-outline btn-block">
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .page { padding: 2rem 0; }
        h1 { margin-bottom: 2rem; }
        .account-layout {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 2rem;
        }
        .profile-section, .settings-section {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.5rem;
        }
        h2 { font-size: 1.25rem; margin-bottom: 1.5rem; }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
        .form-group input:disabled { background: var(--secondary); }
        .settings-list { display: flex; flex-direction: column; gap: 1rem; }
        .btn-block { width: 100%; text-align: center; }
        .loading-page { text-align: center; padding: 4rem; }
        @media (max-width: 768px) {
          .account-layout { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
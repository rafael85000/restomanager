'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { APP_NAME } from '../../lib/config';

export default function Auth() {
  const [mode, setMode] = useState('login');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { nom: nom } },
      });
      if (error) { setError(traduireErreur(error.message)); setLoading(false); return; }
      localStorage.setItem('membre_actif', JSON.stringify({ id: 'gerant', nom: nom || 'Gérant', role: 'Propriétaire', permissions: ['tout'], ts: Date.now() }));
      window.location.href = '/etablissements';
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(traduireErreur(error.message)); setLoading(false); return; }

      const { data: compteExterne } = await supabase.from('comptes_externes').select('*').eq('user_id', data.user.id).eq('actif', true).single()
      if (compteExterne) {
        const premierEtab = (compteExterne.etablissements_ids || [])[0]
        if (premierEtab) localStorage.setItem('etablissement_actif', premierEtab)
        localStorage.setItem('membre_actif', JSON.stringify({ id: data.user.id, nom: compteExterne.nom, role: 'Accès externe', permissions: compteExterne.permissions || [], type: 'externe', ts: Date.now() }))
        window.location.href = '/dashboard'
      } else {
        const { data: etabs } = await supabase.from('etablissements').select('id').eq('compte_client_id', data.user.id).order('created_at').limit(1)
        if (etabs?.[0]) localStorage.setItem('etablissement_actif', etabs[0].id)
        localStorage.setItem('membre_actif', JSON.stringify({ id: 'gerant', nom: data.user.user_metadata?.nom || 'Gérant', role: 'Propriétaire', permissions: ['tout'], ts: Date.now() }))
        window.location.href = '/dashboard'
      }
    }
  }

  function traduireErreur(msg) {
    if (msg.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.';
    if (msg.includes('already registered')) return 'Cet email est déjà utilisé. Connectez-vous plutôt.';
    if (msg.includes('Password should be at least')) return 'Le mot de passe doit contenir au moins 6 caractères.';
    return msg;
  }

  const inpStyle = { width: '100%', padding: '12px 14px', borderRadius: 8, border: '0.5px solid #3a3a3e', background: '#2c2b2f', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ minHeight: '100vh', background: '#1c1b1f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
        <div style={{ width: 40, height: 40, background: '#534ab7', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ti ti-chef-hat" style={{ color: '#fff', fontSize: 20 }} />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>{APP_NAME}</div>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 380 }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: '#2c2b2f', borderRadius: 10, padding: 4 }}>
          <button type="button" onClick={() => { setMode('login'); setError(''); }}
            style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none', background: mode === 'login' ? '#534ab7' : 'transparent', color: mode === 'login' ? '#fff' : '#666460' }}>
            Se connecter
          </button>
          <button type="button" onClick={() => { setMode('signup'); setError(''); }}
            style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none', background: mode === 'signup' ? '#534ab7' : 'transparent', color: mode === 'signup' ? '#fff' : '#666460' }}>
            Créer un compte
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: '#a8a6a0', marginBottom: 6 }}>Votre nom</div>
              <input value={nom} onChange={e => setNom(e.target.value)} required placeholder="Nom complet" style={inpStyle} />
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#a8a6a0', marginBottom: 6 }}>Adresse email</div>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="vous@exemple.fr" style={inpStyle} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: '#a8a6a0', marginBottom: 6 }}>Mot de passe</div>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" style={inpStyle} />
          </div>

          {error && (
            <div style={{ background: '#3a1a1a', border: '0.5px solid #e05858', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#e05858', marginBottom: 14 }}>{error}</div>
          )}

          {mode === 'signup' && (
            <div style={{ fontSize: 12, color: '#555450', marginBottom: 14 }}>
              Vous pourrez créer votre établissement et choisir votre abonnement juste après.
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: 12, background: '#534ab7', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 500, cursor: loading ? 'wait' : 'pointer' }}>
            {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>
      </div>
    </div>
  );
}
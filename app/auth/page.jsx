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
      if (error) {
        setError(traduireErreur(error.message));
        setLoading(false);
        return;
      }
      window.location.href = '/etablissements';
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(traduireErreur(error.message));
        setLoading(false);
        return;
      }
      window.location.href = '/dashboard';
    }
  }

  function traduireErreur(msg) {
    if (msg.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.';
    if (msg.includes('already registered')) return 'Cet email est déjà utilisé. Connectez-vous plutôt.';
    if (msg.includes('Password should be at least')) return 'Le mot de passe doit contenir au moins 6 caractères.';
    return msg;
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f8f7f4', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:'-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }}>
      <div style={{ background:'#fff', borderRadius:'16px', border:'0.5px solid #e2e0d8', padding:'40px', width:'100%', maxWidth:'400px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'28px' }}>
          <div style={{ width:'36px', height:'36px', background:'#534ab7', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ color:'#fff', fontWeight:'700', fontSize:'15px' }}>F</span>
          </div>
          <div style={{ fontSize:'20px', fontWeight:'500', color:'#2c2c2a' }}>{APP_NAME}</div>
        </div>

        <div style={{ fontSize:'22px', fontWeight:'500', color:'#2c2c2a', marginBottom:'24px' }}>
          {mode === 'login' ? 'Connexion à votre espace' : 'Créer votre compte'}
        </div>

        <div style={{ display:'flex', border:'0.5px solid #e2e0d8', borderRadius:'8px', marginBottom:'24px', overflow:'hidden' }}>
          <button type="button" onClick={() => { setMode('login'); setError(''); }} style={{ flex:1, padding:'8px', textAlign:'center', fontSize:'13px', fontWeight:'500', cursor:'pointer', border:'none', background: mode==='login' ? '#eeedfe' : 'transparent', color: mode==='login' ? '#534ab7' : '#5f5e5a' }}>
            Se connecter
          </button>
          <button type="button" onClick={() => { setMode('signup'); setError(''); }} style={{ flex:1, padding:'8px', textAlign:'center', fontSize:'13px', fontWeight:'500', cursor:'pointer', border:'none', background: mode==='signup' ? '#eeedfe' : 'transparent', color: mode==='signup' ? '#534ab7' : '#5f5e5a' }}>
            Créer un compte
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div style={{ marginBottom:'14px' }}>
              <label style={{ fontSize:'13px', fontWeight:'500', color:'#5f5e5a', display:'block', marginBottom:'5px' }}>Votre nom</label>
              <input value={nom} onChange={e => setNom(e.target.value)} required style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none' }} placeholder="Rafael Colonnello" />
            </div>
          )}

          <div style={{ marginBottom:'14px' }}>
            <label style={{ fontSize:'13px', fontWeight:'500', color:'#5f5e5a', display:'block', marginBottom:'5px' }}>Adresse email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none' }} placeholder="vous@exemple.fr" />
          </div>

          <div style={{ marginBottom:'14px' }}>
            <label style={{ fontSize:'13px', fontWeight:'500', color:'#5f5e5a', display:'block', marginBottom:'5px' }}>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none' }} placeholder="••••••••" />
          </div>

          {error && (
            <div style={{ fontSize:'13px', color:'#a32d2d', background:'#fcebeb', padding:'10px 14px', borderRadius:'8px', marginBottom:'14px' }}>{error}</div>
          )}

          {mode === 'signup' && (
            <div style={{ fontSize:'12px', color:'#888780', marginBottom:'14px' }}>
              Vous pourrez créer votre établissement et choisir votre abonnement juste après.
            </div>
          )}

          <button type="submit" disabled={loading} style={{ width:'100%', padding:'12px', background:'#534ab7', color:'#fff', border:'none', borderRadius:'8px', fontSize:'15px', fontWeight:'500', cursor:'pointer' }}>
            {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>
      </div>
    </div>
  );
}

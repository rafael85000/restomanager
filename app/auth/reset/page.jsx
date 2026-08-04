'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Récupérer le code dans l'URL et l'échanger contre une session
    const code = new URLSearchParams(window.location.search).get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) { setError('Lien invalide ou expiré. Recommencez la procédure.') }
        else { setReady(true) }
      })
    } else {
      // Fallback ancien flow avec hash
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') setReady(true)
      })
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setReady(true)
      })
      return () => subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères'); return }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError('Erreur : ' + error.message); return }
    setSuccess(true)
    setTimeout(() => { window.location.replace('/auth') }, 3000)
  }

  const inpStyle = {
    width: '100%', padding: '12px 14px', borderRadius: 8,
    border: '0.5px solid #3a3a3e', background: '#2c2b2f',
    color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1c1b1f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
        <div style={{ width: 40, height: 40, background: '#534ab7', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ti ti-chef-hat" style={{ color: '#fff', fontSize: 20 }} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>FIMC</div>
      </div>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {success ? (
          <div style={{ background: '#1a3a1a', border: '0.5px solid #27500a', borderRadius: 12, padding: '24px 20px', textAlign: 'center' }}>
            <i className="ti ti-circle-check" style={{ fontSize: 40, color: '#4caf50', display: 'block', marginBottom: 12 }} />
            <div style={{ fontSize: 16, color: '#a8f0a8', fontWeight: 600, marginBottom: 8 }}>Mot de passe modifié !</div>
            <div style={{ fontSize: 13, color: '#4a7a4a' }}>Redirection vers la connexion…</div>
          </div>
        ) : error && !ready ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#3a1a1a', border: '0.5px solid #e05858', borderRadius: 10, padding: '20px 18px', marginBottom: 16 }}>
              <i className="ti ti-alert-circle" style={{ fontSize: 32, color: '#e05858', display: 'block', marginBottom: 10 }} />
              <div style={{ fontSize: 13, color: '#e05858' }}>{error}</div>
            </div>
            <a href="/auth" style={{ color: '#666460', fontSize: 12, textDecoration: 'none' }}>← Retour à la connexion</a>
          </div>
        ) : !ready ? (
          <div style={{ textAlign: 'center', color: '#666460', fontSize: 14 }}>
            <i className="ti ti-loader-2" style={{ fontSize: 32, display: 'block', marginBottom: 12, color: '#534ab7' }} />
            Vérification du lien…
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 15, color: '#a8a6a0', textAlign: 'center', marginBottom: 6 }}>Nouveau mot de passe</div>
            <div style={{ fontSize: 12, color: '#555450', textAlign: 'center', marginBottom: 24 }}>Choisissez un nouveau mot de passe pour votre compte.</div>
            {error && <div style={{ background: '#3a1a1a', border: '0.5px solid #e05858', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#e05858', marginBottom: 14 }}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: '#a8a6a0', marginBottom: 6 }}>Nouveau mot de passe</div>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" style={inpStyle} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: '#a8a6a0', marginBottom: 6 }}>Confirmer le mot de passe</div>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={6} placeholder="••••••••"
                  style={{ ...inpStyle, borderColor: confirm && confirm !== password ? '#e05858' : '#3a3a3e' }} />
                {confirm && confirm !== password && <div style={{ fontSize: 11, color: '#e05858', marginTop: 4 }}>Les mots de passe ne correspondent pas</div>}
              </div>
              <button type="submit" disabled={loading || (confirm && confirm !== password)}
                style={{ width: '100%', padding: 12, background: loading ? '#3a3a3e' : '#534ab7', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 500, cursor: loading ? 'wait' : 'pointer' }}>
                {loading ? 'Enregistrement…' : 'Enregistrer le nouveau mot de passe'}
              </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <a href="/auth" style={{ color: '#666460', fontSize: 12, textDecoration: 'none' }}>← Retour à la connexion</a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
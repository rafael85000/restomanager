'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function SelectUserPage() {
  const router = useRouter()
  const [membres, setMembres] = useState([])
  const [roles, setRoles] = useState([])
  const [etabNom, setEtabNom] = useState('')
  const [loading, setLoading] = useState(true)
  const [etape, setEtape] = useState('liste') // liste | pin | gerant
  const [membreSelectionne, setMembreSelectionne] = useState(null)
  const [pin, setPin] = useState('')
  const [pinErreur, setPinErreur] = useState('')
  const [emailGerant, setEmailGerant] = useState('')
  const [mdpGerant, setMdpGerant] = useState('')
  const [gerantErreur, setGerantErreur] = useState('')
  const [loadingAuth, setLoadingAuth] = useState(false)
  const pinRef = useRef(null)

  useEffect(() => {
    // Vérifier si session Supabase active → dashboard directement
   const membreRaw = localStorage.getItem('membre_actif')
    if (membreRaw) {
      router.push('/dashboard')
    } else {
      charger()
    }
  }, [])

  useEffect(() => {
    if (etape === 'pin') setTimeout(() => pinRef.current?.focus(), 100)
  }, [etape])

  const charger = async () => {
    setLoading(true)
    // Charger via etabId en localStorage
    const etabId = localStorage.getItem('etablissement_actif')
    if (!etabId) { setLoading(false); return }

    const [{ data: etab }, { data: mb }, { data: rl }] = await Promise.all([
      supabase.from('etablissements').select('nom').eq('id', etabId).single(),
      supabase.from('equipe').select('id, nom, role_id, actif').eq('etablissement_id', etabId).eq('actif', true).order('nom'),
      supabase.from('roles').select('id, nom, couleur').eq('etablissement_id', etabId)
    ])
    setEtabNom(etab?.nom || '')
    setMembres(mb || [])
    setRoles(rl || [])
    setLoading(false)
  }

  const selectionnerMembre = (m) => {
    setMembreSelectionne(m)
    setPin('')
    setPinErreur('')
    setEtape('pin')
  }

  const saisirChiffre = (c) => {
    if (pin.length >= 4) return
    const nouveau = pin + c
    setPin(nouveau)
    if (nouveau.length === 4) validerPin(nouveau)
  }

  const effacer = () => setPin(p => p.slice(0, -1))

  const validerPin = async (pinSaisi) => {
    const { data: mb } = await supabase
      .from('equipe')
      .select('id, nom, role_id, pin')
      .eq('id', membreSelectionne.id)
      .single()

    if (!mb?.pin || mb.pin !== pinSaisi) {
      setPinErreur('Code incorrect')
      setPin('')
      return
    }

    // Charger les permissions du rôle
    const { data: role } = await supabase
      .from('roles')
      .select('nom, permissions')
      .eq('id', mb.role_id)
      .single()

    // Sauvegarder session membre en localStorage
    localStorage.setItem('membre_actif', JSON.stringify({
      id: mb.id,
      nom: mb.nom,
      role: role?.nom || '',
      permissions: role?.permissions || [],
      ts: Date.now()
    }))

    router.push('/dashboard')
  }

  const connexionGerant = async () => {
    if (!emailGerant || !mdpGerant) { setGerantErreur('Remplissez tous les champs'); return }
    setLoadingAuth(true)
    setGerantErreur('')
    const { error } = await supabase.auth.signInWithPassword({ email: emailGerant, password: mdpGerant })
    setLoadingAuth(false)
    if (error) { setGerantErreur('Email ou mot de passe incorrect'); return }

    // Session persistante — stocker accès gérant complet
    localStorage.setItem('membre_actif', JSON.stringify({
      id: 'gerant',
      nom: 'Gérant',
      role: 'Propriétaire',
      permissions: ['tout'],
      ts: Date.now()
    }))
    router.push('/dashboard')
  }

  const getRoleNom = (roleId) => roles.find(r => r.id === roleId)?.nom || ''
  const getRoleCouleur = (roleId) => roles.find(r => r.id === roleId)?.couleur || '#534ab7'

  const getInitiales = (nom) => nom.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1c1b1f' }}>
      <div style={{ color: '#888780', fontSize: 14 }}>Chargement…</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#1c1b1f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
        <div style={{ width: 40, height: 40, background: '#534ab7', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ti ti-chef-hat" style={{ color: '#fff', fontSize: 20 }} />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>FIMC</div>
          {etabNom && <div style={{ fontSize: 12, color: '#666460' }}>{etabNom}</div>}
        </div>
      </div>

      {/* ÉCRAN LISTE */}
      {etape === 'liste' && (
        <div style={{ width: '100%', maxWidth: 480 }}>
          <div style={{ fontSize: 15, color: '#a8a6a0', textAlign: 'center', marginBottom: 20 }}>Qui êtes-vous ?</div>

          {membres.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666460', fontSize: 13 }}>Aucun membre configuré.<br />Connectez-vous en tant que gérant.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
              {membres.map(m => (
                <div key={m.id} onClick={() => selectionnerMembre(m)}
                  style={{ background: '#2c2b2f', borderRadius: 12, padding: 20, cursor: 'pointer', textAlign: 'center', border: '0.5px solid #3a3a3e', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#38373c'}
                  onMouseLeave={e => e.currentTarget.style.background = '#2c2b2f'}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: getRoleCouleur(m.role_id) + '33', border: `2px solid ${getRoleCouleur(m.role_id)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: 18, fontWeight: 600, color: getRoleCouleur(m.role_id) }}>
                    {getInitiales(m.nom)}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', marginBottom: 4 }}>{m.nom.split(' ')[0]}</div>
                  <div style={{ fontSize: 11, color: '#666460' }}>{getRoleNom(m.role_id)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Bouton gérant discret */}
          <div style={{ textAlign: 'center' }}>
            <button onClick={() => { setEtape('gerant'); setGerantErreur('') }}
              style={{ background: 'none', border: '0.5px solid #3a3a3e', borderRadius: 8, padding: '8px 16px', fontSize: 12, color: '#666460', cursor: 'pointer' }}>
              <i className="ti ti-lock" style={{ marginRight: 5 }} />Connexion gérant
            </button>
          </div>
        </div>
      )}

      {/* ÉCRAN PIN */}
      {etape === 'pin' && membreSelectionne && (
        <div style={{ width: '100%', maxWidth: 320, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: getRoleCouleur(membreSelectionne.role_id) + '33', border: `2px solid ${getRoleCouleur(membreSelectionne.role_id)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 24, fontWeight: 600, color: getRoleCouleur(membreSelectionne.role_id) }}>
            {getInitiales(membreSelectionne.nom)}
          </div>
          <div style={{ fontSize: 16, fontWeight: 500, color: '#fff', marginBottom: 4 }}>{membreSelectionne.nom}</div>
          <div style={{ fontSize: 12, color: '#666460', marginBottom: 28 }}>{getRoleNom(membreSelectionne.role_id)}</div>

          {/* Points PIN */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 28 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: i < pin.length ? '#534ab7' : '#3a3a3e', transition: 'background 0.15s' }} />
            ))}
          </div>

          {pinErreur && <div style={{ fontSize: 12, color: '#e05858', marginBottom: 16 }}>{pinErreur}</div>}

          {/* Pavé numérique */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
            {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((c, i) => (
              <button key={i} onClick={() => c === '⌫' ? effacer() : c !== '' ? saisirChiffre(String(c)) : null}
                disabled={c === ''}
                style={{ height: 56, borderRadius: 10, border: 'none', background: c === '' ? 'transparent' : c === '⌫' ? '#2c2b2f' : '#2c2b2f', color: '#fff', fontSize: c === '⌫' ? 20 : 22, fontWeight: 500, cursor: c === '' ? 'default' : 'pointer', opacity: c === '' ? 0 : 1, transition: 'background 0.1s' }}
                onMouseEnter={e => { if (c !== '') e.currentTarget.style.background = '#38373c' }}
                onMouseLeave={e => { if (c !== '') e.currentTarget.style.background = '#2c2b2f' }}>
                {c}
              </button>
            ))}
          </div>

          <button onClick={() => { setEtape('liste'); setPin(''); setPinErreur('') }}
            style={{ background: 'none', border: 'none', color: '#666460', fontSize: 13, cursor: 'pointer' }}>
            ← Retour
          </button>
        </div>
      )}

      {/* ÉCRAN GÉRANT */}
      {etape === 'gerant' && (
        <div style={{ width: '100%', maxWidth: 360 }}>
          <div style={{ fontSize: 15, color: '#a8a6a0', textAlign: 'center', marginBottom: 24 }}>Connexion gérant</div>

          {gerantErreur && (
            <div style={{ background: '#3a1a1a', border: '0.5px solid #e05858', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#e05858', marginBottom: 14 }}>{gerantErreur}</div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            <input type="email" placeholder="Email" value={emailGerant} onChange={e => setEmailGerant(e.target.value)}
              style={{ padding: '12px 14px', borderRadius: 8, border: '0.5px solid #3a3a3e', background: '#2c2b2f', color: '#fff', fontSize: 14, outline: 'none' }} />
            <input type="password" placeholder="Mot de passe" value={mdpGerant} onChange={e => setMdpGerant(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && connexionGerant()}
              style={{ padding: '12px 14px', borderRadius: 8, border: '0.5px solid #3a3a3e', background: '#2c2b2f', color: '#fff', fontSize: 14, outline: 'none' }} />
          </div>

          <button onClick={connexionGerant} disabled={loadingAuth}
            style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: '#534ab7', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', marginBottom: 12 }}>
            {loadingAuth ? 'Connexion…' : 'Se connecter'}
          </button>

          <div style={{ textAlign: 'center' }}>
            <button onClick={() => { setEtape('liste'); setGerantErreur('') }}
              style={{ background: 'none', border: 'none', color: '#666460', fontSize: 13, cursor: 'pointer' }}>
              ← Retour
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
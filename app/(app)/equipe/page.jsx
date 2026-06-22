'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { getEtablissementActif } from '../../../lib/etablissement'

const TOUTES_PERMISSIONS = [
  { key: 'dashboard', label: 'Tableau de bord' },
  { key: 'mercuriale', label: 'Mercuriale' },
  { key: 'fournisseurs', label: 'Fournisseurs' },
  { key: 'fiches-recettes', label: 'Fiches recettes' },
  { key: 'fiches-techniques', label: 'Fiches techniques' },
  { key: 'allergenes', label: 'Allergènes' },
  { key: 'saisonnalite', label: 'Saisonnalité' },
  { key: 'inventaire', label: 'Inventaire' },
  { key: 'cout-de-revient', label: 'Coût de revient' },
  { key: 'bon-de-commande', label: 'Bon de commande' },
  { key: 'pertes-rendement', label: 'Pertes & Rendement' },
  { key: 'suivi-dlc', label: 'Suivi DLC' },
  { key: 'rapport-mensuel', label: 'Rapport mensuel' },
  { key: 'haccp', label: 'HACCP' },
  { key: 'etablissement', label: 'Établissement' },
  { key: 'equipe', label: 'Équipe' },
  { key: 'mon-compte', label: 'Mon compte' },
  { key: 'mon-abonnement', label: 'Mon abonnement' },
]

const COULEURS = ['#534ab7','#27500a','#854f0b','#0c447c','#a32d2d','#2c5f5f','#5f2c5f']

function fmt2(s) { return (s || '').split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase() }

function Toast({ message, type }) {
  if (!message) return null
  return <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: type === 'err' ? '#a32d2d' : '#27500a', color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: 13, zIndex: 9999, whiteSpace: 'nowrap' }}>{message}</div>
}

export default function EquipePage() {
  const etabId = getEtablissementActif()
  const [tab, setTab] = useState('membres')
  const [membres, setMembres] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({ message: '', type: 'ok' })

  // Modal membre
  const [modalMembre, setModalMembre] = useState(null) // null | { mode: 'add'|'edit', data }
  const [formMembre, setFormMembre] = useState({ nom: '', email: '', telephone: '', role_id: '', pin: '', actif: true })
  const [pinVisible, setPinVisible] = useState(false)

  // Modal rôle
  const [modalRole, setModalRole] = useState(null)
  const [formRole, setFormRole] = useState({ nom: '', couleur: '#534ab7', permissions: [] })

  const showToast = (msg, type = 'ok') => { setToast({ message: msg, type }); setTimeout(() => setToast({ message: '', type: 'ok' }), 3000) }

  useEffect(() => { if (etabId) charger() }, [etabId])

  const charger = async () => {
    setLoading(true)
    const [{ data: mb }, { data: rl }] = await Promise.all([
      supabase.from('equipe').select('*, roles(nom, couleur)').eq('etablissement_id', etabId).order('nom'),
      supabase.from('roles').select('*').eq('etablissement_id', etabId).order('nom')
    ])
    setMembres(mb || [])
    setRoles(rl || [])
    setLoading(false)
  }

  // MEMBRES
  const ouvrirAjoutMembre = () => {
    setFormMembre({ nom: '', email: '', telephone: '', role_id: roles[0]?.id || '', pin: '', actif: true })
    setModalMembre({ mode: 'add' })
  }

  const ouvrirEditMembre = (m) => {
    setFormMembre({ nom: m.nom, email: m.email || '', telephone: m.telephone || '', role_id: m.role_id || '', pin: '', actif: m.actif })
    setModalMembre({ mode: 'edit', id: m.id })
  }

  const sauvegarderMembre = async () => {
    if (!formMembre.nom) { showToast('Le nom est requis', 'err'); return }
    if (modalMembre.mode === 'add' && !formMembre.pin) { showToast('Le PIN est requis', 'err'); return }
    if (formMembre.pin && (formMembre.pin.length !== 4 || !/^\d{4}$/.test(formMembre.pin))) { showToast('Le PIN doit être 4 chiffres', 'err'); return }

    const payload = {
      nom: formMembre.nom, email: formMembre.email || null,
      telephone: formMembre.telephone || null, role_id: formMembre.role_id || null,
      actif: formMembre.actif, etablissement_id: etabId
    }
    if (formMembre.pin) payload.pin = formMembre.pin

    if (modalMembre.mode === 'add') {
      const { error } = await supabase.from('equipe').insert([payload])
      if (error) { showToast('Erreur : ' + error.message, 'err'); return }
      showToast('Membre ajouté !')
    } else {
      const { error } = await supabase.from('equipe').update(payload).eq('id', modalMembre.id)
      if (error) { showToast('Erreur : ' + error.message, 'err'); return }
      showToast('Membre modifié !')
    }
    setModalMembre(null); charger()
  }

  const supprimerMembre = async (id) => {
    if (!window.confirm('Supprimer ce membre ?')) return
    await supabase.from('equipe').delete().eq('id', id)
    showToast('Membre supprimé'); charger()
  }

  // RÔLES
  const ouvrirAjoutRole = () => {
    setFormRole({ nom: '', couleur: '#534ab7', permissions: [] })
    setModalRole({ mode: 'add' })
  }

  const ouvrirEditRole = (r) => {
    setFormRole({ nom: r.nom, couleur: r.couleur || '#534ab7', permissions: r.permissions || [] })
    setModalRole({ mode: 'edit', id: r.id })
  }

  const togglePermission = (key) => {
    setFormRole(prev => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter(p => p !== key)
        : [...prev.permissions, key]
    }))
  }

  const sauvegarderRole = async () => {
    if (!formRole.nom) { showToast('Le nom est requis', 'err'); return }
    const payload = { nom: formRole.nom, couleur: formRole.couleur, permissions: formRole.permissions, etablissement_id: etabId }
    if (modalRole.mode === 'add') {
      await supabase.from('roles').insert([payload])
      showToast('Rôle créé !')
    } else {
      await supabase.from('roles').update(payload).eq('id', modalRole.id)
      showToast('Rôle modifié !')
    }
    setModalRole(null); charger()
  }

  const supprimerRole = async (id) => {
    if (!window.confirm('Supprimer ce rôle ?')) return
    await supabase.from('roles').delete().eq('id', id)
    showToast('Rôle supprimé'); charger()
  }

  const card = { background: '#fff', borderRadius: 12, border: '0.5px solid #e2e0d8', padding: 16 }
  const inp = { padding: '8px 12px', borderRadius: 8, border: '0.5px solid #d3d1c7', fontSize: 13, color: '#2c2c2a', background: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box' }
  const btn = { padding: '7px 13px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '0.5px solid #d3d1c7', background: '#fff', color: '#5f5e5a', display: 'inline-flex', alignItems: 'center', gap: 5 }
  const btnP = { ...btn, background: '#534ab7', color: '#fff', border: 'none' }

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#888780' }}>Chargement…</div>

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 20, fontWeight: 500, color: '#2c2c2a' }}>Équipe & Rôles</div>
        <button onClick={tab === 'membres' ? ouvrirAjoutMembre : ouvrirAjoutRole} style={btnP}>
          <i className="ti ti-plus" /> {tab === 'membres' ? 'Ajouter un membre' : 'Créer un rôle'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[{ id: 'membres', label: '👥 Membres' }, { id: 'roles', label: '🎭 Rôles & Permissions' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ ...btn, ...(tab === t.id ? { background: '#534ab7', color: '#fff', border: 'none' } : {}) }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* LISTE MEMBRES */}
      {tab === 'membres' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {membres.length === 0 && (
            <div style={{ ...card, textAlign: 'center', color: '#888780', fontSize: 13, padding: 30 }}>Aucun membre — ajoutez le premier !</div>
          )}
          {membres.map(m => {
            const couleur = m.roles?.couleur || '#534ab7'
            return (
              <div key={m.id} style={{ ...card, opacity: m.actif ? 1 : 0.6 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: couleur + '22', border: `2px solid ${couleur}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: couleur, flexShrink: 0 }}>
                      {fmt2(m.nom)}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#2c2c2a' }}>{m.nom}</div>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, fontWeight: 500, background: couleur + '22', color: couleur }}>{m.roles?.nom || '—'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => ouvrirEditMembre(m)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888780', fontSize: 15, padding: 4 }}><i className="ti ti-edit" /></button>
                    <button onClick={() => supprimerMembre(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a32d2d', fontSize: 15, padding: 4 }}><i className="ti ti-trash" /></button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#5f5e5a' }}>
                  {m.email && <div><i className="ti ti-mail" style={{ marginRight: 6, color: '#888780' }} />{m.email}</div>}
                  {m.telephone && <div><i className="ti ti-phone" style={{ marginRight: 6, color: '#888780' }} />{m.telephone}</div>}
                  <div><i className="ti ti-lock" style={{ marginRight: 6, color: '#888780' }} />PIN : {m.pin ? '••••' : <span style={{ color: '#e05858' }}>Non défini</span>}</div>
                </div>
                <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, fontWeight: 500, background: m.actif ? '#eaf3de' : '#f1efe8', color: m.actif ? '#27500a' : '#888780' }}>
                    {m.actif ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* LISTE RÔLES */}
      {tab === 'roles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {roles.length === 0 && (
            <div style={{ ...card, textAlign: 'center', color: '#888780', fontSize: 13, padding: 30 }}>Aucun rôle — créez le premier !</div>
          )}
          {roles.map(r => (
            <div key={r.id} style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: r.couleur || '#534ab7' }} />
                  <div style={{ fontSize: 15, fontWeight: 500, color: '#2c2c2a' }}>{r.nom}</div>
                  <span style={{ fontSize: 11, color: '#888780' }}>{membres.filter(m => m.role_id === r.id).length} membre(s)</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => ouvrirEditRole(r)} style={{ ...btn, fontSize: 12, padding: '4px 10px' }}>✏️ Modifier</button>
                  <button onClick={() => supprimerRole(r.id)} style={{ ...btn, fontSize: 12, padding: '4px 10px', background: '#fcebeb', color: '#a32d2d', border: '0.5px solid #f09595' }}>🗑</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(r.permissions || []).includes('tout')
                  ? <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: '#eeedfe', color: '#534ab7', fontWeight: 500 }}>Accès complet</span>
                  : (r.permissions || []).length === 0
                    ? <span style={{ fontSize: 11, color: '#b4b2a9' }}>Aucune permission</span>
                    : (r.permissions || []).map(p => {
                        const perm = TOUTES_PERMISSIONS.find(x => x.key === p)
                        return perm ? <span key={p} style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: '#f1efe8', color: '#5f5e5a' }}>{perm.label}</span> : null
                      })
                }
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL MEMBRE */}
      {modalMembre && (
        <div onClick={e => e.target === e.currentTarget && setModalMembre(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: '100%', maxWidth: 440 }}>
            <div style={{ fontSize: 17, fontWeight: 500, color: '#2c2c2a', marginBottom: 16 }}>
              {modalMembre.mode === 'add' ? 'Ajouter un membre' : 'Modifier le membre'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input placeholder="Nom complet *" value={formMembre.nom} onChange={e => setFormMembre({ ...formMembre, nom: e.target.value })} style={inp} />
              <input placeholder="Email" type="email" value={formMembre.email} onChange={e => setFormMembre({ ...formMembre, email: e.target.value })} style={inp} />
              <input placeholder="Téléphone" value={formMembre.telephone} onChange={e => setFormMembre({ ...formMembre, telephone: e.target.value })} style={inp} />
              <select value={formMembre.role_id} onChange={e => setFormMembre({ ...formMembre, role_id: e.target.value })} style={{ ...inp, background: '#fff' }}>
                <option value="">— Sélectionner un rôle —</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
              </select>
              <div style={{ position: 'relative' }}>
                <input
                  placeholder={modalMembre.mode === 'edit' ? 'Nouveau PIN (laisser vide = inchangé)' : 'PIN 4 chiffres *'}
                  type={pinVisible ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={4}
                  value={formMembre.pin}
                  onChange={e => setFormMembre({ ...formMembre, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  style={{ ...inp, paddingRight: 40 }} />
                <button type="button" onClick={() => setPinVisible(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888780', fontSize: 14 }}>
                  <i className={`ti ${pinVisible ? 'ti-eye-off' : 'ti-eye'}`} />
                </button>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#5f5e5a', cursor: 'pointer' }}>
                <input type="checkbox" checked={formMembre.actif} onChange={e => setFormMembre({ ...formMembre, actif: e.target.checked })} />
                Membre actif
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button onClick={() => setModalMembre(null)} style={btn}>Annuler</button>
              <button onClick={sauvegarderMembre} style={btnP}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RÔLE */}
      {modalRole && (
        <div onClick={e => e.target === e.currentTarget && setModalRole(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 17, fontWeight: 500, color: '#2c2c2a', marginBottom: 16 }}>
              {modalRole.mode === 'add' ? 'Créer un rôle' : 'Modifier le rôle'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input placeholder="Nom du rôle *" value={formRole.nom} onChange={e => setFormRole({ ...formRole, nom: e.target.value })} style={inp} />
              <div>
                <div style={{ fontSize: 12, color: '#888780', marginBottom: 8 }}>Couleur</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {COULEURS.map(c => (
                    <div key={c} onClick={() => setFormRole({ ...formRole, couleur: c })}
                      style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: formRole.couleur === c ? '3px solid #2c2c2a' : '3px solid transparent' }} />
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: '#888780', marginBottom: 8 }}>Permissions</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#534ab7', fontWeight: 500, marginBottom: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={formRole.permissions.includes('tout')}
                    onChange={e => setFormRole({ ...formRole, permissions: e.target.checked ? ['tout'] : [] })} />
                  Accès complet (toutes permissions)
                </label>
                {!formRole.permissions.includes('tout') && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {TOUTES_PERMISSIONS.map(p => (
                      <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#5f5e5a', cursor: 'pointer', padding: '4px 0' }}>
                        <input type="checkbox" checked={formRole.permissions.includes(p.key)} onChange={() => togglePermission(p.key)} />
                        {p.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button onClick={() => setModalRole(null)} style={btn}>Annuler</button>
              <button onClick={sauvegarderRole} style={btnP}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast.message} type={toast.type} />
    </div>
  )
}
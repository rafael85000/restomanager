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

function Toast({ message, type }) {
  if (!message) return null
  return <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: type === 'err' ? '#a32d2d' : '#27500a', color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: 13, zIndex: 9999, whiteSpace: 'nowrap' }}>{message}</div>
}

export default function Compte() {
  const etabId = getEtablissementActif()
  const [tab, setTab] = useState('restaurant')
  const [toast, setToast] = useState({ message: '', type: 'ok' })
  const [user, setUser] = useState(null)
  const [etablissements, setEtablissements] = useState([])
  const [comptesExternes, setComptesExternes] = useState([])
  const [modalCompteExterne, setModalCompteExterne] = useState(null)
  const [formExterne, setFormExterne] = useState({ nom: '', email: '', password: '', permissions: [], etablissements_ids: [], actif: true })
  const [loadingSave, setLoadingSave] = useState(false)

  const showToast = (msg, type = 'ok') => { setToast({ message: msg, type }); setTimeout(() => setToast({ message: '', type: 'ok' }), 3000) }

  useEffect(() => { charger() }, [])

  const charger = async () => {
    const { data: userData } = await supabase.auth.getUser()
    setUser(userData?.user || null)
    const userId = userData?.user?.id
    if (!userId) return

    const [{ data: etabs }, { data: comptes }] = await Promise.all([
      supabase.from('etablissements').select('id, nom, ville').eq('compte_client_id', userId).order('created_at'),
      supabase.from('comptes_externes').select('*').eq('created_by', userId).order('created_at')
    ])
    setEtablissements(etabs || [])
    setComptesExternes(comptes || [])
  }

  const ouvrirAjoutExterne = () => {
    setFormExterne({ nom: '', email: '', password: '', permissions: [], etablissements_ids: [etabId], actif: true })
    setModalCompteExterne({ mode: 'add' })
  }

  const ouvrirEditExterne = (c) => {
    setFormExterne({ nom: c.nom, email: c.email, password: '', permissions: c.permissions || [], etablissements_ids: c.etablissements_ids || [], actif: c.actif })
    setModalCompteExterne({ mode: 'edit', id: c.id, user_id: c.user_id })
  }

  const togglePermissionExterne = (key) => {
    setFormExterne(prev => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter(p => p !== key)
        : [...prev.permissions, key]
    }))
  }

  const toggleEtabExterne = (id) => {
    setFormExterne(prev => ({
      ...prev,
      etablissements_ids: prev.etablissements_ids.includes(id)
        ? prev.etablissements_ids.filter(e => e !== id)
        : [...prev.etablissements_ids, id]
    }))
  }

  const sauvegarderExterne = async () => {
    if (!formExterne.nom || !formExterne.email) { showToast('Nom et email requis', 'err'); return }
    if (modalCompteExterne.mode === 'add' && !formExterne.password) { showToast('Mot de passe requis', 'err'); return }
    setLoadingSave(true)

    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id

    if (modalCompteExterne.mode === 'add') {
      // Créer compte Supabase Auth via API admin
      const res = await fetch('/api/creer-compte-externe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formExterne.email, password: formExterne.password,
          nom: formExterne.nom, permissions: formExterne.permissions,
          etablissements_ids: formExterne.etablissements_ids, created_by: userId
        })
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || 'Erreur création', 'err'); setLoadingSave(false); return }
      showToast('Compte externe créé !')
    } else {
      // Modifier
      const payload = {
        nom: formExterne.nom, email: formExterne.email,
        permissions: formExterne.permissions,
        etablissements_ids: formExterne.etablissements_ids,
        actif: formExterne.actif
      }
      const { error } = await supabase.from('comptes_externes').update(payload).eq('id', modalCompteExterne.id)
      if (error) { showToast('Erreur : ' + error.message, 'err'); setLoadingSave(false); return }
      showToast('Compte modifié !')
    }

    setLoadingSave(false); setModalCompteExterne(null); charger()
  }

  const supprimerExterne = async (id) => {
    if (!window.confirm('Supprimer ce compte externe ?')) return
    await supabase.from('comptes_externes').delete().eq('id', id)
    showToast('Compte supprimé'); charger()
  }

  const getNom = () => {
    if (!user) return ''
    return user.user_metadata?.nom || user.email || ''
  }

  const getInitiales = () => {
    const nom = getNom()
    return nom.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  }

  const inp = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '0.5px solid #d3d1c7', fontSize: 14, outline: 'none', color: '#2c2c2a', boxSizing: 'border-box' }
  const btn = { padding: '7px 13px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '0.5px solid #d3d1c7', background: '#fff', color: '#5f5e5a', display: 'inline-flex', alignItems: 'center', gap: 5 }
  const btnP = { ...btn, background: '#534ab7', color: '#fff', border: 'none' }
  const card = { background: '#fff', borderRadius: 12, border: '0.5px solid #e2e0d8', padding: 24 }

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e2e0d8', padding: '16px 24px', marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 500, color: '#2c2c2a' }}>Mon compte</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { id: 'restaurant', label: 'Restaurant' },
          { id: 'profil', label: 'Mon profil' },
          { id: 'comptes-externes', label: '🔗 Comptes externes' },
          { id: 'notifications', label: 'Notifications' },
          { id: 'export', label: 'Export données' }
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '0.5px solid', borderColor: tab === t.id ? '#afa9ec' : '#d3d1c7', background: tab === t.id ? '#534ab7' : '#fff', color: tab === t.id ? '#fff' : '#5f5e5a' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'restaurant' && (
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#888780', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 20 }}>Informations du restaurant</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            {[
              { label: 'Nom du restaurant', val: 'Le Bistrot du Coin' },
              { label: 'Siret', val: '123 456 789 00012' },
              { label: 'Adresse', val: '12 rue de la Paix' },
              { label: 'Code postal', val: '85000' },
              { label: 'Ville', val: 'La Roche-sur-Yon' },
              { label: 'Téléphone', val: '02 51 00 00 00' },
              { label: 'Email', val: 'contact@bistrotducoin.fr' },
              { label: 'Site web', val: 'www.bistrotducoin.fr' },
            ].map((f, i) => (
              <div key={i}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#5f5e5a', marginBottom: 5 }}>{f.label}</div>
                <input defaultValue={f.val} style={inp} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button style={btnP}>Enregistrer</button>
          </div>
        </div>
      )}

      {tab === 'profil' && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, paddingBottom: 20, borderBottom: '0.5px solid #e2e0d8' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#eeedfe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 500, color: '#534ab7' }}>
              {getInitiales()}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#2c2c2a' }}>{getNom()}</div>
              <div style={{ fontSize: 13, color: '#888780' }}>Propriétaire</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            {[
              { label: 'Email', val: user?.email || '' },
            ].map((f, i) => (
              <div key={i}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#5f5e5a', marginBottom: 5 }}>{f.label}</div>
                <input defaultValue={f.val} style={inp} />
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#5f5e5a', marginBottom: 10 }}>Changer le mot de passe</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input type="password" placeholder="Mot de passe actuel" style={inp} />
              <input type="password" placeholder="Nouveau mot de passe" style={inp} />
              <input type="password" placeholder="Confirmer le nouveau mot de passe" style={inp} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button style={btnP}>Enregistrer</button>
          </div>
        </div>
      )}

      {/* COMPTES EXTERNES */}
      {tab === 'comptes-externes' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#2c2c2a' }}>Comptes externes</div>
              <div style={{ fontSize: 12, color: '#888780', marginTop: 2 }}>Comptables, consultants, partenaires — connexion email/mot de passe</div>
            </div>
            <button onClick={ouvrirAjoutExterne} style={btnP}><i className="ti ti-plus" /> Ajouter un compte</button>
          </div>

          {comptesExternes.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', color: '#888780', fontSize: 13, padding: 30 }}>
              Aucun compte externe — ajoutez votre comptable ou consultant !
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {comptesExternes.map(c => (
                <div key={c.id} style={{ ...card, padding: 16, opacity: c.actif ? 1 : 0.6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#eeedfe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#534ab7' }}>
                        {c.nom.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#2c2c2a' }}>{c.nom}</div>
                        <div style={{ fontSize: 12, color: '#888780' }}>{c.email}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: c.actif ? '#eaf3de' : '#f1efe8', color: c.actif ? '#27500a' : '#888780' }}>
                        {c.actif ? 'Actif' : 'Inactif'}
                      </span>
                      <button onClick={() => ouvrirEditExterne(c)} style={{ ...btn, fontSize: 11, padding: '4px 10px' }}>✏️ Modifier</button>
                      <button onClick={() => supprimerExterne(c.id)} style={{ ...btn, fontSize: 11, padding: '4px 10px', background: '#fcebeb', color: '#a32d2d', border: '0.5px solid #f09595' }}>🗑</button>
                    </div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11, color: '#888780', marginBottom: 4 }}>Établissements :</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {(c.etablissements_ids || []).map(id => {
                        const etab = etablissements.find(e => e.id === id)
                        return etab ? <span key={id} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: '#eeedfe', color: '#534ab7' }}>{etab.nom}</span> : null
                      })}
                    </div>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 11, color: '#888780', marginBottom: 4 }}>Permissions :</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {(c.permissions || []).map(p => {
                        const perm = TOUTES_PERMISSIONS.find(x => x.key === p)
                        return perm ? <span key={p} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: '#f1efe8', color: '#5f5e5a' }}>{perm.label}</span> : null
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'notifications' && (
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#888780', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 }}>Préférences de notifications</div>
          {[
            { label: 'Alertes DLC dépassées', sub: 'Notification immédiate quand une DLC est dépassée', on: true },
            { label: 'Rapport mensuel disponible', sub: 'Email le 1er de chaque mois avec le rapport', on: true },
            { label: 'Hausse de prix fournisseur', sub: 'Alerte quand un prix augmente de plus de 5%', on: true },
            { label: 'Stock bas', sub: 'Notification quand un produit passe sous le seuil minimum', on: false },
            { label: 'Bon de commande livré', sub: 'Confirmation de réception des commandes', on: true },
          ].map((n, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < 4 ? '0.5px solid #f1efe8' : 'none' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#2c2c2a' }}>{n.label}</div>
                <div style={{ fontSize: 12, color: '#888780', marginTop: 2 }}>{n.sub}</div>
              </div>
              <div style={{ width: 40, height: 22, borderRadius: 11, background: n.on ? '#534ab7' : '#d3d1c7', position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
                <div style={{ position: 'absolute', width: 16, height: 16, borderRadius: '50%', background: '#fff', top: 3, right: n.on ? 3 : 'auto', left: n.on ? 'auto' : 3 }} />
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button style={btnP}>Enregistrer</button>
          </div>
        </div>
      )}

      {tab === 'export' && (
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#888780', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 }}>Exporter vos données</div>
          {[
            { label: 'Mercuriale complète', sub: 'Tous vos produits avec prix et fournisseurs', icon: 'ti-list' },
            { label: 'Fiches recettes', sub: 'Toutes vos recettes avec ingrédients et coûts', icon: 'ti-tools-kitchen-2' },
            { label: 'Historique des inventaires', sub: 'Tous vos inventaires archivés', icon: 'ti-clipboard-list' },
            { label: 'Historique des commandes', sub: 'Tous vos bons de commande', icon: 'ti-shopping-cart' },
            { label: 'Données HACCP', sub: 'Températures, nettoyage, traçabilité', icon: 'ti-shield-check' },
          ].map((e, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < 4 ? '0.5px solid #f1efe8' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#eeedfe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={'ti ' + e.icon} style={{ color: '#534ab7', fontSize: 16 }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#2c2c2a' }}>{e.label}</div>
                  <div style={{ fontSize: 12, color: '#888780', marginTop: 1 }}>{e.sub}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ ...btn, fontSize: 12, padding: '6px 12px' }}>CSV</button>
                <button style={{ ...btnP, fontSize: 12, padding: '6px 12px' }}>Excel</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL COMPTE EXTERNE */}
      {modalCompteExterne && (
        <div onClick={e => e.target === e.currentTarget && setModalCompteExterne(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 17, fontWeight: 500, color: '#2c2c2a', marginBottom: 16 }}>
              {modalCompteExterne.mode === 'add' ? 'Créer un compte externe' : 'Modifier le compte externe'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: '#888780', marginBottom: 5 }}>Nom *</div>
                <input placeholder="ex: Jean Dupont" value={formExterne.nom} onChange={e => setFormExterne({ ...formExterne, nom: e.target.value })} style={inp} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#888780', marginBottom: 5 }}>Email *</div>
                <input type="email" placeholder="email@exemple.com" value={formExterne.email} onChange={e => setFormExterne({ ...formExterne, email: e.target.value })} style={inp} />
              </div>
              {modalCompteExterne.mode === 'add' && (
                <div>
                  <div style={{ fontSize: 12, color: '#888780', marginBottom: 5 }}>Mot de passe *</div>
                  <input type="password" placeholder="Minimum 8 caractères" value={formExterne.password} onChange={e => setFormExterne({ ...formExterne, password: e.target.value })} style={inp} />
                </div>
              )}

              {/* Établissements */}
              <div>
                <div style={{ fontSize: 12, color: '#888780', marginBottom: 8 }}>Accès aux établissements</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {etablissements.map(e => (
                    <label key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#2c2c2a', cursor: 'pointer' }}>
                      <input type="checkbox" checked={formExterne.etablissements_ids.includes(e.id)} onChange={() => toggleEtabExterne(e.id)} />
                      {e.nom} {e.ville ? `— ${e.ville}` : ''}
                    </label>
                  ))}
                </div>
              </div>

              {/* Permissions */}
              <div>
                <div style={{ fontSize: 12, color: '#888780', marginBottom: 8 }}>Permissions</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {TOUTES_PERMISSIONS.map(p => (
                    <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#5f5e5a', cursor: 'pointer' }}>
                      <input type="checkbox" checked={formExterne.permissions.includes(p.key)} onChange={() => togglePermissionExterne(p.key)} />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>

              {modalCompteExterne.mode === 'edit' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#5f5e5a', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formExterne.actif} onChange={e => setFormExterne({ ...formExterne, actif: e.target.checked })} />
                  Compte actif
                </label>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button onClick={() => setModalCompteExterne(null)} style={btn}>Annuler</button>
              <button onClick={sauvegarderExterne} disabled={loadingSave} style={btnP}>
                {loadingSave ? 'Création…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast.message} type={toast.type} />
    </div>
  )
}
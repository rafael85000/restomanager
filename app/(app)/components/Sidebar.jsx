'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

const TOUTES_PERMISSIONS = [
  { key: 'dashboard', label: 'Tableau de bord', icon: 'ti-dashboard', href: '/dashboard', section: null },
  { key: 'mercuriale', label: 'Mercuriale', icon: 'ti-list', href: '/mercuriale', section: 'Produits & Recettes' },
  { key: 'fournisseurs', label: 'Fournisseurs', icon: 'ti-building-store', href: '/fournisseurs', section: 'Produits & Recettes' },
  { key: 'fiches-recettes', label: 'Fiches recettes', icon: 'ti-tools-kitchen-2', href: '/fiches', section: 'Produits & Recettes' },
  { key: 'fiches-techniques', label: 'Fiches techniques', icon: 'ti-file-description', href: '/recettes', section: 'Produits & Recettes' },
  { key: 'allergenes', label: 'Allergènes', icon: 'ti-alert-triangle', href: '/allergenes', section: 'Produits & Recettes' },
  { key: 'saisonnalite', label: 'Saisonnalité', icon: 'ti-plant', href: '/saisonnalite', section: 'Produits & Recettes' },
  { key: 'inventaire', label: 'Inventaire', icon: 'ti-clipboard-list', href: '/inventaire', section: 'Gestion' },
  { key: 'cout-de-revient', label: 'Coût de revient', icon: 'ti-calculator', href: '/couts', section: 'Gestion' },
  { key: 'bon-de-commande', label: 'Bons de commande', icon: 'ti-shopping-cart', href: '/commandes', section: 'Gestion' },
  { key: 'pertes-rendement', label: 'Pertes & Rendements', icon: 'ti-trending-down', href: '/pertes', section: 'Gestion' },
  { key: 'suivi-dlc', label: 'Suivi DLC', icon: 'ti-calendar-event', href: '/dlc', section: 'Gestion' },
  { key: 'rapport-mensuel', label: 'Rapport mensuel', icon: 'ti-file-analytics', href: '/rapport', section: 'Gestion' },
  { key: 'haccp', label: 'HACCP', icon: 'ti-shield-check', href: '/haccp', section: 'Qualité' },
  { key: 'etablissement', label: 'Établissements', icon: 'ti-building', href: '/etablissements', section: 'Paramètres' },
  { key: 'equipe', label: 'Équipe', icon: 'ti-users', href: '/equipe', section: 'Paramètres' },
  { key: 'mon-compte', label: 'Mon compte', icon: 'ti-settings', href: '/compte', section: 'Paramètres' },
  { key: 'mon-abonnement', label: 'Mon abonnement', icon: 'ti-credit-card', href: '/abonnement', section: 'Paramètres' },
]

// Items prioritaires affichés dans la bottom nav mobile
const BOTTOM_NAV_KEYS = ['dashboard', 'haccp', 'inventaire', 'fiches-recettes']

export default function Sidebar({ membreActif, rappelTop = 0 }) {
  const pathname = usePathname()
  const router = useRouter()
  const [etablissements, setEtablissements] = useState([])
  const [etablissementActif, setEtablissementActif] = useState(null)
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [showMenuProfil, setShowMenuProfil] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const permissions = membreActif?.permissions || []
  const aTout = permissions.includes('tout')
  const membre = membreActif

  const itemsVisibles = TOUTES_PERMISSIONS.filter(item =>
    aTout || permissions.includes(item.key)
  )

  // Grouper par section
  const sections = []
  const seenSections = []
  itemsVisibles.forEach(item => {
    const sec = item.section || '__none__'
    if (!seenSections.includes(sec)) {
      seenSections.push(sec)
      sections.push({ section: item.section, items: [] })
    }
    sections.find(s => (s.section || '__none__') === sec).items.push(item)
  })

  // Items bottom nav mobile
  const bottomNavItems = itemsVisibles.filter(i => BOTTOM_NAV_KEYS.includes(i.key)).slice(0, 4)
  // Ajouter "Plus" à la fin
  const showMoreInBottomNav = itemsVisibles.length > BOTTOM_NAV_KEYS.length

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => { chargerEtablissements() }, [])

  // Fermer le menu mobile au changement de page
  useEffect(() => { setMobileMenuOpen(false) }, [pathname])

  async function chargerEtablissements() {
    const membreRaw = localStorage.getItem('membre_actif')
    const membre = membreRaw ? JSON.parse(membreRaw) : null
    let data = []
    if (membre?.type === 'externe') {
      const { data: compteExterne } = await supabase.from('comptes_externes').select('etablissements_ids').eq('user_id', membre.id).single()
      if (compteExterne?.etablissements_ids?.length) {
        const { data: etabs } = await supabase.from('etablissements').select('*').in('id', compteExterne.etablissements_ids).order('created_at')
        data = etabs || []
      }
    } else {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id
      if (!userId) return
      const { data: etabs } = await supabase.from('etablissements').select('*').eq('compte_client_id', userId).order('created_at')
      data = etabs || []
    }
    setEtablissements(data || [])
    const savedId = localStorage.getItem('etablissement_actif')
    const actif = data?.find(e => e.id === savedId) || data?.[0]
    setEtablissementActif(actif)
  }

  function changerEtablissement(et) {
    setEtablissementActif(et)
    setShowSwitcher(false)
    localStorage.setItem('etablissement_actif', et.id)
    window.location.reload()
  }

  function quitterSession() {
    localStorage.removeItem('membre_actif')
    window.location.href = '/select-user'
  }

  async function deconnexion() {
    localStorage.removeItem('membre_actif')
    await supabase.auth.signOut()
    window.location.href = '/select-user'
  }

  // ── MOBILE ──
  if (isMobile) {
    return (
      <>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

        {/* Header mobile */}
        <div style={{
          position: 'fixed', top: rappelTop, left: 0, right: 0, zIndex: 100,
          background: '#1c1b1f', borderBottom: '0.5px solid #2c2b2f',
          height: 52, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 16px'
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, background: '#534ab7', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-chef-hat" style={{ color: '#fff', fontSize: 14 }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>FIMC</span>
          </div>

          {/* Établissement actif */}
          {etablissementActif && (
            <div style={{ fontSize: 12, color: '#888780', flex: 1, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 10px' }}>
              {etablissementActif.nom}
            </div>
          )}

          {/* Hamburger */}
          <button onClick={() => setMobileMenuOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#a8a6a0' }}>
            <i className="ti ti-menu-2" style={{ fontSize: 22 }} />
          </button>
        </div>

        {/* Bottom navigation */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
          background: '#1c1b1f', borderTop: '0.5px solid #2c2b2f',
          display: 'flex', alignItems: 'stretch',
          height: 60, paddingBottom: 'env(safe-area-inset-bottom)'
        }}>
          {bottomNavItems.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 3, textDecoration: 'none',
                color: active ? '#534ab7' : '#666460',
                borderTop: active ? '2px solid #534ab7' : '2px solid transparent',
                background: 'transparent'
              }}>
                <i className={`ti ${item.icon}`} style={{ fontSize: 20 }} />
                <span style={{ fontSize: 9, fontWeight: active ? 600 : 400, letterSpacing: '0.2px' }}>
                  {item.label.length > 10 ? item.label.slice(0, 9) + '…' : item.label}
                </span>
              </Link>
            )
          })}
          {/* Bouton Plus */}
          <button onClick={() => setMobileMenuOpen(true)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 3, background: 'none', border: 'none',
            cursor: 'pointer', color: mobileMenuOpen ? '#534ab7' : '#666460',
            borderTop: mobileMenuOpen ? '2px solid #534ab7' : '2px solid transparent'
          }}>
            <i className="ti ti-grid-dots" style={{ fontSize: 20 }} />
            <span style={{ fontSize: 9, fontWeight: 400 }}>Plus</span>
          </button>
        </div>

        {/* Drawer menu complet */}
        {mobileMenuOpen && (
          <>
            {/* Overlay */}
            <div onClick={() => setMobileMenuOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200 }} />

            {/* Drawer */}
            <div style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 201,
              width: '80%', maxWidth: 300, background: '#1c1b1f',
              display: 'flex', flexDirection: 'column', overflowY: 'auto',
              boxShadow: '-4px 0 20px rgba(0,0,0,0.4)'
            }}>
              {/* Header drawer */}
              <div style={{ padding: '16px', borderBottom: '0.5px solid #2c2b2f', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, background: '#534ab7', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="ti ti-chef-hat" style={{ color: '#fff', fontSize: 14 }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>FIMC</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666460', padding: 4 }}>
                  <i className="ti ti-x" style={{ fontSize: 20 }} />
                </button>
              </div>

              {/* Switcher établissement */}
              {(aTout || membre?.type === 'externe') && (
                <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #2c2b2f' }}>
                  <div onClick={() => setShowSwitcher(!showSwitcher)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '8px 10px', borderRadius: 8, background: '#2c2b2f' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#639922' }} />
                      <div style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>{etablissementActif?.nom || 'Chargement…'}</div>
                    </div>
                    <i className="ti ti-selector" style={{ fontSize: 14, color: '#888780' }} />
                  </div>
                  {showSwitcher && (
                    <div style={{ background: '#fff', borderRadius: 10, marginTop: 6, overflow: 'hidden' }}>
                      {etablissements.map(et => (
                        <div key={et.id} onClick={() => changerEtablissement(et)}
                          style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '0.5px solid #f1efe8', background: etablissementActif?.id === et.id ? '#eeedfe' : '#fff' }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: '#2c2c2a' }}>{et.nom}</div>
                        </div>
                      ))}
                      <Link href="/etablissements" style={{ display: 'block', padding: '10px 14px', fontSize: 12, color: '#534ab7', fontWeight: 500, textDecoration: 'none' }}>
                        <i className="ti ti-plus" style={{ marginRight: 5 }} />Gérer les établissements
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation */}
              <nav style={{ flex: 1, padding: 8 }}>
                {sections.map((group, gi) => (
                  <div key={gi} style={{ marginBottom: 8 }}>
                    {group.section && (
                      <div style={{ fontSize: 10, fontWeight: 500, color: '#555450', textTransform: 'uppercase', letterSpacing: '0.6px', padding: '6px 12px 4px' }}>
                        {group.section}
                      </div>
                    )}
                    {group.items.map(item => {
                      const active = pathname === item.href
                      return (
                        <Link key={item.href} href={item.href}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, marginBottom: 2, fontSize: 14, fontWeight: active ? 500 : 400, color: active ? '#fff' : '#a8a6a0', background: active ? '#534ab7' : 'transparent', textDecoration: 'none' }}>
                          <i className={`ti ${item.icon}`} style={{ fontSize: 18, color: active ? '#fff' : '#666460', flexShrink: 0 }} />
                          {item.label}
                        </Link>
                      )
                    })}
                  </div>
                ))}
              </nav>

              {/* Profil bas drawer */}
              <div style={{ padding: '16px', borderTop: '0.5px solid #2c2b2f' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#2c2b2f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, color: '#a8a6a0', flexShrink: 0 }}>
                    {(membreActif?.nom || '?').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{membreActif?.nom || 'Utilisateur'}</div>
                    <div style={{ fontSize: 11, color: '#666460' }}>{membreActif?.role || ''}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button onClick={quitterSession}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, background: '#2c2b2f', border: 'none', color: '#a8a6a0', fontSize: 13, cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                    <i className="ti ti-switch-horizontal" style={{ fontSize: 16 }} /> Changer d'utilisateur
                  </button>
                  {aTout && (
                    <button onClick={deconnexion}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, background: '#2c2b2f', border: 'none', color: '#e05858', fontSize: 13, cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                      <i className="ti ti-logout" style={{ fontSize: 16 }} /> Se déconnecter
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </>
    )
  }

  // ── DESKTOP ── (identique à l'original)
  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />
      <aside style={{ width: 240, minHeight: '100vh', background: '#1c1b1f', display: 'flex', flexDirection: 'column', position: 'fixed', top: rappelTop, left: 0, zIndex: 100, overflowY: 'auto', height: rappelTop ? `calc(100vh - ${rappelTop}px)` : '100vh' }}>

        {/* Logo */}
        <div style={{ padding: '18px 16px', borderBottom: '0.5px solid #2c2b2f', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: '#534ab7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-chef-hat" style={{ color: '#fff', fontSize: 16 }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>FIMC</div>
        </div>

        {/* Switcher établissement */}
        {(aTout || membre?.type === 'externe') && (
          <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #2c2b2f', position: 'relative' }}>
            <div onClick={() => setShowSwitcher(!showSwitcher)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '8px 10px', borderRadius: 8, background: '#2c2b2f' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#639922', flexShrink: 0 }} />
                <div style={{ fontSize: 12, color: '#fff', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{etablissementActif?.nom || 'Chargement…'}</div>
              </div>
              <i className="ti ti-selector" style={{ fontSize: 14, color: '#888780', flexShrink: 0 }} />
            </div>
            {showSwitcher && (
              <div style={{ position: 'absolute', top: '100%', left: 16, right: 16, background: '#fff', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.3)', zIndex: 200, marginTop: 4, overflow: 'hidden' }}>
                {etablissements.map(et => (
                  <div key={et.id} onClick={() => changerEtablissement(et)} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '0.5px solid #f1efe8', background: etablissementActif?.id === et.id ? '#eeedfe' : '#fff' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#2c2c2a' }}>{et.nom}</div>
                    <div style={{ fontSize: 11, color: '#888780' }}>{et.ville}</div>
                  </div>
                ))}
                <Link href="/etablissements" style={{ display: 'block', padding: '10px 14px', fontSize: 12, color: '#534ab7', fontWeight: 500, textDecoration: 'none' }}>
                  <i className="ti ti-plus" style={{ marginRight: 5 }} />Gérer les établissements
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '8px', paddingTop: 12 }}>
          {sections.map((group, gi) => (
            <div key={gi} style={{ marginBottom: 8 }}>
              {group.section && (
                <div style={{ fontSize: 10, fontWeight: 500, color: '#555450', textTransform: 'uppercase', letterSpacing: '0.6px', padding: '6px 12px 4px' }}>
                  {group.section}
                </div>
              )}
              {group.items.map(item => {
                const active = pathname === item.href
                return (
                  <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '5px 12px', borderRadius: 8, marginBottom: 1, fontSize: 13, fontWeight: active ? 500 : 400, color: active ? '#fff' : '#a8a6a0', background: active ? '#534ab7' : 'transparent', textDecoration: 'none' }}>
                    <i className={`ti ${item.icon}`} style={{ fontSize: 16, color: active ? '#fff' : '#666460', flexShrink: 0 }} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Profil bas */}
        <div style={{ padding: '12px 16px', borderTop: '0.5px solid #2c2b2f', position: 'relative' }}>
          <div onClick={() => setShowMenuProfil(!showMenuProfil)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#2c2b2f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, color: '#a8a6a0', flexShrink: 0 }}>
              {(membreActif?.nom || '?').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{membreActif?.nom || 'Utilisateur'}</div>
              <div style={{ fontSize: 11, color: '#666460' }}>{membreActif?.role || ''}</div>
            </div>
            <i className="ti ti-dots-vertical" style={{ fontSize: 14, color: '#666460', flexShrink: 0 }} />
          </div>
          {showMenuProfil && (
            <div style={{ position: 'absolute', bottom: '100%', left: 16, right: 16, background: '#fff', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.3)', zIndex: 200, marginBottom: 4, overflow: 'hidden' }}>
              <div onClick={quitterSession} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', fontSize: 13, color: '#2c2c2a', cursor: 'pointer', borderBottom: '0.5px solid #f1efe8' }}>
                <i className="ti ti-switch-horizontal" style={{ fontSize: 14 }} /> Changer d'utilisateur
              </div>
              {aTout && (
                <>
                  <Link href="/compte" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', fontSize: 13, color: '#2c2c2a', textDecoration: 'none', borderBottom: '0.5px solid #f1efe8' }}>
                    <i className="ti ti-settings" style={{ fontSize: 14 }} /> Mon compte
                  </Link>
                  <div onClick={deconnexion} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', fontSize: 13, color: '#a32d2d', cursor: 'pointer' }}>
                    <i className="ti ti-logout" style={{ fontSize: 14 }} /> Se déconnecter
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
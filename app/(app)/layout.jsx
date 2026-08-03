'use client'
import { useEffect, useState, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '../../lib/supabase'

const INACTIVITE_MS = 2 * 60 * 1000

export default function AppLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [accesComplet, setAccesComplet] = useState(false)
  const [loading, setLoading] = useState(true)
  const [membreActif, setMembreActif] = useState(null)
  const [lotsRappeles, setLotsRappeles] = useState([])

  const resetTimer = useCallback(() => {
    if (typeof window === 'undefined') return
    clearTimeout(window.__inactiviteTimer)
    window.__inactiviteTimer = setTimeout(() => {
      router.push('/select-user')
    }, INACTIVITE_MS)
  }, [])

  useEffect(() => {
    // Bloquer le bouton retour navigateur
    window.history.pushState(null, '', window.location.href)
    window.addEventListener('popstate', () => {
      window.history.pushState(null, '', window.location.href)
    })

    const membreRaw = localStorage.getItem('membre_actif')
    if (!membreRaw) {
      router.push('/select-user')
      setLoading(false)
      return
    }
    const membre = JSON.parse(membreRaw)
    // Vérifier que la session n'est pas trop vieille (8h max)
    if (membre.ts && Date.now() - membre.ts > 8 * 60 * 60 * 1000) {
      localStorage.removeItem('membre_actif')
      router.push('/select-user')
      setLoading(false)
      return
    }
    setMembreActif(membre)
    if (membre.type === 'externe' && window.location.pathname === '/etablissements') {
      router.push('/dashboard')
      setLoading(false)
      return
    }
    setAccesComplet(true)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!membreActif) return
    const permissions = membreActif.permissions || []
    const aTout = permissions.includes('tout')
    if (aTout) return

    const ROUTE_PERMISSIONS = {
      '/mercuriale': 'mercuriale',
      '/fournisseurs': 'fournisseurs',
      '/fiches': 'fiches-recettes',
      '/recettes': 'fiches-techniques',
      '/allergenes': 'allergenes',
      '/saisonnalite': 'saisonnalite',
      '/inventaire': 'inventaire',
      '/couts': 'cout-de-revient',
      '/commandes': 'bon-de-commande',
      '/pertes': 'pertes-rendement',
      '/dlc': 'suivi-dlc',
      '/rapport': 'rapport-mensuel',
      '/haccp': 'haccp',
      '/etablissements': 'etablissement',
      '/equipe': 'equipe',
      '/compte': 'mon-compte',
      '/abonnement': 'mon-abonnement',
    }

    const permRequise = ROUTE_PERMISSIONS[pathname]
    if (permRequise && !permissions.includes(permRequise)) {
      router.push('/select-user')
    }
  }, [pathname, membreActif])

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll']
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))
    resetTimer()
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer))
      clearTimeout(window.__inactiviteTimer)
    }
  }, [resetTimer])

  // Fetch rappels de lots actifs
  useEffect(() => {
    const fetchRappels = async () => {
      try {
        const etabId = typeof window !== 'undefined' ? localStorage.getItem('etablissement_actif') : null
        if (!etabId) return
        const { data } = await supabase
          .from('haccp_lots')
          .select('id,numero_lot,produit_nom,produits(nom)')
          .eq('etablissement_id', etabId)
          .eq('rappele', true)
        setLotsRappeles(data || [])
      } catch(e) {}
    }
    fetchRappels()
    const iv = setInterval(fetchRappels, 30000)
    return () => clearInterval(iv)
  }, [])

  if (loading) return null

  if (!accesComplet) return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4' }}>{children}</div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Bandeau rappel de lots — visible sur toutes les pages */}
      {lotsRappeles.length > 0 && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          background: '#a32d2d', color: '#fff',
          padding: '0 20px',
          height: 48,
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 2px 8px rgba(163,45,45,0.5)'
        }}>
          <i className="ti ti-alert-triangle" style={{ fontSize: 18, flexShrink: 0 }}/>
          <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>
            🚨 RAPPEL DE LOT EN COURS : {lotsRappeles.map(l =>
              l.numero_lot + ' (' + (l.produits?.nom || l.produit_nom || '') + ')'
            ).join(' • ')}
          </div>
          <a href="/haccp" style={{ color: '#fff', fontSize: 12, textDecoration: 'underline', whiteSpace: 'nowrap' }}>
            Voir les lots →
          </a>
        </div>
      )}
      <div style={{ display: 'flex' }}>
        <Sidebar membreActif={membreActif} rappelTop={lotsRappeles.length > 0 ? 48 : 0} />
        <main style={{ marginLeft: '240px', flex: 1, minHeight: '100vh', padding: '24px', paddingTop: lotsRappeles.length > 0 ? 72 : 24, background: '#f8f7f4' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
'use client'
import { useEffect, useState, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import { useRouter, usePathname } from 'next/navigation'

const INACTIVITE_MS = 2 * 60 * 1000

export default function AppLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [accesComplet, setAccesComplet] = useState(false)
  const [loading, setLoading] = useState(true)
  const [membreActif, setMembreActif] = useState(null)

  const resetTimer = useCallback(() => {
    if (typeof window === 'undefined') return
    clearTimeout(window.__inactiviteTimer)
   window.__inactiviteTimer = setTimeout(() => {
      router.push('/select-user')
    }, INACTIVITE_MS)
  }, [])

  useEffect(() => {
    const membreRaw = localStorage.getItem('membre_actif')
    if (!membreRaw) {
      router.push('/select-user')
      setLoading(false)
      return
    }
    const membre = JSON.parse(membreRaw)
    setMembreActif(membre)
    // Bloquer compte externe sur /etablissements
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

  if (loading) return null

  if (!accesComplet) return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4' }}>{children}</div>
  )

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar membreActif={membreActif} />
      <main style={{ marginLeft: '240px', flex: 1, minHeight: '100vh', padding: '24px', background: '#f8f7f4' }}>
        {children}
      </main>
    </div>
  )
}

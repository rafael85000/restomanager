'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Sidebar from './components/Sidebar'
import { supabase } from '../../lib/supabase'

const INACTIVITE_MS = 5 * 60 * 1000 // 5 minutes

export default function AppLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [accesComplet, setAccesComplet] = useState(false)
  const [loading, setLoading] = useState(true)
const [redirige, setRedirige] = useState(false)
  const [membreActif, setMembreActif] = useState(null)

  // Timer inactivité
  const resetTimer = useCallback(() => {
    if (typeof window === 'undefined') return
    clearTimeout(window.__inactiviteTimer)
    window.__inactiviteTimer = setTimeout(() => {
      // Supprimer session membre (pas session Supabase)
      localStorage.removeItem('membre_actif')
      router.push('/select-user')
    }, INACTIVITE_MS)
  }, [])

  useEffect(() => {
    verifierAcces()
  }, [])

  useEffect(() => {
    // Écouter interactions pour reset timer inactivité
    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll']
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))
    resetTimer()
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer))
      clearTimeout(window.__inactiviteTimer)
    }
  }, [resetTimer])

  async function verifierAcces() {
    // 1. Vérifier session membre actif (PIN)
    const membreRaw = localStorage.getItem('membre_actif')
    if (!membreRaw) {
      setRedirige(true)
      router.push('/select-user')
      return
    }

    const membre = JSON.parse(membreRaw)
    setMembreActif(membre)

    // 2. Si gérant → vérifier session Supabase
    if (membre.id === 'gerant') {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) {
        localStorage.removeItem('membre_actif')
        window.location.href = '/select-user'
        return
      }

      // Vérifier abonnement
      const userId = userData.user.id
      const { count: nbEtabs } = await supabase
        .from('etablissements')
        .select('*', { count: 'exact', head: true })
        .eq('compte_client_id', userId)

      if (!nbEtabs || nbEtabs === 0) { setAccesComplet(false); setLoading(false); return }

      const { data: abo } = await supabase
        .from('abonnements')
        .select('statut, date_fin_essai')
        .eq('compte_client_id', userId)
        .single()

      const essaiValide = abo?.statut === 'essai' && abo?.date_fin_essai && new Date(abo.date_fin_essai) > new Date()
      const estActif = abo?.statut === 'actif'
      setAccesComplet(essaiValide || estActif)
    } else {
      // Membre équipe → accès selon permissions
      setAccesComplet(true)
    }
    setLoading(false)
  }

if (loading || redirige) return null

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
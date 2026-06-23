'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from './components/Sidebar'

const INACTIVITE_MS = 5 * 60 * 1000

export default function AppLayout({ children }) {
  const router = useRouter()
  const [accesComplet, setAccesComplet] = useState(false)
  const [loading, setLoading] = useState(true)
  const [membreActif, setMembreActif] = useState(null)

  const resetTimer = useCallback(() => {
    if (typeof window === 'undefined') return
    clearTimeout(window.__inactiviteTimer)
    window.__inactiviteTimer = setTimeout(() => {
      localStorage.removeItem('membre_actif')
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
    setAccesComplet(true)
    setLoading(false)
  }, [])

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

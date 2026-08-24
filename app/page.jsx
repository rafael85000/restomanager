'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Ne pas rediriger si on est sur une page publique
    if (window.location.pathname === '/privacy') return
    const membreRaw = localStorage.getItem('membre_actif')
    const etabId = localStorage.getItem('etablissement_actif')
    if (etabId) {
      router.push('/select-user')
    } else {
      router.push('/auth')
    }
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1c1b1f' }}>
      <div style={{ color: '#888780', fontSize: '14px' }}>Chargement…</div>
    </div>
  )
}

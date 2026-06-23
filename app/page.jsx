'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const membreRaw = localStorage.getItem('membre_actif')
    const etabId = localStorage.getItem('etablissement_actif')
    if (etabId) {
      // Établissement connu → select-user (veille)
      router.push('/select-user')
    } else {
      // Pas de session du tout → auth
      router.push('/auth')
    }
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1c1b1f' }}>
      <div style={{ color: '#888780', fontSize: '14px' }}>Chargement…</div>
    </div>
  )
}

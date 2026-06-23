'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const membreRaw = localStorage.getItem('membre_actif')
    if (membreRaw) {
      router.push('/dashboard')
    } else {
      router.push('/select-user')
    }
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1c1b1f' }}>
      <div style={{ color: '#888780', fontSize: '14px' }}>Chargement…</div>
    </div>
  )
}

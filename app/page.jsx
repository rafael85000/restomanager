'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    async function verifier() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        router.push('/dashboard');
      } else {
        router.push('/auth');
      }
    }
    verifier();
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f7f4' }}>
      <div style={{ color: '#888780', fontSize: '14px' }}>Chargement...</div>
    </div>
  );
}

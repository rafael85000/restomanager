'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './components/Sidebar';
import { supabase } from '../../lib/supabase';

export default function AppLayout({ children }) {
  const router = useRouter();
  const [accesComplet, setAccesComplet] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verifierAcces();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        window.location.href = '/auth';
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  async function verifierAcces() {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) { setLoading(false); return; }

    const { count: nbEtabs } = await supabase
      .from('etablissements')
      .select('*', { count: 'exact', head: true })
      .eq('compte_client_id', userId);

    if (!nbEtabs || nbEtabs === 0) {
      setAccesComplet(false);
      setLoading(false);
      return;
    }

    const { data: abo } = await supabase
      .from('abonnements')
      .select('statut, date_fin_essai')
      .eq('compte_client_id', userId)
      .single();

    const essaiValide = abo?.statut === 'essai' && abo?.date_fin_essai && new Date(abo.date_fin_essai) > new Date();
    const estActif = abo?.statut === 'actif';

   setAccesComplet(essaiValide || estActif);
setLoading(false);
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f7f4', color: '#888780' }}>Chargement...</div>;
  }

  if (!accesComplet) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f7f4' }}>
        {children}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{
        marginLeft: '240px',
        flex: 1,
        minHeight: '100vh',
        padding: '24px',
        background: '#f8f7f4',
      }}>
        {children}
      </main>
    </div>
  );
}
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

const menu = [
  { section: null, items: [
    { label: 'Tableau de bord', icon: 'ti-dashboard', href: '/dashboard' },
  ]},
  { section: 'Produits & Recettes', items: [
    { label: 'Mercuriale', icon: 'ti-list', href: '/mercuriale' },
    { label: 'Fournisseurs', icon: 'ti-building-store', href: '/fournisseurs' },
    { label: 'Fiches recettes', icon: 'ti-tools-kitchen-2', href: '/fiches' },
    { label: 'Fiches techniques', icon: 'ti-file-description', href: '/recettes' },
    { label: 'Allergènes', icon: 'ti-alert-triangle', href: '/allergenes' },
    { label: 'Saisonnalité', icon: 'ti-plant', href: '/saisonnalite' },
  ]},
  { section: 'Gestion', items: [
    { label: 'Inventaire', icon: 'ti-clipboard-list', href: '/inventaire' },
    { label: 'Coût de revient', icon: 'ti-calculator', href: '/couts' },
    { label: 'Bons de commande', icon: 'ti-shopping-cart', href: '/commandes' },
    { label: 'Pertes & Rendements', icon: 'ti-trending-down', href: '/pertes' },
    { label: 'Suivi DLC', icon: 'ti-calendar-event', href: '/dlc' },
    { label: 'Rapport mensuel', icon: 'ti-file-analytics', href: '/rapport' },
  ]},
  { section: 'Qualité', items: [
    { label: 'HACCP', icon: 'ti-shield-check', href: '/haccp' },
  ]},
  { section: 'Paramètres', items: [
    { label: 'Établissements', icon: 'ti-building', href: '/etablissements' },
    { label: 'Équipe', icon: 'ti-users', href: '/equipe' },
    { label: 'Mon compte', icon: 'ti-settings', href: '/compte' },
    { label: 'Mon abonnement', icon: 'ti-credit-card', href: '/abonnement' },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [etablissements, setEtablissements] = useState([]);
  const [etablissementActif, setEtablissementActif] = useState(null);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [user, setUser] = useState(null);
  const [showMenuProfil, setShowMenuProfil] = useState(false);

  useEffect(() => {
    chargerEtablissements();
    chargerUtilisateur();
  }, []);

  async function chargerUtilisateur() {
    const { data } = await supabase.auth.getUser();
    setUser(data?.user || null);
  }

  async function chargerEtablissements() {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  const { data } = await supabase.from('etablissements').select('*').eq('compte_client_id', userId).order('created_at');
    setEtablissements(data || []);
    const savedId = typeof window !== 'undefined' ? window.localStorage?.getItem('etablissement_actif') : null;
    const actif = data?.find(e => e.id === savedId) || data?.[0];
    setEtablissementActif(actif);
  }

  function changerEtablissement(et) {
    setEtablissementActif(et);
    setShowSwitcher(false);
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem('etablissement_actif', et.id);
    }
    window.location.reload();
  }

  async function deconnexion() {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  }

  function getInitiales() {
    if (!user) return '?';
    const nom = user.user_metadata?.nom || user.email;
    return nom.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  }

  function getNomAffiche() {
    if (!user) return 'Chargement...';
    return user.user_metadata?.nom || user.email;
  }

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />
      <aside style={{
        width: '240px',
        minHeight: '100vh',
        background: '#1c1b1f',
        borderRight: 'none',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 100,
        overflowY: 'auto',
      }}>

        <div style={{ padding: '18px 16px', borderBottom: '0.5px solid #2c2b2f', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', background: '#534ab7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink:0 }}>
            <i className="ti ti-chef-hat" style={{ color: '#fff', fontSize: '16px' }} />
          </div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>FIMC</div>
        </div>

        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #2c2b2f', position: 'relative' }}>
          <div onClick={() => setShowSwitcher(!showSwitcher)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', padding:'8px 10px', borderRadius:'8px', background:'#2c2b2f' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', minWidth:0 }}>
              <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#639922', flexShrink:0 }} />
              <div style={{ fontSize:'12px', color:'#fff', fontWeight:'500', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{etablissementActif?.nom || 'Chargement...'}</div>
            </div>
            <i className="ti ti-selector" style={{ fontSize:'14px', color:'#888780', flexShrink:0 }} />
          </div>

          {showSwitcher && (
            <div style={{ position:'absolute', top:'100%', left:'16px', right:'16px', background:'#fff', borderRadius:'10px', boxShadow:'0 4px 16px rgba(0,0,0,0.3)', zIndex:200, marginTop:'4px', overflow:'hidden' }}>
              {etablissements.map(et => (
                <div key={et.id} onClick={() => changerEtablissement(et)} style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'0.5px solid #f1efe8', background: etablissementActif?.id===et.id ? '#eeedfe' : '#fff' }}>
                  <div style={{ fontSize:'13px', fontWeight:'500', color:'#2c2c2a' }}>{et.nom}</div>
                  <div style={{ fontSize:'11px', color:'#888780' }}>{et.ville}</div>
                </div>
              ))}
              <Link href="/etablissements" style={{ display:'block', padding:'10px 14px', fontSize:'12px', color:'#534ab7', fontWeight:'500', textDecoration:'none' }}>
                <i className="ti ti-plus" style={{ marginRight:'5px' }} />Gérer les établissements
              </Link>
            </div>
          )}
        </div>

        <nav style={{ flex: 1, padding: '8px', paddingTop: '12px' }}>
          {menu.map((group, gi) => (
            <div key={gi} style={{ marginBottom: '8px' }}>
              {group.section && (
                <div style={{ fontSize: '10px', fontWeight: '500', color: '#555450', textTransform: 'uppercase', letterSpacing: '0.6px', padding: '6px 12px 4px' }}>
                  {group.section}
                </div>
              )}
              {group.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} style={{
                    display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 12px', borderRadius: '8px', marginBottom: '1px',
                    fontSize: '13px', fontWeight: active ? '500' : '400',
                    color: active ? '#fff' : '#a8a6a0', background: active ? '#534ab7' : 'transparent', textDecoration: 'none',
                  }}>
                    <i className={`ti ${item.icon}`} style={{ fontSize: '16px', color: active ? '#fff' : '#666460', flexShrink: 0 }} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div style={{ padding: '12px 16px', borderTop: '0.5px solid #2c2b2f', position: 'relative' }}>
          <div onClick={() => setShowMenuProfil(!showMenuProfil)} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#2c2b2f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '500', color: '#a8a6a0', flexShrink: 0 }}>
              {getInitiales()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: '500', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getNomAffiche()}</div>
              <div style={{ fontSize: '11px', color: '#666460' }}>Propriétaire</div>
            </div>
            <i className="ti ti-dots-vertical" style={{ fontSize: '14px', color: '#666460', flexShrink: 0 }} />
          </div>

          {showMenuProfil && (
            <div style={{ position: 'absolute', bottom: '100%', left: '16px', right: '16px', background: '#fff', borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.3)', zIndex: 200, marginBottom: '4px', overflow: 'hidden' }}>
              <Link href="/compte" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', fontSize: '13px', color: '#2c2c2a', textDecoration: 'none', borderBottom: '0.5px solid #f1efe8' }}>
                <i className="ti ti-settings" style={{ fontSize: '14px' }} /> Mon compte
              </Link>
              <div onClick={deconnexion} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', fontSize: '13px', color: '#a32d2d', cursor: 'pointer' }}>
                <i className="ti ti-logout" style={{ fontSize: '14px' }} /> Se déconnecter
              </div>
            </div>
          )}
        </div>

      </aside>
    </>
  );
}
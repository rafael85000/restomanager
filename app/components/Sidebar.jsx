'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menu = [
  { section: null, items: [
    { label: 'Tableau de bord', icon: 'ti-dashboard', href: '/dashboard' },
  ]},
  { section: 'Produits & Recettes', items: [
    { label: 'Mercuriale', icon: 'ti-list', href: '/mercuriale' },
    { label: 'Fournisseurs', icon: 'ti-building-store', href: '/fournisseurs' },
    { label: 'Fiches recettes', icon: 'ti-tools-kitchen-2', href: '/recettes' },
    { label: 'Fiches techniques', icon: 'ti-file-description', href: '/fiches' },
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
    { label: 'Équipe', icon: 'ti-users', href: '/equipe' },
    { label: 'Mon compte', icon: 'ti-settings', href: '/compte' },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();

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

        {/* LOGO */}
        <div style={{
          padding: '18px 16px',
          borderBottom: '0.5px solid #2c2b2f',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: '#534ab7',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <i className="ti ti-chef-hat" style={{ color: '#fff', fontSize: '16px' }} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>RestoManager</div>
            <div style={{ fontSize: '11px', color: '#888780' }}>Le Bistrot du Coin</div>
          </div>
        </div>

        {/* MENU */}
        <nav style={{ flex: 1, padding: '8px', paddingTop: '12px' }}>
          {menu.map((group, gi) => (
            <div key={gi} style={{ marginBottom: '8px' }}>
              {group.section && (
                <div style={{
                  fontSize: '10px',
                  fontWeight: '500',
                  color: '#555450',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  padding: '6px 12px 4px',
                }}>
                  {group.section}
                </div>
              )}
              {group.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    marginBottom: '1px',
                    fontSize: '13px',
                    fontWeight: active ? '500' : '400',
                    color: active ? '#fff' : '#a8a6a0',
                    background: active ? '#534ab7' : 'transparent',
                    textDecoration: 'none',
                  }}>
                    <i className={`ti ${item.icon}`} style={{
                      fontSize: '16px',
                      color: active ? '#fff' : '#666460',
                      flexShrink: 0,
                    }} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* PROFIL */}
        <div style={{
          padding: '12px 16px',
          borderTop: '0.5px solid #2c2b2f',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: '#2c2b2f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '500',
            color: '#a8a6a0',
            flexShrink: 0,
          }}>
            RC
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: '500', color: '#fff' }}>Rafael Colonnello</div>
            <div style={{ fontSize: '11px', color: '#666460' }}>Propriétaire</div>
          </div>
        </div>

      </aside>
    </>
  );
}
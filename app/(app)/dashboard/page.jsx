'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { getEtablissementActif } from '../../../lib/etablissement';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [valeurStock, setValeurStock] = useState(0);
  const [deltaStock, setDeltaStock] = useState(null);
  const [nbRecettes, setNbRecettes] = useState(0);
  const [nbSousRecettes, setNbSousRecettes] = useState(0);
  const [nbPlatsCarte, setNbPlatsCarte] = useState(0);
  const [margeMoyenne, setMargeMoyenne] = useState(0);
  const [topPlats, setTopPlats] = useState([]);
  const [bottomPlats, setBottomPlats] = useState([]);
  const [alertesPrix, setAlertesPrix] = useState([]);
  const [membres, setMembres] = useState([]);
  const [dernierInventaire, setDernierInventaire] = useState(null);
  const [rappelFreq, setRappelFreq] = useState(30);
  const [historiqueStock, setHistoriqueStock] = useState([]);

  useEffect(() => { chargerDonnees(); }, []);

  async function chargerDonnees() {
    setLoading(true);
    const etId = getEtablissementActif();

    // Inventaires : valeur stock + historique
    let qInv = supabase.from('inventaires').select('*').order('date_inventaire', { ascending: false }).limit(4);
    if (etId) qInv = qInv.eq('etablissement_id', etId);
    const { data: invs } = await qInv;

    if (invs && invs.length > 0) {
      setValeurStock(parseFloat(invs[0].valeur_totale));
      setDernierInventaire(invs[0].date_inventaire);
      if (invs.length > 1) {
        const prev = parseFloat(invs[1].valeur_totale);
        const cur = parseFloat(invs[0].valeur_totale);
        setDeltaStock(prev > 0 ? ((cur - prev) / prev * 100) : null);
      }
      setHistoriqueStock(invs.slice().reverse());
    }

    // Recettes
    let qRec = supabase.from('recettes').select('*, recette_ingredients(*, produits(prix_ht))');
    if (etId) qRec = qRec.eq('etablissement_id', etId);
    const { data: recs } = await qRec;

    if (recs) {
      setNbRecettes(recs.length);
      const sousRecettesCount = recs.filter(r => !r.prix_vente || r.prix_vente === 0).length;
      setNbSousRecettes(sousRecettesCount);
      const platsAvecPrix = recs.filter(r => r.prix_vente > 0);
      setNbPlatsCarte(platsAvecPrix.length);

      const recettesAvecMarge = platsAvecPrix.map(r => {
        const coutTotal = (r.recette_ingredients || []).reduce((s, i) => s + (i.quantite * (i.produits?.prix_ht || 0)), 0);
        const coutPortion = r.portions > 0 ? coutTotal / r.portions : coutTotal;
        const pvht = r.prix_vente / (1 + (r.tva || 10) / 100);
        const marge = pvht > 0 ? ((pvht - coutPortion) / pvht * 100) : 0;
        return { nom: r.nom, marge, coutPortion, pvht };
      });

      if (recettesAvecMarge.length > 0) {
        const margeAvg = recettesAvecMarge.reduce((s, r) => s + r.marge, 0) / recettesAvecMarge.length;
        setMargeMoyenne(margeAvg);
      }

      const triees = [...recettesAvecMarge].sort((a, b) => b.marge - a.marge);
      setTopPlats(triees.slice(0, 3));
      setBottomPlats(triees.slice(-3).reverse());
    }

    // Équipe
    let qEq = supabase.from('membres_equipe').select('*');
    if (etId) qEq = qEq.eq('etablissement_id', etId);
    const { data: eq } = await qEq;
    setMembres(eq || []);

    // Alertes prix : produits dont le prix a augmenté récemment (simplifié — derniers produits ajoutés)
    let qProd = supabase.from('produits').select('*, fournisseurs(nom)').order('created_at', { ascending: false }).limit(3);
    if (etId) qProd = qProd.eq('etablissement_id', etId);
    const { data: prods } = await qProd;
    setAlertesPrix(prods || []);

    setLoading(false);
  }

  function allerA(page) {
    router.push('/' + page);
  }

  function getRappelInfo() {
    if (!dernierInventaire) return { statut: 'warning', titre: 'Aucun inventaire enregistré', reste: null };
    const now = new Date();
    const dern = new Date(dernierInventaire);
    const diff = Math.floor((now - dern) / (1000 * 60 * 60 * 24));
    const reste = rappelFreq - diff;

    if (reste < 0) return { statut: 'danger', titre: 'Inventaire en retard de ' + Math.abs(reste) + ' jour(s)', reste };
    if (reste <= 7) return { statut: 'warning', titre: reste === 0 ? 'Inventaire recommandé aujourd\'hui' : 'Inventaire recommandé dans ' + reste + ' jour(s)', reste };
    return { statut: 'ok', titre: 'Prochain inventaire dans ' + reste + ' jour(s)', reste };
  }

  const rappelInfo = getRappelInfo();
  const rappelColors = {
    ok: { bg: '#eaf3de', border: '#c0dd97', iconColor: '#27500a' },
    warning: { bg: '#faeeda', border: '#fac775', iconColor: '#854f0b' },
    danger: { bg: '#fcebeb', border: '#f09595', iconColor: '#a32d2d' },
  };
  const rc = rappelColors[rappelInfo.statut];

  function fmt(n) { return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  const quickActions = [
    { label: "Faire l'inventaire", icon: 'ti-clipboard-list', page: 'inventaire' },
    { label: 'Nouvelle recette', icon: 'ti-tools-kitchen-2', page: 'recettes' },
    { label: 'Calculer une marge', icon: 'ti-calculator', page: 'couts' },
    { label: 'Voir la mercuriale', icon: 'ti-list', page: 'mercuriale' },
  ];

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px', color: '#888780' }}>Chargement...</div>;
  }

  return (
    <div>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'14px 24px', marginBottom:'16px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <div style={{ fontSize:'18px', fontWeight:'500', color:'#2c2c2a' }}><i className="ti ti-layout-dashboard" style={{ marginRight:'8px', verticalAlign:'-2px' }} />Tableau de bord</div>
          <div style={{ fontSize:'13px', color:'#888780' }}>{new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}</div>
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

        {/* RAPPEL INVENTAIRE */}
        <div style={{ borderRadius:'12px', border:'0.5px solid '+rc.border, background:rc.bg, padding:'16px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <i className="ti ti-clipboard-list" style={{ fontSize:'20px', color:rc.iconColor }} />
              <div>
                <div style={{ fontSize:'14px', fontWeight:'500', color:'#2c2c2a' }}>{rappelInfo.titre}</div>
                <div style={{ fontSize:'12px', color:'#5f5e5a', marginTop:'2px' }}>
                  {dernierInventaire ? 'Dernier inventaire : ' + new Date(dernierInventaire).toLocaleDateString('fr-FR') + ' — fréquence configurée : tous les ' + rappelFreq + ' jours' : 'Aucun inventaire archivé pour le moment'}
                </div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'12px', color:'#5f5e5a' }}>
              <span>Rappel tous les</span>
              <select value={rappelFreq} onChange={e => setRappelFreq(parseInt(e.target.value))} style={{ padding:'4px 8px', borderRadius:'6px', border:'0.5px solid #d3d1c7', fontSize:'12px', background:'#fff', cursor:'pointer' }}>
                <option value={30}>30 jours</option>
                <option value={60}>60 jours</option>
                <option value={90}>90 jours</option>
              </select>
            </div>
          </div>
        </div>

        {/* INDICATEURS CLES */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px' }}>
          <div style={{ background:'#f8f7f4', borderRadius:'10px', padding:'14px 16px' }}>
            <div style={{ fontSize:'11px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'6px' }}>Valeur du stock</div>
            <div style={{ fontSize:'24px', fontWeight:'500', color:'#2c2c2a' }}>{fmt(valeurStock)} €</div>
            {deltaStock !== null && (
              <div style={{ fontSize:'12px', marginTop:'2px', color: deltaStock < 0 ? '#a32d2d' : '#27500a' }}>
                <i className={"ti " + (deltaStock < 0 ? 'ti-trending-down' : 'ti-trending-up')} style={{ fontSize:'12px', marginRight:'2px' }} />
                {deltaStock > 0 ? '+' : ''}{deltaStock.toFixed(1)}% vs inventaire précédent
              </div>
            )}
          </div>
          <div style={{ background:'#f8f7f4', borderRadius:'10px', padding:'14px 16px' }}>
            <div style={{ fontSize:'11px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'6px' }}>Fiches recettes</div>
            <div style={{ fontSize:'24px', fontWeight:'500', color:'#2c2c2a' }}>{nbRecettes}</div>
            <div style={{ fontSize:'12px', color:'#888780', marginTop:'2px' }}>dont {nbSousRecettes} sous-recettes</div>
          </div>
          <div style={{ background:'#f8f7f4', borderRadius:'10px', padding:'14px 16px' }}>
            <div style={{ fontSize:'11px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'6px' }}>Plats à la carte</div>
            <div style={{ fontSize:'24px', fontWeight:'500', color:'#2c2c2a' }}>{nbPlatsCarte}</div>
            <div style={{ fontSize:'12px', color:'#888780', marginTop:'2px' }}>tarification renseignée</div>
          </div>
          <div style={{ background:'#f8f7f4', borderRadius:'10px', padding:'14px 16px' }}>
            <div style={{ fontSize:'11px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'6px' }}>Marge moyenne</div>
            <div style={{ fontSize:'24px', fontWeight:'500', color:'#2c2c2a' }}>{margeMoyenne.toFixed(1)}%</div>
          </div>
        </div>

        {/* CLASSEMENTS + ALERTES */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px' }}>
          <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
            <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'12px' }}>Top 3 — meilleurs plats</div>
            {topPlats.length === 0 ? (
              <div style={{ fontSize:'12px', color:'#b4b2a9', textAlign:'center', padding:'12px' }}>Pas assez de données</div>
            ) : topPlats.map((p, i) => {
              const rangBg = i === 0 ? '#faeeda' : i === 1 ? '#f1efe8' : '#faeeda';
              const rangCol = i === 0 ? '#854f0b' : i === 1 ? '#5f5e5a' : '#854f0b';
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 0', borderBottom: i < topPlats.length-1 ? '0.5px solid #f1efe8' : 'none' }}>
                  <div style={{ width:'22px', height:'22px', borderRadius:'50%', background:rangBg, color:rangCol, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'500', flexShrink:0, opacity: i===2?0.7:1 }}>{i+1}</div>
                  <div style={{ flex:1, fontSize:'13px', color:'#2c2c2a', fontWeight:'500' }}>{p.nom}</div>
                  <div style={{ width:'80px', height:'5px', background:'#f1efe8', borderRadius:'3px', overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:'3px', width: Math.min(100, p.marge)+'%', background:'#639922' }} />
                  </div>
                  <div style={{ fontSize:'13px', fontWeight:'500', color:'#27500a' }}>{p.marge.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>

          <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
            <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'12px' }}>Bottom 3 — à surveiller</div>
            {bottomPlats.length === 0 ? (
              <div style={{ fontSize:'12px', color:'#b4b2a9', textAlign:'center', padding:'12px' }}>Pas assez de données</div>
            ) : bottomPlats.map((p, i) => {
              const isBad = p.marge < 50;
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 0', borderBottom: i < bottomPlats.length-1 ? '0.5px solid #f1efe8' : 'none' }}>
                  <div style={{ width:'22px', height:'22px', borderRadius:'50%', background:'#fcebeb', color:'#a32d2d', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'500', flexShrink:0 }}>!</div>
                  <div style={{ flex:1, fontSize:'13px', color:'#2c2c2a', fontWeight:'500' }}>{p.nom}</div>
                  <div style={{ width:'80px', height:'5px', background:'#f1efe8', borderRadius:'3px', overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:'3px', width: Math.min(100, Math.abs(p.marge))+'%', background: isBad ? '#e24b4a' : '#639922' }} />
                  </div>
                  <div style={{ fontSize:'13px', fontWeight:'500', color: isBad ? '#a32d2d' : '#27500a' }}>{p.marge.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>

          <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
            <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'12px' }}>Alertes prix fournisseurs</div>
            {alertesPrix.length === 0 ? (
              <div style={{ fontSize:'12px', color:'#b4b2a9', textAlign:'center', padding:'12px' }}>Aucune alerte</div>
            ) : alertesPrix.map((p, i) => (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'12px', padding:'10px 0', borderBottom: i < alertesPrix.length-1 ? '0.5px solid #f1efe8' : 'none' }}>
                <div style={{ width:'32px', height:'32px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'16px', background:'#eeedfe', color:'#3c3489' }}>
                  <i className="ti ti-list" />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'13px', fontWeight:'500', color:'#2c2c2a' }}>{p.nom}</div>
                  <div style={{ fontSize:'12px', color:'#888780', marginTop:'2px' }}>{p.fournisseurs?.nom || 'Sans fournisseur'} — {parseFloat(p.prix_ht).toFixed(2)} €/kg</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ACCES RAPIDES + EQUIPE */}
        <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:'16px' }}>
          <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
            <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'12px' }}>Accès rapides</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'10px' }}>
              {quickActions.map((a, i) => (
                <button key={i} onClick={() => allerA(a.page)} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 14px', borderRadius:'10px', border:'0.5px solid #e2e0d8', background:'#fff', cursor:'pointer', textAlign:'left', fontSize:'13px', fontWeight:'500', color:'#2c2c2a', width:'100%' }}>
                  <div style={{ width:'34px', height:'34px', borderRadius:'8px', background:'#eeedfe', color:'#3c3489', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'17px', flexShrink:0 }}>
                    <i className={"ti " + a.icon} />
                  </div>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
            <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span>Équipe</span>
              <span style={{ fontSize:'11px', color:'#3c3489', background:'#eeedfe', padding:'2px 8px', borderRadius:'10px', textTransform:'none', fontWeight:'400' }}>{membres.length} membre{membres.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', marginBottom:'12px' }}>
              {membres.length === 0 ? (
                <span style={{ fontSize:'12px', color:'#b4b2a9' }}>Aucun membre ajouté</span>
              ) : membres.map((m, i) => {
                const initiales = m.nom.split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase();
                return (
                  <div key={i} title={m.nom} style={{ width:'34px', height:'34px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'500', border:'2px solid #fff', background: m.actif ? '#eaf3de' : '#eeedfe', color: m.actif ? '#27500a' : '#3c3489' }}>
                    {initiales}
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize:'12px', color:'#888780', marginBottom:'4px' }}>
              <i className="ti ti-check" style={{ color:'#27500a', marginRight:'4px' }} />{membres.filter(m => m.actif).length} membre(s) actif(s)
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export default function MonAbonnement() {
  const [loading, setLoading] = useState(true);
  const [abonnement, setAbonnement] = useState(null);
  const [nbEtablissements, setNbEtablissements] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [modalChangement, setModalChangement] = useState(null);

  useEffect(() => { chargerDonnees(); }, []);

  function toast(msg) {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  }

  async function chargerDonnees() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) { setLoading(false); return; }

    const { data: abo } = await supabase.from('abonnements').select('*').eq('compte_client_id', userId).single();
    setAbonnement(abo);

    const { data: etabs } = await supabase.from('etablissements').select('*').eq('compte_client_id', userId);
    setNbEtablissements(etabs?.length || 1);

    setLoading(false);
  }

  function joursRestants() {
    if (!abonnement?.date_fin_essai) return null;
    const fin = new Date(abonnement.date_fin_essai);
    const maintenant = new Date();
    const diff = Math.ceil((fin - maintenant) / (1000 * 60 * 60 * 24));
    return diff;
  }

  function prixMultiSites(nb) {
  if (nb <= 1) return 69;
  if (nb <= 4) return nb * 59;
  return nb * 49;
}

  const plans = [
    {
      code: 'starter', nom: 'Starter', prix: 39,
      description: 'Les fondamentaux pour gérer votre établissement au quotidien',
      fonctionnalites: ['Mercuriale', 'Fournisseurs', 'Fiches recettes', 'Coût de revient', 'Inventaire + Contenants', 'Bons de commande'],
    },
    {
      code: 'pro', nom: 'Pro', prix: 69,
      description: 'Tout Starter + conformité et pilotage avancé',
      fonctionnalites: ['Tout Starter', 'Allergènes', 'HACCP complet', 'Suivi DLC automatique', 'Pertes & Rendements', 'Saisonnalité', 'Fiches techniques', 'Rapport mensuel', 'Comparateur fournisseurs'],
      populaire: true,
    },
    {
      code: 'multi', nom: 'Multi-sites', prix: prixMultiSites(nbEtablissements),
      description: nbEtablissements > 1 ? `Tarif pour vos ${nbEtablissements} établissements` : 'À partir de 2 établissements — tarif dégressif',
      fonctionnalites: ['Tout Pro', 'Switcher multi-établissements', 'Vue globale consolidée', 'Partage granulaire entre sites'],
    },
  ];

  async function demarrerChangementPlan(planCode) {
    setModalChangement(planCode);
  }

  async function confirmerChangementPlan() {
    if (!abonnement) return;
    const planCode = modalChangement;
    const plan = plans.find(p => p.code === planCode);

    const { error } = await supabase.from('abonnements').update({
      plan_code: planCode === 'multi' ? 'pro' : planCode,
      montant_mensuel: plan.prix,
    }).eq('id', abonnement.id);

    if (error) { toast('Erreur : ' + error.message); return; }

    setModalChangement(null);
    chargerDonnees();
    toast('Demande de changement vers le plan ' + plan.nom + ' enregistrée. Le paiement sera configuré prochainement.');
  }

  if (loading) return <div style={{ textAlign:'center', padding:'60px', color:'#888780' }}>Chargement...</div>;

  const jours = joursRestants();
  const planActuelCode = nbEtablissements > 1 ? 'multi' : abonnement?.plan_code;

  return (
    <div>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'16px 24px', marginBottom:'16px' }}>
        <div style={{ fontSize:'18px', fontWeight:'500', color:'#2c2c2a' }}><i className="ti ti-credit-card" style={{ marginRight:'8px', verticalAlign:'-2px' }} />Mon abonnement</div>
      </div>

      {showToast && (
        <div style={{ background:'#eaf3de', color:'#27500a', borderRadius:'10px', padding:'12px 16px', fontSize:'13px', fontWeight:'500', display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
          <i className="ti ti-check" />{toastMsg}
        </div>
      )}

      {abonnement?.statut === 'essai' && jours !== null && (
        <div style={{ background: jours > 3 ? '#eeedfe' : '#faeeda', borderRadius:'12px', padding:'16px 20px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'12px' }}>
          <i className="ti ti-clock" style={{ fontSize:'22px', color: jours > 3 ? '#534ab7' : '#854f0b' }} />
          <div>
            <div style={{ fontSize:'14px', fontWeight:'500', color:'#2c2c2a' }}>
              {jours > 0 ? `Essai gratuit — ${jours} jour${jours > 1 ? 's' : ''} restant${jours > 1 ? 's' : ''}` : 'Votre essai gratuit est terminé'}
            </div>
            <div style={{ fontSize:'12px', color:'#5f5e5a', marginTop:'2px' }}>
              {jours > 0 ? 'Toutes les fonctionnalités Pro sont débloquées pendant votre essai.' : 'Choisissez un plan ci-dessous pour continuer à utiliser FIMC.'}
            </div>
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px', marginBottom:'16px' }}>
        {plans.map(plan => {
          const estActuel = planActuelCode === plan.code;
          return (
            <div key={plan.code} style={{ background:'#fff', borderRadius:'12px', border: estActuel ? '2px solid #534ab7' : '0.5px solid #e2e0d8', padding:'24px', position:'relative' }}>
              {plan.populaire && !estActuel && (
                <div style={{ position:'absolute', top:'-10px', right:'20px', background:'#534ab7', color:'#fff', fontSize:'10px', fontWeight:'600', padding:'3px 10px', borderRadius:'10px', textTransform:'uppercase', letterSpacing:'0.5px' }}>Populaire</div>
              )}
              {estActuel && (
                <div style={{ position:'absolute', top:'-10px', right:'20px', background:'#27500a', color:'#fff', fontSize:'10px', fontWeight:'600', padding:'3px 10px', borderRadius:'10px', textTransform:'uppercase', letterSpacing:'0.5px' }}>Plan actuel</div>
              )}
              <div style={{ fontSize:'16px', fontWeight:'600', color:'#2c2c2a', marginBottom:'4px' }}>{plan.nom}</div>
              <div style={{ fontSize:'28px', fontWeight:'600', color:'#534ab7', marginBottom:'4px' }}>{plan.prix}€<span style={{ fontSize:'13px', color:'#888780', fontWeight:'400' }}>/mois</span></div>
              <div style={{ fontSize:'12px', color:'#888780', marginBottom:'18px', minHeight:'32px' }}>{plan.description}</div>

              <div style={{ marginBottom:'20px' }}>
                {plan.fonctionnalites.map((f, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'8px', marginBottom:'8px', fontSize:'13px', color:'#5f5e5a' }}>
                    <i className="ti ti-check" style={{ color:'#27500a', fontSize:'14px', marginTop:'1px', flexShrink:0 }} />
                    {f}
                  </div>
                ))}
              </div>

              <button
                onClick={() => !estActuel && demarrerChangementPlan(plan.code)}
                disabled={estActuel}
                style={{
                  width:'100%', padding:'11px', borderRadius:'8px', fontSize:'14px', fontWeight:'500',
                  cursor: estActuel ? 'default' : 'pointer',
                  border: estActuel ? '0.5px solid #e2e0d8' : 'none',
                  background: estActuel ? '#f8f7f4' : '#534ab7',
                  color: estActuel ? '#888780' : '#fff',
                }}
              >
                {estActuel ? 'Plan actuel' : 'Choisir ce plan'}
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
        <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'14px' }}>Détails de votre abonnement</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
          <div>
            <div style={{ fontSize:'11px', color:'#888780', marginBottom:'3px' }}>Statut</div>
            <div style={{ fontSize:'14px', fontWeight:'500', color:'#2c2c2a' }}>
              <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'8px', fontWeight:'500', background: abonnement?.statut === 'essai' ? '#eeedfe' : abonnement?.statut === 'actif' ? '#eaf3de' : '#fcebeb', color: abonnement?.statut === 'essai' ? '#3c3489' : abonnement?.statut === 'actif' ? '#27500a' : '#a32d2d' }}>
                {abonnement?.statut === 'essai' ? 'Essai gratuit' : abonnement?.statut === 'actif' ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>
          <div>
            <div style={{ fontSize:'11px', color:'#888780', marginBottom:'3px' }}>Nombre d'établissements</div>
            <div style={{ fontSize:'14px', fontWeight:'500', color:'#2c2c2a' }}>{nbEtablissements}</div>
          </div>
        </div>
      </div>

      {modalChangement && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
          <div style={{ background:'#fff', borderRadius:'16px', padding:'24px', width:'100%', maxWidth:'420px' }}>
            <div style={{ fontSize:'17px', fontWeight:'500', color:'#2c2c2a', marginBottom:'4px' }}>Changer de plan</div>
            <div style={{ fontSize:'13px', color:'#888780', marginBottom:'20px' }}>
              Vous allez passer au plan <strong>{plans.find(p => p.code === modalChangement)?.nom}</strong> à {plans.find(p => p.code === modalChangement)?.prix}€/mois. La gestion du paiement sera configurée à l'étape suivante.
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'8px' }}>
              <button onClick={() => setModalChangement(null)} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', cursor:'pointer', border:'0.5px solid #d3d1c7', background:'#fff' }}>Annuler</button>
              <button onClick={confirmerChangementPlan} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff' }}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

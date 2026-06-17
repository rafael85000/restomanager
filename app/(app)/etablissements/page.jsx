'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { APP_NAME } from '../../../lib/config';

export default function Etablissements() {
  const [etablissements, setEtablissements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [creationEnCours, setCreationEnCours] = useState(false);

  const [form, setForm] = useState({
    nom:'', adresse:'', ville:'', plan:'starter',
    typeCompte: 'actuel', email:'', password:'',
  });

  useEffect(() => { charger(); }, []);

  function toast(msg) {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  }

  async function charger() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    setUserEmail(userData?.user?.email || '');

    const { data } = await supabase.from('etablissements').select('*').eq('compte_client_id', userId).order('created_at');
    setEtablissements(data || []);
    setLoading(false);
  }

  function ouvrirModal() {
    setForm({ nom:'', adresse:'', ville:'', plan:'starter', typeCompte: etablissements.length === 0 ? 'actuel' : 'nouveau', email:'', password:'' });
    setModal(true);
  }

  async function creerEtablissement() {
    if (!form.nom) { toast('Le nom est obligatoire'); return; }
    if (form.typeCompte === 'nouveau' && (!form.email || !form.password)) {
      toast('Email et mot de passe requis pour ce nouvel établissement');
      return;
    }

    setCreationEnCours(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    const { data: nouvelEtab, error } = await supabase.from('etablissements').insert([{
      nom: form.nom, adresse: form.adresse, ville: form.ville, plan: form.plan,
      compte_client_id: userId,
    }]).select().single();

    if (error) { toast('Erreur : ' + error.message); setCreationEnCours(false); return; }

    if (form.typeCompte === 'actuel') {
      await supabase.from('acces_etablissement').insert([{ compte_id: userId, etablissement_id: nouvelEtab.id, role: 'proprietaire' }]);
    } else {
      const res = await fetch('/api/creer-acces-etablissement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password, etablissement_id: nouvelEtab.id }),
      });
      const result = await res.json();
      if (result.error) {
        toast('Établissement créé, mais erreur sur le compte gérant : ' + result.error);
        setCreationEnCours(false);
        setModal(false);
        setTimeout(() => window.location.reload(), 1200);
        return;
      }
      await supabase.from('acces_etablissement').insert([{ compte_id: userId, etablissement_id: nouvelEtab.id, role: 'proprietaire' }]);
    }

    setCreationEnCours(false);
    setModal(false);
    toast('Établissement "' + form.nom + '" créé avec succès');
    setTimeout(() => window.location.reload(), 800);
  }

  const planInfo = {
    starter: { label:'Starter', prix:39, col:'#5f5e5a', bg:'#f1efe8' },
    pro: { label:'Pro', prix:69, col:'#3c3489', bg:'#eeedfe' },
  };

  const tousEnPro = etablissements.length >= 2 && etablissements.every(e => e.plan === 'pro');
  const montrerInfoMulti = etablissements.length >= 1;

  if (loading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#888780' }}>Chargement...</div>;

  return (
    <div style={{ minHeight:'100vh', background:'#f8f7f4', padding:'40px 24px' }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      <div style={{ maxWidth:'900px', margin:'0 auto' }}>

        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
          <div style={{ width:'32px', height:'32px', background:'#534ab7', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ color:'#fff', fontWeight:'700', fontSize:'14px' }}>F</span>
          </div>
          <div style={{ fontSize:'16px', fontWeight:'600', color:'#2c2c2a' }}>{APP_NAME}</div>
        </div>

        <div style={{ fontSize:'24px', fontWeight:'500', color:'#2c2c2a', marginBottom:'6px' }}>
          {etablissements.length === 0 ? 'Créez votre premier établissement' : 'Vos établissements'}
        </div>
        <div style={{ fontSize:'14px', color:'#888780', marginBottom:'28px' }}>
          {etablissements.length === 0 ? 'Choisissez un nom, un plan, et démarrez en quelques secondes.' : 'Gérez vos établissements et leurs abonnements.'}
        </div>

        {showToast && (
          <div style={{ background:'#eaf3de', color:'#27500a', borderRadius:'10px', padding:'12px 16px', fontSize:'13px', fontWeight:'500', marginBottom:'20px' }}>{toastMsg}</div>
        )}

        {montrerInfoMulti && !tousEnPro && (
          <div style={{ background:'#eeedfe', borderRadius:'10px', padding:'14px 18px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'10px' }}>
            <i className="ti ti-info-circle" style={{ color:'#534ab7', fontSize:'18px' }} />
            <div style={{ fontSize:'13px', color:'#3c3489' }}>Le forfait <strong>Multi-sites</strong> existe et peut réduire votre facture totale si tous vos établissements passent en Pro.</div>
          </div>
        )}

        {tousEnPro && (
          <div style={{ background:'#faeeda', borderRadius:'10px', padding:'14px 18px', marginBottom:'20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'10px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <i className="ti ti-sparkles" style={{ color:'#854f0b', fontSize:'18px' }} />
              <div style={{ fontSize:'13px', color:'#6b3f09' }}>Tous vos établissements sont en Pro — passez au forfait <strong>Multi-sites</strong> et économisez chaque mois.</div>
            </div>
            <a href="/abonnement" style={{ fontSize:'12px', fontWeight:'600', color:'#534ab7', whiteSpace:'nowrap' }}>Voir l'offre →</a>
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'14px', marginBottom:'20px' }}>
          {etablissements.map(et => {
            const pi = planInfo[et.plan] || planInfo.starter;
            return (
              <div key={et.id} style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
                <div style={{ fontSize:'15px', fontWeight:'500', color:'#2c2c2a', marginBottom:'4px' }}>{et.nom}</div>
                <div style={{ fontSize:'12px', color:'#888780', marginBottom:'12px' }}>{et.ville || 'Ville non renseignée'}</div>
                <div style={{ background:pi.bg, borderRadius:'8px', padding:'8px 12px', display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:'12px', fontWeight:'500', color:pi.col }}>{pi.label}</span>
                  <span style={{ fontSize:'12px', color:pi.col }}>{pi.prix}€/mois</span>
                </div>
              </div>
            );
          })}

          <div onClick={ouvrirModal} style={{ background:'#fff', borderRadius:'12px', border:'2px dashed #d3d1c7', padding:'20px', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'8px', cursor:'pointer', minHeight:'110px' }}>
            <i className="ti ti-plus" style={{ fontSize:'24px', color:'#534ab7' }} />
            <div style={{ fontSize:'13px', fontWeight:'500', color:'#534ab7' }}>Ajouter un établissement</div>
          </div>
        </div>

      </div>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'20px' }}>
          <div style={{ background:'#fff', borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'460px', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ fontSize:'18px', fontWeight:'500', color:'#2c2c2a', marginBottom:'20px' }}>Nouvel établissement</div>

            <div style={{ marginBottom:'14px' }}>
              <label style={{ fontSize:'12px', fontWeight:'500', color:'#5f5e5a', display:'block', marginBottom:'5px' }}>Nom de l'établissement *</label>
              <input value={form.nom} onChange={e => setForm({...form, nom:e.target.value})} placeholder="Ex : Le Bistrot du Coin" style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px' }} />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'14px' }}>
              <div>
                <label style={{ fontSize:'12px', fontWeight:'500', color:'#5f5e5a', display:'block', marginBottom:'5px' }}>Adresse</label>
                <input value={form.adresse} onChange={e => setForm({...form, adresse:e.target.value})} style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px' }} />
              </div>
              <div>
                <label style={{ fontSize:'12px', fontWeight:'500', color:'#5f5e5a', display:'block', marginBottom:'5px' }}>Ville</label>
                <input value={form.ville} onChange={e => setForm({...form, ville:e.target.value})} style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px' }} />
              </div>
            </div>

            <div style={{ marginBottom:'18px' }}>
              <label style={{ fontSize:'12px', fontWeight:'500', color:'#5f5e5a', display:'block', marginBottom:'8px' }}>Choisissez un plan</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                {['starter','pro'].map(p => (
                  <div key={p} onClick={() => setForm({...form, plan:p})} style={{ border: form.plan===p ? '2px solid #534ab7' : '0.5px solid #e2e0d8', borderRadius:'10px', padding:'14px', cursor:'pointer', background: form.plan===p ? '#eeedfe' : '#fff' }}>
                    <div style={{ fontSize:'13px', fontWeight:'600', color:'#2c2c2a' }}>{planInfo[p].label}</div>
                    <div style={{ fontSize:'16px', fontWeight:'600', color:'#534ab7' }}>{planInfo[p].prix}€<span style={{ fontSize:'11px', color:'#888780' }}>/mois</span></div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:'14px' }}>
              <label style={{ fontSize:'12px', fontWeight:'500', color:'#5f5e5a', display:'block', marginBottom:'8px' }}>Compte de connexion pour cet établissement</label>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                <div onClick={() => setForm({...form, typeCompte:'actuel'})} style={{ border: form.typeCompte==='actuel' ? '2px solid #534ab7' : '0.5px solid #e2e0d8', borderRadius:'10px', padding:'12px 14px', cursor:'pointer', background: form.typeCompte==='actuel' ? '#eeedfe' : '#fff' }}>
                  <div style={{ fontSize:'13px', fontWeight:'500', color:'#2c2c2a' }}>Utiliser mon compte actuel</div>
                  <div style={{ fontSize:'11px', color:'#888780' }}>{userEmail}</div>
                </div>
                <div onClick={() => setForm({...form, typeCompte:'nouveau'})} style={{ border: form.typeCompte==='nouveau' ? '2px solid #534ab7' : '0.5px solid #e2e0d8', borderRadius:'10px', padding:'12px 14px', cursor:'pointer', background: form.typeCompte==='nouveau' ? '#eeedfe' : '#fff' }}>
                  <div style={{ fontSize:'13px', fontWeight:'500', color:'#2c2c2a' }}>Créer un compte dédié à cet établissement</div>
                  <div style={{ fontSize:'11px', color:'#888780' }}>Idéal si un gérant local doit s'y connecter sans voir vos autres établissements</div>
                </div>
              </div>
            </div>

            {form.typeCompte === 'nouveau' && (
              <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'18px', background:'#f8f7f4', borderRadius:'10px', padding:'14px' }}>
                <input type="email" placeholder="Email du gérant" value={form.email} onChange={e => setForm({...form, email:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px' }} />
                <input type="password" placeholder="Mot de passe temporaire" value={form.password} onChange={e => setForm({...form, password:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px' }} />
              </div>
            )}

            <div style={{ display:'flex', justifyContent:'flex-end', gap:'8px' }}>
              <button onClick={() => setModal(false)} style={{ padding:'10px 18px', borderRadius:'8px', fontSize:'14px', cursor:'pointer', border:'0.5px solid #d3d1c7', background:'#fff' }}>Annuler</button>
              <button onClick={creerEtablissement} disabled={creationEnCours} style={{ padding:'10px 18px', borderRadius:'8px', fontSize:'14px', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff' }}>
                {creationEnCours ? 'Création...' : "Créer l'établissement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
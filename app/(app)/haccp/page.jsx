'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export default function HACCP() {
  const [tab, setTab] = useState('etiquetage');
  const [recettes, setRecettes] = useState([]);
  const [produits, setProduits] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [equipements, setEquipements] = useState([]);
  const [zones, setZones] = useState([]);
  const [etiquettes, setEtiquettes] = useState([]);
  const [cuissons, setCuissons] = useState([]);
  const [lots, setLots] = useState([]);
  const [receptions, setReceptions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [nettoyageLog, setNettoyageLog] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formEtiquette, setFormEtiquette] = useState({ produit_nom:'', date_fabrication: new Date().toISOString().split('T')[0], jours_dlc:3 });
  const [modalTemp, setModalTemp] = useState(null);
  const [tempVal, setTempVal] = useState('');

  const [modalCuisson, setModalCuisson] = useState(false);
  const [formCuisson, setFormCuisson] = useState({ produit_nom:'', type:'cuisson', temperature:'' });

  const [modalLot, setModalLot] = useState(false);
  const [formLot, setFormLot] = useState({ numero_lot:'', produit_id:'', produit_nom:'', recette_id:'', date_production: new Date().toISOString().split('T')[0] });
  const [searchLot, setSearchLot] = useState('');

  const [modalReception, setModalReception] = useState(false);
  const [formReception, setFormReception] = useState({ fournisseur_id:'', temperature_camion:'', emballage_ok:true, dlc_ok:true, commentaire:'' });

  const [modalDoc, setModalDoc] = useState(false);
  const [formDoc, setFormDoc] = useState({ nom:'', categorie:'', date_expiration:'' });

  const tabs = [
    {id:'etiquetage', label:'Étiquetage'},
    {id:'temperatures', label:'Températures'},
    {id:'nettoyage', label:'Nettoyage'},
    {id:'cuissons', label:'Cuissons & Refroidissements'},
    {id:'tracabilite', label:'Traçabilité'},
    {id:'reception', label:'Réception'},
    {id:'pms', label:'PMS'},
  ];

  useEffect(() => { chargerDonnees(); }, []);

  async function chargerDonnees() {
    setLoading(true);
    const { data: rec } = await supabase.from('recettes').select('*');
    const { data: prod } = await supabase.from('produits').select('*');
    const { data: fourn } = await supabase.from('fournisseurs').select('*');
    const { data: eq } = await supabase.from('haccp_equipements').select('*');
    const { data: zn } = await supabase.from('haccp_zones_nettoyage').select('*');
    const { data: etiq } = await supabase.from('haccp_etiquettes').select('*').order('created_at', { ascending: false }).limit(10);
    const { data: cuiss } = await supabase.from('haccp_cuissons').select('*').order('date_releve', { ascending: false }).limit(15);
    const { data: lotsData } = await supabase.from('haccp_lots').select('*, produits(nom), recettes(nom)').order('created_at', { ascending: false });
    const { data: recepts } = await supabase.from('haccp_receptions').select('*, fournisseurs(nom)').order('date_reception', { ascending: false }).limit(15);
    const { data: docs } = await supabase.from('haccp_documents').select('*').order('date_expiration', { ascending: true });

    const todayStr = new Date().toISOString().split('T')[0];
    const { data: logToday } = await supabase.from('haccp_nettoyage_log').select('*').gte('valide_le', todayStr);

    setRecettes(rec || []);
    setProduits(prod || []);
    setFournisseurs(fourn || []);
    setEquipements(eq || []);
    setZones(zn || []);
    setEtiquettes(etiq || []);
    setCuissons(cuiss || []);
    setLots(lotsData || []);
    setReceptions(recepts || []);
    setDocuments(docs || []);
    setNettoyageLog(logToday || []);
    setLoading(false);
  }

  async function imprimerEtiquette() {
    if (!formEtiquette.produit_nom) { alert('Saisissez un nom de produit'); return; }
    const dateFab = new Date(formEtiquette.date_fabrication);
    const dateDLC = new Date(dateFab);
    dateDLC.setDate(dateDLC.getDate() + parseInt(formEtiquette.jours_dlc));

    await supabase.from('haccp_etiquettes').insert([{
      produit_nom: formEtiquette.produit_nom,
      date_fabrication: formEtiquette.date_fabrication,
      date_dlc: dateDLC.toISOString().split('T')[0],
    }]);
    await supabase.from('dlc_produits').insert([{
      nom: formEtiquette.produit_nom,
      type: 'preparation',
      date_ouverture: formEtiquette.date_fabrication,
      date_dlc: dateDLC.toISOString().split('T')[0],
      statut: 'ok',
    }]);

    setFormEtiquette({ produit_nom:'', date_fabrication: new Date().toISOString().split('T')[0], jours_dlc:3 });
    chargerDonnees();
    alert('Étiquette imprimée et ajoutée au Suivi DLC !');
  }

  async function ajouterEquipementDemo() {
    await supabase.from('haccp_equipements').insert([
      { nom:'Chambre froide positive', type:'froid', temp_min:0, temp_max:4 },
      { nom:'Congélateur', type:'froid', temp_min:-22, temp_max:-18 },
      { nom:'Bain-marie service', type:'chaud', temp_min:63, temp_max:80 },
    ]);
    chargerDonnees();
  }

  async function validerTemperature() {
    if (!tempVal) return;
    const t = parseFloat(tempVal);
    const conforme = t >= modalTemp.temp_min && t <= modalTemp.temp_max;
    await supabase.from('haccp_releves_temperature').insert([{ equipement_id: modalTemp.id, temperature: t, conforme }]);
    setModalTemp(null);
    if (!conforme) alert('Attention : température hors norme !');
  }

  async function ajouterZoneDemo() {
    await supabase.from('haccp_zones_nettoyage').insert([
      { nom:'Plan de travail cuisine', frequence:'quotidien' },
      { nom:'Friteuse', frequence:'quotidien' },
      { nom:'Sol cuisine', frequence:'quotidien' },
      { nom:'Chambre froide positive', frequence:'hebdomadaire' },
      { nom:'Hottes et filtres', frequence:'hebdomadaire' },
    ]);
    chargerDonnees();
  }

  async function validerNettoyage(zoneId) {
    await supabase.from('haccp_nettoyage_log').insert([{ zone_id: zoneId, valide_par: 'Rafael Colonnello' }]);
    chargerDonnees();
  }

  function estValideAujourdhui(zoneId) {
    return nettoyageLog.some(l => l.zone_id === zoneId);
  }

  const seuilsCuisson = { cuisson:63, refroidissement:10, remise:63 };

  async function enregistrerCuisson() {
    if (!formCuisson.produit_nom || !formCuisson.temperature) { alert('Remplissez tous les champs'); return; }
    const t = parseFloat(formCuisson.temperature);
    let conforme = true;
    if (formCuisson.type === 'cuisson') conforme = t >= 63;
    if (formCuisson.type === 'refroidissement') conforme = t <= 10;
    if (formCuisson.type === 'remise') conforme = t >= 63;

    await supabase.from('haccp_cuissons').insert([{
      produit_nom: formCuisson.produit_nom,
      type: formCuisson.type,
      temperature: t,
      conforme,
    }]);
    setModalCuisson(false);
    setFormCuisson({ produit_nom:'', type:'cuisson', temperature:'' });
    chargerDonnees();
    if (!conforme) alert('Attention : non-conformité détectée !');
  }

  function genererNumeroLot() {
    const d = new Date();
    return 'L' + d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0') + '-' + Math.floor(Math.random()*900+100);
  }

  async function creerLot() {
    if (!formLot.produit_id && !formLot.produit_nom) { alert('Sélectionnez un produit ou saisissez un nom'); return; }
    const numero = formLot.numero_lot || genererNumeroLot();
    const produitChoisi = produits.find(p => p.id === formLot.produit_id);

    await supabase.from('haccp_lots').insert([{
      numero_lot: numero,
      produit_id: formLot.produit_id || null,
      produit_nom: produitChoisi ? produitChoisi.nom : formLot.produit_nom,
      recette_id: formLot.recette_id || null,
      date_production: formLot.date_production,
    }]);
    setModalLot(false);
    setFormLot({ numero_lot:'', produit_id:'', produit_nom:'', recette_id:'', date_production: new Date().toISOString().split('T')[0] });
    chargerDonnees();
  }

  async function basculerRappel(lotId, etatActuel) {
    await supabase.from('haccp_lots').update({ rappele: !etatActuel }).eq('id', lotId);
    chargerDonnees();
  }

  const lotsFiltres = lots.filter(l => !searchLot || l.numero_lot.toLowerCase().includes(searchLot.toLowerCase()) || (l.produits?.nom || l.produit_nom || '').toLowerCase().includes(searchLot.toLowerCase()));
  const lotsRappeles = lots.filter(l => l.rappele);

  async function enregistrerReception() {
    const conforme = formReception.emballage_ok && formReception.dlc_ok;
    await supabase.from('haccp_receptions').insert([{
      fournisseur_id: formReception.fournisseur_id || null,
      temperature_camion: formReception.temperature_camion ? parseFloat(formReception.temperature_camion) : null,
      emballage_ok: formReception.emballage_ok,
      dlc_ok: formReception.dlc_ok,
      conforme,
      commentaire: formReception.commentaire,
    }]);
    setModalReception(false);
    setFormReception({ fournisseur_id:'', temperature_camion:'', emballage_ok:true, dlc_ok:true, commentaire:'' });
    chargerDonnees();
    if (!conforme) alert('Non-conformité enregistrée — pensez à contacter le fournisseur.');
  }

  async function ajouterDocument() {
    if (!formDoc.nom) { alert('Le nom est obligatoire'); return; }
    await supabase.from('haccp_documents').insert([{
      nom: formDoc.nom,
      categorie: formDoc.categorie,
      date_expiration: formDoc.date_expiration || null,
    }]);
    setModalDoc(false);
    setFormDoc({ nom:'', categorie:'', date_expiration:'' });
    chargerDonnees();
  }

  function estExpire(dateExp) {
    if (!dateExp) return false;
    return new Date(dateExp) < new Date();
  }

  return (
    <div>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'16px 24px', marginBottom:'16px' }}>
        <div style={{ fontSize:'18px', fontWeight:'500', color:'#2c2c2a' }}>Module HACCP</div>
        <div style={{ fontSize:'12px', color:'#888780', marginTop:'2px' }}>Gestion de la sécurité alimentaire</div>
      </div>

      <div style={{ display:'flex', gap:'6px', marginBottom:'16px', flexWrap:'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:'8px 14px', borderRadius:'8px', fontSize:'13px', fontWeight:'500', cursor:'pointer', border:'0.5px solid', borderColor: tab===t.id ? '#afa9ec' : '#d3d1c7', background: tab===t.id ? '#534ab7' : '#fff', color: tab===t.id ? '#fff' : '#5f5e5a' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'etiquetage' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:'16px' }}>
          <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
            <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'16px' }}>Nouvelle étiquette</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <input value={formEtiquette.produit_nom} onChange={e => setFormEtiquette({...formEtiquette, produit_nom:e.target.value})} placeholder="Nom du produit ou de la recette..." style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none' }} />
              <input type="date" value={formEtiquette.date_fabrication} onChange={e => setFormEtiquette({...formEtiquette, date_fabrication:e.target.value})} style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none' }} />
              <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                {[1,3,5,7,14,30].map(j => (
                  <button key={j} onClick={() => setFormEtiquette({...formEtiquette, jours_dlc:j})} style={{ padding:'6px 12px', borderRadius:'8px', fontSize:'12px', fontWeight:'500', cursor:'pointer', border:'0.5px solid', borderColor: formEtiquette.jours_dlc===j ? '#534ab7' : '#d3d1c7', background: formEtiquette.jours_dlc===j ? '#eeedfe' : '#fff', color: formEtiquette.jours_dlc===j ? '#3c3489' : '#5f5e5a' }}>J+{j}</button>
                ))}
              </div>
              <button onClick={imprimerEtiquette} style={{ padding:'12px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff' }}>
                <i className="ti ti-printer" /> Imprimer l étiquette
              </button>
            </div>
            <div style={{ marginTop:'20px', paddingTop:'16px', borderTop:'0.5px solid #e2e0d8' }}>
              <div style={{ fontSize:'12px', fontWeight:'500', color:'#888780', textTransform:'uppercase', marginBottom:'10px' }}>Dernières étiquettes</div>
              {etiquettes.map(e => (
                <div key={e.id} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'0.5px solid #f1efe8', fontSize:'12px' }}>
                  <span style={{ color:'#2c2c2a' }}>{e.produit_nom}</span>
                  <span style={{ color:'#888780' }}>DLC {new Date(e.date_dlc).toLocaleDateString('fr-FR')}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background:'#f8f7f4', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
            <div style={{ fontSize:'11px', fontWeight:'500', color:'#888780', textTransform:'uppercase', marginBottom:'16px' }}>Aperçu étiquette</div>
            <div style={{ background:'#fff', border:'2px dashed #d3d1c7', borderRadius:'8px', padding:'16px', width:'180px', textAlign:'center' }}>
              <div style={{ fontSize:'13px', fontWeight:'500', color:'#2c2c2a', marginBottom:'6px' }}>{formEtiquette.produit_nom || '...'}</div>
              <div style={{ fontSize:'11px', color:'#888780', marginBottom:'4px' }}>Fabriqué le : {new Date(formEtiquette.date_fabrication).toLocaleDateString('fr-FR')}</div>
              <div style={{ fontSize:'12px', fontWeight:'500', color:'#a32d2d' }}>DLC : J+{formEtiquette.jours_dlc}</div>
              <div style={{ fontSize:'10px', color:'#888780', marginTop:'6px' }}>Le Bistrot du Coin</div>
            </div>
          </div>
        </div>
      )}

      {tab === 'temperatures' && (
        <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'16px' }}>
            <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase' }}>Équipements</div>
            {equipements.length === 0 && <button onClick={ajouterEquipementDemo} style={{ padding:'7px 14px', borderRadius:'8px', fontSize:'12px', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff' }}>+ Ajouter mes équipements</button>}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'12px' }}>
            {equipements.map(eq => (
              <div key={eq.id} style={{ border:'0.5px solid #e2e0d8', borderRadius:'10px', padding:'14px' }}>
                <div style={{ fontSize:'13px', fontWeight:'500', color:'#2c2c2a', marginBottom:'10px' }}>{eq.nom}</div>
                <div style={{ fontSize:'11px', color:'#888780', marginBottom:'10px' }}>Plage : {eq.temp_min}°C → {eq.temp_max}°C</div>
                <button onClick={() => { setModalTemp(eq); setTempVal(''); }} style={{ width:'100%', padding:'7px', borderRadius:'8px', fontSize:'12px', fontWeight:'500', cursor:'pointer', border:'0.5px solid #d3d1c7', background:'#fff', color:'#5f5e5a' }}>Saisir un relevé</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'nettoyage' && (
        <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'16px' }}>
            <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase' }}>Planning nettoyage — {new Date().toLocaleDateString('fr-FR')}</div>
            {zones.length === 0 && <button onClick={ajouterZoneDemo} style={{ padding:'7px 14px', borderRadius:'8px', fontSize:'12px', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff' }}>+ Ajouter mes zones</button>}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {zones.map(z => {
              const fait = estValideAujourdhui(z.id);
              return (
                <div key={z.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderRadius:'8px', background: fait ? '#eaf3de' : '#f8f7f4', border:'0.5px solid', borderColor: fait ? '#97c459' : '#e2e0d8' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <div style={{ width:'20px', height:'20px', borderRadius:'50%', background: fait ? '#639922' : '#d3d1c7', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {fait && <i className="ti ti-check" style={{ color:'#fff', fontSize:'11px' }} />}
                    </div>
                    <div><div style={{ fontSize:'13px', fontWeight:'500', color:'#2c2c2a' }}>{z.nom}</div><div style={{ fontSize:'11px', color:'#888780' }}>{z.frequence}</div></div>
                  </div>
                  {!fait && <button onClick={() => validerNettoyage(z.id)} style={{ padding:'6px 12px', borderRadius:'8px', fontSize:'12px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff' }}>Valider</button>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'cuissons' && (
        <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'16px' }}>
            <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase' }}>Cuissons & Refroidissements</div>
            <button onClick={() => setModalCuisson(true)} style={{ padding:'7px 14px', borderRadius:'8px', fontSize:'12px', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff' }}>+ Nouveau relevé</button>
          </div>
          {cuissons.length === 0 ? (
            <div style={{ textAlign:'center', padding:'30px', color:'#888780' }}>Aucun relevé enregistré.</div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
              <thead><tr>{['Produit','Type','Température','Statut','Date'].map(h => <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:'10px', fontWeight:'500', color:'#888780', textTransform:'uppercase', borderBottom:'0.5px solid #e2e0d8' }}>{h}</th>)}</tr></thead>
              <tbody>
                {cuissons.map(c => (
                  <tr key={c.id} style={{ borderBottom:'0.5px solid #f1efe8' }}>
                    <td style={{ padding:'10px 12px', fontWeight:'500', color:'#2c2c2a' }}>{c.produit_nom}</td>
                    <td style={{ padding:'10px 12px', color:'#5f5e5a' }}>{c.type === 'cuisson' ? 'Cuisson' : c.type === 'refroidissement' ? 'Refroidissement' : 'Remise en température'}</td>
                    <td style={{ padding:'10px 12px', fontFamily:'monospace' }}>{c.temperature}°C</td>
                    <td style={{ padding:'10px 12px' }}>
                      <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'8px', fontWeight:'500', background: c.conforme ? '#eaf3de' : '#fcebeb', color: c.conforme ? '#27500a' : '#a32d2d' }}>{c.conforme ? 'Conforme' : 'Non conforme'}</span>
                    </td>
                    <td style={{ padding:'10px 12px', color:'#888780', fontSize:'12px' }}>{new Date(c.date_releve).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'tracabilite' && (
        <div>
          {lotsRappeles.length > 0 && (
            <div style={{ background:'#fcebeb', borderRadius:'10px', padding:'12px 16px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'10px' }}>
              <i className="ti ti-alert-triangle" style={{ color:'#a32d2d', fontSize:'18px' }} />
              <div style={{ fontSize:'13px', color:'#791f1f' }}><strong>{lotsRappeles.length} lot(s) rappelé(s)</strong> — {lotsRappeles.map(l => l.numero_lot).join(', ')}</div>
            </div>
          )}
          <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'16px' }}>
              <input value={searchLot} onChange={e => setSearchLot(e.target.value)} placeholder="Rechercher un lot..." style={{ width:'280px', padding:'9px 12px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'13px', outline:'none' }} />
              <button onClick={() => setModalLot(true)} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'13px', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff' }}>+ Nouveau lot</button>
            </div>
            {lotsFiltres.length === 0 ? (
              <div style={{ textAlign:'center', padding:'30px', color:'#888780' }}>Aucun lot enregistré.</div>
            ) : (
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
                <thead><tr>{['N° Lot','Produit','Production liée','Date','Statut',''].map(h => <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:'10px', fontWeight:'500', color:'#888780', textTransform:'uppercase', borderBottom:'0.5px solid #e2e0d8' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {lotsFiltres.map(l => (
                    <tr key={l.id} style={{ borderBottom:'0.5px solid #f1efe8', background: l.rappele ? '#fff8f8' : '#fff' }}>
                      <td style={{ padding:'10px 12px', fontFamily:'monospace', fontWeight:'500', color:'#2c2c2a' }}>{l.numero_lot}</td>
                      <td style={{ padding:'10px 12px', color:'#5f5e5a' }}>{l.produits?.nom || l.produit_nom || '—'}</td>
                      <td style={{ padding:'10px 12px', color:'#888780' }}>{l.recettes?.nom || '—'}</td>
                      <td style={{ padding:'10px 12px', color:'#888780', fontSize:'12px' }}>{l.date_production ? new Date(l.date_production).toLocaleDateString('fr-FR') : '—'}</td>
                      <td style={{ padding:'10px 12px' }}>
                        <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'8px', fontWeight:'500', background: l.rappele ? '#fcebeb' : '#eaf3de', color: l.rappele ? '#a32d2d' : '#27500a' }}>{l.rappele ? 'Rappelé' : 'OK'}</span>
                      </td>
                      <td style={{ padding:'10px 12px', textAlign:'right' }}>
                        <button onClick={() => basculerRappel(l.id, l.rappele)} style={{ padding:'4px 10px', borderRadius:'6px', fontSize:'11px', cursor:'pointer', border:'0.5px solid #d3d1c7', background:'#fff', color:'#5f5e5a' }}>{l.rappele ? 'Annuler rappel' : 'Marquer rappelé'}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === 'reception' && (
        <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'16px' }}>
            <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase' }}>Réceptions marchandises</div>
            <button onClick={() => setModalReception(true)} style={{ padding:'7px 14px', borderRadius:'8px', fontSize:'12px', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff' }}>+ Nouvelle réception</button>
          </div>
          {receptions.length === 0 ? (
            <div style={{ textAlign:'center', padding:'30px', color:'#888780' }}>Aucune réception enregistrée.</div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
              <thead><tr>{['Fournisseur','Date','Temp. camion','Emballage','DLC','Statut'].map(h => <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontSize:'10px', fontWeight:'500', color:'#888780', textTransform:'uppercase', borderBottom:'0.5px solid #e2e0d8' }}>{h}</th>)}</tr></thead>
              <tbody>
                {receptions.map(r => (
                  <tr key={r.id} style={{ borderBottom:'0.5px solid #f1efe8' }}>
                    <td style={{ padding:'10px 12px', fontWeight:'500', color:'#2c2c2a' }}>{r.fournisseurs?.nom || '—'}</td>
                    <td style={{ padding:'10px 12px', color:'#888780', fontSize:'12px' }}>{new Date(r.date_reception).toLocaleDateString('fr-FR')}</td>
                    <td style={{ padding:'10px 12px', fontFamily:'monospace' }}>{r.temperature_camion ? r.temperature_camion+'°C' : '—'}</td>
                    <td style={{ padding:'10px 12px' }}>{r.emballage_ok ? <i className="ti ti-check" style={{ color:'#27500a' }} /> : <i className="ti ti-x" style={{ color:'#a32d2d' }} />}</td>
                    <td style={{ padding:'10px 12px' }}>{r.dlc_ok ? <i className="ti ti-check" style={{ color:'#27500a' }} /> : <i className="ti ti-x" style={{ color:'#a32d2d' }} />}</td>
                    <td style={{ padding:'10px 12px' }}><span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'8px', fontWeight:'500', background: r.conforme ? '#eaf3de' : '#fcebeb', color: r.conforme ? '#27500a' : '#a32d2d' }}>{r.conforme ? 'Conforme' : 'Non conforme'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'pms' && (
        <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'16px' }}>
            <div style={{ fontSize:'13px', fontWeight:'500', color:'#888780', textTransform:'uppercase' }}>Plan de Maîtrise Sanitaire — Documents</div>
            <button onClick={() => setModalDoc(true)} style={{ padding:'7px 14px', borderRadius:'8px', fontSize:'12px', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff' }}>+ Ajouter un document</button>
          </div>
          {documents.length === 0 ? (
            <div style={{ textAlign:'center', padding:'30px', color:'#888780' }}>Aucun document enregistré.</div>
          ) : documents.map(d => (
            <div key={d.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', borderRadius:'8px', background: estExpire(d.date_expiration) ? '#fcebeb' : '#f8f7f4', marginBottom:'8px' }}>
              <div>
                <div style={{ fontSize:'13px', fontWeight:'500', color:'#2c2c2a' }}>{d.nom}</div>
                <div style={{ fontSize:'11px', color:'#888780' }}>{d.categorie || 'Sans catégorie'}{d.date_expiration ? ' — Expire le ' + new Date(d.date_expiration).toLocaleDateString('fr-FR') : ''}</div>
              </div>
              {estExpire(d.date_expiration) && <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'8px', background:'#a32d2d', color:'#fff', fontWeight:'500' }}>Expiré</span>}
            </div>
          ))}
        </div>
      )}

      {modalTemp && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
          <div style={{ background:'#fff', borderRadius:'16px', padding:'24px', width:'100%', maxWidth:'360px' }}>
            <div style={{ fontSize:'17px', fontWeight:'500', marginBottom:'4px' }}>{modalTemp.nom}</div>
            <div style={{ fontSize:'13px', color:'#888780', marginBottom:'16px' }}>Plage : {modalTemp.temp_min}°C → {modalTemp.temp_max}°C</div>
            <input value={tempVal} onChange={e => setTempVal(e.target.value)} type="number" step="0.1" placeholder="Température (°C)" style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'16px', textAlign:'center', fontFamily:'monospace' }} autoFocus />
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'8px', marginTop:'16px' }}>
              <button onClick={() => setModalTemp(null)} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', cursor:'pointer', border:'0.5px solid #d3d1c7', background:'#fff' }}>Annuler</button>
              <button onClick={validerTemperature} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff' }}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {modalCuisson && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
          <div style={{ background:'#fff', borderRadius:'16px', padding:'24px', width:'100%', maxWidth:'400px' }}>
            <div style={{ fontSize:'17px', fontWeight:'500', marginBottom:'16px' }}>Nouveau relevé</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <input placeholder="Nom du produit" value={formCuisson.produit_nom} onChange={e => setFormCuisson({...formCuisson, produit_nom:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px' }} />
              <select value={formCuisson.type} onChange={e => setFormCuisson({...formCuisson, type:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', background:'#fff' }}>
                <option value="cuisson">Cuisson (min 63°C)</option>
                <option value="refroidissement">Refroidissement rapide (max 10°C)</option>
                <option value="remise">Remise en température (min 63°C)</option>
              </select>
              <input placeholder="Température relevée (°C)" type="number" step="0.1" value={formCuisson.temperature} onChange={e => setFormCuisson({...formCuisson, temperature:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px' }} />
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'8px', marginTop:'16px' }}>
              <button onClick={() => setModalCuisson(false)} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', cursor:'pointer', border:'0.5px solid #d3d1c7', background:'#fff' }}>Annuler</button>
              <button onClick={enregistrerCuisson} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff' }}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {modalLot && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
          <div style={{ background:'#fff', borderRadius:'16px', padding:'24px', width:'100%', maxWidth:'420px' }}>
            <div style={{ fontSize:'17px', fontWeight:'500', marginBottom:'4px' }}>Nouveau lot</div>
            <div style={{ fontSize:'13px', color:'#888780', marginBottom:'16px' }}>Le numéro de lot sera généré automatiquement si laissé vide.</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <input placeholder="N° de lot (optionnel — auto-généré sinon)" value={formLot.numero_lot} onChange={e => setFormLot({...formLot, numero_lot:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px' }} />
              <select value={formLot.produit_id} onChange={e => setFormLot({...formLot, produit_id:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', background:'#fff' }}>
                <option value="">Sélectionner un produit de la mercuriale</option>
                {produits.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
              </select>
              <input placeholder="Ou saisir un nom libre" value={formLot.produit_nom} onChange={e => setFormLot({...formLot, produit_nom:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px' }} />
              <select value={formLot.recette_id} onChange={e => setFormLot({...formLot, recette_id:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', background:'#fff' }}>
                <option value="">Lier à une production (optionnel)</option>
                {recettes.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
              </select>
              <input type="date" value={formLot.date_production} onChange={e => setFormLot({...formLot, date_production:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px' }} />
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'8px', marginTop:'16px' }}>
              <button onClick={() => setModalLot(false)} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', cursor:'pointer', border:'0.5px solid #d3d1c7', background:'#fff' }}>Annuler</button>
              <button onClick={creerLot} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff' }}>Créer le lot</button>
            </div>
          </div>
        </div>
      )}

      {modalReception && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
          <div style={{ background:'#fff', borderRadius:'16px', padding:'24px', width:'100%', maxWidth:'400px' }}>
            <div style={{ fontSize:'17px', fontWeight:'500', marginBottom:'16px' }}>Nouvelle réception</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <select value={formReception.fournisseur_id} onChange={e => setFormReception({...formReception, fournisseur_id:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', background:'#fff' }}>
                <option value="">Sélectionner un fournisseur</option>
                {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </select>
              <input placeholder="Température du camion (°C)" type="number" step="0.1" value={formReception.temperature_camion} onChange={e => setFormReception({...formReception, temperature_camion:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px' }} />
              <label style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', color:'#5f5e5a' }}>
                <input type="checkbox" checked={formReception.emballage_ok} onChange={e => setFormReception({...formReception, emballage_ok:e.target.checked})} /> Emballage conforme
              </label>
              <label style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', color:'#5f5e5a' }}>
                <input type="checkbox" checked={formReception.dlc_ok} onChange={e => setFormReception({...formReception, dlc_ok:e.target.checked})} /> DLC conforme
              </label>
              <input placeholder="Commentaire (optionnel)" value={formReception.commentaire} onChange={e => setFormReception({...formReception, commentaire:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px' }} />
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'8px', marginTop:'16px' }}>
              <button onClick={() => setModalReception(false)} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', cursor:'pointer', border:'0.5px solid #d3d1c7', background:'#fff' }}>Annuler</button>
              <button onClick={enregistrerReception} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff' }}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {modalDoc && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
          <div style={{ background:'#fff', borderRadius:'16px', padding:'24px', width:'100%', maxWidth:'400px' }}>
            <div style={{ fontSize:'17px', fontWeight:'500', marginBottom:'16px' }}>Nouveau document</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <input placeholder="Nom du document" value={formDoc.nom} onChange={e => setFormDoc({...formDoc, nom:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px' }} />
              <input placeholder="Catégorie" value={formDoc.categorie} onChange={e => setFormDoc({...formDoc, categorie:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px' }} />
              <input type="date" placeholder="Date d'expiration" value={formDoc.date_expiration} onChange={e => setFormDoc({...formDoc, date_expiration:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px' }} />
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'8px', marginTop:'16px' }}>
              <button onClick={() => setModalDoc(false)} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', cursor:'pointer', border:'0.5px solid #d3d1c7', background:'#fff' }}>Annuler</button>
              <button onClick={ajouterDocument} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff' }}>Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

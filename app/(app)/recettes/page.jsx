'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export default function Recettes() {
  const [recettes, setRecettes] = useState([]);
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({ nom:'', categorie:'', portions:4, temps_prep:'', temps_cuisson:'', prix_vente:'', tva:10 });
  const [ingredients, setIngredients] = useState([{ produit_id:'', quantite:'', unite:'kg' }]);

  useEffect(() => { chargerDonnees(); }, []);

  async function chargerDonnees() {
    setLoading(true);
    const { data: rec } = await supabase.from('recettes').select('*');
    const { data: prod } = await supabase.from('produits').select('*');
    const { data: ings } = await supabase.from('recette_ingredients').select('*, produits(nom, prix_ht)');

    const recettesAvecCout = (rec || []).map(r => {
      const ingsRecette = (ings || []).filter(i => i.recette_id === r.id);
      const coutTotal = ingsRecette.reduce((s, i) => s + (i.quantite * (i.produits?.prix_ht || 0)), 0);
      const coutPortion = r.portions > 0 ? coutTotal / r.portions : coutTotal;
      return { ...r, ingredients: ingsRecette, cout_portion: coutPortion };
    });

    setRecettes(recettesAvecCout);
    setProduits(prod || []);
    setLoading(false);
  }

  function ajouterLigneIngredient() {
    setIngredients([...ingredients, { produit_id:'', quantite:'', unite:'kg' }]);
  }

  function majIngredient(idx, champ, val) {
    const copie = [...ingredients];
    copie[idx][champ] = val;
    setIngredients(copie);
  }

  function supprimerLigneIngredient(idx) {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  }

  async function creerRecette() {
    if (!form.nom) { alert('Le nom est obligatoire'); return; }
    const { data: nouvelleRecette, error } = await supabase.from('recettes').insert([{
      nom: form.nom,
      categorie: form.categorie,
      portions: parseInt(form.portions) || 1,
      temps_prep: form.temps_prep,
      temps_cuisson: form.temps_cuisson,
      prix_vente: parseFloat(form.prix_vente) || 0,
      tva: parseFloat(form.tva) || 10,
    }]).select().single();

    if (error) { alert('Erreur : ' + error.message); return; }

    const lignesValides = ingredients.filter(i => i.produit_id && i.quantite);
    if (lignesValides.length > 0) {
      const lignesAInserer = lignesValides.map(i => ({
        recette_id: nouvelleRecette.id,
        produit_id: i.produit_id,
        quantite: parseFloat(i.quantite),
        unite: i.unite,
      }));
      await supabase.from('recette_ingredients').insert(lignesAInserer);
    }

    setModal(false);
    setForm({ nom:'', categorie:'', portions:4, temps_prep:'', temps_cuisson:'', prix_vente:'', tva:10 });
    setIngredients([{ produit_id:'', quantite:'', unite:'kg' }]);
    chargerDonnees();
  }

  async function supprimerRecette(id) {
    if (!confirm('Supprimer cette recette ?')) return;
    await supabase.from('recette_ingredients').delete().eq('recette_id', id);
    await supabase.from('recettes').delete().eq('id', id);
    chargerDonnees();
  }

  const filtered = recettes.filter(r => !search || r.nom.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'16px 24px', marginBottom:'16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:'18px', fontWeight:'500', color:'#2c2c2a' }}>Fiches recettes</div>
        <button onClick={() => setModal(true)} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff', display:'flex', alignItems:'center', gap:'6px' }}>
          <i className="ti ti-plus" /> Nouvelle recette
        </button>
      </div>

      <div style={{ background:'#fff', borderRadius:'12px', border:'0.5px solid #e2e0d8', padding:'20px' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une recette..." style={{ width:'100%', marginBottom:'16px', padding:'9px 12px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'13px', outline:'none' }} />

        {loading ? (
          <div style={{ textAlign:'center', padding:'30px', color:'#888780' }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'30px', color:'#888780' }}>Aucune recette. Cliquez sur "Nouvelle recette".</div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
            <thead>
              <tr>
                {['Nom','Catégorie','Portions','Coût/portion','Prix vente','Marge',''].map(h => (
                  <th key={h} style={{ padding:'8px 12px', textAlign: ['Coût/portion','Prix vente','Marge'].includes(h) ? 'right' : 'left', fontSize:'10px', fontWeight:'500', color:'#888780', textTransform:'uppercase', borderBottom:'0.5px solid #e2e0d8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const pvht = r.prix_vente / (1 + (r.tva/100));
                const marge = pvht > 0 ? ((pvht - r.cout_portion) / pvht * 100) : 0;
                return (
                  <tr key={r.id} style={{ borderBottom:'0.5px solid #f1efe8' }}>
                    <td style={{ padding:'10px 12px', fontWeight:'500', color:'#2c2c2a' }}>{r.nom}</td>
                    <td style={{ padding:'10px 12px' }}>
                      {r.categorie && <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'8px', background:'#eeedfe', color:'#3c3489', fontWeight:'500' }}>{r.categorie}</span>}
                    </td>
                    <td style={{ padding:'10px 12px', color:'#5f5e5a' }}>{r.portions} pers.</td>
                    <td style={{ padding:'10px 12px', textAlign:'right', fontFamily:'monospace', color:'#2c2c2a' }}>{r.cout_portion.toFixed(2)} €</td>
                    <td style={{ padding:'10px 12px', textAlign:'right', fontFamily:'monospace', color:'#2c2c2a' }}>{parseFloat(r.prix_vente).toFixed(2)} €</td>
                    <td style={{ padding:'10px 12px', textAlign:'right' }}>
                      <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'8px', fontWeight:'500', background: marge >= 70 ? '#eaf3de' : marge >= 50 ? '#faeeda' : '#fcebeb', color: marge >= 70 ? '#27500a' : marge >= 50 ? '#854f0b' : '#a32d2d' }}>{marge.toFixed(1)}%</span>
                    </td>
                    <td style={{ padding:'10px 12px', textAlign:'right' }}>
                      <button onClick={() => supprimerRecette(r.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#888780', fontSize:'15px' }}><i className="ti ti-trash" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:'20px' }}>
          <div style={{ background:'#fff', borderRadius:'16px', padding:'24px', width:'100%', maxWidth:'560px', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ fontSize:'17px', fontWeight:'500', color:'#2c2c2a', marginBottom:'16px' }}>Nouvelle recette</div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px' }}>
              <input placeholder="Nom de la recette *" value={form.nom} onChange={e => setForm({...form, nom:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none', gridColumn:'1 / -1' }} />
              <select value={form.categorie} onChange={e => setForm({...form, categorie:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', background:'#fff' }}>
                <option value="">Catégorie</option>
                <option>Entrées</option><option>Plats</option><option>Desserts</option>
              </select>
              <input placeholder="Portions" type="number" value={form.portions} onChange={e => setForm({...form, portions:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none' }} />
              <input placeholder="Temps préparation" value={form.temps_prep} onChange={e => setForm({...form, temps_prep:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none' }} />
              <input placeholder="Temps cuisson" value={form.temps_cuisson} onChange={e => setForm({...form, temps_cuisson:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none' }} />
              <input placeholder="Prix de vente TTC *" type="number" step="0.01" value={form.prix_vente} onChange={e => setForm({...form, prix_vente:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none' }} />
              <input placeholder="TVA %" type="number" value={form.tva} onChange={e => setForm({...form, tva:e.target.value})} style={{ padding:'10px 14px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'14px', outline:'none' }} />
            </div>

            <div style={{ fontSize:'12px', fontWeight:'500', color:'#5f5e5a', marginBottom:'8px' }}>Ingrédients (depuis la mercuriale)</div>
            {ingredients.map((ing, idx) => (
              <div key={idx} style={{ display:'flex', gap:'8px', marginBottom:'8px', alignItems:'center' }}>
                <select value={ing.produit_id} onChange={e => majIngredient(idx, 'produit_id', e.target.value)} style={{ flex:2, padding:'8px 10px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'13px', background:'#fff' }}>
                  <option value="">Sélectionner un produit...</option>
                  {produits.map(p => <option key={p.id} value={p.id}>{p.nom} ({parseFloat(p.prix_ht).toFixed(2)} €/kg)</option>)}
                </select>
                <input placeholder="Qté (kg)" type="number" step="0.001" value={ing.quantite} onChange={e => majIngredient(idx, 'quantite', e.target.value)} style={{ width:'90px', padding:'8px 10px', borderRadius:'8px', border:'0.5px solid #d3d1c7', fontSize:'13px', outline:'none' }} />
                <button onClick={() => supprimerLigneIngredient(idx)} style={{ background:'none', border:'none', cursor:'pointer', color:'#888780', fontSize:'15px' }}><i className="ti ti-x" /></button>
              </div>
            ))}
            <button onClick={ajouterLigneIngredient} style={{ fontSize:'12px', color:'#534ab7', background:'none', border:'none', cursor:'pointer', fontWeight:'500', marginBottom:'16px', display:'flex', alignItems:'center', gap:'4px' }}>
              <i className="ti ti-plus" /> Ajouter un ingrédient
            </button>

            <div style={{ display:'flex', justifyContent:'flex-end', gap:'8px' }}>
              <button onClick={() => setModal(false)} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'0.5px solid #d3d1c7', background:'#fff', color:'#5f5e5a' }}>Annuler</button>
              <button onClick={creerRecette} style={{ padding:'9px 16px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', border:'none', background:'#534ab7', color:'#fff' }}>Créer la recette</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

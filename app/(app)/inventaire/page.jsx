'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { getEtablissementActif } from '../../../lib/etablissement'

function fmt(n, d = 2) {
  return Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d })
}

function evalExpr(str) {
  try {
    const clean = (str || '').replace(/,/g, '.').replace(/[^0-9.+\-*/()]/g, '')
    if (!clean) return 0
    // eslint-disable-next-line no-new-func
    return Math.max(0, Function('"use strict"; return (' + clean + ')')())
  } catch (e) { return 0 }
}

function Toast({ message, type }) {
  if (!message) return null
  return <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: type === 'err' ? '#a32d2d' : '#27500a', color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: 13, zIndex: 9999, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>{message}</div>
}

function ChampPoidsEditable({ value, expr, contSel, contenants, onChange }) {
  const [local, setLocal] = useState(value === 0 ? '0,000' : fmt(value, 3))
  const [focus, setFocus] = useState(false)

  useEffect(() => {
    if (!focus) setLocal(value === 0 ? '0,000' : fmt(value, 3))
  }, [value, focus])

  const calcConts = (sel) => Object.keys(sel || {}).reduce((s, cid) => {
    const c = (contenants || []).find(x => x.id === cid)
    return s + (c ? Number(c.poids_vide) * ((sel || {})[cid] || 0) : 0)
  }, 0)

  return (
    <input type="text" inputMode="decimal" value={local}
      onFocus={() => { setFocus(true); setLocal(expr && expr !== '' ? expr : value === 0 ? '' : String(value)) }}
      onBlur={() => {
        setFocus(false)
        const brut = evalExpr(local)
        const net = Math.max(0, brut - calcConts(contSel))
        onChange(net, local)
        setLocal(net === 0 ? '0,000' : fmt(net, 3))
      }}
      onChange={e => setLocal(e.target.value)}
      style={{ width: 100, padding: '3px 6px', borderRadius: 6, border: '0.5px solid #534ab7', fontSize: 12, textAlign: 'right', outline: 'none', background: '#f0effe', color: '#2c2c2a', fontFamily: 'monospace' }}
    />
  )
}

export default function InventairePage() {
  const etabId = getEtablissementActif()
  const clé = `fimc_inventaire_${etabId}`

  const sauvegarderLocal = useCallback((merc, rec, autre, date) => {
    try { localStorage.setItem(clé, JSON.stringify({ merc, rec, autre, date, ts: Date.now() })) } catch (e) {}
  }, [clé])
  const lireLocal = useCallback(() => {
    try { const d = localStorage.getItem(clé); return d ? JSON.parse(d) : null } catch (e) { return null }
  }, [clé])

  const local = lireLocal()
  const today = new Date().toISOString().split('T')[0]

  const [tab, setTab] = useState('saisie')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({ message: '', type: 'ok' })

  const [produits, setProduits] = useState([])
  const [recettes, setRecettes] = useState([])
  const [contenants, setContenants] = useState([])
  const [historique, setHistorique] = useState([])
  const [historiqueDetail, setHistoriqueDetail] = useState(null)
  const [equipe, setEquipe] = useState([])
  const [nomEtablissement, setNomEtablissement] = useState('')

  const [search, setSearch] = useState('')
  const [showSugg, setShowSugg] = useState(false)
  const [selectionne, setSelectionne] = useState(null)
  const [poidsExpr, setPoidsExpr] = useState('')
  const [contSel, setContSel] = useState({})
  const [nouveauProduit, setNouveauProduit] = useState(null)

  const [dateInventaire, setDateInventaire] = useState(local?.date || today)
  const [lignesMerc, setLignesMerc] = useState(local?.merc || [])
  const [lignesRec, setLignesRec] = useState(local?.rec || [])
  const [lignesAutre, setLignesAutre] = useState(local?.autre || [])

  const [modalHors, setModalHors] = useState(false)
  const [formHors, setFormHors] = useState({ nom: '', prix: '' })
  const [modalContenant, setModalContenant] = useState(false)
  const [formContenant, setFormContenant] = useState({ nom: '', poids_vide: '' })
  const [modalEditContenant, setModalEditContenant] = useState(null)

  const [modalStep, setModalStep] = useState(null)
  const [mailDest, setMailDest] = useState('')
  const [mailMembreId, setMailMembreId] = useState('')
  const [mailEnvoye, setMailEnvoye] = useState(false)

  const showToast = useCallback((msg, type = 'ok') => {
    setToast({ message: msg, type })
    setTimeout(() => setToast({ message: '', type: 'ok' }), 3000)
  }, [])

  useEffect(() => { if (etabId) chargerDonnees() }, [etabId])

  const chargerDonnees = async () => {
    setLoading(true)
    try {
      const [{ data: prods, error: eP }, { data: recs, error: eR }, { data: conts }, { data: histo }, { data: membres }] = await Promise.all([
        supabase.from('produits').select('id, nom, prix_ht, fournisseurs(nom)').eq('etablissement_id', etabId).eq('actif', true).order('nom'),
        supabase.from('recettes').select('id, nom').eq('etablissement_id', etabId).order('nom'),
        supabase.from('contenants').select('*').order('nom'),
        supabase.from('inventaires').select('*').eq('etablissement_id', etabId).order('date_inventaire', { ascending: false }),
        supabase.from('equipe').select('id, nom, email').eq('etablissement_id', etabId).order('nom')
      ])
      if (eP) console.error('Erreur produits:', eP)
      if (eR) console.error('Erreur recettes:', eR)

      // Nom établissement
      const { data: etab } = await supabase.from('etablissements').select('nom').eq('id', etabId).single()
      setNomEtablissement(etab?.nom || 'FIMC')

      const recsData = recs || []
      if (recsData.length) {
        const [{ data: ings }, { data: prodsAll }] = await Promise.all([
          supabase.from('recette_ingredients').select('recette_id, poids, produit_id').in('recette_id', recsData.map(r => r.id)),
          supabase.from('produits').select('id, prix_ht').eq('etablissement_id', etabId)
        ])
        setRecettes(recsData.map(r => ({
          ...r,
          recette_ingredients: (ings || []).filter(i => i.recette_id === r.id)
            .map(i => ({ ...i, produits: (prodsAll || []).find(p => p.id === i.produit_id) || null }))
        })))
      } else { setRecettes([]) }

      setProduits(prods || [])
      setContenants(conts || [])
      setHistorique(histo || [])
      setEquipe(membres || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const calcCoutKgRecette = (ings) => {
    const valides = (ings || []).filter(i => i.produit_id && i.produits)
    const poids = valides.reduce((s, i) => s + Number(i.poids || 0), 0)
    const cout = valides.reduce((s, i) => s + Number(i.poids || 0) * Number(i.produits?.prix_ht || 0), 0)
    return poids > 0 ? cout / poids : 0
  }

  const tous = [
    ...produits.map(p => ({ id: p.id, nom: p.nom, prix: Number(p.prix_ht || 0), fourn: p.fournisseurs?.nom || '', cat: 'merc' })),
    ...recettes.map(r => ({ id: r.id, nom: r.nom, prix: calcCoutKgRecette(r.recette_ingredients), fourn: '', cat: 'rec' })),
    ...lignesAutre.map(l => ({ id: l.id, nom: l.nom, prix: l.prix, fourn: '', cat: 'autre', existant: true }))
  ]

  const suggestions = search.length >= 1 ? tous.filter(p => p.nom.toLowerCase().includes(search.toLowerCase())) : []
  const aucunResultat = search.length >= 2 && suggestions.length === 0

  const getLigneExistante = (p) => {
    if (!p) return null
    if (p.cat === 'merc') return lignesMerc.find(l => l.produit_id === p.id)
    if (p.cat === 'rec') return lignesRec.find(l => l.recette_id === p.id)
    if (p.cat === 'autre' || p.cat === 'nouveau') return lignesAutre.find(l => l.id === p.id)
    return null
  }

  const selectionner = (p) => {
    setSelectionne(p); setNouveauProduit(null); setSearch(p.nom); setShowSugg(false)
    const exist = getLigneExistante(p)
    if (exist) { setPoidsExpr((exist.expr_brut || String(exist.poids_net)) + '+'); setContSel(exist.cont_sel || {}) }
    else { setPoidsExpr(''); setContSel({}) }
  }

  const initNouveauProduit = (nom) => {
    const p = { id: 'nouveau_' + Date.now(), nom, prix: 0, fourn: '', cat: 'nouveau' }
    setNouveauProduit({ ...p, prixInput: '' }); setSelectionne(p)
    setSearch(nom); setShowSugg(false); setPoidsExpr(''); setContSel({})
  }

  const getPoidsConts = () => Object.keys(contSel).reduce((s, cid) => {
    const c = contenants.find(x => x.id === cid)
    return s + (c ? Number(c.poids_vide) * (contSel[cid] || 0) : 0)
  }, 0)

  const brutTotal = evalExpr(poidsExpr)
  const poidsConts = getPoidsConts()
  const netTotal = Math.max(0, brutTotal - poidsConts)
  const ligneExist = getLigneExistante(selectionne)
  const prixSel = selectionne?.cat === 'nouveau' ? (parseFloat(nouveauProduit?.prixInput) || 0) : (selectionne?.prix || 0)

  const valider = () => {
    if (!selectionne || !poidsExpr || brutTotal === 0) return
    const contLabel = Object.keys(contSel).map(cid => {
      const c = contenants.find(x => x.id === cid)
      return c ? contSel[cid] + 'x ' + c.nom : null
    }).filter(Boolean).join(', ')

    const buildLigne = (overrides = {}) => ({
      id: Date.now() + '', produit_id: selectionne.cat === 'merc' ? selectionne.id : null,
      recette_id: selectionne.cat === 'rec' ? selectionne.id : null, nom: selectionne.nom,
      fourn: selectionne.fourn || null, prix: prixSel, poids_net: netTotal, expr_brut: poidsExpr,
      cont_sel: contSel, contenants_detail: contLabel,
      categorie: selectionne.cat === 'nouveau' ? 'autre' : selectionne.cat, ...overrides
    })
    const maj = (l) => ({ ...l, poids_net: netTotal, expr_brut: poidsExpr, cont_sel: contSel, contenants_detail: contLabel, prix: prixSel })

    if (selectionne.cat === 'merc') {
      setLignesMerc(prev => { const ex = prev.find(l => l.produit_id === selectionne.id); const n = ex ? prev.map(l => l.produit_id === selectionne.id ? maj(l) : l) : [...prev, buildLigne()]; sauvegarderLocal(n, lignesRec, lignesAutre, dateInventaire); return n })
    } else if (selectionne.cat === 'rec') {
      setLignesRec(prev => { const ex = prev.find(l => l.recette_id === selectionne.id); const n = ex ? prev.map(l => l.recette_id === selectionne.id ? maj(l) : l) : [...prev, buildLigne()]; sauvegarderLocal(lignesMerc, n, lignesAutre, dateInventaire); return n })
    } else if (selectionne.cat === 'autre') {
      setLignesAutre(prev => { const n = prev.map(l => l.id === selectionne.id ? maj(l) : l); sauvegarderLocal(lignesMerc, lignesRec, n, dateInventaire); return n })
    } else if (selectionne.cat === 'nouveau') {
      setLignesAutre(prev => { const n = [...prev, buildLigne({ id: Date.now() + '' })]; sauvegarderLocal(lignesMerc, lignesRec, n, dateInventaire); return n })
    }
    setSelectionne(null); setNouveauProduit(null); setSearch(''); setPoidsExpr(''); setContSel({})
    showToast(`${selectionne.nom} — ${fmt(netTotal, 3)} kg NET`)
  }

  const modifierPoids = (cat, id, net, expr) => {
    if (cat === 'merc') setLignesMerc(prev => { const n = prev.map(l => l.id === id ? { ...l, poids_net: net, expr_brut: expr } : l); sauvegarderLocal(n, lignesRec, lignesAutre, dateInventaire); return n })
    if (cat === 'rec') setLignesRec(prev => { const n = prev.map(l => l.id === id ? { ...l, poids_net: net, expr_brut: expr } : l); sauvegarderLocal(lignesMerc, n, lignesAutre, dateInventaire); return n })
    if (cat === 'autre') setLignesAutre(prev => { const n = prev.map(l => l.id === id ? { ...l, poids_net: net, expr_brut: expr } : l); sauvegarderLocal(lignesMerc, lignesRec, n, dateInventaire); return n })
  }

  const supprimerLigne = (cat, id) => {
    if (cat === 'merc') setLignesMerc(prev => { const n = prev.filter(l => l.id !== id); sauvegarderLocal(n, lignesRec, lignesAutre, dateInventaire); return n })
    if (cat === 'rec') setLignesRec(prev => { const n = prev.filter(l => l.id !== id); sauvegarderLocal(lignesMerc, n, lignesAutre, dateInventaire); return n })
    if (cat === 'autre') setLignesAutre(prev => { const n = prev.filter(l => l.id !== id); sauvegarderLocal(lignesMerc, lignesRec, n, dateInventaire); return n })
  }

  const ajouterContenant = async () => {
    if (!formContenant.nom || !formContenant.poids_vide) return
    await supabase.from('contenants').insert([{ nom: formContenant.nom, poids_vide: parseFloat(formContenant.poids_vide) }])
    setModalContenant(false); setFormContenant({ nom: '', poids_vide: '' }); chargerDonnees(); showToast('Contenant ajouté !')
  }

  const modifierContenant = async () => {
    if (!modalEditContenant) return
    await supabase.from('contenants').update({ nom: modalEditContenant.nom, poids_vide: parseFloat(modalEditContenant.poids_vide) }).eq('id', modalEditContenant.id)
    setModalEditContenant(null); chargerDonnees(); showToast('Contenant modifié !')
  }

  const supprimerContenant = async (id) => {
    await supabase.from('contenants').delete().eq('id', id); chargerDonnees(); showToast('Contenant supprimé')
  }

  const total = [...lignesMerc, ...lignesRec, ...lignesAutre].reduce((s, l) => s + l.poids_net * l.prix, 0)

  const genererDonneesEmail = () => {
    const toutesLignes = [...lignesMerc, ...lignesRec, ...lignesAutre]
    const byFournisseur = lignesMerc.reduce((acc, l) => {
      if (l.fourn) acc[l.fourn] = (acc[l.fourn] || 0) + l.poids_net * l.prix
      return acc
    }, {})
    return { toutesLignes, byFournisseur }
  }

  const genererCSV = (toutesLignes, dateStr) => {
    let csv = `${nomEtablissement}\n`
    csv += `Inventaire du ${new Date(dateStr).toLocaleDateString('fr-FR')}\n`
    csv += `Valeur totale;${fmt(total)} €\n\n`
    csv += `Produit;Catégorie;Fournisseur;Contenants;Poids net (kg);Prix/kg;Valeur\n`
    toutesLignes.forEach(l => {
      csv += `${l.nom};${l.categorie};${l.fourn || ''};${l.contenants_detail || ''};${fmt(l.poids_net, 3)};${fmt(l.prix)};${fmt(l.poids_net * l.prix)}\n`
    })
    return csv
  }

  const telechargerCSVHistorique = async (invId) => {
    const { data: lignes } = await supabase.from('inventaire_lignes').select('*').eq('inventaire_id', invId)
    const inv = historique.find(h => h.id === invId)
    if (!lignes || !inv) return
    const dateStr = inv.date_inventaire
    let csv = `${nomEtablissement}\n`
    csv += `Inventaire du ${new Date(dateStr).toLocaleDateString('fr-FR')}\n`
    csv += `Valeur totale;${fmt(inv.valeur_totale)} €\n\n`
    csv += `Produit;Catégorie;Poids net (kg);Prix/kg;Valeur\n`
    lignes.forEach(l => { csv += `${l.nom};${l.categorie};${fmt(l.poids_net, 3)};${fmt(l.prix)};${fmt(l.poids_net * l.prix)}\n` })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `inventaire_${dateStr}.csv`; a.click(); URL.revokeObjectURL(url)
    showToast('CSV téléchargé !')
  }

  const envoyerParMail = async () => {
    const dest = mailMembreId ? equipe.find(m => m.id === mailMembreId)?.email : mailDest
    if (!dest) { showToast('Entrez un email', 'err'); return }
    const { toutesLignes, byFournisseur } = genererDonneesEmail()
    const csv = genererCSV(toutesLignes, dateInventaire || today)
    try {
      const res = await fetch('/api/envoyer-inventaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: dest, date: dateInventaire || today, csv, total: fmt(total), byFournisseur, lignes: toutesLignes, nomEtablissement })
      })
      if (res.ok) { showToast(`Envoyé à ${dest} !`); setMailEnvoye(true) }
      else { showToast('Erreur envoi mail', 'err') }
    } catch (e) { showToast('Erreur réseau', 'err') }
  }

  const archiver = async () => {
    const toutesLignes = [...lignesMerc, ...lignesRec, ...lignesAutre]
    if (!toutesLignes.length) { showToast('Aucun produit saisi', 'err'); return }
    try {
      const { data: inv, error } = await supabase.from('inventaires').insert([{
        date_inventaire: dateInventaire || today, statut: 'archive',
        valeur_totale: total, archive_par: 'FIMC', etablissement_id: etabId
      }]).select().single()
      if (error) throw error
      await supabase.from('inventaire_lignes').insert(toutesLignes.map(l => ({
        inventaire_id: inv.id, produit_id: l.produit_id, recette_id: l.recette_id,
        nom: l.nom, poids_net: l.poids_net, prix: l.prix, contenants_detail: l.contenants_detail, categorie: l.categorie
      })))
      setLignesMerc([]); setLignesRec([]); setLignesAutre([])
      sauvegarderLocal([], [], [], today); setDateInventaire(today)
      chargerDonnees(); setModalStep(null)
      showToast(`Inventaire du ${new Date(dateInventaire).toLocaleDateString('fr-FR')} archivé !`)
    } catch (err) { showToast('Erreur : ' + err.message, 'err') }
  }

  const voirDetail = async (invId) => {
    const { data: lignes } = await supabase.from('inventaire_lignes').select('*').eq('inventaire_id', invId)
    const inv = historique.find(h => h.id === invId)
    setHistoriqueDetail({ inv, lignes: lignes || [] })
  }

  const byFourn = lignesMerc.reduce((acc, l) => {
    if (l.fourn) acc[l.fourn] = (acc[l.fourn] || 0) + l.poids_net * l.prix
    return acc
  }, {})

  const card = { background: '#fff', borderRadius: 12, border: '0.5px solid #e2e0d8', padding: 16 }
  const inp = { padding: '7px 10px', borderRadius: 8, border: '0.5px solid #d3d1c7', fontSize: 13, color: '#2c2c2a', background: '#fff', outline: 'none', width: '100%' }
  const btn = { padding: '7px 13px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '0.5px solid #d3d1c7', background: '#fff', color: '#5f5e5a', display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }
  const btnP = { ...btn, background: '#534ab7', color: '#fff', border: 'none' }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#888780', fontSize: 14 }}>Chargement…</div>

  return (
    <div style={{ background: '#f8f7f4', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', padding: 16 }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 500, color: '#2c2c2a' }}>Inventaire</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 12, color: '#888780' }}>Date de l'inventaire :</span>
            <input type="date" value={dateInventaire}
              onChange={e => { setDateInventaire(e.target.value); sauvegarderLocal(lignesMerc, lignesRec, lignesAutre, e.target.value) }}
              style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6, border: '0.5px solid #d3d1c7', color: '#2c2c2a', outline: 'none', background: '#fff' }} />
          </div>
        </div>
        <button onClick={() => { setModalStep('confirm'); setMailDest(''); setMailMembreId(''); setMailEnvoye(false) }}
          style={{ ...btnP, padding: '9px 16px', fontSize: 14 }}>
          📦 Archiver l'inventaire
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[{ id: 'saisie', label: '📋 Saisie' }, { id: 'contenants', label: '🪣 Contenants' }, { id: 'historique', label: '🕐 Historique' }].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setHistoriqueDetail(null) }}
            style={{ ...btn, ...(tab === t.id ? { background: '#534ab7', color: '#fff', border: 'none' } : {}) }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'saisie' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            <div style={{ background: '#534ab7', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, color: '#cecbf6', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Rechercher un produit, recette ou hors mercuriale</div>
              <div style={{ position: 'relative' }}>
                <input value={search} onChange={e => { setSearch(e.target.value); setShowSugg(true) }}
                  onFocus={() => search && setShowSugg(true)}
                  placeholder="Nom du produit, recette ou hors mercuriale…"
                  style={{ ...inp, background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)', color: '#fff', fontSize: 14 }}
                  autoComplete="off" />
                {showSugg && (suggestions.length > 0 || aucunResultat) && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 50, marginTop: 6, maxHeight: 280, overflowY: 'auto' }}>
                    {['merc', 'rec', 'autre'].map(cat => {
                      const items = suggestions.filter(s => s.cat === cat)
                      if (!items.length) return null
                      const labels = { merc: 'Mercuriale', rec: 'Recettes', autre: 'Hors mercuriale' }
                      const colors = { merc: { bg: '#eeedfe', c: '#3c3489' }, rec: { bg: '#eaf3de', c: '#27500a' }, autre: { bg: '#faeeda', c: '#854f0b' } }
                      return (
                        <div key={cat}>
                          <div style={{ padding: '4px 10px', fontSize: 10, fontWeight: 500, color: '#888780', textTransform: 'uppercase', background: '#f8f7f4' }}>{labels[cat]}</div>
                          {items.map(p => (
                            <div key={p.id} onClick={() => selectionner(p)}
                              style={{ padding: '9px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '0.5px solid #f1efe8' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#f8f7f4'}
                              onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 500, color: '#2c2c2a', display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {p.nom}
                                  {(() => { const ex = getLigneExistante(p); return ex ? <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 6, background: '#faeeda', color: '#854f0b' }}>Déjà saisi : {fmt(ex.poids_net, 3)} kg</span> : null })()}
                                </div>
                                <div style={{ fontSize: 11, color: '#888780' }}>
                                  {p.cat === 'merc' ? `${p.fourn || ''}${p.fourn ? ' — ' : ''}${fmt(p.prix, 2)} €/kg`
                                    : p.cat === 'rec' ? `Recette — ${p.prix > 0 ? fmt(p.prix, 2) + ' €/kg' : 'prix non calculé'}`
                                    : `Hors mercuriale — ${fmt(p.prix, 2)} €/kg`}
                                </div>
                              </div>
                              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, fontWeight: 500, background: colors[cat].bg, color: colors[cat].c, flexShrink: 0 }}>{labels[cat]}</span>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                    {aucunResultat && (
                      <div onClick={() => initNouveauProduit(search)}
                        style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#534ab7', fontSize: 13, fontWeight: 500, borderTop: '0.5px solid #f1efe8' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8f7f4'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                        ＋ Saisir <strong>"{search}"</strong> comme hors mercuriale
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectionne && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 13, color: '#cecbf6', marginBottom: 8, fontWeight: 500 }}>
                    → {selectionne.nom}
                    {prixSel > 0 && <span style={{ fontSize: 11, opacity: 0.7 }}> ({fmt(prixSel, 2)} €/kg)</span>}
                    {selectionne.cat === 'nouveau' && <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.2)', borderRadius: 6, padding: '1px 6px', marginLeft: 6 }}>Hors mercuriale</span>}
                  </div>

                  {selectionne.cat === 'nouveau' && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: '#cecbf6', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Prix €/kg (optionnel)</div>
                      <input type="number" step="0.01" min="0" value={nouveauProduit?.prixInput || ''} onChange={e => setNouveauProduit(prev => ({ ...prev, prixInput: e.target.value }))} placeholder="0.00"
                        style={{ ...inp, background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)', color: '#fff', fontSize: 14 }} />
                    </div>
                  )}

                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: '#cecbf6', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>
                      Poids brut — modifiez ou ajoutez avec +
                      {ligneExist && <span style={{ opacity: 0.7, textTransform: 'none', letterSpacing: 0 }}> (actuel: {ligneExist.expr_brut || fmt(ligneExist.poids_net, 3)})</span>}
                    </div>
                    <input value={poidsExpr} onChange={e => setPoidsExpr(e.target.value)}
                      placeholder={ligneExist ? (ligneExist.expr_brut || String(ligneExist.poids_net)) + '+...' : '0.000'}
                      style={{ ...inp, background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)', color: '#fff', fontSize: 16, fontWeight: 500, fontFamily: 'monospace' }} />
                  </div>

                  {contenants.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: '#cecbf6', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                        Contenants {ligneExist?.contenants_detail ? `— actuels : ${ligneExist.contenants_detail}` : '(optionnel)'}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {contenants.map(c => {
                          const qty = contSel[c.id] || 0; const sel = qty > 0
                          return (
                            <div key={c.id} onClick={() => setContSel(prev => { const n = { ...prev }; if (n[c.id]) delete n[c.id]; else n[c.id] = 1; return n })}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, border: `0.5px solid ${sel ? '#fff' : 'rgba(255,255,255,0.3)'}`, background: sel ? '#fff' : 'rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 12, color: sel ? '#3c3489' : '#fff' }}>
                              <span>{c.nom}</span><span style={{ opacity: 0.7, fontSize: 10 }}>({c.poids_vide} kg)</span>
                              {sel && (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2, background: 'rgba(83,74,183,0.15)', borderRadius: 5, padding: '0 3px' }}>
                                  <button onClick={e => { e.stopPropagation(); setContSel(prev => { const n = { ...prev }; n[c.id] = Math.max(0, (n[c.id] || 1) - 1); if (!n[c.id]) delete n[c.id]; return n }) }} style={{ background: 'none', border: 'none', color: '#3c3489', cursor: 'pointer', fontSize: 14, fontWeight: 700, padding: '0 2px' }}>−</button>
                                  <span style={{ fontSize: 12, fontWeight: 600, minWidth: 14, textAlign: 'center', color: '#3c3489' }}>{qty}</span>
                                  <button onClick={e => { e.stopPropagation(); setContSel(prev => ({ ...prev, [c.id]: (prev[c.id] || 0) + 1 })) }} style={{ background: 'none', border: 'none', color: '#3c3489', cursor: 'pointer', fontSize: 14, fontWeight: 700, padding: '0 2px' }}>+</button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {brutTotal > 0 && (
                    <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#fff', marginBottom: 10 }}>
                      <span>{fmt(brutTotal, 3)} kg brut</span>
                      {poidsConts > 0 && <span style={{ color: '#fac775' }}> — contenants : {fmt(poidsConts, 3)} kg</span>}
                      <span style={{ fontWeight: 600 }}> → NET : {fmt(netTotal, 3)} kg</span>
                      {prixSel > 0 && <span style={{ opacity: 0.7, marginLeft: 8 }}>= {fmt(netTotal * prixSel)} €</span>}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={valider} disabled={!poidsExpr || brutTotal === 0}
                      style={{ flex: 1, padding: 10, borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: poidsExpr && brutTotal > 0 ? 'pointer' : 'not-allowed', border: 'none', background: poidsExpr && brutTotal > 0 ? '#fff' : 'rgba(255,255,255,0.3)', color: poidsExpr && brutTotal > 0 ? '#3c3489' : '#cecbf6', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      ＋ {ligneExist ? 'Mettre à jour' : selectionne.cat === 'nouveau' ? 'Ajouter en hors mercuriale' : 'Ajouter à l\'inventaire'}
                    </button>
                    <button onClick={() => { setSelectionne(null); setNouveauProduit(null); setSearch(''); setPoidsExpr(''); setContSel({}) }}
                      style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', border: '1.5px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#cecbf6' }}>✕</button>
                  </div>
                </div>
              )}
            </div>

            {[
              { titre: 'Produits mercuriale', lignes: lignesMerc, cat: 'merc', icon: '🥩' },
              { titre: 'Recettes / Préparations', lignes: lignesRec, cat: 'rec', icon: '🍽️' },
              { titre: 'Hors mercuriale', lignes: lignesAutre, cat: 'autre', icon: '📦' }
            ].map((section, si) => (
              <div key={si} style={card}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 8, borderBottom: '0.5px solid #e2e0d8' }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#888780', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {section.icon} {section.titre}
                    <span style={{ background: '#eeedfe', color: '#3c3489', borderRadius: 10, padding: '1px 8px', fontSize: 11, fontWeight: 400, textTransform: 'none' }}>{section.lignes.length}</span>
                  </div>
                  {section.cat === 'autre' && (
                    <button onClick={() => setModalHors(true)} style={{ ...btn, fontSize: 11, padding: '4px 10px' }}>+ Ajouter</button>
                  )}
                </div>
                {section.lignes.length === 0
                  ? <div style={{ fontSize: 12, color: '#b4b2a9', textAlign: 'center', padding: 16 }}>Aucun produit saisi</div>
                  : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr>{['Produit', section.cat === 'merc' ? 'Fournisseur' : 'Type', 'Contenants', 'Poids net (kg)', 'Prix/kg', 'Valeur', ''].map((h, hi) => (
                          <th key={hi} style={{ padding: '5px 8px', textAlign: h === 'Poids net (kg)' || h === 'Prix/kg' || h === 'Valeur' ? 'right' : 'left', fontSize: 10, fontWeight: 500, color: '#888780', textTransform: 'uppercase', borderBottom: '0.5px solid #e2e0d8' }}>{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {section.lignes.map(l => (
                          <tr key={l.id} style={{ borderBottom: '0.5px solid #f1efe8' }}>
                            <td style={{ padding: '7px 8px', fontWeight: 500, color: '#2c2c2a' }}>{l.nom}</td>
                            <td style={{ padding: '7px 8px', color: '#888780', fontSize: 11 }}>{section.cat === 'merc' ? (l.fourn || '—') : section.cat === 'rec' ? 'Recette' : 'Hors mercuriale'}</td>
                            <td style={{ padding: '7px 8px', color: '#534ab7', fontSize: 11 }}>{l.contenants_detail || '—'}</td>
                            <td style={{ padding: '7px 8px', textAlign: 'right' }}>
                              <ChampPoidsEditable value={l.poids_net} expr={l.expr_brut || ''} contSel={l.cont_sel} contenants={contenants} onChange={(net, expr) => modifierPoids(l.categorie, l.id, net, expr)} />
                            </td>
                            <td style={{ padding: '7px 8px', textAlign: 'right', color: '#888780' }}>{fmt(l.prix)} €</td>
                            <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 500, color: '#534ab7' }}>{fmt(l.poids_net * l.prix)} €</td>
                            <td style={{ padding: '7px 8px' }}>
                              <button onClick={() => supprimerLigne(l.categorie, l.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a32d2d', fontSize: 13, padding: 2 }}>✕</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                }
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#534ab7', borderRadius: 12, padding: 18, color: '#fff' }}>
              <div style={{ fontSize: 11, color: '#cecbf6', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Valeur totale</div>
              <div style={{ fontSize: 28, fontWeight: 500 }}>{fmt(total)} €</div>
              <div style={{ fontSize: 12, color: '#cecbf6', marginTop: 4 }}>{lignesMerc.length + lignesRec.length + lignesAutre.length} ligne{lignesMerc.length + lignesRec.length + lignesAutre.length > 1 ? 's' : ''}</div>
            </div>
            <div style={card}>
              <div style={{ fontSize: 11, fontWeight: 500, color: '#888780', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Par fournisseur</div>
              {Object.keys(byFourn).length === 0
                ? <div style={{ fontSize: 12, color: '#b4b2a9', textAlign: 'center', padding: 8 }}>Aucun produit</div>
                : <>
                  {Object.entries(byFourn).sort((a, b) => b[1] - a[1]).map(([f, v]) => (
                    <div key={f} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: '0.5px solid #f1efe8' }}>
                      <span style={{ color: '#888780' }}>{f}</span>
                      <span style={{ fontWeight: 500, color: '#534ab7' }}>{fmt(v)} €</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0 2px', marginTop: 4, borderTop: '1px solid #2c2c2a' }}>
                    <span style={{ fontWeight: 600, color: '#2c2c2a' }}>Total</span>
                    <span style={{ fontWeight: 600, color: '#534ab7' }}>{fmt(Object.values(byFourn).reduce((s, v) => s + v, 0))} €</span>
                  </div>
                </>
              }
            </div>
            <div style={card}>
              <div style={{ fontSize: 11, fontWeight: 500, color: '#888780', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Résumé</div>
              {[['🥩 Mercuriale', lignesMerc.reduce((s, l) => s + l.poids_net * l.prix, 0)], ['🍽️ Recettes', lignesRec.reduce((s, l) => s + l.poids_net * l.prix, 0)], ['📦 Hors mercuriale', lignesAutre.reduce((s, l) => s + l.poids_net * l.prix, 0)]].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: '0.5px solid #f1efe8' }}>
                  <span style={{ color: '#888780' }}>{label}</span>
                  <span style={{ fontWeight: 500, color: '#2c2c2a' }}>{fmt(val)} €</span>
                </div>
              ))}
            </div>
            {(lignesMerc.length + lignesRec.length + lignesAutre.length) > 0 && (
              <div style={{ background: '#eaf3de', border: '0.5px solid #97c459', borderRadius: 10, padding: 10, fontSize: 11, color: '#27500a' }}>
                ✅ Données sauvegardées automatiquement.
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'contenants' && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#2c2c2a' }}>Mes contenants ({contenants.length})</div>
            <button onClick={() => setModalContenant(true)} style={btnP}>＋ Ajouter</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {contenants.map(c => (
              <div key={c.id} style={{ border: '0.5px solid #e2e0d8', borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#2c2c2a', marginBottom: 4 }}>{c.nom}</div>
                <div style={{ fontSize: 22, fontWeight: 500, color: '#534ab7' }}>{c.poids_vide} kg</div>
                <div style={{ fontSize: 11, color: '#888780', marginBottom: 10 }}>Poids vide</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setModalEditContenant({ ...c })} style={{ ...btn, fontSize: 11, padding: '4px 10px', flex: 1, justifyContent: 'center' }}>✏️ Modifier</button>
                  <button onClick={() => { if (window.confirm(`Supprimer "${c.nom}" ?`)) supprimerContenant(c.id) }}
                    style={{ ...btn, fontSize: 11, padding: '4px 10px', background: '#fcebeb', color: '#a32d2d', border: '0.5px solid #f09595' }}>🗑</button>
                </div>
              </div>
            ))}
            <div onClick={() => setModalContenant(true)} style={{ border: '2px dashed #d3d1c7', borderRadius: 10, padding: 14, minHeight: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', color: '#534ab7', fontSize: 13, fontWeight: 500 }}>＋ Ajouter</div>
          </div>
        </div>
      )}

      {tab === 'historique' && !historiqueDetail && (
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#2c2c2a', marginBottom: 16 }}>Inventaires archivés</div>
          {historique.length === 0
            ? <div style={{ textAlign: 'center', padding: 30, color: '#888780', fontSize: 13 }}>Aucun inventaire archivé</div>
            : historique.map(h => (
              <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#f8f7f4', borderRadius: 8, marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#2c2c2a' }}>Inventaire du {new Date(h.date_inventaire).toLocaleDateString('fr-FR')}</div>
                  <div style={{ fontSize: 12, color: '#888780', marginTop: 2 }}>FIMC — archivé le {new Date(h.created_at).toLocaleDateString('fr-FR')}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 16, fontWeight: 500, color: '#534ab7' }}>{fmt(h.valeur_totale)} €</div>
                  <button onClick={() => telechargerCSVHistorique(h.id)} style={{ ...btn, fontSize: 11, padding: '5px 10px' }}>⬇ CSV</button>
                  <button onClick={() => voirDetail(h.id)} style={btn}>Voir</button>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {tab === 'historique' && historiqueDetail && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button onClick={() => setHistoriqueDetail(null)} style={btn}>← Retour</button>
            <button onClick={() => telechargerCSVHistorique(historiqueDetail.inv.id)} style={{ ...btn, background: '#e6f1fb', color: '#0c447c', border: '0.5px solid #85b7eb' }}>⬇ Télécharger CSV</button>
          </div>
          <div style={{ background: '#534ab7', borderRadius: 12, padding: 16, color: '#fff', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>Inventaire du {new Date(historiqueDetail.inv.date_inventaire).toLocaleDateString('fr-FR')}</div>
              <div style={{ fontSize: 12, color: '#cecbf6', marginTop: 2 }}>{nomEtablissement} — FIMC</div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 500 }}>{fmt(historiqueDetail.inv.valeur_totale)} €</div>
          </div>

          {(() => {
            const byF = historiqueDetail.lignes.filter(l => l.categorie === 'merc').reduce((acc, l) => {
              const prod = produits.find(p => p.id === l.produit_id)
              const fourn = prod?.fournisseurs?.nom
              if (fourn) acc[fourn] = (acc[fourn] || 0) + l.poids_net * l.prix
              return acc
            }, {})
            return Object.keys(byF).length > 0 ? (
              <div style={{ ...card, marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#888780', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Par fournisseur</div>
                {Object.entries(byF).sort((a, b) => b[1] - a[1]).map(([f, v]) => (
                  <div key={f} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: '0.5px solid #f1efe8' }}>
                    <span style={{ color: '#888780' }}>{f}</span>
                    <span style={{ fontWeight: 500, color: '#534ab7' }}>{fmt(v)} €</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0 2px', marginTop: 4, borderTop: '1px solid #2c2c2a' }}>
                  <span style={{ fontWeight: 600, color: '#2c2c2a' }}>Total</span>
                  <span style={{ fontWeight: 600, color: '#534ab7' }}>{fmt(Object.values(byF).reduce((s, v) => s + v, 0))} €</span>
                </div>
              </div>
            ) : null
          })()}

          <div style={card}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>{['Produit', 'Catégorie', 'Poids net', 'Prix/kg', 'Valeur'].map(h => (
                  <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 10, fontWeight: 500, color: '#888780', textTransform: 'uppercase', borderBottom: '0.5px solid #e2e0d8' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {historiqueDetail.lignes.map(l => (
                  <tr key={l.id} style={{ borderBottom: '0.5px solid #f1efe8' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 500, color: '#2c2c2a' }}>{l.nom}</td>
                    <td style={{ padding: '8px 10px', color: '#888780' }}>{l.categorie}</td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{fmt(l.poids_net, 3)} kg</td>
                    <td style={{ padding: '8px 10px' }}>{fmt(l.prix)} €</td>
                    <td style={{ padding: '8px 10px', fontWeight: 500, color: '#534ab7' }}>{fmt(l.poids_net * l.prix)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL ÉTAPE 1 : Confirmation */}
      {modalStep === 'confirm' && (
        <div onClick={e => e.target === e.currentTarget && setModalStep(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: '100%', maxWidth: 420 }}>
            <div style={{ fontSize: 17, fontWeight: 500, color: '#2c2c2a', marginBottom: 6 }}>📦 Archiver l'inventaire ?</div>
            <div style={{ fontSize: 13, color: '#5f5e5a', marginBottom: 6, lineHeight: 1.6 }}>
              <strong>{nomEtablissement}</strong> — Inventaire du <strong>{new Date(dateInventaire).toLocaleDateString('fr-FR')}</strong>
            </div>
            <div style={{ fontSize: 24, fontWeight: 500, color: '#534ab7', marginBottom: 16 }}>{fmt(total)} €</div>
            <div style={{ fontSize: 12, color: '#888780', marginBottom: 20 }}>
              {lignesMerc.length + lignesRec.length + lignesAutre.length} lignes — cette action est irréversible.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setModalStep(null)} style={btn}>Annuler</button>
              <button onClick={() => setModalStep('mail')} style={{ ...btn, background: '#eaf3de', color: '#27500a', border: '0.5px solid #97c459' }}>📧 Envoyer par mail d'abord</button>
              <button onClick={archiver} style={btnP}>📦 Archiver</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ÉTAPE 2 : Envoi mail */}
      {modalStep === 'mail' && (
        <div onClick={e => e.target === e.currentTarget && setModalStep('confirm')} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: '100%', maxWidth: 440 }}>
            <div style={{ fontSize: 17, fontWeight: 500, color: '#2c2c2a', marginBottom: 16 }}>📧 Envoyer le récapitulatif</div>
            {mailEnvoye && (
              <div style={{ background: '#eaf3de', border: '0.5px solid #97c459', borderRadius: 8, padding: 10, fontSize: 12, color: '#27500a', marginBottom: 14 }}>✅ Mail envoyé !</div>
            )}
            {equipe.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: '#888780', marginBottom: 5 }}>Membre de l'équipe :</div>
                <select value={mailMembreId} onChange={e => { setMailMembreId(e.target.value); setMailDest('') }} style={inp}>
                  <option value="">— Sélectionner —</option>
                  {equipe.map(m => <option key={m.id} value={m.id}>{m.nom} ({m.email})</option>)}
                </select>
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: '#888780', marginBottom: 5 }}>Ou saisir un email :</div>
              <input placeholder="email@exemple.com" value={mailDest} onChange={e => { setMailDest(e.target.value); setMailMembreId('') }} style={inp} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button onClick={() => setModalStep('confirm')} style={btn}>← Retour</button>
              <button onClick={envoyerParMail} style={{ ...btn, background: '#eaf3de', color: '#27500a', border: '0.5px solid #97c459' }}>📧 Envoyer</button>
              <button onClick={archiver} style={btnP}>📦 Archiver maintenant</button>
            </div>
          </div>
        </div>
      )}

      {modalHors && (
        <div onClick={e => e.target === e.currentTarget && setModalHors(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: '100%', maxWidth: 400 }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#2c2c2a', marginBottom: 16 }}>Produit hors mercuriale</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input placeholder="Nom *" value={formHors.nom} onChange={e => setFormHors({ ...formHors, nom: e.target.value })} style={inp} />
              <input placeholder="Prix estimé (€/kg)" type="number" step="0.01" value={formHors.prix} onChange={e => setFormHors({ ...formHors, prix: e.target.value })} style={inp} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button onClick={() => setModalHors(false)} style={btn}>Annuler</button>
              <button onClick={() => {
                const ligne = { id: Date.now() + '', produit_id: null, recette_id: null, nom: formHors.nom, fourn: null, prix: parseFloat(formHors.prix) || 0, poids_net: 0, expr_brut: '', cont_sel: {}, contenants_detail: '', categorie: 'autre' }
                setLignesAutre(prev => { const n = [...prev, ligne]; sauvegarderLocal(lignesMerc, lignesRec, n, dateInventaire); return n })
                setModalHors(false); setFormHors({ nom: '', prix: '' })
              }} style={btnP}>Ajouter</button>
            </div>
          </div>
        </div>
      )}

      {modalContenant && (
        <div onClick={e => e.target === e.currentTarget && setModalContenant(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: '100%', maxWidth: 400 }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#2c2c2a', marginBottom: 16 }}>Nouveau contenant</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input placeholder="Nom *" value={formContenant.nom} onChange={e => setFormContenant({ ...formContenant, nom: e.target.value })} style={inp} />
              <input placeholder="Poids vide (kg) *" type="number" step="0.001" value={formContenant.poids_vide} onChange={e => setFormContenant({ ...formContenant, poids_vide: e.target.value })} style={inp} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button onClick={() => setModalContenant(false)} style={btn}>Annuler</button>
              <button onClick={ajouterContenant} style={btnP}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {modalEditContenant && (
        <div onClick={e => e.target === e.currentTarget && setModalEditContenant(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: '100%', maxWidth: 400 }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#2c2c2a', marginBottom: 16 }}>Modifier le contenant</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input placeholder="Nom *" value={modalEditContenant.nom} onChange={e => setModalEditContenant({ ...modalEditContenant, nom: e.target.value })} style={inp} />
              <input placeholder="Poids vide (kg) *" type="number" step="0.001" value={modalEditContenant.poids_vide} onChange={e => setModalEditContenant({ ...modalEditContenant, poids_vide: e.target.value })} style={inp} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button onClick={() => setModalEditContenant(null)} style={btn}>Annuler</button>
              <button onClick={modifierContenant} style={btnP}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast.message} type={toast.type} />
    </div>
  )
}
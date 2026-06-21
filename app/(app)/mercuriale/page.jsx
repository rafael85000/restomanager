'use client'

import React, { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function getEtabId() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('etablissement_actif')
}

function fmt(v) {
  return Number(v).toFixed(2)
}

// ─── MODAL CONFIRMATION DANGER ────────────────────────────────
function ModalConfirm({ titre, message, onConfirm, onClose }) {
  const [confirme, setConfirme] = useState('')
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16
    }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: '100%', maxWidth: 400 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: '#a32d2d', marginBottom: 8 }}>⚠️ {titre}</div>
        <div style={{ fontSize: 13, color: '#5f5e5a', marginBottom: 16, lineHeight: 1.6 }}>{message}</div>
        <div style={{ background: '#fcebeb', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#a32d2d', marginBottom: 14 }}>
          Cette action est irréversible. Tapez <strong>SUPPRIMER</strong> pour confirmer.
        </div>
        <input value={confirme} onChange={e => setConfirme(e.target.value)} placeholder="Tapez SUPPRIMER"
          style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '0.5px solid #d3d1c7', fontSize: 13, outline: 'none', marginBottom: 14 }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '0.5px solid #d3d1c7', background: '#fff', color: '#5f5e5a' }}>Annuler</button>
          <button onClick={() => confirme === 'SUPPRIMER' && onConfirm()} disabled={confirme !== 'SUPPRIMER'}
            style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: confirme === 'SUPPRIMER' ? 'pointer' : 'not-allowed', border: 'none', background: confirme === 'SUPPRIMER' ? '#a32d2d' : '#d3d1c7', color: '#fff' }}>
            Confirmer la suppression
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── STEPPER ─────────────────────────────────────────────────
function Stepper({ current }) {
  const steps = ['Fichier', 'Mapping IA', 'Doublons', 'Validation', 'Aperçu']
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
      {steps.map((label, i) => {
        const n = i + 1
        const state = n < current ? 'done' : n === current ? 'active' : 'pending'
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center', flex: n < steps.length ? 1 : 0 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 500, flexShrink: 0,
              background: state === 'pending' ? '#f1efe8' : '#534ab7',
              color: state === 'pending' ? '#888780' : '#fff',
              boxShadow: state === 'active' ? '0 0 0 3px #eeedfe' : 'none'
            }}>
              {state === 'done' ? '✓' : n}
            </div>
            <div style={{ fontSize: 10, fontWeight: 500, marginLeft: 4, marginRight: 4, color: state === 'pending' ? '#b4b2a9' : '#534ab7', whiteSpace: 'nowrap' }}>
              {label}
            </div>
            {n < steps.length && (
              <div style={{ flex: 1, height: 1, background: state === 'done' ? '#534ab7' : '#e2e0d8', margin: '0 4px' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── MODAL PRODUIT ────────────────────────────────────────────
function ModalProduit({ produit, fournisseurs, onSave, onClose }) {
  const [form, setForm] = useState({
    reference: produit?.reference || '',
    nom: produit?.nom || '',
    prix_ht: produit?.prix_ht || '',
    unite_facturation: produit?.unite_facturation || 'kg',
    fournisseur_id: produit?.fournisseur_id || ''
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    if (!form.nom.trim()) { alert('Le nom est obligatoire'); return }
    onSave(form)
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16
    }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: '100%', maxWidth: 420 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: '#2c2c2a', marginBottom: 16 }}>
          {produit ? 'Modifier le produit' : 'Ajouter un produit'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#5f5e5a', marginBottom: 3, display: 'block' }}>Référence</label>
            <input value={form.reference} onChange={e => set('reference', e.target.value)} placeholder="REF-001"
              style={{ padding: '9px 12px', borderRadius: 8, border: '0.5px solid #d3d1c7', fontSize: 13, color: '#2c2c2a', background: '#fff', outline: 'none', width: '100%' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#5f5e5a', marginBottom: 3, display: 'block' }}>Désignation *</label>
            <input value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Poulet fermier label rouge"
              style={{ padding: '9px 12px', borderRadius: 8, border: '0.5px solid #d3d1c7', fontSize: 13, color: '#2c2c2a', background: '#fff', outline: 'none', width: '100%' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#5f5e5a', marginBottom: 3, display: 'block' }}>Prix HT (€/kg)</label>
              <input value={form.prix_ht} onChange={e => set('prix_ht', e.target.value)} placeholder="4.50" type="number" step="0.01"
                style={{ padding: '9px 12px', borderRadius: 8, border: '0.5px solid #d3d1c7', fontSize: 13, color: '#2c2c2a', background: '#fff', outline: 'none', width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#5f5e5a', marginBottom: 3, display: 'block' }}>Unité</label>
              <input value={form.unite_facturation} onChange={e => set('unite_facturation', e.target.value)} placeholder="kg"
                style={{ padding: '9px 12px', borderRadius: 8, border: '0.5px solid #d3d1c7', fontSize: 13, color: '#2c2c2a', background: '#fff', outline: 'none', width: '100%' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#5f5e5a', marginBottom: 3, display: 'block' }}>Fournisseur</label>
            <select value={form.fournisseur_id} onChange={e => set('fournisseur_id', e.target.value)}
              style={{ padding: '9px 12px', borderRadius: 8, border: '0.5px solid #d3d1c7', fontSize: 13, color: '#2c2c2a', background: '#fff', outline: 'none', width: '100%' }}>
              <option value="">— Aucun —</option>
              {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button onClick={onClose} style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '0.5px solid #d3d1c7', background: '#fff', color: '#5f5e5a' }}>Annuler</button>
          <button onClick={handleSave} style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none', background: '#534ab7', color: '#fff' }}>Enregistrer</button>
        </div>
      </div>
    </div>
  )
}

// ─── MODAL EXPORT ─────────────────────────────────────────────
function ModalExport({ produits, fournisseurs, formatInitial, onClose }) {
  const [fmt_exp, setFmtExp] = useState(formatInitial)
  const [tab, setTab] = useState('forni')
  const [selForni, setSelForni] = useState(fournisseurs.map(f => f.id))
  const [selProds, setSelProds] = useState(produits.map(p => p.id))
  const [searchProd, setSearchProd] = useState('')
  const [ordre, setOrdre] = useState('fournisseur')

  const prodsFiltres = searchProd
    ? produits.filter(p => p.nom.toLowerCase().includes(searchProd.toLowerCase()) || (p.reference || '').toLowerCase().includes(searchProd.toLowerCase()))
    : produits

  const toggleForni = (id) => setSelForni(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  const toggleProd = (id) => setSelProds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  const getListe = () => {
    let liste = produits.filter(p => selProds.includes(p.id) && selForni.includes(p.fournisseur_id))
    if (ordre === 'az') {
      liste = [...liste].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
    } else {
      liste = [...liste].sort((a, b) => {
        const fa = fournisseurs.find(f => f.id === a.fournisseur_id)?.nom || ''
        const fb = fournisseurs.find(f => f.id === b.fournisseur_id)?.nom || ''
        return fa.localeCompare(fb, 'fr') || a.nom.localeCompare(b.nom, 'fr')
      })
    }
    return liste
  }

  const exporterPDF = async (liste) => {
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    doc.setFontSize(18)
    doc.setTextColor(83, 74, 183)
    doc.text('Mercuriale — Export', 14, 20)
    doc.setFontSize(10)
    doc.setTextColor(136, 135, 128)
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} · ${liste.length} produit(s) · ${ordre === 'az' ? 'A → Z' : 'Par fournisseur'}`, 14, 27)
    let startY = 34
    if (ordre === 'fournisseur') {
      const groups = {}
      liste.forEach(p => {
        const k = fournisseurs.find(f => f.id === p.fournisseur_id)?.nom || 'Sans fournisseur'
        if (!groups[k]) groups[k] = []
        groups[k].push(p)
      })
      Object.entries(groups).forEach(([groupe, items]) => {
        doc.setFontSize(9)
        doc.setTextColor(83, 74, 183)
        doc.setFont(undefined, 'bold')
        doc.text(groupe.toUpperCase(), 14, startY + 5)
        doc.setFont(undefined, 'normal')
        autoTable(doc, {
          startY: startY + 7,
          head: [['Réf.', 'Désignation', 'Fournisseur', 'Prix HT/kg', 'Unité']],
          body: items.map(p => [p.reference || '—', p.nom, fournisseurs.find(f => f.id === p.fournisseur_id)?.nom || '—', `${Number(p.prix_ht).toFixed(2)} €`, p.unite_facturation || '—']),
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [83, 74, 183], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [248, 247, 244] },
          columnStyles: { 3: { halign: 'right' } },
          margin: { left: 14, right: 14 },
        })
        startY = doc.lastAutoTable.finalY + 6
      })
    } else {
      autoTable(doc, {
        startY,
        head: [['Réf.', 'Désignation', 'Fournisseur', 'Prix HT/kg', 'Unité']],
        body: liste.map(p => [p.reference || '—', p.nom, fournisseurs.find(f => f.id === p.fournisseur_id)?.nom || '—', `${Number(p.prix_ht).toFixed(2)} €`, p.unite_facturation || '—']),
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [83, 74, 183], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 247, 244] },
        columnStyles: { 3: { halign: 'right' } },
        margin: { left: 14, right: 14 },
      })
    }
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(180)
      doc.text('FIMC — Fiche Inventaire Mercuriale Coût de revient', 14, doc.internal.pageSize.height - 8)
      doc.text(`Page ${i}/${pageCount}`, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 8, { align: 'right' })
    }
    doc.save(`mercuriale_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  const exporterExcel = async (liste) => {
    const { utils, writeFile } = await import('xlsx')
    const wb = utils.book_new()
    const rows = [['Référence', 'Désignation', 'Fournisseur', 'Prix HT (€/kg)', 'Unité']]
    if (ordre === 'fournisseur') {
      const groups = {}
      liste.forEach(p => {
        const k = fournisseurs.find(f => f.id === p.fournisseur_id)?.nom || 'Sans fournisseur'
        if (!groups[k]) groups[k] = []
        groups[k].push(p)
      })
      Object.entries(groups).forEach(([g, items]) => {
        rows.push([`— ${g} —`, '', '', '', ''])
        items.forEach(p => rows.push([p.reference || '', p.nom, fournisseurs.find(f => f.id === p.fournisseur_id)?.nom || '', p.prix_ht, p.unite_facturation || '']))
      })
    } else {
      liste.forEach(p => rows.push([p.reference || '', p.nom, fournisseurs.find(f => f.id === p.fournisseur_id)?.nom || '', p.prix_ht, p.unite_facturation || '']))
    }
    const ws = utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 12 }, { wch: 32 }, { wch: 20 }, { wch: 14 }, { wch: 8 }]
    utils.book_append_sheet(wb, ws, 'Mercuriale')
    writeFile(wb, `mercuriale_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const exporterSheets = (liste) => {
    const csv = 'Référence,Désignation,Fournisseur,Prix HT,Unité\n' +
      liste.map(p => [p.reference || '', p.nom, fournisseurs.find(f => f.id === p.fournisseur_id)?.nom || '', p.prix_ht, p.unite_facturation || '']
        .map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `mercuriale_sheets_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  const lancer = async () => {
    const liste = getListe()
    if (!liste.length) { alert('Aucun produit dans la sélection.'); return }
    if (fmt_exp === 'excel') await exporterExcel(liste)
    else if (fmt_exp === 'pdf') await exporterPDF(liste)
    else if (fmt_exp === 'sheets') exporterSheets(liste)
    onClose()
  }

  const btnStyle = (active) => ({
    padding: '7px 13px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
    border: active ? 'none' : '0.5px solid #d3d1c7',
    background: active ? '#534ab7' : '#fff', color: active ? '#fff' : '#5f5e5a'
  })

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16
    }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 22, width: '100%', maxWidth: 440, maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#2c2c2a' }}>Exporter la mercuriale</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#888780' }}>✕</button>
        </div>
        <div style={{ fontSize: 11, color: '#888780', marginBottom: 8 }}>Format :</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {[['pdf', '📄 PDF'], ['excel', '📊 Excel'], ['sheets', '🟢 Google Sheets']].map(([f, l]) => (
            <button key={f} onClick={() => setFmtExp(f)} style={btnStyle(fmt_exp === f)}>{l}</button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: '#888780', marginBottom: 8 }}>Ordre des produits :</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {[['fournisseur', '🏪 Par fournisseur'], ['az', '🔤 A → Z']].map(([o, l]) => (
            <button key={o} onClick={() => setOrdre(o)} style={btnStyle(ordre === o)}>{l}</button>
          ))}
        </div>
        <div style={{ display: 'flex', borderBottom: '0.5px solid #e2e0d8', marginBottom: 12 }}>
          {[['forni', 'Fournisseurs'], ['prod', 'Produits']].map(([t, l]) => (
            <div key={t} onClick={() => setTab(t)} style={{
              padding: '7px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
              color: tab === t ? '#534ab7' : '#888780',
              borderBottom: tab === t ? '2px solid #534ab7' : '2px solid transparent', marginBottom: -1
            }}>{l}</div>
          ))}
        </div>
        {tab === 'forni' && (
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', fontSize: 12, color: '#534ab7', fontWeight: 500, cursor: 'pointer', borderBottom: '0.5px solid #e2e0d8', marginBottom: 6, paddingBottom: 10 }}>
              <input type="checkbox" checked={selForni.length === fournisseurs.length}
                onChange={e => setSelForni(e.target.checked ? fournisseurs.map(f => f.id) : [])}
                style={{ accentColor: '#534ab7' }} />
              Tous les fournisseurs
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 180, overflowY: 'auto' }}>
              {fournisseurs.map(f => {
                const nb = produits.filter(p => p.fournisseur_id === f.id).length
                return (
                  <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: '#f8f7f4', borderRadius: 7, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={selForni.includes(f.id)} onChange={() => toggleForni(f.id)} style={{ accentColor: '#534ab7' }} />
                    <span style={{ flex: 1 }}>{f.nom}</span>
                    <span style={{ fontSize: 11, color: '#888780' }}>{nb} produit{nb !== 1 ? 's' : ''}</span>
                  </label>
                )
              })}
            </div>
          </div>
        )}
        {tab === 'prod' && (
          <div>
            <input value={searchProd} onChange={e => setSearchProd(e.target.value)} placeholder="Filtrer les produits…"
              style={{ width: '100%', padding: '7px 11px', borderRadius: 8, border: '0.5px solid #d3d1c7', fontSize: 12, marginBottom: 8, outline: 'none' }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', fontSize: 12, color: '#534ab7', fontWeight: 500, cursor: 'pointer', borderBottom: '0.5px solid #e2e0d8', marginBottom: 6, paddingBottom: 10 }}>
              <input type="checkbox" checked={selProds.length === produits.length}
                onChange={e => setSelProds(e.target.checked ? produits.map(p => p.id) : [])}
                style={{ accentColor: '#534ab7' }} />
              Tous les produits
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 180, overflowY: 'auto' }}>
              {prodsFiltres.map(p => (
                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: '#f8f7f4', borderRadius: 7, fontSize: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={selProds.includes(p.id)} onChange={() => toggleProd(p.id)} style={{ accentColor: '#534ab7' }} />
                  <span style={{ flex: 1 }}>{p.nom}</span>
                  <span style={{ fontSize: 10, color: '#888780' }}>{fournisseurs.find(f => f.id === p.fournisseur_id)?.nom || '—'}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTop: '0.5px solid #e2e0d8' }}>
          <span style={{ fontSize: 11, color: '#888780' }}>{getListe().length} produit{getListe().length !== 1 ? 's' : ''} sélectionné{getListe().length !== 1 ? 's' : ''}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '0.5px solid #d3d1c7', background: '#fff', color: '#5f5e5a' }}>Annuler</button>
            <button onClick={lancer} style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none', background: '#534ab7', color: '#fff' }}>↓ Exporter</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── PANNEAU IMPORT IA ────────────────────────────────────────
function PanneauImport({ fournisseurs, etablissementId, onImportDone, onClose }) {
  const [step, setStep] = useState(1)
  const [fichier, setFichier] = useState(null)
  const [colonnes, setColonnes] = useState([])
  const [mapping, setMapping] = useState({})
  const [lignes, setLignes] = useState([])
  const [doublons, setDoublons] = useState([])
  const [detectionEnCours, setDetectionEnCours] = useState(false)
  const [detectionFaite, setDetectionFaite] = useState(false)
  const [detSteps, setDetSteps] = useState([
    { lbl: 'Normalisation des noms', state: 'pending' },
    { lbl: 'Fuzzy matching (Levenshtein)', state: 'pending' },
    { lbl: 'Vérification IA des correspondances', state: 'pending' }
  ])
  const [iaAnalyse, setIaAnalyse] = useState(null)
  const [iaEnCours, setIaEnCours] = useState(false)
  const [fournisseurDefaut, setFournisseurDefaut] = useState('')

  const dlModele = async () => {
    const { utils, writeFile } = await import('xlsx')
    const wb = utils.book_new()
    const ws = utils.aoa_to_sheet([
      ['Référence', 'Désignation', 'Prix HT (€)', 'Unité', 'Fournisseur'],
      ['REF-001', 'Exemple produit 1', '4.50', 'kg', 'Fournisseur A'],
      ['REF-002', 'Exemple produit 2', '12.00', 'L', 'Fournisseur B'],
    ])
    ws['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 14 }, { wch: 8 }, { wch: 20 }]
    utils.book_append_sheet(wb, ws, 'Mercuriale')
    writeFile(wb, 'modele_mercuriale_FIMC.xlsx')
  }

  // ── Analyse IA — gère Excel/CSV ET PDF ───────────────────
  const analyserAvecIA = async () => {
    if (!fichier) return
    setIaEnCours(true)
    try {
      const isPDF = fichier.name.toLowerCase().endsWith('.pdf')

      if (isPDF) {
        // ── PDF : envoi direct à Claude en base64 ──────────
        const buffer = await fichier.arrayBuffer()
        // Conversion base64 sans dépasser la limite de pile
        const bytes = new Uint8Array(buffer)
        let binary = ''
        const chunkSize = 8192
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
        }
        const base64 = btoa(binary)

        const response = await fetch('/api/claude-mapping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `Analyse ce PDF qui est un tarif fournisseur pour un restaurateur.
Extrait TOUS les produits que tu trouves et retourne-les en JSON.
Ignore les titres, totaux, sous-totaux, en-têtes de page, lignes vides.
Pour chaque produit extrait : nom (obligatoire), prix_ht (nombre décimal HT si possible), unite_facturation (kg/L/pièce/boite...), reference (code article si présent), fournisseur_nom (nom du fournisseur si présent dans le document).

Réponds UNIQUEMENT en JSON valide, format :
{
  "produits": [
    { "nom": "Poulet fermier", "prix_ht": 4.50, "unite_facturation": "kg", "reference": "REF001", "fournisseur_nom": "Metro" }
  ],
  "commentaire": "Explication courte de ce que tu as trouvé"
}`,
            pdf_base64: base64
          })
        })

        const result = await response.json()
        const parsed = JSON.parse(result.content)

        if (!parsed.produits?.length) {
          alert('Aucun produit trouvé dans ce PDF. Vérifiez que le fichier contient bien un tarif fournisseur.')
          return
        }

        // On affiche les produits extraits à l'étape 2 pour validation manuelle
        const colonnesPDF = ['nom', 'prix_ht', 'unite_facturation', 'reference', 'fournisseur_nom']
        const lignesPDF = parsed.produits.map(p => [
          p.nom || '',
          p.prix_ht || 0,
          p.unite_facturation || '',
          p.reference || '',
          p.fournisseur_nom || ''
        ])

        setColonnes(colonnesPDF)
        setLignes(lignesPDF)
        setMapping({
          nom: 'nom',
          prix_ht: 'prix_ht',
          unite_facturation: 'unite_facturation',
          reference: 'reference',
          fournisseur_nom: 'fournisseur_nom'
        })
        setIaAnalyse({
          commentaire: `${parsed.commentaire} — ${parsed.produits.length} produits extraits du PDF. Vérifiez le mapping ci-dessous.`,
          confiance: { nom: 95, prix_ht: 90, unite_facturation: 75, reference: 80, fournisseur_nom: 70 }
        })
        setStep(2)
        return
      }

      // ── Excel / CSV ────────────────────────────────────────
      const { read, utils } = await import('xlsx')
      const buffer = await fichier.arrayBuffer()
      const wb = read(buffer)
      const ws = wb.Sheets[wb.SheetNames[0]]
      const data = utils.sheet_to_json(ws, { header: 1 })
      if (!data.length) throw new Error('Fichier vide')

      const lignesNonVides = data.filter(row => row.some(c => c !== null && c !== undefined && c !== ''))

      // Détection intelligente de la ligne d'entêtes
      let ligneEntetes = 0
      let meilleurScore = -1
      for (let i = 0; i < Math.min(10, lignesNonVides.length); i++) {
        const row = lignesNonVides[i]
        const cellsNonVides = row.filter(c => c !== null && c !== undefined && c !== '')
        const cellsTexte = cellsNonVides.filter(c => isNaN(Number(String(c).replace(',', '.'))))
        const nbCols = cellsNonVides.length
        if (nbCols >= 3 && cellsTexte.length >= 2) {
          const lignesSuivantes = lignesNonVides.slice(i + 1, i + 3)
          const hasData = lignesSuivantes.some(r =>
            r.filter(c => !isNaN(Number(String(c).replace(',', '.'))) && c !== '').length >= 1
          )
          const score = nbCols * (hasData ? 2 : 1)
          if (score > meilleurScore) {
            meilleurScore = score
            ligneEntetes = i
          }
        }
      }

      const entetes = lignesNonVides[ligneEntetes].map(c => String(c || '').trim()).filter(c => c)
      const exemples = lignesNonVides.slice(ligneEntetes + 1, ligneEntetes + 4)

      const prompt = `Tu es un assistant pour restaurateurs qui analyse des fichiers mercuriale fournisseurs.
Le fichier peut avoir n'importe quelle structure : titres, colonnes inutiles, lignes vides, colonnes fusionnées, codes internes.
Ton rôle est d'identifier UNIQUEMENT les colonnes utiles parmi celles-ci.

Colonnes détectées (ligne ${ligneEntetes + 1}) : ${JSON.stringify(entetes)}
Exemples de données (lignes suivantes) : ${JSON.stringify(exemples)}

Les seuls champs qui nous intéressent pour la mercuriale sont :
- nom (nom/désignation du produit) — OBLIGATOIRE, cherche "article", "désignation", "produit", "libellé", "description"
- prix_ht (prix hors taxe en euros, nombre décimal) — cherche "prix HT", "tarif", "PU HT", "prix unitaire"
- unite_facturation (kg, L, pièce, boite, carton...) — cherche "unité", "UF", "conditionnement"
- reference (code ou référence article) — cherche "ref", "code", "EAN", "article"
- fournisseur_nom (nom du fournisseur ou grossiste)

Pour chaque colonne : si elle correspond à un champ, mappe-la. Sinon mets "ignorer".
Ignore : totaux, TVA, prix TTC, marges, dates, numéros de commande.

Réponds UNIQUEMENT en JSON valide :
{
  "mapping": { "NomColonneFichier": "champ_cible_ou_ignorer" },
  "confiance": { "NomColonneFichier": 95 },
  "commentaire": "Explication courte"
}`

      const response = await fetch('/api/claude-mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      const result = await response.json()
      const mappingIA = JSON.parse(result.content)

      const lignesDonnees = lignesNonVides.slice(ligneEntetes + 1).filter(row => row.some(c => c))
      setColonnes(entetes)
      setMapping(mappingIA.mapping)
      setLignes(lignesDonnees)
      setIaAnalyse(mappingIA)
      setStep(2)

    } catch (err) {
      console.error('Erreur analyse IA:', err)
      alert('Erreur lors de l\'analyse : ' + err.message)
    } finally {
      setIaEnCours(false)
    }
  }

  const lancerDetection = async () => {
    setDetectionEnCours(true)
    const { data: existants } = await supabase
      .from('produits').select('id, nom, prix_ht, reference').eq('etablissement_id', etablissementId)

    const nouvelles = lignes.map(row => {
      const obj = {}
      colonnes.forEach((col, i) => {
        const champ = mapping[col]
        if (champ && champ !== 'ignorer') obj[champ] = row[i]
      })
      return obj
    }).filter(l => l.nom)

    for (let i = 0; i < 3; i++) {
      await new Promise(r => setTimeout(r, 800))
      setDetSteps(prev => prev.map((s, idx) => ({ ...s, state: idx < i ? 'done' : idx === i ? 'active' : 'pending' })))
    }

    if (existants?.length && nouvelles.length) {
      try {
        const prompt = `Tu es un assistant pour restaurateurs.
Produits existants : ${JSON.stringify(existants.slice(0, 30).map(p => ({ nom: p.nom, id: p.id })))}
Nouveaux produits à importer : ${JSON.stringify(nouvelles.slice(0, 30).map(p => p.nom))}
Identifie les produits identiques malgré des noms légèrement différents.
Réponds UNIQUEMENT en JSON : { "doublons": [{ "nouveau": "nom", "existant_id": "id", "existant_nom": "nom", "score": 92 }] }`
        const res = await fetch('/api/claude-mapping', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        })
        const result = await res.json()
        setDoublons(JSON.parse(result.content).doublons || [])
      } catch (e) { console.error('Erreur détection doublons:', e) }
    }

    setDetSteps(prev => prev.map(s => ({ ...s, state: 'done' })))
    await new Promise(r => setTimeout(r, 400))
    setDetectionEnCours(false)
    setDetectionFaite(true)
  }

  const confirmerImport = async () => {
    try {
      const nouvelles = lignes.map(row => {
        const obj = { etablissement_id: etablissementId }
        colonnes.forEach((col, i) => {
          const champ = mapping[col]
          if (champ && champ !== 'ignorer' && champ !== 'fournisseur_nom') {
            obj[champ] = champ === 'prix_ht' ? (parseFloat(row[i]) || 0) : (row[i] ? String(row[i]).trim() : null)
          }
          if (champ === 'fournisseur_nom' && row[i]) obj._fournisseur_nom = String(row[i]).trim()
        })
        return obj
      }).filter(l => l.nom)

      if (!nouvelles.length) { alert('Aucun produit valide. Vérifiez le mapping.'); return }

      const nomsFournis = [...new Set(nouvelles.map(l => l._fournisseur_nom).filter(Boolean))]
      const { data: fourniExistants } = await supabase.from('fournisseurs').select('id, nom').eq('etablissement_id', etablissementId)
      const fourniMap = {}
      fourniExistants?.forEach(f => { fourniMap[f.nom.toLowerCase()] = f.id })

      for (const nom of nomsFournis) {
        if (fourniMap[nom.toLowerCase()]) continue
        const cle = nom.toLowerCase().replace(/[^a-z0-9]/g, '')
        const match = Object.entries(fourniMap).find(([k]) => {
          const kn = k.replace(/[^a-z0-9]/g, '')
          return kn.startsWith(cle) || cle.startsWith(kn) ||
            (cle.length > 4 && kn.includes(cle)) ||
            (kn.length > 4 && cle.includes(kn))
        })
        if (match) {
          fourniMap[nom.toLowerCase()] = match[1]
        } else {
          const { data: newF, error } = await supabase.from('fournisseurs')
            .insert({ nom, etablissement_id: etablissementId, actif: true }).select().single()
          if (!error && newF) fourniMap[nom.toLowerCase()] = newF.id
        }
      }

      const produitsFinaux = nouvelles.map(({ _fournisseur_nom, ...p }) => ({
        ...p,
        fournisseur_id: _fournisseur_nom
          ? (fourniMap[_fournisseur_nom.toLowerCase()] || null)
          : (fournisseurDefaut || null)
      }))

      const { error } = await supabase.from('produits').insert(produitsFinaux)
      if (error) throw error

      onImportDone(produitsFinaux.length)
      onClose()
    } catch (err) {
      console.error('Erreur import:', err)
      alert('Erreur lors de l\'import : ' + err.message)
    }
  }

  const champsLabels = {
    nom: 'Désignation (nom)', prix_ht: 'Prix HT', unite_facturation: 'Unité',
    reference: 'Référence', fournisseur_nom: 'Fournisseur', ignorer: '— Ignorer —'
  }
  const btnStyle = { padding: '7px 13px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid #d3d1c7', background: '#fff', color: '#5f5e5a', display: 'inline-flex', alignItems: 'center', gap: 5 }
  const btnPrimary = { ...btnStyle, background: '#534ab7', color: '#fff', border: 'none' }
  const inputStyle = { padding: '8px 11px', borderRadius: 8, border: '0.5px solid #d3d1c7', fontSize: 12, color: '#2c2c2a', background: '#fff', outline: 'none', width: '100%' }

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, width: 480, maxWidth: '95vw', height: '100vh', background: '#fff', zIndex: 100, boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 18px', borderBottom: '0.5px solid #e2e0d8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#2c2c2a' }}>Importer des produits</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#888780' }}>✕</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Stepper current={step} />

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: '#eeedfe', borderRadius: 8, padding: '9px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: '#3c3489' }}>📥 Télécharger le modèle FIMC (.xlsx)</span>
              <button onClick={dlModele} style={{ ...btnStyle, fontSize: 10, padding: '4px 9px', background: '#eeedfe', border: '0.5px solid #afa9ec', color: '#3c3489' }}>Télécharger</button>
            </div>
            <label style={{ border: '2px dashed #d3d1c7', borderRadius: 10, padding: 24, textAlign: 'center', cursor: 'pointer', background: fichier ? '#eaf3de' : '#f8f7f4', borderColor: fichier ? '#97c459' : '#d3d1c7', display: 'block' }}>
              <div style={{ fontSize: 28, color: '#b4b2a9', marginBottom: 6 }}>☁</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#2c2c2a', marginBottom: 3 }}>{fichier ? fichier.name : 'Glissez votre fichier ici'}</div>
              <div style={{ fontSize: 11, color: '#888780' }}>{fichier ? `${(fichier.size / 1024).toFixed(0)} Ko` : 'ou cliquez pour parcourir'}</div>
              {!fichier && (
                <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginTop: 8 }}>
                  {[['Excel', '#eaf3de', '#27500a'], ['CSV', '#e6f1fb', '#0c447c'], ['PDF tarif', '#fcebeb', '#a32d2d']].map(([l, bg, c]) => (
                    <span key={l} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 5, fontWeight: 500, background: bg, color: c }}>{l}</span>
                  ))}
                </div>
              )}
              <input type="file" accept=".xlsx,.csv,.pdf" style={{ display: 'none' }} onChange={e => e.target.files[0] && setFichier(e.target.files[0])} />
            </label>
            <div style={{ background: '#f8f7f4', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#888780' }}>
              💡 Peu importe le format — l'IA détecte automatiquement les colonnes utiles et ignore le reste. Les PDF sont lus directement par l'IA.
            </div>
            <div style={{ background: '#f8f7f4', borderRadius: 8, padding: '10px 12px' }}>
              <label style={{ fontSize: 11, fontWeight: 500, color: '#5f5e5a', marginBottom: 6, display: 'block' }}>
                🏪 Fournisseur par défaut <span style={{ fontWeight: 400, color: '#b4b2a9' }}>(optionnel — si non présent dans le fichier)</span>
              </label>
              <select value={fournisseurDefaut} onChange={e => setFournisseurDefaut(e.target.value)}
                style={{ width: '100%', padding: '8px 11px', borderRadius: 8, border: '0.5px solid #d3d1c7', fontSize: 12, color: '#2c2c2a', background: '#fff', outline: 'none' }}>
                <option value="">— Aucun fournisseur par défaut —</option>
                {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8, borderTop: '0.5px solid #e2e0d8' }}>
              <button onClick={analyserAvecIA} disabled={!fichier || iaEnCours} style={{ ...btnPrimary, opacity: !fichier || iaEnCours ? 0.5 : 1, cursor: !fichier || iaEnCours ? 'not-allowed' : 'pointer' }}>
                {iaEnCours ? '⏳ Analyse en cours…' : '🤖 Analyser avec IA'}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {iaAnalyse && (
              <div style={{ background: '#eeedfe', borderRadius: 9, padding: '10px 13px' }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#3c3489', marginBottom: 6 }}>🤖 Analyse IA — {colonnes.length} colonnes détectées</div>
                <div style={{ fontSize: 11, color: '#5f5e5a' }}>{iaAnalyse.commentaire}</div>
              </div>
            )}
            <div style={{ fontSize: 11, color: '#5f5e5a', background: '#eeedfe', borderRadius: 8, padding: '8px 11px' }}>
              Vérifiez que "Désignation (nom)" est bien assigné à la colonne des noms de produits. Vous pouvez corriger manuellement.
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr>{['Colonne fichier', '', 'Champ mercuriale'].map(h => (
                  <th key={h} style={{ padding: '5px 7px', textAlign: 'left', fontSize: 9, fontWeight: 500, color: '#888780', textTransform: 'uppercase', borderBottom: '0.5px solid #e2e0d8' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {colonnes.map(col => {
                  const mapped = mapping[col] || 'ignorer'
                  const conf = iaAnalyse?.confiance?.[col] || 0
                  const isIA = conf > 0
                  return (
                    <tr key={col}>
                      <td style={{ padding: '6px 7px', borderBottom: '0.5px solid #f1efe8' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 10, background: '#f8f7f4', padding: '2px 6px', borderRadius: 4, color: '#5f5e5a' }}>{col}</span>
                        {isIA && <div style={{ height: 2, borderRadius: 2, marginTop: 3, background: conf >= 85 ? '#27500a' : '#fac775', width: conf + '%' }} />}
                      </td>
                      <td style={{ padding: '6px 4px', color: '#b4b2a9', fontSize: 10, textAlign: 'center' }}>→</td>
                      <td style={{ padding: '6px 7px', borderBottom: '0.5px solid #f1efe8' }}>
                        <select value={mapped} onChange={e => setMapping(m => ({ ...m, [col]: e.target.value }))}
                          style={{ ...inputStyle, fontSize: 11, padding: '5px 7px', borderColor: isIA && mapped !== 'ignorer' ? '#534ab7' : '#d3d1c7', background: isIA && mapped !== 'ignorer' ? '#eeedfe' : '#fff' }}>
                          {Object.entries(champsLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                        {isIA && <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 4, background: '#eeedfe', color: '#3c3489', fontWeight: 500, marginLeft: 3 }}>IA {conf}%</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '0.5px solid #e2e0d8' }}>
              <button onClick={() => setStep(1)} style={btnStyle}>← Retour</button>
              <button onClick={() => setStep(3)} style={btnPrimary}>Détecter doublons →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {detSteps.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', borderRadius: 9, border: '0.5px solid', borderColor: s.state === 'done' ? '#c0dd97' : s.state === 'active' ? '#afa9ec' : '#e2e0d8', background: s.state === 'done' ? '#eaf3de' : s.state === 'active' ? '#eeedfe' : '#fff' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0, background: s.state === 'done' ? '#27500a' : s.state === 'active' ? '#534ab7' : '#f1efe8', color: s.state === 'pending' ? '#888780' : '#fff' }}>
                  {s.state === 'done' ? '✓' : s.state === 'active' ? '⟳' : i + 1}
                </div>
                <span style={{ fontSize: 11, color: '#2c2c2a' }}>{s.lbl}</span>
              </div>
            ))}
            {detectionFaite && (
              <div style={{ background: '#eeedfe', borderRadius: 8, padding: '9px 12px', fontSize: 11, color: '#3c3489' }}>
                ℹ️ {doublons.length > 0 ? `${doublons.length} correspondance(s) potentielle(s) détectée(s)` : 'Aucun doublon — tous les produits sont nouveaux'}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '0.5px solid #e2e0d8' }}>
              <button onClick={() => setStep(2)} style={btnStyle}>← Retour</button>
              {!detectionFaite
                ? <button onClick={lancerDetection} disabled={detectionEnCours} style={{ ...btnPrimary, opacity: detectionEnCours ? 0.6 : 1 }}>{detectionEnCours ? '⏳ Détection…' : '🔍 Lancer la détection'}</button>
                : <button onClick={() => setStep(doublons.length > 0 ? 4 : 5)} style={btnPrimary}>{doublons.length > 0 ? 'Valider les doublons →' : 'Aperçu final →'}</button>
              }
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 11, color: '#888780', lineHeight: 1.6 }}>Confirmez si ces produits sont identiques.</p>
            {doublons.map((d, i) => (
              <div key={i} style={{ border: '0.5px solid', borderColor: d.choix === 'maj' ? '#97c459' : d.choix === 'ignore' ? '#f09595' : '#e2e0d8', borderRadius: 9, padding: 11, background: d.choix === 'maj' ? '#f6fdf0' : d.choix === 'ignore' ? '#fff5f5' : '#fff' }}>
                <div style={{ display: 'flex', gap: 7, marginBottom: 8 }}>
                  <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 6, fontWeight: 500, background: d.score >= 85 ? '#eaf3de' : '#faeeda', color: d.score >= 85 ? '#27500a' : '#854f0b' }}>{d.score}% confiance</span>
                  <span style={{ fontSize: 9, color: '#888780' }}>🤖 IA</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 7, alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ background: '#f8f7f4', borderRadius: 7, padding: 8 }}>
                    <div style={{ fontSize: 9, fontWeight: 500, color: '#888780', textTransform: 'uppercase', marginBottom: 2 }}>Mercuriale actuelle</div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: '#2c2c2a' }}>{d.existant_nom}</div>
                  </div>
                  <div style={{ textAlign: 'center', color: '#534ab7', fontSize: 16 }}>=?</div>
                  <div style={{ background: '#f8f7f4', borderRadius: 7, padding: 8 }}>
                    <div style={{ fontSize: 9, fontWeight: 500, color: '#888780', textTransform: 'uppercase', marginBottom: 2 }}>Fichier importé</div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: '#2c2c2a' }}>{d.nouveau}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {[['maj', 'Oui — Mettre à jour', '#eaf3de', '#27500a', '#97c459'], ['ignore', 'Non — Différents', '#fcebeb', '#a32d2d', '#f09595']].map(([v, l, bg, c, bc]) => (
                    <button key={v} onClick={() => setDoublons(prev => prev.map((x, j) => j === i ? { ...x, choix: v } : x))}
                      style={{ flex: 1, padding: 6, borderRadius: 7, fontSize: 11, fontWeight: 500, cursor: 'pointer', textAlign: 'center', border: `0.5px solid ${d.choix === v ? c : bc}`, background: d.choix === v ? c : bg, color: d.choix === v ? '#fff' : c }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '0.5px solid #e2e0d8' }}>
              <button onClick={() => setStep(3)} style={btnStyle}>← Retour</button>
              <button onClick={() => setStep(5)} style={btnPrimary}>Aperçu final →</button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 }}>
              {[[lignes.length, 'Nouveaux', '#27500a', '#eaf3de'], [doublons.filter(d => d.choix === 'maj').length, 'Mises à jour', '#854f0b', '#faeeda'], [lignes.length, 'Total', '#2c2c2a', '#f8f7f4']].map(([v, l, c, bg]) => (
                <div key={l} style={{ background: bg, borderRadius: 8, padding: 9, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 500, color: c }}>{v}</div>
                  <div style={{ fontSize: 9, color: '#888780', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ background: '#eeedfe', borderRadius: 8, padding: '9px 12px', fontSize: 11, color: '#3c3489' }}>
              🔒 Les fournisseurs absents seront créés automatiquement. Les noms similaires seront fusionnés intelligemment.
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '0.5px solid #e2e0d8' }}>
              <button onClick={() => setStep(doublons.length > 0 ? 4 : 3)} style={btnStyle}>← Retour</button>
              <button onClick={confirmerImport} style={btnPrimary}>✓ Confirmer l'import ({lignes.length} ligne{lignes.length !== 1 ? 's' : ''})</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────
export default function MercurialePage() {
  const [produits, setProduits] = useState([])
  const [fournisseurs, setFournisseurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtreForni, setFiltreForni] = useState('')
  const [trieAZ, setTrieAZ] = useState(false)
  const [modalProduit, setModalProduit] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [exportFormat, setExportFormat] = useState('excel')
  const [showExpDrop, setShowExpDrop] = useState(false)
  const [toast, setToast] = useState('')
  const [modalConfirm, setModalConfirm] = useState(null)
  const etabId = getEtabId()

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    if (!etabId) return
    chargerDonnees()
  }, [etabId])

  const chargerDonnees = async () => {
    setLoading(true)
    const [{ data: prods }, { data: fournis }] = await Promise.all([
      supabase.from('produits').select('*').eq('etablissement_id', etabId).order('nom'),
      supabase.from('fournisseurs').select('*').eq('etablissement_id', etabId).order('nom')
    ])
    setProduits(prods || [])
    setFournisseurs(fournis || [])
    setLoading(false)
  }

  const sauvegarderProduit = async (form) => {
    const data = { ...form, prix_ht: parseFloat(form.prix_ht) || 0, etablissement_id: etabId }
    if (modalProduit && modalProduit !== 'new') {
      const { error } = await supabase.from('produits').update(data).eq('id', modalProduit.id)
      if (error) { alert('Erreur : ' + error.message); return }
      setProduits(prev => prev.map(p => p.id === modalProduit.id ? { ...p, ...data } : p))
      showToast('Produit modifié')
    } else {
      const { data: inserted, error } = await supabase.from('produits').insert({ ...data, is_new: true }).select().single()
      if (error) { alert('Erreur : ' + error.message); return }
      setProduits(prev => [...prev, inserted])
      showToast('Produit ajouté')
    }
    setModalProduit(null)
  }

  const supprimerProduit = async (produit) => {
    if (!window.confirm(`Supprimer "${produit.nom}" ?`)) return
    const { error } = await supabase.from('produits').delete().eq('id', produit.id)
    if (error) { alert('Erreur : ' + error.message); return }
    setProduits(prev => prev.filter(p => p.id !== produit.id))
    showToast('Produit supprimé')
  }

  const viderMercuriale = async () => {
    const { error } = await supabase.from('produits').delete().eq('etablissement_id', etabId)
    if (error) { alert('Erreur : ' + error.message); return }
    setProduits([])
    setModalConfirm(null)
    showToast('Mercuriale vidée')
  }

  const viderFournisseur = async (fournisseurId, nomFourni) => {
    const { error } = await supabase.from('produits').delete()
      .eq('etablissement_id', etabId).eq('fournisseur_id', fournisseurId)
    if (error) { alert('Erreur : ' + error.message); return }
    setProduits(prev => prev.filter(p => p.fournisseur_id !== fournisseurId))
    setModalConfirm(null)
    showToast(`Produits de ${nomFourni} supprimés`)
  }

  const retirerBadgeNouveau = async (produit) => {
    await supabase.from('produits').update({ is_new: false }).eq('id', produit.id)
    setProduits(prev => prev.map(p => p.id === produit.id ? { ...p, is_new: false } : p))
  }

  const listeFiltree = produits.filter(p => {
    const s = search.toLowerCase()
    return (!s || p.nom?.toLowerCase().includes(s) || (p.reference || '').toLowerCase().includes(s))
      && (!filtreForni || p.fournisseur_id === filtreForni)
  })

  const listeTrie = trieAZ
    ? [...listeFiltree].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
    : [...listeFiltree].sort((a, b) => {
        const fa = fournisseurs.find(f => f.id === a.fournisseur_id)?.nom || 'zzz'
        const fb = fournisseurs.find(f => f.id === b.fournisseur_id)?.nom || 'zzz'
        return fa.localeCompare(fb, 'fr') || a.nom.localeCompare(b.nom, 'fr')
      })

  const grouperParFourni = (arr) => {
    const groups = {}
    arr.forEach(p => {
      const f = fournisseurs.find(f => f.id === p.fournisseur_id)
      const k = f?.nom || 'Sans fournisseur'
      const kid = f?.id || 'none'
      if (!groups[k]) groups[k] = { id: kid, items: [] }
      groups[k].items.push(p)
    })
    return groups
  }

  const cardStyle = { background: '#fff', borderRadius: 12, border: '0.5px solid #e2e0d8', padding: '14px 18px' }
  const btnBase = { padding: '7px 13px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '0.5px solid #d3d1c7', background: '#fff', color: '#5f5e5a', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }
  const btnPurple = { ...btnBase, background: '#534ab7', color: '#fff', border: 'none' }
  const btnImport = { ...btnBase, background: '#eeedfe', color: '#3c3489', border: '0.5px solid #afa9ec' }
  const btnDanger = { ...btnBase, background: '#fcebeb', color: '#a32d2d', border: '0.5px solid #f09595', fontSize: 12 }

  const ligneHtml = (p) => {
    const forni = fournisseurs.find(f => f.id === p.fournisseur_id)
    return (
      <tr key={p.id} style={{ borderBottom: '0.5px solid #f1efe8' }}>
        <td style={{ padding: '9px 10px', fontSize: 11, color: '#888780', fontFamily: 'monospace' }}>{p.reference || '—'}</td>
        <td style={{ padding: '9px 10px', fontWeight: 500 }}>
          {p.nom}
          {p.is_new && (
            <span onClick={() => retirerBadgeNouveau(p)} title="Cliquer pour retirer le badge"
              style={{ fontSize: 9, padding: '1px 5px', borderRadius: 6, background: '#eaf3de', color: '#27500a', fontWeight: 500, marginLeft: 5, cursor: 'pointer' }}>
              Nouveau ×
            </span>
          )}
        </td>
        <td style={{ padding: '9px 10px', fontSize: 12, color: '#888780' }}>{forni?.nom || '—'}</td>
        <td style={{ padding: '9px 10px', textAlign: 'right', color: '#534ab7', fontWeight: 500, fontSize: 13 }}>{fmt(p.prix_ht)} €</td>
        <td style={{ padding: '9px 10px', fontSize: 12, color: '#888780' }}>{p.unite_facturation || '—'}</td>
        <td style={{ padding: '9px 10px' }}>
          <div style={{ display: 'flex', gap: 3, justifyContent: 'flex-end' }}>
            <button onClick={() => setModalProduit(p)} title="Modifier"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 5px', borderRadius: 5, color: '#888780', fontSize: 14 }}
              onMouseEnter={e => { e.currentTarget.style.background = '#eeedfe'; e.currentTarget.style.color = '#534ab7' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#888780' }}>
              ✏️
            </button>
            <button onClick={() => supprimerProduit(p)} title="Supprimer"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 5px', borderRadius: 5, color: '#888780', fontSize: 14 }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fcebeb'; e.currentTarget.style.color = '#a32d2d' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#888780' }}>
              🗑️
            </button>
          </div>
        </td>
      </tr>
    )
  }

  const groupes = grouperParFourni(listeTrie)

  return (
    <div style={{ background: '#f8f7f4', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ background: '#fff', borderBottom: '0.5px solid #e2e0d8', padding: '13px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, borderRadius: '12px 12px 0 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 500, color: '#2c2c2a' }}>
          📋 Mercuriale
          <span style={{ background: '#eeedfe', color: '#3c3489', fontSize: 11, fontWeight: 500, padding: '2px 9px', borderRadius: 20 }}>
            {produits.length} produit{produits.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setShowImport(true)} style={btnImport}>⬆ Importer</button>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowExpDrop(v => !v)} style={btnBase}>⬇ Exporter ▾</button>
            {showExpDrop && (
              <div style={{ position: 'absolute', top: 'calc(100% + 5px)', right: 0, background: '#fff', border: '0.5px solid #e2e0d8', borderRadius: 10, boxShadow: '0 6px 20px rgba(0,0,0,0.1)', zIndex: 60, minWidth: 180, overflow: 'hidden' }}>
                {[['pdf', '📄 Export PDF'], ['excel', '📊 Export Excel'], ['sheets', '🟢 Google Sheets']].map(([f, l]) => (
                  <div key={f} onClick={() => { setExportFormat(f); setShowExport(true); setShowExpDrop(false) }}
                    style={{ padding: '10px 14px', fontSize: 13, color: '#2c2c2a', cursor: 'pointer', borderBottom: '0.5px solid #f1efe8' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8f7f4'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                    {l}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setModalConfirm({
            titre: 'Vider toute la mercuriale',
            message: `Vous allez supprimer les ${produits.length} produit(s) de votre mercuriale. Les fournisseurs ne seront pas supprimés.`,
            action: viderMercuriale
          })} style={btnDanger}>🗑 Vider la mercuriale</button>
          <button onClick={() => setModalProduit('new')} style={btnPurple}>+ Nouveau produit</button>
        </div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom ou référence…"
              style={{ flex: 1, minWidth: 140, padding: '8px 12px', borderRadius: 8, border: '0.5px solid #d3d1c7', fontSize: 13, color: '#2c2c2a', background: '#fff', outline: 'none' }} />
            <select value={filtreForni} onChange={e => setFiltreForni(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: 8, border: '0.5px solid #d3d1c7', fontSize: 13, color: '#2c2c2a', background: '#fff', cursor: 'pointer' }}>
              <option value="">Tous les fournisseurs</option>
              {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
            <button onClick={() => setTrieAZ(v => !v)}
              style={{ ...btnBase, background: trieAZ ? '#eeedfe' : '#fff', color: trieAZ ? '#3c3489' : '#5f5e5a', borderColor: trieAZ ? '#afa9ec' : '#d3d1c7', fontSize: 12 }}>
              {trieAZ ? '🔤 A → Z' : '🏪 Par fournisseur'}
            </button>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#888780', padding: 32, fontSize: 13 }}>Chargement…</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Réf.', 'Désignation', 'Fournisseur', 'Prix HT/kg', 'U.F.', ''].map((h, i) => (
                      <th key={i} style={{ padding: '7px 10px', textAlign: i === 3 ? 'right' : 'left', fontSize: 10, fontWeight: 500, color: '#888780', textTransform: 'uppercase', letterSpacing: '0.3px', borderBottom: '0.5px solid #e2e0d8', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!listeTrie.length ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888780', padding: 32, fontSize: 13 }}>Aucun produit. Cliquez sur "+ Nouveau produit" pour commencer.</td></tr>
                  ) : trieAZ ? (
                    listeTrie.map(p => ligneHtml(p))
                  ) : (
                    Object.entries(groupes).map(([groupe, { id: fourniId, items }]) => (
                      <React.Fragment key={groupe}>
                        <tr>
                          <td colSpan={6} style={{ padding: '6px 10px', background: '#f8f7f4', borderBottom: '0.5px solid #e2e0d8' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ color: '#534ab7', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                🏪 {groupe} <span style={{ color: '#b4b2a9', fontWeight: 400 }}>({items.length})</span>
                              </span>
                              {fourniId !== 'none' && (
                                <button onClick={() => setModalConfirm({
                                  titre: `Supprimer les produits de ${groupe}`,
                                  message: `Vous allez supprimer les ${items.length} produit(s) du fournisseur "${groupe}". Le fournisseur ne sera pas supprimé.`,
                                  action: () => viderFournisseur(fourniId, groupe)
                                })}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#a32d2d', padding: '2px 6px', borderRadius: 5 }}>
                                  🗑 Vider
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {items.map(p => ligneHtml(p))}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showImport && (
        <>
          <div onClick={() => setShowImport(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.36)', zIndex: 90 }} />
          <PanneauImport
            fournisseurs={fournisseurs}
            etablissementId={etabId}
            onImportDone={(nb) => { chargerDonnees(); showToast(`${nb} produit(s) importé(s) avec succès`) }}
            onClose={() => setShowImport(false)}
          />
        </>
      )}

      {showExport && (
        <ModalExport produits={produits} fournisseurs={fournisseurs} formatInitial={exportFormat} onClose={() => setShowExport(false)} />
      )}

      {modalProduit !== null && (
        <ModalProduit
          produit={modalProduit === 'new' ? null : modalProduit}
          fournisseurs={fournisseurs}
          onSave={sauvegarderProduit}
          onClose={() => setModalProduit(null)}
        />
      )}

      {modalConfirm && (
        <ModalConfirm
          titre={modalConfirm.titre}
          message={modalConfirm.message}
          onConfirm={modalConfirm.action}
          onClose={() => setModalConfirm(null)}
        />
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: '#2c2c2a', color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: 13, zIndex: 999, whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
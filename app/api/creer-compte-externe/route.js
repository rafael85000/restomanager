import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Client admin avec service role key pour créer des utilisateurs
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { email, password, nom, permissions, etablissements_ids, created_by } = await request.json()

    if (!email || !password || !nom) {
      return NextResponse.json({ error: 'Email, mot de passe et nom requis' }, { status: 400 })
    }

    // Créer le compte Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Pas besoin de confirmer l'email
      user_metadata: { nom }
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Créer l'entrée dans comptes_externes
    const { error: dbError } = await supabaseAdmin.from('comptes_externes').insert([{
      user_id: authData.user.id,
      nom, email,
      permissions: permissions || [],
      etablissements_ids: etablissements_ids || [],
      actif: true,
      created_by
    }])

    if (dbError) {
      // Supprimer le compte Auth si l'insertion échoue
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: dbError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
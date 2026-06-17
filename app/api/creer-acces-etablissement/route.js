import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const { email, password, etablissement_id } = await request.json();

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: newUser, error: errCreate } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (errCreate) {
      return Response.json({ error: errCreate.message }, { status: 400 });
    }

    const { error: errAcces } = await supabaseAdmin.from('acces_etablissement').insert([{
      compte_id: newUser.user.id,
      etablissement_id: etablissement_id,
      role: 'gerant',
    }]);

    if (errAcces) {
      return Response.json({ error: errAcces.message }, { status: 400 });
    }

    return Response.json({ success: true, user_id: newUser.user.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return Response.json({ error: 'Signature invalide' }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const compteClientId = session.metadata.compte_client_id;
    const etablissementId = session.metadata.etablissement_id;

    await supabaseAdmin.from('abonnements').update({
      statut: 'actif',
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
    }).eq('compte_client_id', compteClientId);

    if (etablissementId) {
      await supabaseAdmin.from('etablissements').update({
        actif: true,
      }).eq('id', etablissementId);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    await supabaseAdmin.from('abonnements').update({
      statut: 'inactif',
    }).eq('stripe_subscription_id', subscription.id);
  }

  return Response.json({ received: true });
}

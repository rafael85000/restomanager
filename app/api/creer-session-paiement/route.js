import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { price_id, compte_client_id, email, etablissement_id } = await request.json();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card', 'sepa_debit'],
      line_items: [{ price: price_id, quantity: 1 }],
      customer_email: email,
      success_url: `${request.headers.get('origin')}/abonnement?paiement=succes`,
      cancel_url: `${request.headers.get('origin')}/abonnement?paiement=annule`,
      metadata: {
        compte_client_id: compte_client_id,
        etablissement_id: etablissement_id || '',
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

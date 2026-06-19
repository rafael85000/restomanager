import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET() {
  try {
    const produitStarter = await stripe.products.create({
      name: 'FIMC - Starter',
      description: 'Mercuriale, Fournisseurs, Recettes, Coût de revient, Inventaire, Bons de commande',
    });
    const prixStarter = await stripe.prices.create({
      product: produitStarter.id,
      unit_amount: 3900,
      currency: 'eur',
      recurring: { interval: 'month' },
    });

    const produitPro = await stripe.products.create({
      name: 'FIMC - Pro',
      description: 'Tout Starter + Allergènes, HACCP, DLC, Pertes, Saisonnalité, Fiches techniques, Rapport mensuel',
    });
    const prixPro = await stripe.prices.create({
      product: produitPro.id,
      unit_amount: 6900,
      currency: 'eur',
      recurring: { interval: 'month' },
    });

    return Response.json({
      starter: { product_id: produitStarter.id, price_id: prixStarter.id },
      pro: { product_id: produitPro.id, price_id: prixPro.id },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

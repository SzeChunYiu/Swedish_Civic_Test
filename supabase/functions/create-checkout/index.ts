// Supabase Edge Function: create-checkout
// Creates a Stripe Checkout Session for the SIGNED-IN user and returns its URL.
// The browser then redirects to Stripe Checkout (Google Pay / Apple Pay / cards).
//
// Deploy:  supabase functions deploy create-checkout
// Secrets: STRIPE_SECRET_KEY, STRIPE_PRICE_REMOVE_ADS, STRIPE_PRICE_PRO_LIFETIME,
//          SITE_ORIGIN (optional, defaults to https://almostswedish.se)
// verify_jwt stays TRUE (default): only authenticated users can invoke it.

import Stripe from 'npm:stripe@^17';
import { createClient } from 'npm:@supabase/supabase-js@^2';

const SITE = Deno.env.get('SITE_ORIGIN') ?? 'https://almostswedish.se';
const ALLOWED_ORIGINS = new Set([SITE, 'https://www.almostswedish.se', 'http://localhost:3000']);
const PRICE_BY_PLAN: Record<string, string | undefined> = {
  remove_ads: Deno.env.get('STRIPE_PRICE_REMOVE_ADS'),
  pro_lifetime: Deno.env.get('STRIPE_PRICE_PRO_LIFETIME'),
};

function corsHeaders(origin: string | null): Record<string, string> {
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : SITE;
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

Deno.serve(async (req) => {
  const headers = { ...corsHeaders(req.headers.get('origin')), 'content-type': 'application/json' };

  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers });
  }

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeKey) {
    // Architecture is live but credentials not set yet — tell the client cleanly.
    return new Response(JSON.stringify({ error: 'not_configured' }), { status: 501, headers });
  }

  try {
    // Identify the caller from their Supabase access token.
    const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    if (!jwt)
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${jwt}` } } },
    );
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(jwt);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers });
    }

    const { plan } = (await req.json().catch(() => ({}))) as { plan?: string };
    const price = plan ? PRICE_BY_PLAN[plan] : undefined;
    if (!price) {
      return new Response(JSON.stringify({ error: 'unknown_or_unconfigured_plan' }), {
        status: 400,
        headers,
      });
    }

    const stripe = new Stripe(stripeKey);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price, quantity: 1 }],
      customer_email: user.email ?? undefined,
      client_reference_id: user.id,
      metadata: { user_id: user.id, plan },
      payment_intent_data: { metadata: { user_id: user.id, plan } },
      // Stripe Tax computes EU VAT per buyer location. OFF by default so the first
      // test checkout works even before tax setup is complete — set the secret
      // STRIPE_TAX_ENABLED=true only AFTER you've added your Stripe Tax origin
      // address + a Swedish tax registration, or session creation errors.
      automatic_tax: { enabled: Deno.env.get("STRIPE_TAX_ENABLED") === "true" },
      allow_promotion_codes: true,
      success_url: `${SITE}/?purchase=success&plan=${encodeURIComponent(plan)}`,
      cancel_url: `${SITE}/?purchase=cancelled`,
    });

    return new Response(JSON.stringify({ url: session.url }), { headers });
  } catch (err) {
    console.error('[create-checkout]', err);
    return new Response(JSON.stringify({ error: 'server_error' }), { status: 500, headers });
  }
});

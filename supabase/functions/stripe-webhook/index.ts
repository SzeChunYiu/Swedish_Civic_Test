// Supabase Edge Function: stripe-webhook
// Stripe calls this after payment. It verifies the signature, then writes the
// account's entitlement using the service-role key (bypasses RLS). This is the
// ONLY path that grants an entitlement — the client can never self-grant.
//
// Deploy WITHOUT jwt verification (Stripe does not send a Supabase JWT):
//   supabase functions deploy stripe-webhook --no-verify-jwt
// Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
// (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are injected automatically.)

import Stripe from 'npm:stripe@^17';
import { createClient } from 'npm:@supabase/supabase-js@^2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '');
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method_not_allowed', { status: 405 });

  const signature = req.headers.get('stripe-signature');
  const rawBody = await req.text();
  if (!signature || !webhookSecret) {
    return new Response('missing signature or secret', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    // constructEventAsync uses WebCrypto (required in the Deno/Edge runtime).
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('[stripe-webhook] bad signature', (err as Error).message);
    return new Response('invalid signature', { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const paid =
        session.payment_status === 'paid' || session.payment_status === 'no_payment_required';
      const userId = session.metadata?.user_id ?? session.client_reference_id ?? null;
      const plan = session.metadata?.plan ?? null;

      if (paid && userId && (plan === 'remove_ads' || plan === 'pro_lifetime')) {
        const { error } = await admin.from('entitlements').upsert(
          {
            user_id: userId,
            plan,
            source: 'stripe',
            stripe_session_id: session.id,
            stripe_customer_id: typeof session.customer === 'string' ? session.customer : null,
            active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,plan' },
        );
        if (error) {
          console.error('[stripe-webhook] entitlement upsert failed', error);
          return new Response('db_error', { status: 500 });
        }
      }
    }
  } catch (err) {
    console.error('[stripe-webhook] handler error', err);
    return new Response('handler_error', { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
});

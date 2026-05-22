/* Almost Swedish — account-bound web checkout (Stripe).
 *
 * Flow: signed-in user clicks a purchase button -> we call the Supabase Edge
 * Function `create-checkout` (which makes a Stripe Checkout Session with Google
 * Pay / Apple Pay / cards + Stripe Tax) -> redirect to Stripe. After payment,
 * Stripe's webhook writes an `entitlements` row; the client reads it and goes
 * ad-free. Until the Stripe keys + Edge Functions are deployed, checkout returns
 * `not_configured` and the button shows a friendly "coming soon" message —
 * nothing breaks. */

(function () {
  const PLAN_COPY = {
    remove_ads: { locked: 'purchase.removeAds.locked' },
    pro_lifetime: { locked: 'purchase.premium.locked' },
  };
  // Labels are literal (not the old i18n keys) because those said "Continue with
  // Google Play"; this is now a Stripe web checkout.
  const READY_LABEL = {
    remove_ads: 'Remove ads — 29 kr',
    pro_lifetime: 'Premium Lifetime — 59 kr',
  };
  const OWNED_LABEL = {
    remove_ads: 'Ad-free — active ✓',
    pro_lifetime: 'Premium — active ✓',
  };

  let ownedPlans = [];

  function readStorage(key) {
    try {
      return localStorage.getItem(key) || '';
    } catch {
      return '';
    }
  }

  function t(key, replacements) {
    const dict = window.i18n || {};
    const lang = readStorage('smt_lang') || 'en';
    let value = (dict[lang] && dict[lang][key]) || (dict.en && dict.en[key]) || key;
    Object.entries(replacements || {}).forEach(([name, replacement]) => {
      value = value.replace(`{${name}}`, replacement);
    });
    return value;
  }

  function requireSignedInAccount() {
    const signedIn =
      typeof window.smtIsSignedIn === 'function'
        ? window.smtIsSignedIn()
        : readStorage('smt_signed_in') === '1';
    const id = readStorage('smt_account_id');
    const email = readStorage('smt_account_email');
    if (!signedIn || !id) return null;
    return { email, id };
  }

  function statusMsg(message) {
    const el = document.getElementById('purchase-status');
    if (el) el.textContent = message;
    if (window.smtFx && message) window.smtFx.toast(message, { duration: 2600 });
  }

  function setButtonState(button, account) {
    const kind = button.dataset.purchaseKind;
    const owned =
      ownedPlans.includes(kind) || (kind === 'remove_ads' && ownedPlans.includes('pro_lifetime'));
    const locked = !account;
    button.dataset.purchaseLocked = locked ? 'true' : 'false';
    button.dataset.purchaseOwned = owned ? 'true' : 'false';
    button.removeAttribute('aria-disabled');
    button.disabled = owned;
    if (owned) button.textContent = OWNED_LABEL[kind] || 'Active ✓';
    else if (locked) button.textContent = t((PLAN_COPY[kind] || PLAN_COPY.remove_ads).locked);
    else button.textContent = READY_LABEL[kind] || 'Buy';
  }

  function renderPurchaseGate() {
    const account = requireSignedInAccount();
    document.querySelectorAll('[data-purchase-kind]').forEach((button) => {
      setButtonState(button, account);
    });
  }

  function supabaseConfigured() {
    return Boolean(window.SMT_SUPABASE_URL && window.SMT_SUPABASE_ANON_KEY);
  }

  // ----- Entitlements (ad-free) -------------------------------------------------

  async function fetchEntitlements() {
    const account = requireSignedInAccount();
    if (!supabaseConfigured() || !account || account.id === 'local-demo') return [];
    if (typeof window.smtGetSupabaseClient !== 'function') return [];
    try {
      const client = await window.smtGetSupabaseClient();
      if (!client) return [];
      const { data, error } = await client.from('entitlements').select('plan').eq('active', true);
      if (error) return []; // table missing / not signed in -> treat as no entitlement
      return (data || []).map((row) => row.plan).filter(Boolean);
    } catch {
      return [];
    }
  }

  function applyAdFree() {
    const adFree = ownedPlans.includes('remove_ads') || ownedPlans.includes('pro_lifetime');
    if (!adFree) return;
    try {
      localStorage.setItem('smt_ad_free', '1');
    } catch {}
    // Hide the manual ad panels + suppress the consent prompt for paying users.
    // NOTE: AdSense auto-ads loaded from <head> are not gated client-side yet —
    // see docs/release/stripe-purchase-setup.md "Ad-free enforcement" follow-up.
    if (typeof window.smtSetAdsMode === 'function') window.smtSetAdsMode('none');
    if (typeof window.smtRefreshAds === 'function') window.smtRefreshAds();
  }

  async function refreshEntitlements() {
    ownedPlans = await fetchEntitlements();
    applyAdFree();
    renderPurchaseGate();
    return ownedPlans;
  }

  // ----- Checkout ---------------------------------------------------------------

  async function startCheckout(plan) {
    const client =
      typeof window.smtGetSupabaseClient === 'function'
        ? await window.smtGetSupabaseClient()
        : null;
    if (!client) throw new Error('signin_client_unavailable');
    const { data } = await client.auth.getSession();
    const token = data && data.session && data.session.access_token;
    if (!token) throw new Error('no_session');

    const resp = await fetch(`${window.SMT_SUPABASE_URL}/functions/v1/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: window.SMT_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ plan }),
    });
    const json = await resp.json().catch(() => ({}));
    if (resp.status === 501 || json.error === 'not_configured') {
      return { notConfigured: true };
    }
    if (!resp.ok || !json.url) {
      throw new Error(json.error || `checkout_failed_${resp.status}`);
    }
    return { url: json.url };
  }

  async function handlePurchaseClick(event) {
    const target = event.target && event.target.closest ? event.target : null;
    const button = target && target.closest('[data-purchase-kind]');
    if (!button) return;
    const kind = button.dataset.purchaseKind;
    if (button.dataset.purchaseOwned === 'true') return;

    const account = requireSignedInAccount();
    if (!account) {
      event.preventDefault();
      statusMsg(t('purchase.status.needSignIn'));
      if (typeof window.smtOpenSignin === 'function') window.smtOpenSignin();
      return;
    }
    if (account.id === 'local-demo') {
      statusMsg(t('purchase.status.realSignin'));
      return;
    }

    button.disabled = true;
    statusMsg('Opening secure checkout…');
    try {
      const result = await startCheckout(kind);
      if (result.notConfigured) {
        button.disabled = false;
        statusMsg('Online purchases are not enabled yet — please check back soon.');
        return;
      }
      window.location.href = result.url;
    } catch (error) {
      if (console && console.warn) console.warn('[purchase] checkout failed', error);
      button.disabled = false;
      statusMsg('Something went wrong starting checkout. Please try again.');
    }
  }

  // ----- Return from Stripe -----------------------------------------------------

  function cleanPurchaseParams() {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('purchase');
      url.searchParams.delete('plan');
      window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
    } catch {}
  }

  async function pollForEntitlement(attempts) {
    for (let i = 0; i < attempts; i++) {
      const plans = await refreshEntitlements();
      if (plans.length) return true;
      await new Promise((r) => setTimeout(r, 1500));
    }
    return false;
  }

  async function handlePurchaseReturn() {
    let outcome = '';
    try {
      outcome = new URLSearchParams(window.location.search).get('purchase') || '';
    } catch {}
    if (outcome === 'success') {
      statusMsg('Thanks! Confirming your purchase…');
      cleanPurchaseParams();
      const granted = await pollForEntitlement(6); // webhook can lag a few seconds
      statusMsg(granted ? 'Purchase confirmed — enjoy!' : 'Payment received; unlocking shortly…');
    } else if (outcome === 'cancelled') {
      statusMsg('Checkout cancelled.');
      cleanPurchaseParams();
    }
  }

  // ----- Wiring -----------------------------------------------------------------

  document.addEventListener('click', (event) => {
    void handlePurchaseClick(event);
  });
  window.addEventListener('DOMContentLoaded', () => {
    void refreshEntitlements();
    void handlePurchaseReturn();
  });
  window.addEventListener('smt:authchange', () => {
    void refreshEntitlements();
  });
  window.addEventListener('smt:languagechange', renderPurchaseGate);
  window.smtRenderPurchaseGate = renderPurchaseGate;
  window.smtRefreshEntitlements = refreshEntitlements;
})();

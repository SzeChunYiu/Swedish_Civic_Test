/* Almost Swedish — account-bound static purchase handoff */

(function () {
  const PLAN_COPY = {
    remove_ads: { locked: 'purchase.removeAds.locked', ready: 'purchase.removeAds.ready' },
    pro_lifetime: { locked: 'purchase.premium.locked', ready: 'purchase.premium.ready' },
  };
  const GOOGLE_PLAY_URL =
    'https://play.google.com/store/apps/details?id=com.billyyiu.almostswedish';

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

  function isRealPurchaseAccount(account) {
    return Boolean(account && account.id && account.id !== 'local-demo');
  }

  function status(messageKey, replacements) {
    const message = t(messageKey, replacements);
    const el = document.getElementById('purchase-status');
    if (el) el.textContent = message;
    if (window.smtFx && message) window.smtFx.toast(message, { duration: 2600 });
  }

  function setButtonState(button, account) {
    const kind = button.dataset.purchaseKind;
    const copy = PLAN_COPY[kind] || PLAN_COPY.remove_ads;
    const locked = !isRealPurchaseAccount(account);
    button.dataset.purchaseLocked = locked ? 'true' : 'false';
    button.removeAttribute('aria-disabled');
    button.disabled = false;
    button.textContent = t(locked ? copy.locked : copy.ready);
  }

  function renderPurchaseGate() {
    const account = requireSignedInAccount();
    document.querySelectorAll('[data-purchase-kind]').forEach((button) => {
      setButtonState(button, account);
    });
    if (isRealPurchaseAccount(account)) {
      status('purchase.status.ready', { account: account.email || account.id });
    }
  }

  function supabaseConfigured() {
    return Boolean(window.SMT_SUPABASE_URL && window.SMT_SUPABASE_ANON_KEY);
  }

  async function recordPurchaseIntent(kind, account) {
    if (!supabaseConfigured()) return { ok: true, skipped: true };
    if (typeof window.smtGetSupabaseClient !== 'function') {
      throw new Error('Supabase sign-in client is not available.');
    }
    const client = await window.smtGetSupabaseClient();
    if (!client) throw new Error('Supabase sign-in client is not available.');
    const { error } = await client.from('purchase_intents').insert({
      account_email: account.email || null,
      platform: 'google_play',
      plan: kind,
      status: 'pending',
      user_id: account.id,
    });
    if (error) throw error;
    return { ok: true };
  }

  function buildGooglePlayUrl(kind, account) {
    const params = new URLSearchParams({
      account_id: account.id,
      plan: kind,
      source: 'web_static',
    });
    if (account.email) params.set('account_email', account.email);
    return `${GOOGLE_PLAY_URL}&referrer=${encodeURIComponent(params.toString())}`;
  }

  async function handlePurchaseClick(event) {
    const target = event.target && event.target.closest ? event.target : null;
    const button = target && target.closest('[data-purchase-kind]');
    if (!button) return;
    const kind = button.dataset.purchaseKind;
    const account = requireSignedInAccount();
    if (!account) {
      event.preventDefault();
      status('purchase.status.needSignIn');
      if (typeof window.smtOpenSignin === 'function') window.smtOpenSignin();
      return;
    }
    if (account.id === 'local-demo') {
      status('purchase.status.realSignin');
      return;
    }
    button.disabled = true;
    status('purchase.status.preparing');
    try {
      await recordPurchaseIntent(kind, account);
      window.location.href = buildGooglePlayUrl(kind, account);
    } catch (error) {
      if (console && console.warn) console.warn('[purchase] intent failed', error);
      button.disabled = false;
      if (error && error.code === 'PGRST205') {
        status('purchase.status.backendMissing');
        return;
      }
      status('purchase.status.error');
    }
  }

  document.addEventListener('click', (event) => {
    void handlePurchaseClick(event);
  });
  window.addEventListener('DOMContentLoaded', renderPurchaseGate);
  window.addEventListener('smt:authchange', renderPurchaseGate);
  window.addEventListener('smt:languagechange', renderPurchaseGate);
  window.smtRenderPurchaseGate = renderPurchaseGate;
})();

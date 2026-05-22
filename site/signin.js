/* Sveriges Medborgartest — Sign-in modal (localized, all 12 locales) */

(function () {
  const T = {
    'signin.cta': {
      en: 'Sign in',
      sv: 'Logga in',
      'zh-Hans': '登录',
      'zh-Hant': '登入',
      ar: 'تسجيل الدخول',
      ckb: 'چوونەژوورەوە',
      fa: 'ورود',
      pl: 'Zaloguj się',
      so: 'Soo gal',
      ti: 'እቶ',
      tr: 'Giriş yap',
      uk: 'Увійти',
    },
    'signin.account': {
      en: 'Account',
      sv: 'Konto',
      'zh-Hans': '账户',
      'zh-Hant': '帳號',
      ar: 'الحساب',
      ckb: 'هەژمار',
      fa: 'حساب',
      pl: 'Konto',
      so: 'Akoon',
      ti: 'ሕሳብ',
      tr: 'Hesap',
      uk: 'Обліковий запис',
    },
    'signin.signout': {
      en: 'Sign out',
      sv: 'Logga ut',
      'zh-Hans': '退出登录',
      'zh-Hant': '登出',
      ar: 'تسجيل الخروج',
      ckb: 'چوونەدەرەوە',
      fa: 'خروج',
      pl: 'Wyloguj się',
      so: 'Ka bax',
      ti: 'ውጻእ',
      tr: 'Çıkış yap',
      uk: 'Вийти',
    },
    'signin.signedin': {
      en: "You're signed in. Your highlights, notes, and dashboard sync across your devices.",
      sv: 'Du är inloggad. Dina markeringar, anteckningar och panel synkas mellan dina enheter.',
      'zh-Hans': '你已登录。你的标注、笔记和学习面板会在设备间同步。',
      'zh-Hant': '你已登入。你的標註、筆記和學習面板會在裝置間同步。',
      ar: 'لقد سجّلت الدخول. تتزامن تظليلاتك وملاحظاتك ولوحتك عبر أجهزتك.',
      ckb: 'چوویتە ژوورەوە. هایلایت، تێبینی و داشبۆردەکەت لەنێوان ئامێرەکانت هاوکات دەبن.',
      fa: 'وارد شده‌ای. هایلایت‌ها، یادداشت‌ها و داشبوردت بین دستگاه‌هایت همگام می‌شوند.',
      pl: 'Jesteś zalogowany. Twoje zaznaczenia, notatki i panel synchronizują się między urządzeniami.',
      so: 'Waad gashay. Calaamadahaaga, qoraalladaada iyo dashboard-kaaga ayaa isugu dhban qalabkaaga.',
      ti: 'ኣቲኻ ኣለኻ። ምልክታትካ፣ መዘኻኸርን ዳሽቦርድካን ኣብ መሳርሕታትካ ይሳነዩ።',
      tr: 'Giriş yaptın. Vurguların, notların ve panon cihazlarında senkronize olur.',
      uk: 'Ви увійшли. Виділення, нотатки та панель синхронізуються між пристроями.',
    },
    'signin.lede': {
      en: 'Save your highlights, notes, and progress across devices. Totally optional — everything works without an account.',
      sv: 'Spara dina markeringar, anteckningar och framsteg på alla enheter. Helt valfritt — allt fungerar utan konto.',
      'zh-Hans': '跨设备保存你的标注、笔记和学习进度。完全可选——不登录也能使用全部功能。',
      'zh-Hant': '跨裝置儲存你的標註、筆記和學習進度。完全可選——不登入也能使用全部功能。',
      ar: 'احفظ تظليلاتك وملاحظاتك وتقدّمك عبر كل أجهزتك. اختياري تمامًا — كل شيء يعمل بدون حساب.',
      ckb: 'هایلایت، تێبینی و پێشکەوتنەکانت لەسەر هەموو ئامێرەکان پاشەکەوت بکە. تەواو ئیختیارییە — هەموو شتێک بێ هەژمار کار دەکات.',
      fa: 'هایلایت‌ها، یادداشت‌ها و پیشرفتت را روی همه دستگاه‌ها ذخیره کن. کاملاً اختیاری — همه‌چیز بدون حساب کار می‌کند.',
      pl: 'Zapisuj zaznaczenia, notatki i postępy na wszystkich urządzeniach. Całkowicie opcjonalne — wszystko działa bez konta.',
      so: 'Kaydi calaamadahaaga, qoraalladaada iyo horumarkaaga dhammaan qalabkaaga. Gabi ahaanba ikhtiyaari — wax walba way shaqeeyaan iyada oo aan akoon loo baahnayn.',
      ti: 'ምልክታትካ፣ መዘኻኸርን ምዕባለኻን ኣብ ኩሎም መሳርሕታት ኣቐምጥ። ምሉእ ብምሉእ ኣማራጺ — ኩሉ ነገር ብዘይ ሕሳብ ይሰርሕ።',
      tr: 'Vurgularını, notlarını ve ilerlemeni tüm cihazlarda kaydet. Tamamen isteğe bağlı — her şey hesapsız çalışır.',
      uk: "Зберігайте свої виділення, нотатки та прогрес на всіх пристроях. Цілком необов'язково — усе працює без облікового запису.",
    },
    'signin.google': {
      en: 'Continue with Google',
      sv: 'Fortsätt med Google',
      'zh-Hans': '使用 Google 继续',
      'zh-Hant': '使用 Google 繼續',
      ar: 'المتابعة باستخدام Google',
      ckb: 'بەردەوامبوون بە Google',
      fa: 'ادامه با Google',
      pl: 'Kontynuuj z Google',
      so: 'Ku sii wad Google',
      ti: 'ብ Google ቀጽል',
      tr: 'Google ile devam et',
      uk: 'Продовжити з Google',
    },
    'signin.apple': {
      en: 'Continue with Apple',
      sv: 'Fortsätt med Apple',
      'zh-Hans': '使用 Apple 继续',
      'zh-Hant': '使用 Apple 繼續',
      ar: 'المتابعة باستخدام Apple',
      ckb: 'بەردەوامبوون بە Apple',
      fa: 'ادامه با Apple',
      pl: 'Kontynuuj z Apple',
      so: 'Ku sii wad Apple',
      ti: 'ብ Apple ቀጽል',
      tr: 'Apple ile devam et',
      uk: 'Продовжити з Apple',
    },
    'signin.or': {
      en: 'or',
      sv: 'eller',
      'zh-Hans': '或',
      'zh-Hant': '或',
      ar: 'أو',
      ckb: 'یان',
      fa: 'یا',
      pl: 'lub',
      so: 'ama',
      ti: 'ወይ',
      tr: 'veya',
      uk: 'або',
    },
    'signin.email.label': {
      en: 'Email address',
      sv: 'E-postadress',
      'zh-Hans': '电子邮件地址',
      'zh-Hant': '電子郵件地址',
      ar: 'عنوان البريد الإلكتروني',
      ckb: 'ناونیشانی ئیمەیڵ',
      fa: 'نشانی ایمیل',
      pl: 'Adres e-mail',
      so: 'Cinwaanka iimaylka',
      ti: 'ኣድራሻ ኢመይል',
      tr: 'E-posta adresi',
      uk: 'Адреса електронної пошти',
    },
    'signin.email.placeholder': {
      en: 'you@example.com',
      sv: 'namn@example.com',
      'zh-Hans': 'name@example.com',
      'zh-Hant': 'name@example.com',
      ar: 'name@example.com',
      ckb: 'name@example.com',
      fa: 'name@example.com',
      pl: 'imie@example.com',
      so: 'magac@example.com',
      ti: 'name@example.com',
      tr: 'ad@example.com',
      uk: 'name@example.com',
    },
    'signin.magic': {
      en: 'Email me a magic link',
      sv: 'Mejla mig en magisk länk',
      'zh-Hans': '给我发送登录链接',
      'zh-Hant': '寄給我登入連結',
      ar: 'أرسل لي رابط دخول عبر البريد',
      ckb: 'بەستەرێکی چوونەژوورەوەم بۆ بنێرە',
      fa: 'لینک ورود را برایم ایمیل کن',
      pl: 'Wyślij mi magiczny link',
      so: 'Ii soo dir link gelitaan',
      ti: 'ናይ መእተዊ መላግቦ ስደደለይ',
      tr: 'Bana sihirli bağlantı gönder',
      uk: 'Надішліть мені магічне посилання',
    },
    'signin.fineprint': {
      en: 'No password needed. We never post anything or share your study data.',
      sv: 'Inget lösenord behövs. Vi publicerar aldrig något och delar aldrig dina studiedata.',
      'zh-Hans': '无需密码。我们绝不会发布任何内容，也不会分享你的学习数据。',
      'zh-Hant': '不需要密碼。我們絕不會發布任何內容，也不會分享你的學習資料。',
      ar: 'لا حاجة لكلمة مرور. لا ننشر أي شيء أبدًا ولا نشارك بيانات دراستك.',
      ckb: 'پێویست بە تێپەڕەووشە نییە. هەرگیز هیچ شتێک بڵاو ناکەینەوە و داتای خوێندنت بەش ناکەین.',
      fa: 'نیازی به رمز عبور نیست. ما هرگز چیزی منتشر نمی‌کنیم و داده‌های مطالعه‌ات را به اشتراک نمی‌گذاریم.',
      pl: 'Hasło nie jest potrzebne. Niczego nie publikujemy ani nie udostępniamy Twoich danych nauki.',
      so: 'Furaha sirta looma baahna. Waligayo waxba ma daabacno mana wadaagno xogtaada waxbarashada.',
      ti: 'መሕለፊ ቃል ኣየድልን። ዝኾነ ነገር ኣይነዝርግሕን ሓበሬታ መጽናዕትኻ ኣይነካፍልን።',
      tr: 'Şifre gerekmez. Asla bir şey paylaşmaz veya çalışma verilerinizi paylaşmayız.',
      uk: 'Пароль не потрібен. Ми ніколи нічого не публікуємо й не передаємо ваші навчальні дані.',
    },
    'signin.magicsent': {
      en: 'Check your email for the sign-in link.',
      sv: 'Kolla din e-post efter inloggningslänken.',
      'zh-Hans': '请查收邮件中的登录链接。',
      'zh-Hant': '請查收電子郵件中的登入連結。',
      ar: 'تحقّق من بريدك للحصول على رابط تسجيل الدخول.',
      ckb: 'ئیمەیڵەکەت بپشکنە بۆ بەستەری چوونەژوورەوە.',
      fa: 'ایمیلت را برای لینک ورود بررسی کن.',
      pl: 'Sprawdź e-mail, aby znaleźć link do logowania.',
      so: 'Hubi iimaylkaaga si aad u hesho linkiga gelitaanka.',
      ti: 'ኢመይልካ ንመላግቦ መእተዊ ፈትሽ።',
      tr: 'Giriş bağlantısı için e-postanı kontrol et.',
      uk: 'Перевірте пошту — там посилання для входу.',
    },
    'signin.toast': {
      en: 'Signed in. Highlights & notes enabled.',
      sv: 'Inloggad. Markeringar och anteckningar är på.',
      'zh-Hans': '已登录。标注和笔记已启用。',
      'zh-Hant': '已登入。標註和筆記已啟用。',
      ar: 'تم تسجيل الدخول. تم تفعيل التظليلات والملاحظات.',
      ckb: 'چوویتە ژوورەوە. هایلایت و تێبینییەکان چالاککران.',
      fa: 'وارد شدی. هایلایت‌ها و یادداشت‌ها فعال شدند.',
      pl: 'Zalogowano. Zaznaczenia i notatki włączone.',
      so: 'Waad gashay. Calaamadaha iyo qoraallada waa la furay.',
      ti: 'ኣቲኻ። ምልክታትን መዘኻኸርን ተኸፊቶም።',
      tr: 'Giriş yapıldı. Vurgular ve notlar etkin.',
      uk: 'Ви увійшли. Виділення та нотатки увімкнено.',
    },
  };

  // ----------------------------------------------------------------
  // Supabase config (PUBLIC values, read from index.html). When BOTH are
  // present we perform REAL OAuth; otherwise we keep the local-only stub.
  // ----------------------------------------------------------------
  function supaUrl() {
    return (typeof window !== 'undefined' && window.SMT_SUPABASE_URL) || '';
  }
  function supaKey() {
    return (typeof window !== 'undefined' && window.SMT_SUPABASE_ANON_KEY) || '';
  }
  function isConfigured() {
    return Boolean(supaUrl() && supaKey());
  }

  // Lazy singleton Supabase client. The SDK is only fetched from the CDN when
  // configured AND a provider/magic-link action is taken (or on load to pick
  // up an existing session). Unconfigured visitors never touch the network.
  let _clientPromise = null;
  function getClient() {
    if (!isConfigured()) return Promise.resolve(null);
    if (!_clientPromise) {
      _clientPromise = import('https://esm.sh/@supabase/supabase-js@2')
        .then((mod) => {
          const createClient = mod.createClient || (mod.default && mod.default.createClient);
          if (!createClient) throw new Error('supabase-js: createClient missing');
          const client = createClient(supaUrl(), supaKey());
          // detectSessionInUrl defaults to true in v2 → handles OAuth redirect-back.
          client.auth.onAuthStateChange((event, session) => {
            applySession(session);
          });
          return client;
        })
        .catch((err) => {
          // Don't spam: log once, then disable real auth for this page load.
          _clientPromise = null;
          if (window.console && console.warn)
            console.warn('[signin] Supabase load failed; using local stub.', err);
          return null;
        });
    }
    return _clientPromise;
  }

  // Reflect a Supabase session into localStorage + notify the app.
  function applySession(session) {
    const wasSignedIn = signedIn();
    const nowSignedIn = Boolean(session);
    try {
      if (nowSignedIn && session.user && session.user.id) {
        localStorage.setItem('smt_signed_in', '1');
        localStorage.setItem('smt_account_id', session.user.id);
        localStorage.setItem(
          'smt_account_email',
          session.user.email || session.user.user_metadata?.email || '',
        );
      } else {
        localStorage.removeItem('smt_signed_in');
        localStorage.removeItem('smt_account_id');
        localStorage.removeItem('smt_account_email');
      }
    } catch {}
    if (nowSignedIn !== wasSignedIn) {
      localize();
      try {
        window.dispatchEvent(new Event('smt:authchange'));
      } catch {}
    } else {
      localize();
    }
  }

  function redirectTarget() {
    try {
      const configuredOrigin =
        typeof window !== 'undefined' && typeof window.SMT_SITE_ORIGIN === 'string'
          ? window.SMT_SITE_ORIGIN.replace(/\/+$/, '')
          : '';
      const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
      const origin = configuredOrigin && !isLocal ? configuredOrigin : location.origin;
      return origin + location.pathname;
    } catch {
      return undefined;
    }
  }

  function lang() {
    try {
      return localStorage.getItem('smt_lang') || 'en';
    } catch {
      return 'en';
    }
  }
  function t(key) {
    const m = T[key] || {};
    return m[lang()] || m.en || '';
  }
  function signedIn() {
    try {
      return localStorage.getItem('smt_signed_in') === '1';
    } catch {
      return false;
    }
  }

  function open() {
    const m = document.getElementById('signin-modal');
    if (!m) return;
    // Show the account/sign-out view when already signed in, the login form otherwise.
    const signed = signedIn();
    const loginSec = m.querySelector('.signin__login');
    const acctSec = m.querySelector('.signin__account');
    if (loginSec) loginSec.hidden = signed;
    if (acctSec) acctSec.hidden = !signed;
    localize();
    m.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function close() {
    const m = document.getElementById('signin-modal');
    if (m) m.hidden = true;
    document.body.style.overflow = '';
  }

  function localize() {
    // Localize every tagged element inside the modal.
    document.querySelectorAll('#signin-modal [data-sk]').forEach((el) => {
      const v = t(el.dataset.sk);
      if (v) el.textContent = v;
    });
    document.querySelectorAll('#signin-modal [data-sk-placeholder]').forEach((el) => {
      const v = t(el.dataset.skPlaceholder);
      if (v) el.setAttribute('placeholder', v);
    });
    document.querySelectorAll('#signin-modal [data-sk-aria-label]').forEach((el) => {
      const v = t(el.dataset.skAriaLabel);
      if (v) el.setAttribute('aria-label', v);
    });
    // Trigger label depends on signed-in state.
    const btn = document.getElementById('signin-open');
    if (btn) {
      const triggerText = signedIn() ? t('signin.account') : t('signin.cta');
      const label = btn.querySelector('span:not([aria-hidden])');
      if (label) label.textContent = triggerText;
      btn.title = triggerText;
      btn.setAttribute('aria-label', triggerText);
      btn.classList.toggle('is-signed', signedIn());
    }
  }

  // Local-only stub used when Supabase is NOT configured. This preserves the
  // exact original behaviour: flip the flag, close, toast, notify.
  function stubSignIn() {
    try {
      localStorage.setItem('smt_signed_in', '1');
      localStorage.setItem('smt_account_id', 'local-demo');
      localStorage.setItem('smt_account_email', 'local-demo@example.invalid');
    } catch {}
    close();
    if (window.smtFx) window.smtFx.toast(t('signin.toast'), { duration: 2400 });
    localize();
    // Let the dashboard (login-gated) react.
    try {
      window.dispatchEvent(new Event('smt:authchange'));
    } catch {}
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('#signin-open')) {
      open();
      return;
    }
    if (e.target.closest('#signin-modal [data-close="signin"]')) {
      close();
      return;
    }

    const provBtn = e.target.closest('#signin-modal .signin__btn, #signin-modal .btn--gold');
    if (provBtn) {
      // ----- REAL OAuth / magic-link path (only when configured) -----
      if (isConfigured()) {
        const magicBtn = e.target.closest('#signin-modal .signin__magic, #signin-modal .btn--gold');
        const prov = provBtn.getAttribute('data-prov'); // "google" | "apple" | null
        getClient().then((client) => {
          if (!client) {
            stubSignIn();
            return;
          } // SDK failed to load → safe fallback
          if (prov === 'google' || prov === 'apple') {
            client.auth
              .signInWithOAuth({
                provider: prov,
                options: { redirectTo: redirectTarget() },
              })
              .catch((err) => {
                if (console && console.warn) console.warn('[signin] OAuth error', err);
              });
          } else if (magicBtn) {
            const input = document.querySelector('#signin-modal .signin__input');
            const email = input && input.value ? input.value.trim() : '';
            if (!email) {
              if (input) input.focus();
              return;
            }
            client.auth
              .signInWithOtp({
                email,
                options: { emailRedirectTo: redirectTarget() },
              })
              .then(() => {
                close();
                if (window.smtFx) window.smtFx.toast(t('signin.magicsent'), { duration: 2800 });
              })
              .catch((err) => {
                if (console && console.warn) console.warn('[signin] OTP error', err);
              });
          }
        });
        return;
      }
      // ----- Unconfigured: original local-only stub (unchanged) -----
      stubSignIn();
      return;
    }

    if (e.target.closest('#signout')) {
      try {
        localStorage.removeItem('smt_signed_in');
        localStorage.removeItem('smt_account_id');
        localStorage.removeItem('smt_account_email');
      } catch {}
      close();
      localize();
      try {
        window.dispatchEvent(new Event('smt:authchange'));
      } catch {}
      // Also clear the server-side Supabase session so getSession() on the next
      // page load doesn't silently re-sign the user back in.
      if (isConfigured()) {
        getClient().then((client) => {
          if (client) client.auth.signOut().catch(() => {});
        });
      }
      return;
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const m = document.getElementById('signin-modal');
      if (m && !m.hidden) close();
    }
  });

  // On load: when configured, load the client (which registers
  // onAuthStateChange) and read any existing session — this also captures the
  // session created by an OAuth redirect-back. When unconfigured this is a
  // no-op (getClient resolves null without touching the network).
  function initAuth() {
    if (!isConfigured()) return;
    getClient().then((client) => {
      if (!client) return;
      client.auth
        .getSession()
        .then(({ data }) => {
          applySession(data && data.session ? data.session : null);
        })
        .catch(() => {});
    });
  }

  window.addEventListener('DOMContentLoaded', () => {
    localize();
    initAuth();
  });
  window.addEventListener('smt:languagechange', localize);

  window.smtOpenSignin = open;
  window.smtIsSignedIn = signedIn;
  window.smtGetSupabaseClient = getClient;
})();

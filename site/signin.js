/* Sveriges Medborgartest — Sign-in modal (localized, all 12 locales) */

(function () {
  const T = {
    "signin.cta": { en: "Sign in", sv: "Logga in", "zh-Hans": "登录", "zh-Hant": "登入", ar: "تسجيل الدخول", ckb: "چوونەژوورەوە", fa: "ورود", pl: "Zaloguj się", so: "Soo gal", ti: "እቶ", tr: "Giriş yap", uk: "Увійти" },
    "signin.account": { en: "Account", sv: "Konto", "zh-Hans": "账户", "zh-Hant": "帳號", ar: "الحساب", ckb: "هەژمار", fa: "حساب", pl: "Konto", so: "Akoon", ti: "ሕሳብ", tr: "Hesap", uk: "Обліковий запис" },
    "signin.signout": { en: "Sign out", sv: "Logga ut", "zh-Hans": "退出登录", "zh-Hant": "登出", ar: "تسجيل الخروج", ckb: "چوونەدەرەوە", fa: "خروج", pl: "Wyloguj się", so: "Ka bax", ti: "ውጻእ", tr: "Çıkış yap", uk: "Вийти" },
    "signin.lede": {
      en: "Save your highlights, notes, and progress across devices. Totally optional — everything works without an account.",
      sv: "Spara dina markeringar, anteckningar och framsteg på alla enheter. Helt valfritt — allt fungerar utan konto.",
      "zh-Hans": "跨设备保存你的标注、笔记和学习进度。完全可选——不登录也能使用全部功能。",
      "zh-Hant": "跨裝置儲存你的標註、筆記和學習進度。完全可選——不登入也能使用全部功能。",
      ar: "احفظ تظليلاتك وملاحظاتك وتقدّمك عبر كل أجهزتك. اختياري تمامًا — كل شيء يعمل بدون حساب.",
      ckb: "هایلایت، تێبینی و پێشکەوتنەکانت لەسەر هەموو ئامێرەکان پاشەکەوت بکە. تەواو ئیختیارییە — هەموو شتێک بێ هەژمار کار دەکات.",
      fa: "هایلایت‌ها، یادداشت‌ها و پیشرفتت را روی همه دستگاه‌ها ذخیره کن. کاملاً اختیاری — همه‌چیز بدون حساب کار می‌کند.",
      pl: "Zapisuj zaznaczenia, notatki i postępy na wszystkich urządzeniach. Całkowicie opcjonalne — wszystko działa bez konta.",
      so: "Kaydi calaamadahaaga, qoraalladaada iyo horumarkaaga dhammaan qalabkaaga. Gabi ahaanba ikhtiyaari — wax walba way shaqeeyaan iyada oo aan akoon loo baahnayn.",
      ti: "ምልክታትካ፣ መዘኻኸርን ምዕባለኻን ኣብ ኩሎም መሳርሕታት ኣቐምጥ። ምሉእ ብምሉእ ኣማራጺ — ኩሉ ነገር ብዘይ ሕሳብ ይሰርሕ።",
      tr: "Vurgularını, notlarını ve ilerlemeni tüm cihazlarda kaydet. Tamamen isteğe bağlı — her şey hesapsız çalışır.",
      uk: "Зберігайте свої виділення, нотатки та прогрес на всіх пристроях. Цілком необов'язково — усе працює без облікового запису.",
    },
    "signin.google": { en: "Continue with Google", sv: "Fortsätt med Google", "zh-Hans": "使用 Google 继续", "zh-Hant": "使用 Google 繼續", ar: "المتابعة باستخدام Google", ckb: "بەردەوامبوون بە Google", fa: "ادامه با Google", pl: "Kontynuuj z Google", so: "Ku sii wad Google", ti: "ብ Google ቀጽል", tr: "Google ile devam et", uk: "Продовжити з Google" },
    "signin.apple": { en: "Continue with Apple", sv: "Fortsätt med Apple", "zh-Hans": "使用 Apple 继续", "zh-Hant": "使用 Apple 繼續", ar: "المتابعة باستخدام Apple", ckb: "بەردەوامبوون بە Apple", fa: "ادامه با Apple", pl: "Kontynuuj z Apple", so: "Ku sii wad Apple", ti: "ብ Apple ቀጽል", tr: "Apple ile devam et", uk: "Продовжити з Apple" },
    "signin.or": { en: "or", sv: "eller", "zh-Hans": "或", "zh-Hant": "或", ar: "أو", ckb: "یان", fa: "یا", pl: "lub", so: "ama", ti: "ወይ", tr: "veya", uk: "або" },
    "signin.magic": { en: "Email me a magic link", sv: "Mejla mig en magisk länk", "zh-Hans": "给我发送登录链接", "zh-Hant": "寄給我登入連結", ar: "أرسل لي رابط دخول عبر البريد", ckb: "بەستەرێکی چوونەژوورەوەم بۆ بنێرە", fa: "لینک ورود را برایم ایمیل کن", pl: "Wyślij mi magiczny link", so: "Ii soo dir link gelitaan", ti: "ናይ መእተዊ መላግቦ ስደደለይ", tr: "Bana sihirli bağlantı gönder", uk: "Надішліть мені магічне посилання" },
    "signin.fineprint": {
      en: "No password needed. We never post anything or share your study data.",
      sv: "Inget lösenord behövs. Vi publicerar aldrig något och delar aldrig dina studiedata.",
      "zh-Hans": "无需密码。我们绝不会发布任何内容，也不会分享你的学习数据。",
      "zh-Hant": "不需要密碼。我們絕不會發布任何內容，也不會分享你的學習資料。",
      ar: "لا حاجة لكلمة مرور. لا ننشر أي شيء أبدًا ولا نشارك بيانات دراستك.",
      ckb: "پێویست بە تێپەڕەووشە نییە. هەرگیز هیچ شتێک بڵاو ناکەینەوە و داتای خوێندنت بەش ناکەین.",
      fa: "نیازی به رمز عبور نیست. ما هرگز چیزی منتشر نمی‌کنیم و داده‌های مطالعه‌ات را به اشتراک نمی‌گذاریم.",
      pl: "Hasło nie jest potrzebne. Niczego nie publikujemy ani nie udostępniamy Twoich danych nauki.",
      so: "Furaha sirta looma baahna. Waligayo waxba ma daabacno mana wadaagno xogtaada waxbarashada.",
      ti: "መሕለፊ ቃል ኣየድልን። ዝኾነ ነገር ኣይነዝርግሕን ሓበሬታ መጽናዕትኻ ኣይነካፍልን።",
      tr: "Şifre gerekmez. Asla bir şey paylaşmaz veya çalışma verilerinizi paylaşmayız.",
      uk: "Пароль не потрібен. Ми ніколи нічого не публікуємо й не передаємо ваші навчальні дані.",
    },
    "signin.toast": {
      en: "Signed in. Highlights & notes enabled.",
      sv: "Inloggad. Markeringar och anteckningar är på.",
      "zh-Hans": "已登录。标注和笔记已启用。",
      "zh-Hant": "已登入。標註和筆記已啟用。",
      ar: "تم تسجيل الدخول. تم تفعيل التظليلات والملاحظات.",
      ckb: "چوویتە ژوورەوە. هایلایت و تێبینییەکان چالاککران.",
      fa: "وارد شدی. هایلایت‌ها و یادداشت‌ها فعال شدند.",
      pl: "Zalogowano. Zaznaczenia i notatki włączone.",
      so: "Waad gashay. Calaamadaha iyo qoraallada waa la furay.",
      ti: "ኣቲኻ። ምልክታትን መዘኻኸርን ተኸፊቶም።",
      tr: "Giriş yapıldı. Vurgular ve notlar etkin.",
      uk: "Ви увійшли. Виділення та нотатки увімкнено.",
    },
  };

  function lang() {
    try { return localStorage.getItem("smt_lang") || "en"; } catch { return "en"; }
  }
  function t(key) {
    const m = T[key] || {};
    return m[lang()] || m.en || "";
  }
  function signedIn() {
    try { return localStorage.getItem("smt_signed_in") === "1"; } catch { return false; }
  }

  function open() {
    const m = document.getElementById("signin-modal");
    if (m) m.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function close() {
    const m = document.getElementById("signin-modal");
    if (m) m.hidden = true;
    document.body.style.overflow = "";
  }

  function localize() {
    // Localize every tagged element inside the modal.
    document.querySelectorAll("#signin-modal [data-sk]").forEach((el) => {
      const v = t(el.dataset.sk);
      if (v) el.textContent = v;
    });
    // Trigger label depends on signed-in state.
    const btn = document.getElementById("signin-open");
    if (btn) {
      const label = btn.querySelector("span:not([aria-hidden])");
      if (label) label.textContent = signedIn() ? t("signin.account") : t("signin.cta");
      btn.classList.toggle("is-signed", signedIn());
    }
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest("#signin-open")) { open(); return; }
    if (e.target.closest('#signin-modal [data-close="signin"]')) { close(); return; }
    // Any provider button or magic-link button "signs in" (stub until Supabase auth lands).
    const provBtn = e.target.closest("#signin-modal .signin__btn, #signin-modal .btn--gold");
    if (provBtn) {
      try { localStorage.setItem("smt_signed_in", "1"); } catch {}
      close();
      if (window.smtFx) window.smtFx.toast(t("signin.toast"), { duration: 2400 });
      localize();
      // Let the dashboard (login-gated) react.
      try { window.dispatchEvent(new Event("smt:authchange")); } catch {}
      return;
    }
    if (e.target.closest("#signout")) {
      try { localStorage.removeItem("smt_signed_in"); } catch {}
      localize();
      try { window.dispatchEvent(new Event("smt:authchange")); } catch {}
      return;
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const m = document.getElementById("signin-modal");
      if (m && !m.hidden) close();
    }
  });

  window.addEventListener("DOMContentLoaded", localize);
  window.addEventListener("smt:languagechange", localize);

  window.smtOpenSignin = open;
  window.smtIsSignedIn = signedIn;
})();

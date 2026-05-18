/* Sveriges Medborgartest — Sign-in modal */

(function () {
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

  document.addEventListener("click", (e) => {
    if (e.target.closest("#signin-open")) { open(); return; }
    if (e.target.closest('#signin-modal [data-close="signin"]')) { close(); return; }
    // Any provider button or magic-link button "signs in" (stub)
    const provBtn = e.target.closest("#signin-modal .signin__btn, #signin-modal .btn--gold");
    if (provBtn) {
      try { localStorage.setItem("smt_signed_in", "1"); } catch {}
      close();
      if (window.smtFx) window.smtFx.toast(
        (localStorage.getItem("smt_lang") || "en") === "sv"
          ? "Inloggad. Markeringar och anteckningar är på."
          : "Signed in. Highlights & notes enabled.",
        { duration: 2400 }
      );
      updateAuthChrome();
      return;
    }
    if (e.target.closest("#signout")) {
      try { localStorage.removeItem("smt_signed_in"); } catch {}
      updateAuthChrome();
      return;
    }
  });

  function updateAuthChrome() {
    const signed = (function () { try { return localStorage.getItem("smt_signed_in") === "1"; } catch { return false; } })();
    const btn = document.getElementById("signin-open");
    if (!btn) return;
    const label = btn.querySelector("span:not([aria-hidden])");
    if (label) label.textContent = signed
      ? ((localStorage.getItem("smt_lang") || "en") === "sv" ? "Konto" : "Account")
      : ((localStorage.getItem("smt_lang") || "en") === "sv" ? "Logga in" : "Sign in");
    btn.classList.toggle("is-signed", signed);
  }
  window.addEventListener("DOMContentLoaded", updateAuthChrome);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const m = document.getElementById("signin-modal");
      if (m && !m.hidden) close();
    }
  });

  window.smtOpenSignin = open;
})();

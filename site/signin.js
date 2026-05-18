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
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const m = document.getElementById("signin-modal");
      if (m && !m.hidden) close();
    }
  });

  window.smtOpenSignin = open;
})();

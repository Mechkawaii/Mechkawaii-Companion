(function () {
  "use strict";

  const PREFIX = "mechkawaii:";

  function shouldForceHome() {
    return location.hash === "#home" || sessionStorage.getItem(PREFIX + "forceHomeMenu") === "1";
  }

  function forceHomeMenu() {
    if (!shouldForceHome()) return;

    sessionStorage.removeItem(PREFIX + "forceHomeMenu");
    sessionStorage.setItem(PREFIX + "skipResumeOnce", "1");

    localStorage.removeItem(PREFIX + "splashDismissed");
    document.documentElement.classList.remove("splash-dismissed");
    document.body?.classList.add("has-splash");

    const splash = document.querySelector("#splash");
    if (splash) {
      splash.style.display = "";
      splash.classList.remove("hidden");
    }

    ["#setupCard", "#draftCard", "#terrainPage", "#charList"].forEach(selector => {
      const el = document.querySelector(selector);
      if (!el) return;
      if (selector === "#charList") el.innerHTML = "";
      else el.style.display = "none";
    });

    document.querySelector("#unitTabsContainer")?.classList.add("hidden");

    if (location.hash === "#home") {
      history.replaceState(null, "", location.pathname.split("/").pop() ? "./index.html" : "./");
    }
  }

  function init() {
    forceHomeMenu();
    setTimeout(forceHomeMenu, 80);
    setTimeout(forceHomeMenu, 300);
    setTimeout(forceHomeMenu, 900);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

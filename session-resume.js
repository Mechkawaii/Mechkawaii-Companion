(function () {
  "use strict";

  const PREFIX = "mechkawaii:";

  function isIndexPage() {
    const path = location.pathname.split("/").pop() || "index.html";
    return path === "index.html" || path === "";
  }

  function readJson(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function resumeSessionIfNeeded() {
    if (!isIndexPage()) return;
    if (location.hash === "#terrain") return;
    if (sessionStorage.getItem(PREFIX + "skipResumeOnce") === "1") {
      sessionStorage.removeItem(PREFIX + "skipResumeOnce");
      return;
    }

    const setup = readJson(PREFIX + "setup");
    const draft = readJson(PREFIX + "draft");
    const activeIds = Array.isArray(draft?.activeIds) ? draft.activeIds : [];

    if (!setup || activeIds.length === 0) return;

    location.replace("./character.html?id=" + encodeURIComponent(activeIds[0]));
  }

  resumeSessionIfNeeded();
})();
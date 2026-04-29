(function () {
  "use strict";

  const ROW_CLASS = "mkw-mobile-cu-badge-row";
  const BADGE_CLASS = "mkw-mobile-cu-badge";
  const EMPTY_BADGE_CLASS = "mkw-mobile-cu-badge-empty";
  let isSyncing = false;

  function isMobile() {
    return window.matchMedia && window.matchMedia("(max-width: 560px)").matches;
  }

  function markerFor(el) {
    if (!el) return "";
    const img = el instanceof HTMLImageElement ? el : el.querySelector?.("img");
    const src = String(img?.getAttribute("src") || el.getAttribute?.("src") || "").toLowerCase();
    const alt = String(img?.getAttribute("alt") || el.getAttribute?.("alt") || "").toLowerCase();
    const cls = String(el.className || "").toLowerCase();
    const id = String(el.id || "").toLowerCase();
    return `${src} ${alt} ${cls} ${id}`;
  }

  function isEmptyCuBadge(el) {
    const marker = markerFor(el);
    return marker.includes("cu_vide") ||
      marker.includes("cu-vide") ||
      marker.includes("cuvide") ||
      marker.includes("cu vide") ||
      marker.includes("empty") ||
      marker.includes("vide") ||
      marker.includes("placeholder") ||
      marker.includes("off");
  }

  function isCuBadgeImage(img) {
    if (!(img instanceof HTMLImageElement)) return false;
    if (!img.closest(".page-character .topbar")) return false;
    if (img.closest("#charPortrait")) return false;
    if (img.closest("#mkwEnergyInlineStatus")) return false;

    const marker = markerFor(img);

    if (marker.includes("energy_") || marker.includes("pv") || marker.includes("heart") || marker.includes("portrait")) return false;

    return marker.includes("cu_") ||
      marker.includes("coup") ||
      marker.includes("unique") ||
      marker.includes("ultimate") ||
      marker.includes("ult") ||
      marker.includes("badge");
  }

  function badgeRoot(img) {
    const root = img.closest("button, a, [role='button'], [class*='badge'], [class*='Badge'], [class*='cu'], [class*='CU'], [class*='ult'], [class*='Ult']");
    if (root && root.closest(".page-character .topbar") && !root.closest("#charPortrait") && !root.closest("#mkwEnergyInlineStatus") && !root.classList.contains(ROW_CLASS)) return root;
    return img;
  }

  function looksLikeRemoveControl(el, badgeRootEl) {
    if (!(el instanceof Element) || el === badgeRootEl) return false;
    const text = String(el.textContent || "").trim().toLowerCase();
    const aria = String(el.getAttribute("aria-label") || "").toLowerCase();
    const title = String(el.getAttribute("title") || "").toLowerCase();
    const cls = String(el.className || "").toLowerCase();
    const id = String(el.id || "").toLowerCase();
    const marker = `${text} ${aria} ${title} ${cls} ${id}`;

    return text === "×" || text === "x" || text === "✕" || text === "✖" ||
      marker.includes("close") ||
      marker.includes("remove") ||
      marker.includes("delete") ||
      marker.includes("retir") ||
      marker.includes("suppr") ||
      marker.includes("dismiss");
  }

  function stripRemoveControls(root) {
    if (!(root instanceof Element)) return;
    root.querySelectorAll("button, [role='button'], [aria-label], [title], [class], [id]").forEach(el => {
      if (looksLikeRemoveControl(el, root)) el.remove();
    });
  }

  function keyForBadge(el) {
    const img = el instanceof HTMLImageElement ? el : el.querySelector?.("img");
    return String(img?.getAttribute("src") || el.getAttribute?.("src") || el.outerHTML || "").toLowerCase();
  }

  function cleanRow(row) {
    const seen = new Set();
    Array.from(row.children).forEach(child => {
      stripRemoveControls(child);
      const img = child instanceof HTMLImageElement ? child : child.querySelector?.("img");
      const key = keyForBadge(child);

      if (!img || seen.has(key)) {
        child.remove();
        return;
      }

      child.classList.toggle(EMPTY_BADGE_CLASS, isEmptyCuBadge(child));
      seen.add(key);
    });
  }

  function sortRow(row) {
    const children = Array.from(row.children);
    const emptyBadges = children.filter(isEmptyCuBadge);
    const fullBadges = children.filter(child => !isEmptyCuBadge(child));
    [...emptyBadges, ...fullBadges].slice(0, 3).forEach(child => row.appendChild(child));
    Array.from(row.children).slice(3).forEach(child => child.remove());
  }

  function syncBadges() {
    if (isSyncing || !isMobile()) return;
    isSyncing = true;

    try {
      const topbar = document.querySelector(".page-character .topbar");
      const brand = document.querySelector(".page-character .brand-with-portrait");
      if (!topbar || !brand) return;

      let row = topbar.querySelector(`.${ROW_CLASS}`);
      if (!row) {
        row = document.createElement("div");
        row.className = ROW_CLASS;
        row.setAttribute("aria-label", "Badges Coup Unique");
        topbar.appendChild(row);
      }

      cleanRow(row);

      const roots = [];
      topbar.querySelectorAll("img").forEach(img => {
        if (!isCuBadgeImage(img)) return;
        const root = badgeRoot(img);
        stripRemoveControls(root);
        if (!roots.includes(root)) roots.push(root);
      });

      const emptyRoots = roots.filter(isEmptyCuBadge);
      const fullRoots = roots.filter(root => !isEmptyCuBadge(root));

      [...emptyRoots, ...fullRoots].slice(0, 3).forEach(root => {
        stripRemoveControls(root);
        root.classList.add(BADGE_CLASS);
        root.classList.toggle(EMPTY_BADGE_CLASS, isEmptyCuBadge(root));
        if (root.parentElement !== row) row.appendChild(root);
      });

      cleanRow(row);
      sortRow(row);

      row.style.display = row.children.length ? "flex" : "none";
      topbar.classList.toggle("has-mobile-cu-badges", row.children.length > 0);
    } finally {
      isSyncing = false;
    }
  }

  function scheduleSync() {
    if (isSyncing) return;
    clearTimeout(scheduleSync.timer);
    scheduleSync.timer = setTimeout(syncBadges, 40);
  }

  function init() {
    syncBadges();
    [80, 180, 360, 800, 1400, 2400].forEach(delay => setTimeout(syncBadges, delay));

    const observer = new MutationObserver(scheduleSync);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["src", "class", "style"] });

    window.addEventListener("resize", scheduleSync);
    window.addEventListener("pageshow", scheduleSync);
    window.addEventListener("mechkawaii:energy-updated", scheduleSync);
    window.addEventListener("mechkawaii:ultimate-cancelled", scheduleSync);
    window.addEventListener("mechkawaii:ultimate-energy-finalized", scheduleSync);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

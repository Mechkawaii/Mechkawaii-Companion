(function () {
  "use strict";

  const ROW_CLASS = "mkw-mobile-cu-badge-row";
  const BADGE_CLASS = "mkw-mobile-cu-badge";

  function isMobile() {
    return window.matchMedia && window.matchMedia("(max-width: 560px)").matches;
  }

  function isCuBadgeImage(img) {
    if (!(img instanceof HTMLImageElement)) return false;
    if (!img.closest(".page-character .topbar")) return false;
    if (img.closest("#charPortrait")) return false;
    if (img.closest("#mkwEnergyInlineStatus")) return false;
    if (img.closest(`.${ROW_CLASS}`)) return false;

    const src = String(img.getAttribute("src") || "").toLowerCase();
    const alt = String(img.getAttribute("alt") || "").toLowerCase();
    const cls = String(img.className || "").toLowerCase();
    const id = String(img.id || "").toLowerCase();
    const marker = `${src} ${alt} ${cls} ${id}`;

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
    if (root && root.closest(".page-character .topbar") && !root.closest("#charPortrait") && !root.closest("#mkwEnergyInlineStatus")) return root;
    return img;
  }

  function syncBadges() {
    if (!isMobile()) return;

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

    const roots = [];
    topbar.querySelectorAll("img").forEach(img => {
      if (!isCuBadgeImage(img)) return;
      const root = badgeRoot(img);
      if (!roots.includes(root)) roots.push(root);
    });

    roots.slice(0, 3).forEach(root => {
      root.classList.add(BADGE_CLASS);
      row.appendChild(root);
    });

    row.style.display = row.children.length ? "flex" : "none";
    topbar.classList.toggle("has-mobile-cu-badges", row.children.length > 0);
  }

  function scheduleSync() {
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

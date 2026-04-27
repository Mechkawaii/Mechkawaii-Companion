(function () {
  "use strict";

  // Disabled intentionally.
  // The previous version used a MutationObserver that could loop on mobile/PWA
  // and freeze the character page. Keep this file as a safe no-op so cached
  // HTML pages that still reference it do not break the app.

  window.mkwTurnHandoffFixDisabled = true;
})();

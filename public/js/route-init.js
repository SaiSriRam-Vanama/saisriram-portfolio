/**
 * Runs in <head> before first paint. When the page is opened directly on a case-study URL,
 * it hides the home page immediately so it never flashes before js/router.js takes over.
 */
(function () {
  try {
    var base = new URL('../', document.currentScript.src).pathname;
    var rel = '/' + location.pathname.slice(base.length);
    if (/^\/projects\//.test(rel)) document.documentElement.setAttribute('data-initial', 'case');
  } catch (e) { /* ignore */ }
})();

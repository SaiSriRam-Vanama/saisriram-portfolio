/**
 * Runs in <head> before first paint so the saved (or system) theme is applied
 * without a flash. Keep this file tiny and synchronous.
 */
try {
  var savedTheme = localStorage.getItem('theme');
  document.documentElement.dataset.theme =
    savedTheme || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
} catch (e) {
  document.documentElement.dataset.theme = 'light';
}
document.documentElement.classList.add('js');

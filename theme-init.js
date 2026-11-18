/**
 * theme-init.js
 * Synchronous early theme initializer.
 * Runs in <head> before page render to eliminate Flash of Unstyled Theme (FOUT).
 * Safely handles environments where localStorage throws SecurityError (sandboxed iframes, private browsing).
 */
(function () {
  try {
    var storedTheme = localStorage.getItem("preferred-theme");
    if (storedTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else if (storedTheme === "light") {
      document.documentElement.removeAttribute("data-theme");
    }
  } catch (e) {
    // Storage access restricted or disabled; gracefully fallback to system default
  }
})();

"use strict";

/**
 * Dark/light theme toggle.
 * Stores preference in localStorage under "gaslands_theme".
 */

(function () {
  var STORAGE_KEY = "gaslands_theme";

  function getStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      // localStorage unavailable
    }
    updateToggleLabel(theme);
  }

  function updateToggleLabel(theme) {
    var btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.textContent = theme === "light" ? "Night mode" : "Daylight";
      btn.title = theme === "light" ? "Switch to dark mode" : "Switch to light mode";
      btn.setAttribute("aria-label", btn.title);
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content",theme === "light" ? "#eeeae1" : "#171c20");
    }
  }

  function init() {
    var stored = getStoredTheme();
    var theme = stored || "dark";
    setTheme(theme);

    var btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.addEventListener("click", function () {
        var current = document.documentElement.getAttribute("data-theme") || "dark";
        setTheme(current === "dark" ? "light" : "dark");
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

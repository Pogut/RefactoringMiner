/*
 * Dark mode controller for the RefactoringMiner web diff.
 *
 * This file is loaded as a blocking <script> in the <head> of every page, so
 * the saved theme is applied to <html> before the body paints (no flash of
 * light content). Wiring of the toggle button(s) is deferred to
 * DOMContentLoaded since the buttons live in the body.
 *
 * The theme is stored in localStorage so it survives navigation across the
 * app's many server-rendered pages and works in the static export too.
 */
(function () {
    "use strict";

    var STORAGE_KEY = "rm-theme";
    var DARK = "dark";
    var LIGHT = "light";
    var DARK_CLASS = "rm-dark";

    // currentColor so the icons follow the button's text color in both themes.
    var SUN_SVG =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"' +
        ' stroke="currentColor" stroke-width="2" stroke-linecap="round"' +
        ' stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle>' +
        '<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41' +
        'M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>';
    var MOON_SVG =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"' +
        ' stroke="currentColor" stroke-width="2" stroke-linecap="round"' +
        ' stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0' +
        ' 21 12.79z"></path></svg>';

    function getStored() {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch (e) {
            return null;
        }
    }

    function store(theme) {
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch (e) {
            /* storage unavailable (e.g. private mode) -- theme just won't persist */
        }
    }

    function currentTheme() {
        return document.documentElement.classList.contains(DARK_CLASS) ? DARK : LIGHT;
    }

    function applyThemeClass(theme) {
        var root = document.documentElement;
        if (theme === DARK) {
            root.classList.add(DARK_CLASS);
        } else {
            root.classList.remove(DARK_CLASS);
        }
    }

    // Apply the saved theme immediately (runs while <head> is parsed).
    applyThemeClass(getStored() === DARK ? DARK : LIGHT);

    function applyMonacoTheme(theme) {
        if (window.monaco && window.monaco.editor) {
            window.monaco.editor.setTheme(theme === DARK ? "vs-dark" : "vs");
        }
    }

    // Monaco loads asynchronously via the AMD loader, so it may not be ready
    // when the page first runs. Poll briefly until it is, then theme it.
    function syncMonacoWhenReady() {
        if (window.monaco && window.monaco.editor) {
            applyMonacoTheme(currentTheme());
            return;
        }
        var tries = 0;
        var interval = setInterval(function () {
            tries++;
            if (window.monaco && window.monaco.editor) {
                applyMonacoTheme(currentTheme());
                clearInterval(interval);
            } else if (tries > 150) {
                // ~15s: Monaco isn't on this page (e.g. directory view). Give up.
                clearInterval(interval);
            }
        }, 100);
    }

    function updateButtons(theme) {
        var icon = theme === DARK ? MOON_SVG : SUN_SVG;
        var label = theme === DARK ? "Switch to light mode" : "Switch to dark mode";
        var buttons = document.querySelectorAll(".theme-toggle");
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].innerHTML = icon;
            buttons[i].setAttribute("title", label);
            buttons[i].setAttribute("aria-label", label);
            buttons[i].setAttribute("aria-pressed", theme === DARK ? "true" : "false");
        }
    }

    function toggle() {
        var next = currentTheme() === DARK ? LIGHT : DARK;
        applyThemeClass(next);
        store(next);
        updateButtons(next);
        applyMonacoTheme(next);
    }

    function init() {
        updateButtons(currentTheme());
        var buttons = document.querySelectorAll(".theme-toggle");
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener("click", toggle);
        }
        syncMonacoWhenReady();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();

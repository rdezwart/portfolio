"use strict";

/**
 * This file is meant to be loaded in the `<head>` WITHOUT `defer`, as it needs
 * to load immediately to avoid a flash of the wrong style. Only the code
 * outside the DOM listener blocks rendering.
 *
 * Referenced: https://www.aleksandrhovhannisyan.com/blog/the-perfect-theme-switch/
 */

/**
 * Immediately Invoked Function Expression.
 */
(function () {
  const THEME_OWNER = document.documentElement;
  const THEME_STORAGE_KEY = "theme";
  const DEFAULT_THEME = "dark";

  /**
   * Can be `null` if theme not found in local storage.
   * @type {?string}
   */
  const cachedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (cachedTheme) {
    THEME_OWNER.dataset[THEME_STORAGE_KEY] = cachedTheme;
  }

  // The rest of this can wait until the DOM finishes loading
  document.addEventListener("DOMContentLoaded", () => {
    /** @type {NodeListOf<HTMLFormElement>} */
    const themePickers = document.querySelectorAll("form.theme-picker");
    const gradioApplets = document.querySelectorAll("gradio-app");

    /**
     * Sets the correct them as active on a theme picker form.
     * @param {HTMLFormElement} themePickerForm
     * @param {?string} theme
     */
    function setTheme(themePickerForm, theme) {
      themePickerForm[THEME_STORAGE_KEY].value = theme ?? DEFAULT_THEME;
    }

    /**
     * Updates the theme for Gradio applets.
     * @param {Element} gradioApplet
     * @param {?string} theme
     */
    function updateGradio(gradioApplet, theme) {
      gradioApplet.classList.toggle("dark", (theme ?? DEFAULT_THEME) === DEFAULT_THEME);
      gradioApplet.setAttribute("theme_mode", theme ?? DEFAULT_THEME);
    }

    /**
     * Updates the FontAwesome icons to match the current state.
     * @param {HTMLFormElement} themePickerForm
     * @param {?string} theme
     */
    function updateIcons(themePickerForm, theme) {
      /** @type {RadioNodeList} */
      let inputs = themePickerForm[THEME_STORAGE_KEY];

      inputs.forEach((input) => {
        // Only works because the input and icon are nested in the same label
        let icon = input.parentNode.querySelector("i");

        // Theme is null when there is no cached theme, default theme is dark
        if (input.value === (theme ?? DEFAULT_THEME)) {
          icon.classList.replace("fa-regular", "fa-solid");
        } else {
          icon.classList.replace("fa-solid", "fa-regular");
        }
      });
    }

    /**
     * Callback function for handling change events.
     * @param {Event} e
     */
    function handleChange(e) {
      const theme = e.target.value;
      if (theme === DEFAULT_THEME) {
        delete THEME_OWNER.dataset[THEME_STORAGE_KEY];
        localStorage.removeItem(THEME_STORAGE_KEY);
      } else {
        THEME_OWNER.dataset[THEME_STORAGE_KEY] = theme;
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      }

      // Keep pickers in sync
      themePickers.forEach((picker) => {
        if (picker !== e.currentTarget) {
          setTheme(picker, theme);
        }
        updateIcons(picker, theme);
      });

      // Sync Gradio applets
      gradioApplets.forEach((gradioApplet) => {
        updateGradio(gradioApplet, theme);
      });
    }


    // Add listeners and sync all pickers
    themePickers.forEach((themePicker) => {
      setTheme(themePicker, cachedTheme);
      updateIcons(themePicker, cachedTheme);
      themePicker.addEventListener("change", handleChange);
    });

    // Sync Gradio applets
    gradioApplets.forEach((gradioApplet) => {
      updateGradio(gradioApplet, cachedTheme);
    });
  });
})();

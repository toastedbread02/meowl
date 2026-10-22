(() => {
  "use strict";

  const openButton = document.getElementById("meowl-settings-open");
  const closeButton = document.getElementById("meowl-settings-close");
  const panel = document.getElementById("meowl-settings-panel");
  const backdrop = document.getElementById("meowl-settings-backdrop");
  const noUiSwitch = document.getElementById("meowl-settings-no-ui");

  if (!openButton || !panel || !backdrop || !noUiSwitch) return;

  // Everything that counts as extra UI. No UI mode hides these with CSS and
  // also closes them here so no dialog or overlay is left open behind it.
  const overlayIds = [
    "event-backdrop",
    "event-menu",
    "daily-challenge-backdrop",
    "daily-challenge-panel",
    "daily-challenge-game",
    "daily-welcome-backdrop",
    "daily-welcome-panel",
    "daily-profile-backdrop",
    "daily-profile-panel",
    "meowl-friends-backdrop",
    "meowl-friends-panel"
  ];

  function showPanel() {
    panel.hidden = false;
    backdrop.hidden = false;
    closeButton.focus();
  }

  function hidePanel() {
    panel.hidden = true;
    backdrop.hidden = true;
    openButton.focus();
  }

  function clearOverlays() {
    overlayIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) element.hidden = true;
    });
    const toastStack = document.getElementById("meowl-toast-stack");
    if (toastStack) toastStack.replaceChildren();
    const celebration = document.getElementById("streak-celebration");
    if (celebration) {
      celebration.classList.remove("play");
      celebration.hidden = true;
    }
    if (document.activeElement && typeof document.activeElement.blur === "function") {
      document.activeElement.blur();
    }
  }

  function setNoUiMode(enabled) {
    noUiSwitch.setAttribute("aria-checked", String(enabled));
    document.body.classList.toggle("no-ui-mode", enabled);
    if (!enabled) return;
    // Deliberately not saved: a refresh clears the class and the UI returns.
    clearOverlays();
    panel.hidden = true;
    backdrop.hidden = true;
  }

  openButton.addEventListener("click", showPanel);
  closeButton.addEventListener("click", hidePanel);
  backdrop.addEventListener("click", hidePanel);

  noUiSwitch.addEventListener("click", () => {
    setNoUiMode(noUiSwitch.getAttribute("aria-checked") !== "true");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) hidePanel();
  });
})();

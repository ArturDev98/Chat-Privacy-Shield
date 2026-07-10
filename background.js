// Background Service Worker - WhatsApp Privacy Shield
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.includes("web.whatsapp.com")) return;

  if (command === "toggle-privacy") {
    chrome.tabs.sendMessage(tab.id, { action: "toggle-privacy" });
  }
  if (command === "toggle-panel") {
    chrome.tabs.sendMessage(tab.id, { action: "toggle-panel" });
  }
});

// Al actualizar de versión, se deja una bandera pendiente en storage.
// El content script la revisa la próxima vez que WhatsApp Web carga y
// muestra el popup de "novedades" — no se hace aquí porque el service
// worker no tiene acceso al DOM de la pestaña.
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "update") {
    chrome.storage.local.set({
      wps_pending_changelog: chrome.runtime.getManifest().version,
    });
  }
});


// Background Service Worker - Chat Privacy Shield
importScripts("sites.js");

chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !cpsIsSupportedUrl(tab.url)) return;

  if (command === "toggle-privacy") {
    chrome.tabs.sendMessage(tab.id, { action: "toggle-privacy" });
  }
  if (command === "toggle-panel") {
    chrome.tabs.sendMessage(tab.id, { action: "toggle-panel" });
  }
  if (command === "lock-now") {
    chrome.tabs.sendMessage(tab.id, { action: "lock-now" });
  }
});

// Bandera de "novedades": la muestra el content script la próxima vez que carga
// WhatsApp o Telegram, porque el service worker no tiene DOM.
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "update") {
    chrome.storage.local.set({
      wps_pending_changelog: chrome.runtime.getManifest().version,
    });
  }
});

// ---- Telegram Web: content script registrado según el permiso opcional ----

// En cola: onAdded y el mensaje del popup llegan casi a la vez, y dos
// registros simultáneos chocan con "Duplicate script ID".
let telegramSync = Promise.resolve();

function syncTelegramScript() {
  telegramSync = telegramSync.then(applyTelegramScript, applyTelegramScript);
  return telegramSync;
}

async function applyTelegramScript() {
  const granted = await chrome.permissions.contains({ origins: CPS_TELEGRAM_ORIGINS });
  const registered = await chrome.scripting.getRegisteredContentScripts({ ids: [CPS_TELEGRAM_SCRIPT.id] });

  if (!granted) {
    if (registered.length) await chrome.scripting.unregisterContentScripts({ ids: [CPS_TELEGRAM_SCRIPT.id] });
    return false;
  }
  // update en cada arranque: tras una actualización la lista de archivos puede cambiar.
  if (registered.length) await chrome.scripting.updateContentScripts([CPS_TELEGRAM_SCRIPT]);
  else await chrome.scripting.registerContentScripts([CPS_TELEGRAM_SCRIPT]);
  return true;
}

chrome.runtime.onInstalled.addListener(syncTelegramScript);
chrome.runtime.onStartup.addListener(syncTelegramScript);
chrome.permissions.onRemoved.addListener(syncTelegramScript);

// Se recarga aquí y no desde el popup: Chrome puede cerrarlo al mostrar el
// diálogo de permiso. Las pestañas abiertas no reciben el script sin recargar.
chrome.permissions.onAdded.addListener(async (permissions) => {
  if (!(await syncTelegramScript())) return;
  if (!permissions.origins?.some((origin) => CPS_TELEGRAM_ORIGINS.includes(origin))) return;
  const tabs = await chrome.tabs.query({ url: CPS_TELEGRAM_SCRIPT.matches });
  tabs.forEach((tab) => chrome.tabs.reload(tab.id));
});

// El popup pregunta el estado final tras pedir o quitar el permiso.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.action !== "telegram-sync") return;
  syncTelegramScript()
    .then((enabled) => sendResponse({ enabled }))
    .catch(() => sendResponse({ enabled: false }));
  return true;
});

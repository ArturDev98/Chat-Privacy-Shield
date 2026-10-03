// Sitios soportados: lo comparten background.js y popup.js.

// Permiso opcional: se pide desde el popup y Chrome no avisa al actualizar.
const CPS_TELEGRAM_ORIGINS = ["https://web.telegram.org/*"];

// Mismos archivos que el content script de WhatsApp en manifest.json, con el
// adaptador de Telegram: si cambia uno, cambia el otro.
const CPS_TELEGRAM_SCRIPT = {
  id: "cps-telegram",
  matches: ["https://web.telegram.org/k/*"],
  js: ["i18n.js", "pro.js", "changelog.js", "sites/telegram.js", "content.js"],
  css: ["content.css", "sites/telegram.css"],
  runAt: "document_idle",
};

function cpsIsSupportedUrl(url) {
  return /^https:\/\/(web\.whatsapp\.com|web\.telegram\.org\/k)\//.test(url || "");
}

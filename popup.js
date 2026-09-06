// popup.js - Sincroniza el popup con el content script

const STORAGE_KEY = "wps_settings";

const defaults = {
  privacyActive: false,
  blurLevel: 8,
  hideAvatars: true,
  hideNames: true,
  hoverReveal: false,
  panelVisible: true,
  showBadges: false,
  blurMain: false,
  hideTypedText: false,
  autoBlurEnabled: false,
  hideChatSubtitle: false,
  scheduleEnabled: false,
  scheduleStart: "09:00",
  scheduleEnd: "17:00",
  blurOnTabHidden: false,
  hideHeaderAvatar: false,
  lang: "en",
};

let settings = { ...defaults };

function saveAndSync() {
  chrome.storage.local.set({ [STORAGE_KEY]: settings });

  // Enviar mensaje al tab activo si es WhatsApp
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab?.url?.includes("web.whatsapp.com")) {
      chrome.tabs.sendMessage(tab.id, { action: "sync-settings", settings });
    }
  });
}

function applyTranslations() {
  const lang = settings.lang;
  const isRTL = cpsIsRTL(lang);

  // Aplicar dirección RTL/LTR al documento completo
  document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr");

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    el.textContent = cpsT(key, lang);
  });

  document.getElementById("lang-toggle").textContent = lang.toUpperCase();
}

function updateUI() {
  document.getElementById("main-toggle").checked = settings.privacyActive;
  document.getElementById("status-text").textContent = settings.privacyActive
    ? cpsT("statusActive", settings.lang)
    : cpsT("statusInactive", settings.lang);
  document.getElementById("status-text").style.color = settings.privacyActive ? "#00a884" : "rgba(255,255,255,0.4)";
  document.getElementById("blur-slider").value = settings.blurLevel;
  document.getElementById("blur-val").textContent = `${settings.blurLevel}px`;
  document.getElementById("toggle-avatars").checked = settings.hideAvatars;
  document.getElementById("toggle-names").checked = settings.hideNames;
  document.getElementById("toggle-hover").checked = settings.hoverReveal;
  document.getElementById("toggle-badges").checked = settings.showBadges;
  document.getElementById("toggle-blur-main").checked = settings.blurMain;
  document.getElementById("toggle-hide-typed").checked = settings.hideTypedText;
  document.getElementById("toggle-auto-blur").checked = settings.autoBlurEnabled;
  document.getElementById("toggle-hide-subtitle").checked = settings.hideChatSubtitle;
  document.getElementById("toggle-schedule").checked = settings.scheduleEnabled;
  document.getElementById("schedule-start").value = settings.scheduleStart;
  document.getElementById("schedule-end").value = settings.scheduleEnd;
  document.getElementById("schedule-times").classList.toggle("disabled", !settings.scheduleEnabled);
  document.getElementById("toggle-blur-tab-hidden").checked = settings.blurOnTabHidden;
  document.getElementById("toggle-hide-header-avatar").checked = settings.hideHeaderAvatar;
  applyTranslations();
}

// ---- Cargar estado ----
chrome.storage.local.get(STORAGE_KEY, (data) => {
  if (data[STORAGE_KEY]) settings = { ...defaults, ...data[STORAGE_KEY] };
  updateUI();
});

// ---- Eventos ----
document.getElementById("main-toggle").addEventListener("change", (e) => {
  settings.privacyActive = e.target.checked;
  updateUI();
  saveAndSync();
});

document.getElementById("blur-slider").addEventListener("input", (e) => {
  settings.blurLevel = parseInt(e.target.value);
  document.getElementById("blur-val").textContent = `${settings.blurLevel}px`;
  saveAndSync();
});

document.getElementById("toggle-avatars").addEventListener("change", (e) => {
  settings.hideAvatars = e.target.checked;
  saveAndSync();
});

document.getElementById("toggle-names").addEventListener("change", (e) => {
  settings.hideNames = e.target.checked;
  saveAndSync();
});

document.getElementById("toggle-hover").addEventListener("change", (e) => {
  settings.hoverReveal = e.target.checked;
  saveAndSync();
});

document.getElementById("toggle-badges").addEventListener("change", (e) => {
  settings.showBadges = e.target.checked;
  saveAndSync();
});

document.getElementById("toggle-blur-main").addEventListener("change", (e) => {
  settings.blurMain = e.target.checked;
  saveAndSync();
});

document.getElementById("toggle-hide-typed").addEventListener("change", (e) => {
  settings.hideTypedText = e.target.checked;
  saveAndSync();
});

document.getElementById("toggle-auto-blur").addEventListener("change", (e) => {
  settings.autoBlurEnabled = e.target.checked;
  saveAndSync();
});

document.getElementById("toggle-hide-subtitle").addEventListener("change", (e) => {
  settings.hideChatSubtitle = e.target.checked;
  saveAndSync();
});

document.getElementById("toggle-blur-tab-hidden").addEventListener("change", (e) => {
  settings.blurOnTabHidden = e.target.checked;
  saveAndSync();
});

document.getElementById("toggle-hide-header-avatar").addEventListener("change", (e) => {
  settings.hideHeaderAvatar = e.target.checked;
  saveAndSync();
});

document.getElementById("toggle-schedule").addEventListener("change", (e) => {
  settings.scheduleEnabled = e.target.checked;
  document.getElementById("schedule-times").classList.toggle("disabled", !settings.scheduleEnabled);
  saveAndSync();
});

document.getElementById("schedule-start").addEventListener("change", (e) => {
  settings.scheduleStart = e.target.value || defaults.scheduleStart;
  saveAndSync();
});

document.getElementById("schedule-end").addEventListener("change", (e) => {
  settings.scheduleEnd = e.target.value || defaults.scheduleEnd;
  saveAndSync();
});

document.getElementById("lang-toggle").addEventListener("click", () => {
  settings.lang = cpsNextLang(settings.lang);
  updateUI();
  saveAndSync();
});

// ---- Exportar / Importar configuración ----
function showBackupStatus(text, isError) {
  const el = document.getElementById("backup-status");
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("error", !!isError);
  clearTimeout(showBackupStatus._timer);
  showBackupStatus._timer = setTimeout(() => {
    el.textContent = "";
  }, 3000);
}

document.getElementById("export-settings-btn").addEventListener("click", () => {
  const exportPayload = {
    app: "chat-privacy-shield",
    exportedAt: new Date().toISOString(),
    settings,
  };
  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cps-settings-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  showBackupStatus(cpsT("exportSuccess", settings.lang), false);
});

document.getElementById("import-settings-btn").addEventListener("click", () => {
  document.getElementById("import-file-input").click();
});

document.getElementById("import-file-input").addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Un archivo de configuración real pesa unos pocos KB — se rechaza de
  // entrada cualquier cosa fuera de rango, ANTES de leerlo. Sin este
  // chequeo, un archivo gigante (ej. un log de varios GB subido por
  // error) se intentaba leer completo en memoria con readAsText() y
  // trababa el popup en vez de mostrar el error de formato inválido.
  const MAX_IMPORT_SIZE_BYTES = 1 * 1024 * 1024; // 1MB, generoso de sobra
  if (file.size > MAX_IMPORT_SIZE_BYTES || file.size === 0) {
    showBackupStatus(cpsT("importError", settings.lang), true);
    e.target.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onerror = () => {
    showBackupStatus(cpsT("importError", settings.lang), true);
    e.target.value = "";
  };

  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      // Acepta tanto el archivo exportado (con envoltura {app, settings})
      // como un objeto plano de settings directamente.
      const imported = parsed && typeof parsed === "object" && parsed.settings
        ? parsed.settings
        : parsed;

      const validKeys = Object.keys(defaults);
      const looksValid = imported
        && typeof imported === "object"
        && validKeys.some((key) => Object.prototype.hasOwnProperty.call(imported, key));

      if (!looksValid) throw new Error("El archivo no tiene el formato esperado");

      settings = { ...defaults, ...imported };
      updateUI();
      saveAndSync();
      showBackupStatus(cpsT("importSuccess", settings.lang), false);
    } catch (err) {
      showBackupStatus(cpsT("importError", settings.lang), true);
    } finally {
      e.target.value = "";
    }
  };
  reader.readAsText(file);
});


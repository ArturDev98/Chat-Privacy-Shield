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

document.getElementById("lang-toggle").addEventListener("click", () => {
  settings.lang = cpsNextLang(settings.lang);
  updateUI();
  saveAndSync();
});

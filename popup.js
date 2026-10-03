// popup.js - Sincroniza el popup con el content script

const STORAGE_KEY = "wps_settings";
const TELEGRAM_K_RE = /^https:\/\/web\.telegram\.org\/k\//;
const TELEGRAM_RE = /^https:\/\/web\.telegram\.org\//;

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
  hideTabCount: false,
  pinLockEnabled: false,
  autoLockMinutes: 0,
  lockOnTabHidden: false,
  lang: "en",
};

let settings = { ...defaults };
let proActive = false;
let pinSet = false;
let telegramEnabled = false;
let activeTabUrl = "";

function saveAndSync() {
  chrome.storage.local.set({ [STORAGE_KEY]: settings });

  // Enviar mensaje al tab activo si es un sitio soportado
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (cpsIsSupportedUrl(tab?.url)) {
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

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = cpsT(el.getAttribute("data-i18n-placeholder"), lang);
  });

  document.getElementById("lang-toggle").textContent = lang.toUpperCase();
  renderAutoLockOptions();
  updateTelegramBanner();
}

// Las opciones salen de pro.js, que es lo mismo que acepta content.js.
function renderAutoLockOptions() {
  const select = document.getElementById("auto-lock-minutes");
  const values = [0, ...CPS_AUTO_LOCK_MINUTES];
  select.innerHTML = "";
  for (const minutes of values) {
    const option = document.createElement("option");
    option.value = String(minutes);
    option.textContent = minutes
      ? `${minutes} ${cpsT("minutesShort", settings.lang)}`
      : cpsT("autoLockOff", settings.lang);
    select.appendChild(option);
  }
  select.value = String(cpsAutoLockMinutes(settings.autoLockMinutes));
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
  document.getElementById("toggle-hide-tab-count").checked = settings.hideTabCount;
  document.getElementById("toggle-lock-tab-hidden").checked = settings.lockOnTabHidden;
  applyTranslations();
  updateProUI();
}

// ---- Cargar estado ----
chrome.storage.local.get(STORAGE_KEY, (data) => {
  if (data[STORAGE_KEY]) settings = { ...defaults, ...data[STORAGE_KEY] };
  updateUI();
  loadProState();
  loadTelegramState();
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

document.getElementById("toggle-hide-tab-count").addEventListener("change", (e) => {
  settings.hideTabCount = e.target.checked;
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

      // Importar no puede ser la puerta trasera para quitar el candado: si
      // está armado, se conserva pase lo que pase en el archivo.
      const lockWasOn = settings.pinLockEnabled;
      settings = { ...defaults, ...imported };
      if (lockWasOn) settings.pinLockEnabled = true;

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


// ---- Bloqueo con PIN (Pro) ----

async function loadProState() {
  proActive = await cpsProIsActive();
  pinSet = await cpsPinExists();

  // La URL de compra se lee de pro.js, no se escribe a mano en el HTML.
  const buyLink = document.getElementById("pro-buy-link");
  if (buyLink) buyLink.href = CPS_PRO_BUY_URL;

  updateProUI();
}

function updateProUI() {
  const toggle = document.getElementById("toggle-pin-lock");
  if (!toggle) return;

  const armed = proActive && pinSet && settings.pinLockEnabled;
  toggle.checked = armed;
  toggle.disabled = !proActive;

  // Visibles aunque no apliquen, para que se vea lo que trae Pro.
  document.getElementById("pin-auto").classList.toggle("disabled", !armed);
  document.getElementById("auto-lock-minutes").disabled = !armed;
  document.getElementById("toggle-lock-tab-hidden").disabled = !armed;

  document.getElementById("pro-box").style.display = proActive ? "none" : "flex";
  document.getElementById("pro-active-box").style.display = proActive ? "flex" : "none";
  document.getElementById("pin-actions").style.display = proActive && pinSet ? "flex" : "none";
  document.getElementById("pin-hint").textContent = proActive
    ? cpsT("pinLockHint", settings.lang)
    : cpsT("proLockedHint", settings.lang);
}

function showPinStatus(text, isError) {
  const el = document.getElementById("pin-status");
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("error", !!isError);
  clearTimeout(showPinStatus._timer);
  showPinStatus._timer = setTimeout(() => {
    el.textContent = "";
  }, 3500);
}

// ---- Diálogo de PIN ----

let pinDialogResolve = null;

function openPinDialog(title) {
  return new Promise((resolve) => {
    pinDialogResolve = resolve;
    document.getElementById("pin-dialog-title").textContent = title;
    document.getElementById("pin-dialog-error").textContent = "";
    const input = document.getElementById("pin-dialog-input");
    input.value = "";
    document.getElementById("pin-dialog").classList.add("open");
    input.focus();
  });
}

function closePinDialog(value) {
  document.getElementById("pin-dialog").classList.remove("open");
  const resolve = pinDialogResolve;
  pinDialogResolve = null;
  resolve?.(value);
}

document.getElementById("pin-dialog-cancel").addEventListener("click", () => closePinDialog(null));

document.getElementById("pin-dialog-ok").addEventListener("click", () => {
  closePinDialog(document.getElementById("pin-dialog-input").value);
});

document.getElementById("pin-dialog-input").addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/\D/g, "");
});

document.getElementById("pin-dialog-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") closePinDialog(e.target.value);
  if (e.key === "Escape") closePinDialog(null);
});

async function askNewPin() {
  // Se repite hasta que el PIN sea válido y coincida, o el usuario cancele.
  for (;;) {
    const first = await openPinDialog(cpsT("pinEnterNew", settings.lang));
    if (first === null) return null;
    if (!cpsPinIsValidFormat(first)) {
      showPinStatus(cpsT("pinTooShort", settings.lang), true);
      continue;
    }
    const second = await openPinDialog(cpsT("pinConfirmNew", settings.lang));
    if (second === null) return null;
    if (first !== second) {
      showPinStatus(cpsT("pinMismatch", settings.lang), true);
      continue;
    }
    return first;
  }
}

async function askCurrentPin() {
  const left = await cpsPinCooldownLeft();
  if (left > 0) {
    showPinStatus(`${cpsT("lockCooldown", settings.lang)} ${left}${cpsT("lockSeconds", settings.lang)}`, true);
    return false;
  }

  const pin = await openPinDialog(cpsT("pinEnterCurrent", settings.lang));
  if (pin === null) return false;

  if (await cpsPinVerify(pin)) {
    await cpsPinResetFails();
    return true;
  }

  await cpsPinRegisterFail();
  showPinStatus(cpsT("pinWrong", settings.lang), true);
  return false;
}

// ---- Eventos de la sección ----

document.getElementById("toggle-pin-lock").addEventListener("change", async (e) => {
  const wantsOn = e.target.checked;

  if (!proActive) {
    e.target.checked = false;
    showPinStatus(cpsT("proLockedHint", settings.lang), true);
    return;
  }

  if (wantsOn) {
    if (!pinSet) {
      e.target.checked = false;
      const pin = await askNewPin();
      if (!pin) return;
      await cpsPinSet(pin);
      pinSet = true;
    }
    settings.pinLockEnabled = true;
    saveAndSync();
    updateProUI();
    showPinStatus(cpsT("pinEnabled", settings.lang), false);
    return;
  }

  // Apagarlo exige el PIN actual: si no, el popup sería la puerta trasera.
  e.target.checked = true;
  if (!(await askCurrentPin())) return;

  await cpsPinClear();
  pinSet = false;
  settings.pinLockEnabled = false;
  saveAndSync();
  updateProUI();
  showPinStatus(cpsT("pinDisabled", settings.lang), false);
});

// Aflojar el bloqueo automático no pide PIN: no abre nada que ya esté bloqueado.
document.getElementById("auto-lock-minutes").addEventListener("change", (e) => {
  settings.autoLockMinutes = cpsAutoLockMinutes(e.target.value);
  saveAndSync();
});

document.getElementById("toggle-lock-tab-hidden").addEventListener("change", (e) => {
  settings.lockOnTabHidden = e.target.checked;
  saveAndSync();
});

document.getElementById("change-pin-btn").addEventListener("click", async () => {
  if (!(await askCurrentPin())) return;
  const pin = await askNewPin();
  if (!pin) return;
  await cpsPinSet(pin);
  showPinStatus(cpsT("pinChanged", settings.lang), false);
});

document.getElementById("pro-activate-btn").addEventListener("click", async () => {
  const input = document.getElementById("pro-code-input");
  if (!(await cpsProActivate(input.value))) {
    showPinStatus(cpsT("proInvalidCode", settings.lang), true);
    return;
  }
  input.value = "";
  proActive = true;
  updateProUI();
  showPinStatus(cpsT("proActivated", settings.lang), false);
});

document.getElementById("pro-deactivate-btn").addEventListener("click", async () => {
  // Quitar Pro con el candado armado sería otra forma de abrirlo.
  if (settings.pinLockEnabled && pinSet && !(await askCurrentPin())) return;

  await cpsProDeactivate();
  proActive = false;
  updateProUI();
});

// ---- Telegram Web (permiso opcional) ----


async function loadTelegramState() {
  // activeTab deja leer la URL aunque Telegram aún no tenga permiso.
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTabUrl = tab?.url || "";
  telegramEnabled = await chrome.permissions.contains({ origins: CPS_TELEGRAM_ORIGINS });
  document.getElementById("toggle-telegram").checked = telegramEnabled;
  updateTelegramBanner();
}

// El interruptor queda al fondo del popup: abierto sobre Telegram, se ofrece arriba.
function updateTelegramBanner() {
  const onK = TELEGRAM_K_RE.test(activeTabUrl);
  const onOtherVersion = !onK && TELEGRAM_RE.test(activeTabUrl);
  document.getElementById("tg-banner").hidden = !(onOtherVersion || (onK && !telegramEnabled));
  document.getElementById("tg-banner-btn").hidden = onOtherVersion;
  document.getElementById("tg-banner-text").textContent =
    cpsT(onOtherVersion ? "telegramOnlyK" : "telegramBannerText", settings.lang);
}

async function enableTelegram() {
  // request() exige el gesto del usuario: tiene que ser el primer await.
  if (!(await chrome.permissions.request({ origins: CPS_TELEGRAM_ORIGINS }))) {
    document.getElementById("toggle-telegram").checked = false;
    showTelegramStatus(cpsT("telegramDenied", settings.lang), true);
    return;
  }
  await finishTelegramChange();
}

async function finishTelegramChange() {
  const { enabled } = await chrome.runtime.sendMessage({ action: "telegram-sync" });
  telegramEnabled = enabled;
  document.getElementById("toggle-telegram").checked = enabled;
  showTelegramStatus(cpsT(enabled ? "telegramEnabled" : "telegramDisabled", settings.lang), false);
  updateTelegramBanner();
}

function showTelegramStatus(text, isError) {
  const el = document.getElementById("telegram-status");
  el.textContent = text;
  el.classList.toggle("error", !!isError);
  clearTimeout(showTelegramStatus._timer);
  showTelegramStatus._timer = setTimeout(() => {
    el.textContent = "";
  }, 4000);
}

document.getElementById("toggle-telegram").addEventListener("change", async (e) => {
  if (e.target.checked) {
    await enableTelegram();
    return;
  }
  // Quitar Telegram con el candado armado lo dejaría sin bloqueo.
  e.target.checked = true;
  if (proActive && pinSet && settings.pinLockEnabled && !(await askCurrentPin())) return;
  await chrome.permissions.remove({ origins: CPS_TELEGRAM_ORIGINS });
  await finishTelegramChange();
});

document.getElementById("tg-banner-btn").addEventListener("click", enableTelegram);

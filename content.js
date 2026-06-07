(() => {
  "use strict";

  // =============================================
  //  WhatsApp Privacy Shield - Content Script
  // =============================================

  const STORAGE_KEY = "wps_settings";

  const defaults = {
    privacyActive: false,
    blurLevel: 8,
    opacity: 0.15,
    hideAvatars: true,
    hideNames: true,
    hoverReveal: false,
    panelVisible: true,
  };

  let settings = { ...defaults };
  let panel = null;

  // ---- Cargar settings desde chrome.storage ----
  function loadSettings(cb) {
    try {
      chrome.storage.local.get(STORAGE_KEY, (data) => {
        if (data[STORAGE_KEY]) {
          settings = { ...defaults, ...data[STORAGE_KEY] };
        }
        cb && cb();
      });
    } catch {
      cb && cb();
    }
  }

  function saveSettings() {
    try {
      chrome.storage.local.set({ [STORAGE_KEY]: settings });
    } catch {}
  }

  // ---- Aplicar/retirar clases CSS en body ----
  function applyState() {
    const body = document.body;

    // Privacidad principal
    body.classList.toggle("wps-active", settings.privacyActive);

    // Sub-opciones (solo tienen efecto cuando wps-active está)
    body.classList.toggle("wps-hide-avatars", settings.hideAvatars);
    body.classList.toggle("wps-hide-names", settings.hideNames);
    body.classList.toggle("wps-hover-reveal", settings.hoverReveal);

    // CSS variables dinámicas
    body.style.setProperty("--wps-blur", `${settings.blurLevel}px`);
    body.style.setProperty("--wps-opacity", settings.opacity);

    updatePanelUI();
  }

  // ---- Hover reveal: listener sobre #pane-side y #main ----
  function setupHoverReveal() {
    [["pane-side", "wps-pane-hovered"], ["main", "wps-main-hovered"]].forEach(([id, cls]) => {
      const el = document.getElementById(id);
      if (!el || el._wpsHoverBound) return;
      el._wpsHoverBound = true;
      el.addEventListener("mouseenter", () => document.body.classList.add(cls));
      el.addEventListener("mouseleave", () => document.body.classList.remove(cls));
    });
  }

  // ---- Toggle privacidad principal ----
  function togglePrivacy() {
    settings.privacyActive = !settings.privacyActive;
    applyState();
    saveSettings();
  }

  // ---- Toggle panel flotante ----
  function togglePanel() {
    settings.panelVisible = !settings.panelVisible;
    if (settings.panelVisible) {
      panel.classList.remove("wps-panel-hidden");
      const hint = document.getElementById("wps-restore-hint");
      if (hint) hint.remove();
    } else {
      panel.classList.add("wps-panel-hidden");
      showRestoreHint();
    }
    saveSettings();
  }

  // ---- Construir panel flotante ----
  function buildPanel() {
    if (document.getElementById("wps-panel")) return;

    panel = document.createElement("div");
    panel.id = "wps-panel";
    panel.innerHTML = `
      <!-- Botón toggle privacidad -->
      <button class="wps-btn" id="wps-toggle" data-tip="Privacy (Ctrl+Shift+H)">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </button>

      <!-- Slider blur -->
      <div class="wps-slider-wrap" id="wps-slider-wrap">
        <span class="wps-slider-label">BLUR</span>
        <input type="range" id="wps-blur-slider" min="2" max="20" step="1" value="${settings.blurLevel}">
      </div>

      <div class="wps-divider"></div>

      <!-- Ocultar avatares -->
      <button class="wps-btn" id="wps-avatars" data-tip="Hide photos (📷)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </button>

      <!-- Hide names -->
      <button class="wps-btn" id="wps-names" data-tip="Hide names">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="15" y2="18"/>
        </svg>
      </button>

      <!-- Hover reveal -->
      <button class="wps-btn" id="wps-hover" data-tip="Reveal on hover (👀)" style="font-size:12px; color:rgba(255,255,255,0.3);">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/>
        </svg>
      </button>

      <div class="wps-divider"></div>


      <!-- Ocultar/mostrar panel -->
      <button class="wps-btn" id="wps-pin" data-tip="Hide panel (Ctrl+Shift+K)" style="font-size:11px; color:rgba(255,255,255,0.3);">
        ✕
      </button>
    `;

    document.body.appendChild(panel);

    // ---- Eventos ----
    document.getElementById("wps-toggle").addEventListener("click", () => {
      togglePrivacy();
      // Mostrar/ocultar slider
      document.getElementById("wps-slider-wrap").classList.toggle("visible", settings.privacyActive);
    });

    document.getElementById("wps-blur-slider").addEventListener("input", (e) => {
      settings.blurLevel = parseInt(e.target.value);
      document.body.style.setProperty("--wps-blur", `${settings.blurLevel}px`);
      saveSettings();
    });

    document.getElementById("wps-avatars").addEventListener("click", () => {
      settings.hideAvatars = !settings.hideAvatars;
      applyState();
      saveSettings();
    });

    document.getElementById("wps-names").addEventListener("click", () => {
      settings.hideNames = !settings.hideNames;
      applyState();
      saveSettings();
    });

    document.getElementById("wps-hover").addEventListener("click", () => {
      settings.hoverReveal = !settings.hoverReveal;
      applyState();
      saveSettings();
    });

    document.getElementById("wps-pin").addEventListener("click", () => {
      settings.panelVisible = false;
      panel.classList.add("wps-panel-hidden");
      saveSettings();
      // Mostrar hint para recuperar el panel
      showRestoreHint();
    });

    updatePanelUI();
  }

  // ---- Sincronizar UI del panel con estado ----
  function updatePanelUI() {
    if (!panel) return;

    const toggle = document.getElementById("wps-toggle");
    const avatarsBtn = document.getElementById("wps-avatars");
    const namesBtn = document.getElementById("wps-names");
    const hoverBtn = document.getElementById("wps-hover");
    const slider = document.getElementById("wps-blur-slider");
    const sliderWrap = document.getElementById("wps-slider-wrap");

    toggle?.classList.toggle("active", settings.privacyActive);
    avatarsBtn?.classList.toggle("active", settings.hideAvatars);
    namesBtn?.classList.toggle("active", settings.hideNames);
    hoverBtn?.classList.toggle("active", settings.hoverReveal);

    if (slider) slider.value = settings.blurLevel;
    sliderWrap?.classList.toggle("visible", settings.privacyActive);

    // Actualizar tooltip del toggle
    if (toggle) {
      toggle.setAttribute("data-tip", settings.privacyActive ? "Disable privacy (Ctrl+Shift+H)" : "Enable privacy (Ctrl+Shift+H)");
    }
  }

  // ---- Hint para restaurar panel minimizado ----
  function showRestoreHint() {
    const hint = document.createElement("div");
    hint.id = "wps-restore-hint";
    Object.assign(hint.style, {
      position: "fixed",
      bottom: "12px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "rgba(17,27,33,0.85)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: "20px",
      color: "rgba(255,255,255,0.35)",
      fontSize: "11px",
      padding: "6px 14px",
      zIndex: "99998",
      cursor: "pointer",
      fontFamily: "system-ui, sans-serif",
      letterSpacing: "0.3px",
      transition: "opacity 0.2s",
    });
    hint.textContent = "🛡 CPS — click to show panel";
    hint.addEventListener("click", () => {
      settings.panelVisible = true;
      panel.classList.remove("wps-panel-hidden");
      hint.remove();
      saveSettings();
    });
    document.body.appendChild(hint);
  }

  // ---- Escuchar mensajes desde background/popup ----
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "toggle-privacy") togglePrivacy();
    if (msg.action === "toggle-panel") togglePanel();
    if (msg.action === "sync-settings" && msg.settings) {
      settings = { ...settings, ...msg.settings };
      applyState();
    }
  });

  // ---- Keyboard shortcuts directos en la página ----
  document.addEventListener("keydown", (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.shiftKey && e.key === "H") { e.preventDefault(); togglePrivacy(); }
    if (mod && e.shiftKey && e.key === "K") { e.preventDefault(); togglePanel(); }
  });

  // ---- Init ----
  function init() {
    loadSettings(() => {
      applyState();
      buildPanel();
      setupHoverReveal();
      if (!settings.panelVisible) {
        panel.classList.add("wps-panel-hidden");
        showRestoreHint();
      }
    });
  }

  // Esperar a que WhatsApp cargue el DOM
  if (document.readyState === "complete") {
    init();
  } else {
    window.addEventListener("load", init);
  }

  // También observar cuando WhatsApp monta su app (SPA)
  const observer = new MutationObserver(() => {
    if (document.getElementById("app") && !document.getElementById("wps-panel")) {
      buildPanel();
    }
    setupHoverReveal();
  });
  observer.observe(document.body, { childList: true, subtree: false });

})();

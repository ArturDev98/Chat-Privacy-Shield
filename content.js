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
    lang: "en",
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
    // Si se desactiva hover reveal, limpiar items revelados que queden
    if (!settings.hoverReveal) {
      document.querySelectorAll(".wps-revealed").forEach(el => el.classList.remove("wps-revealed"));
    }

    // CSS variables dinámicas
    body.style.setProperty("--wps-blur", `${settings.blurLevel}px`);
    body.style.setProperty("--wps-opacity", settings.opacity);

    updatePanelUI();
  }

  // ---- Hover reveal: por item individual en la lista de chats ----
  function setupHoverReveal() {
    // #main: listener global (imágenes compartidas dentro del chat abierto)
    const main = document.getElementById("main");
    if (main && !main._wpsHoverBound) {
      main._wpsHoverBound = true;
      main.addEventListener("mouseenter", () => document.body.classList.add("wps-main-hovered"));
      main.addEventListener("mouseleave", () => document.body.classList.remove("wps-main-hovered"));
    }

    // #pane-side: hover por cada chat individualmente
    const pane = document.getElementById("pane-side");
    if (!pane || pane._wpsHoverBound) return;
    pane._wpsHoverBound = true;

    // Selector real del contenedor de cada fila de chat (confirmado via consola)
    const ITEM_SELECTORS = '[data-testid^="list-item-"]';

    pane.addEventListener("mouseover", (e) => {
      if (!settings.hoverReveal) return;
      const item = e.target.closest(ITEM_SELECTORS);
      if (item) item.classList.add("wps-revealed");
    });

    pane.addEventListener("mouseout", (e) => {
      if (!settings.hoverReveal) return;
      const item = e.target.closest(ITEM_SELECTORS);
      if (item) {
        const related = e.relatedTarget;
        if (!item.contains(related)) {
          item.classList.remove("wps-revealed");
        }
      }
    });

    // archived-chatlist: se monta dinámicamente, usar observer dedicado
    bindArchivedChatlist();
  }

  // ---- Enlazar archived-chatlist cuando aparece en el DOM ----
  function bindArchivedChatlist() {
    const archived = document.querySelector('[data-testid="archived-chatlist"]');
    if (!archived || archived._wpsHoverBound) return;
    archived._wpsHoverBound = true;

    const ITEM_SELECTORS = '[data-testid^="list-item-"]';

    archived.addEventListener("mouseover", (e) => {
      if (!settings.hoverReveal) return;
      const item = e.target.closest(ITEM_SELECTORS);
      if (item) item.classList.add("wps-revealed");
    });

    archived.addEventListener("mouseout", (e) => {
      if (!settings.hoverReveal) return;
      const item = e.target.closest(ITEM_SELECTORS);
      if (item) {
        const related = e.relatedTarget;
        if (!item.contains(related)) item.classList.remove("wps-revealed");
      }
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
      <button class="wps-btn" id="wps-toggle" data-tip="${cpsT('panelTooltipPrivacyOff', settings.lang)}">
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
      <button class="wps-btn" id="wps-avatars" data-tip="${cpsT('panelTooltipPhotos', settings.lang)}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </button>

      <!-- Hide names -->
      <button class="wps-btn" id="wps-names" data-tip="${cpsT('panelTooltipNames', settings.lang)}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="15" y2="18"/>
        </svg>
      </button>

      <!-- Hover reveal -->
      <button class="wps-btn" id="wps-hover" data-tip="${cpsT('panelTooltipHover', settings.lang)}" style="font-size:12px; color:rgba(255,255,255,0.3);">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/>
        </svg>
      </button>

      <div class="wps-divider"></div>

      <!-- Idioma -->
      <button class="wps-btn" id="wps-lang" data-tip="${cpsT('language', settings.lang)}" style="font-size:10px; font-weight:700; letter-spacing:0.5px;">
        ${settings.lang.toUpperCase()}
      </button>

      <!-- Ocultar/mostrar panel -->
      <button class="wps-btn" id="wps-pin" data-tip="${cpsT('panelTooltipHidePanel', settings.lang)}" style="font-size:11px; color:rgba(255,255,255,0.3);">
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

    document.getElementById("wps-lang").addEventListener("click", () => {
      settings.lang = cpsNextLang(settings.lang);
      applyState();
      saveSettings();
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
    const langBtn = document.getElementById("wps-lang");
    const pinBtn = document.getElementById("wps-pin");
    const slider = document.getElementById("wps-blur-slider");
    const sliderWrap = document.getElementById("wps-slider-wrap");

    toggle?.classList.toggle("active", settings.privacyActive);
    avatarsBtn?.classList.toggle("active", settings.hideAvatars);
    namesBtn?.classList.toggle("active", settings.hideNames);
    hoverBtn?.classList.toggle("active", settings.hoverReveal);

    if (slider) slider.value = settings.blurLevel;
    sliderWrap?.classList.toggle("visible", settings.privacyActive);

    // Actualizar todos los tooltips con el idioma actual
    toggle?.setAttribute("data-tip", settings.privacyActive
      ? cpsT("panelTooltipPrivacyOn", settings.lang)
      : cpsT("panelTooltipPrivacyOff", settings.lang));
    avatarsBtn?.setAttribute("data-tip", cpsT("panelTooltipPhotos", settings.lang));
    namesBtn?.setAttribute("data-tip", cpsT("panelTooltipNames", settings.lang));
    hoverBtn?.setAttribute("data-tip", cpsT("panelTooltipHover", settings.lang));
    pinBtn?.setAttribute("data-tip", cpsT("panelTooltipHidePanel", settings.lang));
    if (langBtn) {
      langBtn.textContent = settings.lang.toUpperCase();
      langBtn.setAttribute("data-tip", cpsT("language", settings.lang));
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
    hint.textContent = cpsT("restoreHint", settings.lang);
    hint.style.direction = cpsIsRTL(settings.lang) ? "rtl" : "ltr";
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

  // ---- Status Preview ----
  const CIRCUNFERENCIA = 2 * Math.PI * 50;

  function countStates(cell) {
    const circle = cell.querySelector("circle");
    if (!circle) return 0;
    const dasharray = circle.getAttribute("stroke-dasharray");
    if (!dasharray) return 0;
    const values = dasharray.split(" ").map(Number).filter(Boolean);
    const arcValue = Math.max(...values);
    if (arcValue <= 0) return 0;
    return Math.round(CIRCUNFERENCIA / (arcValue + 10));
  }

  function buildStatusPreview() {
    if (document.getElementById("cps-status-preview")) return;

    const preview = document.createElement("div");
    preview.id = "cps-status-preview";
    preview.innerHTML = `
      <div class="cps-sp-name"></div>
      <div class="cps-sp-noimg"><span>👁</span>Preview</div>
      <div class="cps-sp-count"></div>
    `;
    document.body.appendChild(preview);
  }

  function setupStatusPreview() {
    const drawer = document.querySelector('[data-testid="status-drawer"]');
    if (!drawer || drawer._wpsStatusBound) return;
    drawer._wpsStatusBound = true;

    buildStatusPreview();
    const preview = document.getElementById("cps-status-preview");
    const nameEl = preview.querySelector(".cps-sp-name");
    const countEl = preview.querySelector(".cps-sp-count");
    const noImgEl = preview.querySelector(".cps-sp-noimg");

    drawer.addEventListener("mouseover", (e) => {
      if (!settings.privacyActive) return;

      const cell = e.target.closest('[data-testid="status-row-cell"]');
      if (!cell) return;

      // Obtener thumbnail
      const thumbDiv = cell.querySelector('[data-testid="status-thumbnail"] div div');
      const bg = thumbDiv ? window.getComputedStyle(thumbDiv).backgroundImage : null;

      // Nombre del contacto
      const name = cell.querySelector('[data-testid="cell-frame-title"]')?.textContent || "";
      nameEl.textContent = name;

      // Conteo de estados
      const count = countStates(cell);
      const countLabel = count > 5 ? "+5" : count;
      countEl.textContent = count > 1
        ? `👁 ${countLabel} ${cpsT("statusPreviewCount", settings.lang)}`
        : cpsT("statusPreviewOnly", settings.lang);

      if (bg && bg !== "none") {
        preview.style.backgroundImage = bg;
        noImgEl.style.display = "none";
      } else {
        preview.style.backgroundImage = "none";
        noImgEl.style.display = "flex";
      }

      preview.classList.add("visible");
    });

    drawer.addEventListener("mousemove", (e) => {
      if (!settings.privacyActive) return;
      const x = e.clientX + 24;
      const y = Math.max(10, Math.min(e.clientY - 80, window.innerHeight - 320));
      preview.style.left = x + "px";
      preview.style.top = y + "px";
    });

    drawer.addEventListener("mouseout", (e) => {
      const cell = e.target.closest('[data-testid="status-row-cell"]');
      if (!cell || !cell.contains(e.relatedTarget)) {
        preview.classList.remove("visible");
      }
    });
  }

  // ---- Init ----
  function init() {
    loadSettings(() => {
      applyState();
      buildPanel();

      // pane-side puede no existir aún — reintentar hasta que aparezca
      function tryBindPane() {
        const pane = document.getElementById("pane-side");
        if (pane) {
          setupHoverReveal();
        } else {
          setTimeout(tryBindPane, 300);
        }
      }
      tryBindPane();

      // Status preview — el drawer puede montarse después
      function tryBindStatus() {
        const drawer = document.querySelector('[data-testid="status-drawer"]');
        if (drawer) {
          setupStatusPreview();
        } else {
          setTimeout(tryBindStatus, 500);
        }
      }
      tryBindStatus();

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
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;

        // Panel principal
        if (node.id === "app" && !document.getElementById("wps-panel")) {
          buildPanel();
          setupHoverReveal();
        }

        // archived-chatlist montado dinámicamente
        const archived = node.matches?.('[data-testid="archived-chatlist"]')
          ? node
          : node.querySelector?.('[data-testid="archived-chatlist"]');
        if (archived) bindArchivedChatlist();

        // status-drawer montado dinámicamente
        const statusDrawer = node.matches?.('[data-testid="status-drawer"]')
          ? node
          : node.querySelector?.('[data-testid="status-drawer"]');
        if (statusDrawer) setupStatusPreview();
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

})();

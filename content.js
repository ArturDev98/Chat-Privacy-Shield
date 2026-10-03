(() => {
  "use strict";

  // =============================================
  //  Chat Privacy Shield - núcleo del content script
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
    showBadges: false,
    blurMain: false,
    hideTypedText: false,
    autoBlurEnabled: false,
    hideChatSubtitle: false,
    scheduleEnabled: false,
    scheduleStart: "09:00",
    scheduleEnd: "17:00",
    panelPosition: null,
    hintPosition: null,
    blurOnTabHidden: false,
    hideHeaderAvatar: false,
    hideTabCount: false,
    pinLockEnabled: false,
    autoLockMinutes: 0,
    lockOnTabHidden: false,
    lang: "en",
  };

  let settings = { ...defaults };
  let panel = null;

  // Estado del bloqueo con PIN. "Desbloqueado" vive solo en memoria: recargar
  // la página vuelve a pedir el PIN, que es el disparador elegido.
  let isLocked = false;
  let lockEntry = "";
  let lockPinLength = CPS_PIN_MIN;
  let lockCooldownTimer = null;
  let lockForgotVisible = false;
  let proActive = false;
  let proSerial = null;
  let pinConfigured = false;

  // Fallos tras los que se ofrece restablecer con la licencia: se muestra justo
  // antes del primer enfriamiento, cuando ya se ve que el PIN no sale.
  const LOCK_FORGOT_AFTER_FAILS = 3;

  // Lo que depende del DOM del sitio (selectores, secciones propias) llega del
  // adaptador cargado antes que este archivo: sites/<sitio>.js.
  const site = cpsCreateSite({
    getSettings: () => settings,
    bindHoverContainer,
  });

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

  // ---- Hacer un elemento arrastrable (panel y menú minimizado) ----
  const dragState = { active: false };

  function makeDraggable(el, storageKey) {
    const DRAG_THRESHOLD = 4;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;
    let dragging = false;
    let moved = false;

    function applyPosition(left, top) {
      const maxLeft = Math.max(0, window.innerWidth - el.offsetWidth);
      const maxTop = Math.max(0, window.innerHeight - el.offsetHeight);
      const clampedLeft = Math.min(Math.max(0, left), maxLeft);
      const clampedTop = Math.min(Math.max(0, top), maxTop);
      el.style.left = `${clampedLeft}px`;
      el.style.top = `${clampedTop}px`;
      el.style.bottom = "auto";
      el.style.transform = "none";
      return { left: clampedLeft, top: clampedTop };
    }

    // Restaurar posición guardada de una sesión anterior, si existe
    const saved = settings[storageKey];
    if (saved && typeof saved.left === "number" && typeof saved.top === "number") {
      applyPosition(saved.left, saved.top);
    }

    el.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return; // solo clic izquierdo
      // No arrancar un arrastre del panel si el clic fue sobre un control
      // interactivo propio (el slider de intensidad, por ejemplo) — si no,
      // mover el slider terminaba arrastrando el panel entero en vez de
      // ajustar el valor.
      if (e.target.closest?.('input, [type="range"]')) return;
      dragging = true;
      moved = false;
      const rect = el.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startLeft = rect.left;
      startTop = rect.top;
    });

    document.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!moved && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
      if (!moved) {
        moved = true;
        dragState.active = true;
        el.classList.add("wps-dragging");
      }
      applyPosition(startLeft + dx, startTop + dy);
    });

    document.addEventListener("mouseup", () => {
      if (!dragging) return;
      dragging = false;
      dragState.active = false;
      el.classList.remove("wps-dragging");
      if (moved) {
        const rect = el.getBoundingClientRect();
        settings[storageKey] = { left: rect.left, top: rect.top };
        saveSettings();
        // Se hubo arrastre real: se suprime el clic que dispararía el
        // navegador justo después, para no activar por accidente un
        // botón que haya quedado bajo el cursor al soltar.
        const suppressClick = (ev) => {
          ev.stopPropagation();
          ev.preventDefault();
        };
        document.addEventListener("click", suppressClick, { capture: true, once: true });
      }
    });
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
    body.classList.toggle("wps-show-badges", settings.showBadges);
    body.classList.toggle("wps-blur-main", settings.blurMain);
    body.classList.toggle("wps-hide-typed", settings.hideTypedText);
    body.classList.toggle("wps-hide-subtitle", settings.hideChatSubtitle);
    body.classList.toggle("wps-hide-header-avatar", settings.hideHeaderAvatar);
    body.classList.toggle("wps-hide-tab-count", settings.hideTabCount);
    // Si se desactiva hover reveal, limpiar items revelados que queden
    if (!settings.hoverReveal) {
      document.querySelectorAll(".wps-revealed").forEach(el => el.classList.remove("wps-revealed"));
    }
    // Igual para mensajes individuales revelados si se apaga blur-main
    if (!settings.blurMain) {
      document.querySelectorAll(".wps-msg-revealed").forEach(el => el.classList.remove("wps-msg-revealed"));
    }

    // CSS variables dinámicas
    body.style.setProperty("--wps-blur", `${settings.blurLevel}px`);
    body.style.setProperty("--wps-opacity", settings.opacity);

    updateBadgeOverlays();
    updatePanelUI();
    scheduleAutoBlur();
    applyTabCounter();
    restartAutoLock();
  }

  // ---- Hover reveal: por item individual en listas de chats/llamadas ----

  // Engancha el revelado por hover a un contenedor con scroll; _wpsHoverBound
  // evita duplicar listeners cuando el observer vuelve a pasar por aquí.
  function bindHoverContainer(container) {
    if (!container || container._wpsHoverBound) return;
    container._wpsHoverBound = true;

    // Refrescar overlays de badges al instante al hacer scroll (en vez de
    // esperar al siguiente tick del loop de 400ms)
    container.addEventListener("scroll", scheduleBadgeRefresh, { passive: true });

    container.addEventListener("mouseover", (e) => {
      if (!settings.hoverReveal) return;
      const item = site.hoverItem(e.target);
      if (item && !item.classList.contains("wps-revealed")) {
        item.classList.add("wps-revealed");
        scheduleBadgeRefresh();
      }
    });

    container.addEventListener("mouseout", (e) => {
      if (!settings.hoverReveal) return;
      const item = site.hoverItem(e.target);
      if (item) {
        const related = e.relatedTarget;
        if (!item.contains(related)) {
          item.classList.remove("wps-revealed");
          scheduleBadgeRefresh();
        }
      }
    });
  }

  // ---- Toggle privacidad principal ----
  function togglePrivacy() {
    if (isLocked) return;
    settings.privacyActive = !settings.privacyActive;
    applyState();
    saveSettings();
  }

  // ---- Toggle panel flotante ----
  function togglePanel() {
    if (isLocked) return;
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

      <!-- Mostrar contador de no leídos -->
      <button class="wps-btn" id="wps-badges" data-tip="${cpsT('panelTooltipBadges', settings.lang)}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      </button>

      <!-- Difuminar conversación activa -->
      <button class="wps-btn" id="wps-blur-main" data-tip="${cpsT('panelTooltipBlurMain', settings.lang)}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10M7 13h6"/>
        </svg>
      </button>

      <!-- Ocultar texto escrito al perder foco -->
      <button class="wps-btn" id="wps-hide-typed" data-tip="${cpsT('panelTooltipHideTyped', settings.lang)}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 2l4 4-14 14H3v-4z"/><path d="M14.5 4.5 19.5 9.5"/>
        </svg>
      </button>

      <!-- Auto-difuminar por inactividad -->
      <button class="wps-btn" id="wps-auto-blur" data-tip="${cpsT('panelTooltipAutoBlur', settings.lang)}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2"/><path d="M9 2h6"/>
        </svg>
      </button>

      <!-- Ocultar "en línea"/"última vez"/"escribiendo..." -->
      <button class="wps-btn" id="wps-hide-subtitle" data-tip="${cpsT('panelTooltipHideSubtitle', settings.lang)}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9"/><path d="M12 12h4M8 12h.01"/>
        </svg>
      </button>

      <!-- Auto-difuminar al perder el foco de la pestaña/ventana -->
      <button class="wps-btn" id="wps-blur-tab-hidden" data-tip="${cpsT('panelTooltipBlurTabHidden', settings.lang)}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 21h8M12 18v3"/>
        </svg>
      </button>

      <!-- Ocultar foto del contacto en el encabezado del chat -->
      <button class="wps-btn" id="wps-hide-header-avatar" data-tip="${cpsT('panelTooltipHideHeaderAvatar', settings.lang)}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6"/><line x1="3" y1="3" x2="21" y2="21"/>
        </svg>
      </button>

      <!-- Ocultar el contador de no leídos del título de la pestaña -->
      <button class="wps-btn" id="wps-hide-tab-count" data-tip="${cpsT('panelTooltipHideTabCount', settings.lang)}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 9h14M5 15h14M10 4 8 20M16 4l-2 16"/><line x1="3" y1="3" x2="21" y2="21"/>
        </svg>
      </button>

      <!-- Bloquear ahora con PIN (Pro) -->
      <button class="wps-btn wps-hidden" id="wps-lock-now" data-tip="${cpsT('panelTooltipLockNow', settings.lang)}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
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
    makeDraggable(panel, "panelPosition");

    // ---- Auto-cerrar al sacar el cursor (como si se hubiera dado en la X) ----
    let panelAutoHideTimer = null;

    panel.addEventListener("mouseleave", () => {
      if (dragState.active) return; // no cerrar mientras se está arrastrando
      clearTimeout(panelAutoHideTimer);
      panelAutoHideTimer = setTimeout(() => {
        if (panel.classList.contains("wps-panel-hidden")) return;
        panel.classList.add("wps-panel-hidden");
        showRestoreHint();
      }, 400);
    });

    panel.addEventListener("mouseenter", () => {
      clearTimeout(panelAutoHideTimer);
    });

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

    document.getElementById("wps-badges").addEventListener("click", () => {
      settings.showBadges = !settings.showBadges;
      applyState();
      saveSettings();
    });

    document.getElementById("wps-blur-main").addEventListener("click", () => {
      settings.blurMain = !settings.blurMain;
      applyState();
      saveSettings();
    });

    document.getElementById("wps-hide-typed").addEventListener("click", () => {
      settings.hideTypedText = !settings.hideTypedText;
      applyState();
      saveSettings();
    });

    document.getElementById("wps-auto-blur").addEventListener("click", () => {
      settings.autoBlurEnabled = !settings.autoBlurEnabled;
      applyState();
      saveSettings();
    });

    document.getElementById("wps-hide-subtitle").addEventListener("click", () => {
      settings.hideChatSubtitle = !settings.hideChatSubtitle;
      applyState();
      saveSettings();
    });

    document.getElementById("wps-blur-tab-hidden").addEventListener("click", () => {
      settings.blurOnTabHidden = !settings.blurOnTabHidden;
      applyState();
      saveSettings();
    });

    document.getElementById("wps-hide-header-avatar").addEventListener("click", () => {
      settings.hideHeaderAvatar = !settings.hideHeaderAvatar;
      applyState();
      saveSettings();
    });

    document.getElementById("wps-hide-tab-count").addEventListener("click", () => {
      settings.hideTabCount = !settings.hideTabCount;
      applyState();
      saveSettings();
    });

    document.getElementById("wps-lock-now").addEventListener("click", () => {
      lockNow();
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
    const badgesBtn = document.getElementById("wps-badges");
    const blurMainBtn = document.getElementById("wps-blur-main");
    const hideTypedBtn = document.getElementById("wps-hide-typed");
    const autoBlurBtn = document.getElementById("wps-auto-blur");
    const hideSubtitleBtn = document.getElementById("wps-hide-subtitle");
    const blurTabHiddenBtn = document.getElementById("wps-blur-tab-hidden");
    const hideHeaderAvatarBtn = document.getElementById("wps-hide-header-avatar");
    const hideTabCountBtn = document.getElementById("wps-hide-tab-count");
    const lockNowBtn = document.getElementById("wps-lock-now");
    const langBtn = document.getElementById("wps-lang");
    const pinBtn = document.getElementById("wps-pin");
    const slider = document.getElementById("wps-blur-slider");
    const sliderWrap = document.getElementById("wps-slider-wrap");

    toggle?.classList.toggle("active", settings.privacyActive);
    avatarsBtn?.classList.toggle("active", settings.hideAvatars);
    namesBtn?.classList.toggle("active", settings.hideNames);
    hoverBtn?.classList.toggle("active", settings.hoverReveal);
    badgesBtn?.classList.toggle("active", settings.showBadges);
    blurMainBtn?.classList.toggle("active", settings.blurMain);
    hideTypedBtn?.classList.toggle("active", settings.hideTypedText);
    autoBlurBtn?.classList.toggle("active", settings.autoBlurEnabled);
    hideSubtitleBtn?.classList.toggle("active", settings.hideChatSubtitle);
    blurTabHiddenBtn?.classList.toggle("active", settings.blurOnTabHidden);
    hideHeaderAvatarBtn?.classList.toggle("active", settings.hideHeaderAvatar);
    hideTabCountBtn?.classList.toggle("active", settings.hideTabCount);

    if (slider) slider.value = settings.blurLevel;
    sliderWrap?.classList.toggle("visible", settings.privacyActive);

    // Actualizar todos los tooltips con el idioma actual
    toggle?.setAttribute("data-tip", settings.privacyActive
      ? cpsT("panelTooltipPrivacyOn", settings.lang)
      : cpsT("panelTooltipPrivacyOff", settings.lang));
    avatarsBtn?.setAttribute("data-tip", cpsT("panelTooltipPhotos", settings.lang));
    namesBtn?.setAttribute("data-tip", cpsT("panelTooltipNames", settings.lang));
    hoverBtn?.setAttribute("data-tip", cpsT("panelTooltipHover", settings.lang));
    badgesBtn?.setAttribute("data-tip", cpsT("panelTooltipBadges", settings.lang));
    blurMainBtn?.setAttribute("data-tip", cpsT("panelTooltipBlurMain", settings.lang));
    hideTypedBtn?.setAttribute("data-tip", cpsT("panelTooltipHideTyped", settings.lang));
    autoBlurBtn?.setAttribute("data-tip", cpsT("panelTooltipAutoBlur", settings.lang));
    hideSubtitleBtn?.setAttribute("data-tip", cpsT("panelTooltipHideSubtitle", settings.lang));
    blurTabHiddenBtn?.setAttribute("data-tip", cpsT("panelTooltipBlurTabHidden", settings.lang));
    hideHeaderAvatarBtn?.setAttribute("data-tip", cpsT("panelTooltipHideHeaderAvatar", settings.lang));
    hideTabCountBtn?.setAttribute("data-tip", cpsT("panelTooltipHideTabCount", settings.lang));
    pinBtn?.setAttribute("data-tip", cpsT("panelTooltipHidePanel", settings.lang));

    // El candado solo aparece cuando hay Pro + PIN configurado + opción activa.
    lockNowBtn?.classList.toggle("wps-hidden", !pinLockArmed());
    lockNowBtn?.setAttribute("data-tip", cpsT("panelTooltipLockNow", settings.lang));
    if (langBtn) {
      langBtn.textContent = settings.lang.toUpperCase();
      langBtn.setAttribute("data-tip", cpsT("language", settings.lang));
    }
  }

  // ---- Hint para restaurar panel minimizado ----
  // Se mantiene bien transparente por defecto para no tapar lo que se está
  // escribiendo en el input de chat; al pasar el cursor se vuelve legible.
  function showRestoreHint() {
    const hint = document.createElement("div");
    hint.id = "wps-restore-hint";
    hint.textContent = cpsT("restoreHint", settings.lang);
    hint.style.direction = cpsIsRTL(settings.lang) ? "rtl" : "ltr";
    hint.addEventListener("click", () => {
      settings.panelVisible = true;
      panel.classList.remove("wps-panel-hidden");
      hint.remove();
      saveSettings();
    });
    document.body.appendChild(hint);
    makeDraggable(hint, "hintPosition");
  }

  // ---- Badge de no leídos: overlay que "escapa" del blur del item ----
  // Un hijo no puede quitarse el blur de un ancestro: se clona fuera del árbol difuminado.
  let badgeLoopId = null;
  let badgeRefreshScheduled = false;

  // Throttlea updateBadgeOverlays a un frame — se usa en eventos de scroll
  // que pueden dispararse muchas veces por segundo.
  function scheduleBadgeRefresh() {
    if (badgeRefreshScheduled) return;
    badgeRefreshScheduled = true;
    requestAnimationFrame(() => {
      badgeRefreshScheduled = false;
      updateBadgeOverlays();
    });
  }

  // Propiedades que normalmente llegan por herencia/cascada desde los
  // ancestros reales del badge (tamaño de fuente, centrado con flex, etc).
  // Al clonar y mover el elemento a <body>, esa cascada se pierde — por eso
  // se capturan explícitamente con getComputedStyle() y se copian al clon,
  // así queda visualmente idéntico al original en vez de más grande y
  // descentrado.
  const BADGE_STYLE_PROPS = [
    "fontSize", "fontFamily", "fontWeight", "lineHeight", "letterSpacing",
    "color", "backgroundColor", "borderRadius", "padding", "boxSizing",
    "display", "alignItems", "justifyContent", "textAlign", "whiteSpace",
  ];

  function cloneBadgeWithComputedStyle(badge) {
    const clone = badge.cloneNode(true);
    clone.classList.add("wps-badge-clone");
    const computed = window.getComputedStyle(badge);
    BADGE_STYLE_PROPS.forEach((prop) => {
      clone.style[prop] = computed[prop];
    });
    return clone;
  }

  // El contador solo se muestra mientras el mouse está en movimiento
  // activo, y se oculta a los ~900ms de quedar quieto. Evita depender de
  // distinguir con precisión cada estructura interna de WhatsApp (chats,
  // estados ocultos, etc.) para decidir dónde "debe" o "no debe" aparecer:
  // si no estás moviendo el mouse ahí, simplemente no se ve.
  let mouseIdle = true;
  let mouseIdleTimer = null;

  document.addEventListener("mousemove", () => {
    if (mouseIdle) {
      mouseIdle = false;
      scheduleBadgeRefresh();
    }
    clearTimeout(mouseIdleTimer);
    mouseIdleTimer = setTimeout(() => {
      mouseIdle = true;
      scheduleBadgeRefresh();
    }, 900);
  }, { passive: true });

  function clearBadgeOverlays() {
    document.querySelectorAll(".wps-badge-clone").forEach((el) => el.remove());
  }

  function updateBadgeOverlays() {
    if (!settings.privacyActive || !settings.showBadges) {
      clearBadgeOverlays();
      stopBadgeLoop();
      return;
    }

    if (mouseIdle) {
      clearBadgeOverlays();
      stopBadgeLoop();
      return;
    }

    const items = document.querySelectorAll(site.badgeItemSelector);

    let found = false;
    items.forEach((item) => {
      if (site.skipBadgeItem(item)) {
        const staleClone = item._wpsBadgeClone;
        if (staleClone) staleClone.style.display = "none";
        return;
      }

      const existingClone = item._wpsBadgeClone;
      const badge = item.querySelector(site.badgeSelector);

      if (!badge) {
        // Ya no hay contador (p. ej. se leyó el mensaje): se oculta el clon que quedara.
        if (existingClone) existingClone.style.display = "none";
        return;
      }

      const rect = badge.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        // La lista sigue montada pero oculta al cambiar de sección; sin esto el
        // clon se queda flotando en su última posición.
        if (existingClone) existingClone.style.display = "none";
        return;
      }

      // Con tamaño válido aún puede estar tapado por otra sección dibujada encima.
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const topElement = document.elementFromPoint(cx, cy);
      const actuallyOnTop = topElement && (badge.contains(topElement) || topElement.contains(badge));
      if (!actuallyOnTop) {
        if (existingClone) existingClone.style.display = "none";
        return;
      }
      found = true;

      let clone = existingClone;
      if (!clone || !clone.isConnected) {
        clone = cloneBadgeWithComputedStyle(badge);
        document.body.appendChild(clone);
        item._wpsBadgeClone = clone;
      } else if (clone.textContent !== badge.textContent) {
        clone.textContent = badge.textContent;
      }

      // El clon vive en <body> e ignora el overflow de la lista: sin recortar,
      // un item fuera de vista seguiría flotando en pantalla.
      const container = site.badgeClip(item);
      const clip = container ? container.getBoundingClientRect() : null;
      const withinBounds = !clip || (
        rect.top >= clip.top &&
        rect.bottom <= clip.bottom &&
        rect.left >= clip.left &&
        rect.right <= clip.right
      );

      // Revelado por hover, el badge real ya se ve: el clon sería un duplicado.
      const revealed = item.classList.contains("wps-revealed");

      if (!withinBounds || revealed) {
        clone.style.display = "none";
        return;
      }

      clone.style.display = "";
      clone.style.left = `${rect.left}px`;
      clone.style.top = `${rect.top}px`;
      clone.style.width = `${rect.width}px`;
      clone.style.height = `${rect.height}px`;
    });

    // Limpiar clones huérfanos (chats que ya no están montados en el DOM)
    document.querySelectorAll(".wps-badge-clone").forEach((clone) => {
      const stillOwned = Array.from(items).some((item) => item._wpsBadgeClone === clone);
      if (!stillOwned) clone.remove();
    });

    // El loop sigue aunque no haya badges visibles: si parara, nadie limpiaría
    // los clones huérfanos al volver o cambiar de sección.
    startBadgeLoop();
  }

  // Bucle liviano que reposiciona/limpia los overlays de badges mientras
  // la opción esté activa (cubre scroll, mensajes nuevos y cambios de
  // pestaña dentro de WhatsApp)
  function startBadgeLoop() {
    if (badgeLoopId) return;
    const tick = () => {
      if (!settings.privacyActive || !settings.showBadges) {
        stopBadgeLoop();
        return;
      }
      updateBadgeOverlays();
      badgeLoopId = setTimeout(tick, 400);
    };
    badgeLoopId = setTimeout(tick, 400);
  }

  function stopBadgeLoop() {
    if (badgeLoopId) {
      clearTimeout(badgeLoopId);
      badgeLoopId = null;
    }
  }

  // ---- Ocultar texto escrito cuando el input del chat pierde el foco ----
  const COMPOSE_INPUT_SELECTOR = site.composeInputSelector;

  document.addEventListener("focusout", (e) => {
    if (!settings.privacyActive || !settings.hideTypedText) return;
    const input = e.target.closest?.(COMPOSE_INPUT_SELECTOR);
    if (input) input.classList.add("wps-input-blurred");
  }, true);

  document.addEventListener("focusin", (e) => {
    const input = e.target.closest?.(COMPOSE_INPUT_SELECTOR);
    if (input) input.classList.remove("wps-input-blurred");
  }, true);

  // El input mantiene el foco hasta que se hace clic en otra parte, así
  // que basar el difuminado solo en focusout obligaba a hacer clic para
  // que se aplicara. Se agrega el mismo efecto al sacar el cursor del
  // input, sin necesidad de perder el foco ni hacer clic.
  document.addEventListener("mouseout", (e) => {
    if (!settings.privacyActive || !settings.hideTypedText) return;
    const input = e.target.closest?.(COMPOSE_INPUT_SELECTOR);
    if (input) {
      const related = e.relatedTarget;
      if (!related || !input.contains(related)) {
        input.classList.add("wps-input-blurred");
      }
    }
  }, true);

  document.addEventListener("mouseover", (e) => {
    const input = e.target.closest?.(COMPOSE_INPUT_SELECTOR);
    if (input) input.classList.remove("wps-input-blurred");
  }, true);

  // ---- Auto-difuminar por inactividad ----
  // Si no hay actividad (mouse/teclado/scroll/clic) durante el tiempo
  // configurado, se activa la privacidad sola. A propósito NO se apaga
  // automáticamente al volver la actividad — queda difuminado hasta que
  // se apague manualmente desde el panel, para no revelar nada de golpe
  // apenas alguien vuelve a tocar el mouse.
  const AUTO_BLUR_DELAY_MS = 30000;
  let autoBlurTimer = null;

  function scheduleAutoBlur() {
    clearTimeout(autoBlurTimer);
    if (!settings.autoBlurEnabled || settings.privacyActive) return;
    autoBlurTimer = setTimeout(() => {
      if (!settings.autoBlurEnabled || settings.privacyActive) return;
      settings.privacyActive = true;
      applyState();
      saveSettings();
    }, AUTO_BLUR_DELAY_MS);
  }

  // Lo que cuenta como actividad para el auto-difuminado y el bloqueo automático.
  const ACTIVITY_EVENTS = ["mousemove", "keydown", "mousedown", "wheel", "touchstart"];

  ACTIVITY_EVENTS.forEach((evt) => {
    document.addEventListener(evt, scheduleAutoBlur, { passive: true });
  });

  // ---- Auto-difuminar por horario programado ----
  // Al entrar a la ventana configurada (ej. 9:00-17:00), se activa la
  // privacidad junto con todas las opciones principales de ocultar
  // (fotos, nombres, chat activo, texto escrito, en línea/última vez) y
  // las que hacen que ese difuminado siga siendo usable (revelar al
  // pasar el cursor, contador de no leídos) — sin esto último, la lista
  // difuminada queda inservible: no hay forma de leer nada ni de ver
  // qué chats tienen mensajes pendientes. Al terminar la ventana, se
  // desactiva todo de nuevo.
  // Si el usuario apaga manualmente en medio de la ventana, no se vuelve
  // a forzar el encendido hasta el siguiente ciclo (no "pelea" cada 20s).
  let scheduleWasWithinWindow = false;

  function isWithinSchedule() {
    if (!settings.scheduleEnabled) return false;
    const [startH, startM] = (settings.scheduleStart || "09:00").split(":").map(Number);
    const [endH, endM] = (settings.scheduleEnd || "17:00").split(":").map(Number);
    if ([startH, startM, endH, endM].some((n) => Number.isNaN(n))) return false;

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes === endMinutes) return false;
    if (startMinutes < endMinutes) {
      return nowMinutes >= startMinutes && nowMinutes < endMinutes;
    }
    // Rango que cruza la medianoche (ej. 22:00 a 06:00)
    return nowMinutes >= startMinutes || nowMinutes < endMinutes;
  }

  // Opciones que se activan por completo al arrancar la ventana
  // programada — así el usuario no tiene que haberlas configurado
  // manualmente de antemano para que el horario dé protección real.
  const SCHEDULE_FULL_PRIVACY_KEYS = ["hideAvatars", "hideNames", "blurMain", "hideTypedText", "hideChatSubtitle", "hideTabCount", "hoverReveal", "showBadges"];

  function checkSchedule() {
    if (!settings.scheduleEnabled) {
      scheduleWasWithinWindow = false;
      return;
    }
    const withinWindow = isWithinSchedule();

    if (withinWindow && !scheduleWasWithinWindow) {
      // Arranca una ventana nueva: se activa todo.
      settings.privacyActive = true;
      SCHEDULE_FULL_PRIVACY_KEYS.forEach((key) => { settings[key] = true; });
      applyState();
      saveSettings();
    } else if (!withinWindow && scheduleWasWithinWindow) {
      // Termina la ventana: se desactiva.
      settings.privacyActive = false;
      applyState();
      saveSettings();
    }

    scheduleWasWithinWindow = withinWindow;
  }

  setInterval(checkSchedule, 20000);

  // ---- Auto-difuminar al perder el foco de la pestaña/ventana ----
  // Se activa apenas cambias de pestaña, minimizas o pasas a otra
  // aplicación — no espera nada, es inmediato
  function triggerTabHiddenBlur() {
    if (!settings.blurOnTabHidden || settings.privacyActive) return;
    settings.privacyActive = true;
    applyState();
    saveSettings();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) triggerTabHiddenBlur();
  });

  window.addEventListener("blur", triggerTabHiddenBlur);

  // ---- Ocultar el contador de no leídos de la pestaña ----
  // El sitio lo pone en el título y lo dibuja en el favicon; una pestaña
  // fijada solo muestra el favicon.
  const TITLE_COUNT_RE = site.titleCountRe;
  const ICON_SELECTOR = 'link[rel~="icon"]';
  let siteTitle = null; // último título que puso el sitio, con su contador
  const siteIconHrefs = new WeakMap(); // <link> → último href que le puso el sitio
  const ownIconHrefs = new WeakMap(); // <link> → href que le puso la extensión

  // Este script corre con WhatsApp aún en su pantalla de carga: el favicon
  // todavía no lleva contador y sirve de versión limpia.
  const cleanIconHref = TITLE_COUNT_RE.test(document.title)
    ? null
    : document.head.querySelector(ICON_SELECTOR)?.getAttribute("href") ?? null;

  function tabCountHidden() {
    return settings.privacyActive && settings.hideTabCount;
  }

  function applyTabTitle() {
    const textNode = document.querySelector("head > title")?.firstChild;
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return;
    if (siteTitle === null) siteTitle = textNode.data;

    const wanted = tabCountHidden() ? siteTitle.replace(TITLE_COUNT_RE, "") : siteTitle;
    // Se edita el nodo de texto en vez de document.title: eso no genera un
    // childList, y el observer sabe que cada childList es una escritura del sitio.
    if (textNode.data !== wanted) textNode.data = wanted;
  }

  function applyTabIcon() {
    if (!cleanIconHref) return;
    document.head.querySelectorAll(ICON_SELECTOR).forEach((link) => {
      if (!siteIconHrefs.has(link)) siteIconHrefs.set(link, link.getAttribute("href"));

      let wanted;
      if (tabCountHidden()) {
        wanted = cleanIconHref;
        ownIconHrefs.set(link, wanted);
      } else if (ownIconHrefs.has(link)) {
        // Si el sitio escribió el mismo href que el nuestro no se vio; el título
        // dice si hoy toca el favicon con contador o el limpio.
        wanted = TITLE_COUNT_RE.test(siteTitle ?? "") ? siteIconHrefs.get(link) : cleanIconHref;
        ownIconHrefs.delete(link);
      } else {
        return; // nunca se tocó: es del sitio tal cual
      }
      if (wanted && link.getAttribute("href") !== wanted) link.setAttribute("href", wanted);
    });
  }

  function applyTabCounter() {
    applyTabTitle();
    applyTabIcon();
  }

  // Contador del menú lateral del sitio: solo se marcan los que muestran un número.
  const NAV_COUNT_SELECTOR = site.navCountSelector;

  function markNavCounts() {
    document.querySelectorAll(NAV_COUNT_SELECTOR).forEach((el) => {
      el.classList.toggle("wps-nav-count", /^\d+\+?$/.test(el.textContent.trim()));
    });
  }

  // document.title = x reemplaza el nodo de texto del <title> (o el <title>
  // entero), así que basta con childList para el título; el favicon cambia de
  // href o se reemplaza el <link> entero.
  new MutationObserver((records) => {
    let changed = false;
    for (const r of records) {
      if (r.target.nodeName === "TITLE" || [...r.addedNodes].some((n) => n.nodeName === "TITLE")) {
        siteTitle = document.querySelector("head > title")?.textContent ?? null;
        changed = true;
      }
      for (const n of r.addedNodes) {
        if (n.matches?.(ICON_SELECTOR)) {
          siteIconHrefs.set(n, n.getAttribute("href"));
          changed = true;
        }
      }
      if (r.type === "attributes" && r.target.matches(ICON_SELECTOR)) {
        const href = r.target.getAttribute("href");
        if (href !== ownIconHrefs.get(r.target)) siteIconHrefs.set(r.target, href);
        changed = true;
      }
    }
    if (changed) applyTabCounter();
  }).observe(document.head, { childList: true, subtree: true, attributes: true, attributeFilter: ["href"] });

  // ---- Hover sobre la conversación activa ----
  // Delegado en `document` en vez de atado a un nodo puntual de la conversación
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest?.(site.conversationSelector)) {
      document.body.classList.add("wps-main-hovered");
    }
  });

  document.addEventListener("mouseout", (e) => {
    const main = e.target.closest?.(site.conversationSelector);
    if (!main) return;
    const related = e.relatedTarget;
    if (!related || !main.contains(related)) {
      document.body.classList.remove("wps-main-hovered");
    }
  });

  // ---- Hover específico sobre el bloque de info del encabezado ----
  // (foto + nombre + "en línea"/"última vez")
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest?.(site.conversationHeaderSelector)) {
      document.body.classList.add("wps-header-hovered");
    }
  });

  document.addEventListener("mouseout", (e) => {
    const infoHeader = e.target.closest?.(site.conversationHeaderSelector);
    if (!infoHeader) return;
    const related = e.relatedTarget;
    if (!related || !infoHeader.contains(related)) {
      document.body.classList.remove("wps-header-hovered");
    }
  });

  // ---- Hover por mensaje individual dentro de la conversación activa ----
  const MESSAGE_ROW_SELECTOR = site.messageRowSelector;
  const MESSAGE_SELECTOR = site.messageSelector;

  document.addEventListener("mouseover", (e) => {
    if (!settings.privacyActive || !settings.blurMain) return;
    const row = e.target.closest?.(MESSAGE_ROW_SELECTOR);
    if (!row) return;
    const msg = row.querySelector(MESSAGE_SELECTOR);
    if (msg) msg.classList.add("wps-msg-revealed");
  });

  document.addEventListener("mouseout", (e) => {
    if (!settings.privacyActive || !settings.blurMain) return;
    const row = e.target.closest?.(MESSAGE_ROW_SELECTOR);
    if (!row) return;
    const related = e.relatedTarget;
    if (!related || !row.contains(related)) {
      const msg = row.querySelector(MESSAGE_SELECTOR);
      if (msg) msg.classList.remove("wps-msg-revealed");
    }
  });

  // ---- Escuchar mensajes desde background/popup ----
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "toggle-privacy") togglePrivacy();
    if (msg.action === "toggle-panel") togglePanel();
    if (msg.action === "lock-now") lockNow();
    if (msg.action === "sync-settings" && msg.settings) {
      const incoming = { ...msg.settings };
      // Con la pantalla de bloqueo puesta, nada externo puede apagar el
      // candado: solo el PIN correcto lo levanta.
      if (isLocked) incoming.pinLockEnabled = settings.pinLockEnabled;
      settings = { ...settings, ...incoming };
      // Tocar el popup es actividad: sin esto, bajar el plazo desde ahí podía
      // bloquear en el acto.
      if (!isLocked) lastActivityAt = Date.now();
      applyState();
    }
  });

  // Pro y PIN viven fuera de wps_settings — hay que reaccionar cuando el
  // popup los cambia, sin obligar a recargar WhatsApp Web.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes[CPS_PRO_KEY] || changes[CPS_PIN_KEY]) refreshProState();
  });

  // ---- Keyboard shortcuts directos en la página ----
  document.addEventListener("keydown", (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.shiftKey && e.key === "H") { e.preventDefault(); togglePrivacy(); }
    if (mod && e.shiftKey && e.key === "K") { e.preventDefault(); togglePanel(); }
    if (mod && e.shiftKey && e.key === "L") { e.preventDefault(); lockNow(); }
  });

  // ---- Bloqueo con PIN (Pro) ----

  async function refreshProState() {
    const pro = await cpsProGet();
    proActive = pro.active;
    proSerial = pro.serial;
    pinConfigured = await cpsPinExists();
    lockPinLength = await cpsPinLength();
    // Si se pierde el Pro o se borra el PIN, no puede quedar nadie encerrado.
    if (isLocked && !(proActive && pinConfigured)) unlockNow();
    updatePanelUI();
    restartAutoLock();
  }

  function pinLockArmed() {
    return proActive && pinConfigured && settings.pinLockEnabled;
  }

  // ---- Bloqueo automático (Pro) ----
  // Por inactividad o al ocultarse la pestaña. Se cuenta con una marca de
  // tiempo y no solo con el timer: en segundo plano Chrome retrasa los timers
  // hasta un minuto, y con el equipo suspendido no corren.
  let lastActivityAt = Date.now();
  let autoLockTimer = null;

  function autoLockDelayMs() {
    return cpsAutoLockMinutes(settings.autoLockMinutes) * 60000;
  }

  function autoLockActive() {
    return autoLockDelayMs() > 0 && pinLockArmed() && !isLocked;
  }

  function autoLockDue() {
    return autoLockActive() && Date.now() - lastActivityAt >= autoLockDelayMs();
  }

  // El timer no se reinicia en cada mousemove: al vencer mira la última
  // actividad y, si hubo, se reprograma por lo que falta.
  function autoLockTick() {
    autoLockTimer = null;
    if (!autoLockActive()) return;
    const left = lastActivityAt + autoLockDelayMs() - Date.now();
    if (left > 0) autoLockTimer = setTimeout(autoLockTick, left);
    else lockNow();
  }

  function restartAutoLock() {
    clearTimeout(autoLockTimer);
    autoLockTimer = null;
    autoLockTick();
  }

  function noteActivity() {
    if (isLocked) return;
    // Si el plazo venció sin que el timer llegara a correr, la actividad no lo salva.
    if (autoLockDue()) {
      lockNow();
      return;
    }
    lastActivityAt = Date.now();
    if (!autoLockTimer) autoLockTick();
  }

  ACTIVITY_EVENTS.forEach((evt) => {
    document.addEventListener(evt, noteActivity, { passive: true });
  });

  // Solo visibilitychange, no window blur: blur también salta al abrir el
  // popup de la extensión, y bloquearía justo al ir a cambiar un ajuste.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (settings.lockOnTabHidden) lockNow();
    } else if (autoLockDue()) {
      lockNow();
    }
  });

  function lockNow() {
    if (!pinLockArmed() || isLocked) return;
    isLocked = true;
    lockEntry = "";
    document.activeElement?.blur?.();
    document.body.classList.add("wps-locked");
    buildLockOverlay();
    refreshLockCooldown();
  }

  function unlockNow() {
    isLocked = false;
    lockEntry = "";
    clearInterval(lockCooldownTimer);
    lockCooldownTimer = null;
    document.body.classList.remove("wps-locked");
    document.getElementById("wps-lock-overlay")?.remove();
    // Sin esto el plazo seguiría vencido y volvería a bloquear al instante.
    lastActivityAt = Date.now();
    restartAutoLock();
  }

  const LOCK_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "del", "0", "ok"];

  function buildLockOverlay() {
    if (document.getElementById("wps-lock-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "wps-lock-overlay";
    overlay.dir = cpsIsRTL(settings.lang) ? "rtl" : "ltr";
    overlay.innerHTML = `
      <div id="wps-lock-card">
        <div id="wps-lock-shield">🛡</div>
        <h2 id="wps-lock-title">${cpsT("lockScreenTitle", settings.lang)}</h2>
        <p id="wps-lock-sub">${cpsT("lockScreenSubtitle", settings.lang)}</p>
        <div id="wps-lock-dots"></div>
        <div id="wps-lock-error"></div>
        <div id="wps-lock-keypad"></div>
        <button type="button" id="wps-lock-forgot" class="wps-hidden">${cpsT("lockForgotPin", settings.lang)}</button>
        <div id="wps-lock-reset" class="wps-hidden">
          <p id="wps-lock-reset-hint">${cpsT("lockResetHint", settings.lang)}</p>
          <textarea id="wps-lock-reset-input" rows="3" spellcheck="false" autocomplete="off"></textarea>
          <div id="wps-lock-reset-actions">
            <button type="button" id="wps-lock-reset-cancel">${cpsT("pinCancel", settings.lang)}</button>
            <button type="button" id="wps-lock-reset-ok">${cpsT("pinConfirm", settings.lang)}</button>
          </div>
        </div>
      </div>
    `;

    const keypad = overlay.querySelector("#wps-lock-keypad");
    for (const key of LOCK_KEYS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wps-lock-key";
      btn.dataset.key = key;
      btn.textContent = key === "del" ? "⌫" : key === "ok" ? "✓" : key;
      if (key === "del" || key === "ok") btn.classList.add("wps-lock-key-alt");
      keypad.appendChild(btn);
    }

    keypad.addEventListener("click", (e) => {
      const btn = e.target.closest(".wps-lock-key");
      if (btn) handleLockKey(btn.dataset.key);
    });

    overlay.querySelector("#wps-lock-forgot").addEventListener("click", () => showLockResetView(true));
    overlay.querySelector("#wps-lock-reset-cancel").addEventListener("click", () => showLockResetView(false));
    overlay.querySelector("#wps-lock-reset-ok").addEventListener("click", submitLockReset);

    document.body.appendChild(overlay);
    renderLockDots();
    refreshForgotVisibility();
  }

  // El enlace aparece recién tras varios fallos: no conviene anunciar la salida
  // antes de que haga falta.
  async function refreshForgotVisibility() {
    lockForgotVisible = (await cpsPinFailCount()) >= LOCK_FORGOT_AFTER_FAILS;
    const btn = document.getElementById("wps-lock-forgot");
    const resetOpen = !document.getElementById("wps-lock-reset")?.classList.contains("wps-hidden");
    btn?.classList.toggle("wps-hidden", !lockForgotVisible || resetOpen);
  }

  function showLockResetView(show) {
    // "Ingresa tu PIN para continuar" estorba cuando lo que se pide es la
    // licencia; el texto de la vista de restablecer lo reemplaza.
    document.getElementById("wps-lock-sub")?.classList.toggle("wps-hidden", show);
    document.getElementById("wps-lock-dots")?.classList.toggle("wps-hidden", show);
    document.getElementById("wps-lock-keypad")?.classList.toggle("wps-hidden", show);
    document.getElementById("wps-lock-reset")?.classList.toggle("wps-hidden", !show);
    document.getElementById("wps-lock-forgot")?.classList.toggle("wps-hidden", show || !lockForgotVisible);
    showLockError("");

    const input = document.getElementById("wps-lock-reset-input");
    if (input) {
      input.value = "";
      if (show) input.focus();
    }
  }

  async function submitLockReset() {
    const value = document.getElementById("wps-lock-reset-input")?.value || "";
    const license = await cpsProVerifyCode(value);

    // No basta con que la firma sea válida: tiene que ser la misma licencia que
    // activó esta instalación, o la de otro comprador abriría este candado.
    if (!license || license.serial === null || license.serial !== proSerial) {
      showLockError(cpsT("lockResetInvalid", settings.lang));
      shakeLockCard();
      return;
    }

    await cpsPinClear();
    pinConfigured = false;
    settings.pinLockEnabled = false;
    saveSettings();
    unlockNow();
    updatePanelUI();
  }

  function handleLockKey(key) {
    if (document.getElementById("wps-lock-keypad")?.classList.contains("disabled")) return;

    if (key === "ok") {
      submitLockPin();
      return;
    }
    if (key === "del") {
      lockEntry = lockEntry.slice(0, -1);
    } else if (lockEntry.length < CPS_PIN_MAX) {
      lockEntry += key;
    }
    renderLockDots();
    // Autoenvío al completar la longitud guardada: en el caso normal no hace
    // falta pulsar ✓.
    if (lockEntry.length === lockPinLength) submitLockPin();
  }

  function renderLockDots() {
    const wrap = document.getElementById("wps-lock-dots");
    if (!wrap) return;
    wrap.innerHTML = "";
    for (let i = 0; i < lockPinLength; i++) {
      const dot = document.createElement("span");
      dot.className = i < lockEntry.length ? "wps-lock-dot filled" : "wps-lock-dot";
      wrap.appendChild(dot);
    }
  }

  async function submitLockPin() {
    const entry = lockEntry;
    lockEntry = "";
    renderLockDots();
    if (!entry) return;

    if ((await cpsPinCooldownLeft()) > 0) {
      refreshLockCooldown();
      return;
    }

    if (await cpsPinVerify(entry)) {
      await cpsPinResetFails();
      unlockNow();
      return;
    }

    await cpsPinRegisterFail();
    showLockError(cpsT("pinWrong", settings.lang));
    shakeLockCard();
    refreshLockCooldown();
    refreshForgotVisibility();
  }

  function showLockError(text) {
    const el = document.getElementById("wps-lock-error");
    if (el) el.textContent = text;
  }

  function shakeLockCard() {
    const card = document.getElementById("wps-lock-card");
    if (!card) return;
    card.classList.remove("wps-lock-shake");
    void card.offsetWidth; // fuerza reflow para reiniciar la animación
    card.classList.add("wps-lock-shake");
  }

  function refreshLockCooldown() {
    clearInterval(lockCooldownTimer);
    lockCooldownTimer = null;
    let wasCooling = false;

    const tick = async () => {
      if (!document.getElementById("wps-lock-overlay")) {
        clearInterval(lockCooldownTimer);
        lockCooldownTimer = null;
        return;
      }
      const left = await cpsPinCooldownLeft();
      document.getElementById("wps-lock-keypad")?.classList.toggle("disabled", left > 0);

      if (left > 0) {
        wasCooling = true;
        showLockError(`${cpsT("lockCooldown", settings.lang)} ${left}${cpsT("lockSeconds", settings.lang)}`);
        return;
      }
      if (wasCooling) showLockError("");
      clearInterval(lockCooldownTimer);
      lockCooldownTimer = null;
    };

    lockCooldownTimer = setInterval(tick, 1000);
    tick();
  }

  // Mientras está bloqueado el teclado es del overlay: WhatsApp no debe recibir
  // nada, ni atajos ni texto que termine en el compositor.
  window.addEventListener("keydown", (e) => {
    if (!isLocked) return;
    e.stopImmediatePropagation();

    // El campo de la licencia necesita escribir y pegar con normalidad; se le
    // deja el evento, pero sin dejar que llegue a WhatsApp.
    if (e.target?.id === "wps-lock-reset-input") return;

    e.preventDefault();
    if (/^[0-9]$/.test(e.key)) handleLockKey(e.key);
    else if (e.key === "Backspace") handleLockKey("del");
    else if (e.key === "Enter") handleLockKey("ok");
  }, true);

  // Se arma sin esperar al evento load: WhatsApp tarda segundos en pintar sus
  // chats y el overlay tiene que ganarle a eso.
  async function armLockOnLoad() {
    const data = await cpsStorageGet(STORAGE_KEY);
    if (data[STORAGE_KEY]) settings = { ...defaults, ...data[STORAGE_KEY] };
    await refreshProState();
    if (pinLockArmed()) lockNow();
  }

  // ---- Init ----
  function init() {
    loadSettings(() => {
      applyState();
      checkSchedule();
      buildPanel();

      // La lista de chats puede no existir aún — reintentar hasta que aparezca
      function tryBindPane() {
        if (site.chatListReady()) {
          site.bindHoverContainers();
        } else {
          setTimeout(tryBindPane, 300);
        }
      }
      tryBindPane();

      site.start();

      if (!settings.panelVisible) {
        panel.classList.add("wps-panel-hidden");
        showRestoreHint();
      }

      checkPendingChangelog();
    });
  }

  // ---- Popup de "novedades" al actualizar de versión ----
  // Se muestra una sola vez por versión.
  function checkPendingChangelog() {
    if (typeof chrome === "undefined" || !chrome.storage?.local) return;
    chrome.storage.local.get("wps_pending_changelog", (data) => {
      const version = data?.wps_pending_changelog;
      if (!version) return;

      // Se limpia la bandera de inmediato — si algo falla al mostrar el
      // modal, es preferible perderse el aviso a mostrarlo en bucle.
      chrome.storage.local.remove("wps_pending_changelog");

      const entry = typeof cpsGetChangelog === "function"
        ? cpsGetChangelog(version, settings.lang)
        : null;
      if (entry) showChangelogModal(version, entry);
    });
  }

  function showChangelogModal(version, entry) {
    const overlay = document.createElement("div");
    overlay.id = "wps-changelog-overlay";
    overlay.style.direction = cpsIsRTL(settings.lang) ? "rtl" : "ltr";

    const itemsHtml = entry.items.map((item) => `<li>${item}</li>`).join("");

    overlay.innerHTML = `
      <div id="wps-changelog-card">
        <div id="wps-changelog-header">
          <span id="wps-changelog-badge">CPS</span>
          <h2>${entry.title}</h2>
          <span id="wps-changelog-version">v${version}</span>
        </div>
        <ul id="wps-changelog-list">${itemsHtml}</ul>
        <button id="wps-changelog-close" type="button">${cpsT("changelogGotIt", settings.lang)}</button>
      </div>
    `;

    const close = () => overlay.remove();
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    document.body.appendChild(overlay);
    overlay.querySelector("#wps-changelog-close").addEventListener("click", close);
  }

  // Esperar a que el sitio cargue el DOM
  if (document.readyState === "complete") {
    init();
  } else {
    window.addEventListener("load", init);
  }

  // También observar cuando el sitio monta su app (SPA)
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;

        if (site.isAppRoot(node) && !document.getElementById("wps-panel")) {
          buildPanel();
          site.bindHoverContainers();
        }
        site.onNodeAdded(node);
      }
    }
    site.onMutations();
    // El contador del menú lateral se monta de nuevo al pasar de 0 a 1 no leído
    markNavCounts();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  armLockOnLoad();

})();

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
    showBadges: false,
    blurMain: false,
    hideTypedText: false,
    autoBlurEnabled: false,
    hideChatSubtitle: false,
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
    body.classList.toggle("wps-show-badges", settings.showBadges);
    body.classList.toggle("wps-blur-main", settings.blurMain);
    body.classList.toggle("wps-hide-typed", settings.hideTypedText);
    body.classList.toggle("wps-hide-subtitle", settings.hideChatSubtitle);
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
  }

  // ---- Hover reveal: por item individual en la lista de chats ----
  function setupHoverReveal() {
    // pane-side: hover por cada chat individualmente
    const pane = document.getElementById("pane-side");
    if (!pane || pane._wpsHoverBound) return;
    pane._wpsHoverBound = true;

    // Refrescar overlays de badges al instante al hacer scroll (en vez de
    // esperar al siguiente tick del loop de 400ms)
    pane.addEventListener("scroll", scheduleBadgeRefresh, { passive: true });

    // Selector real del contenedor de cada fila de chat (confirmado via consola)
    const ITEM_SELECTORS = '[data-testid^="list-item-"]';

    pane.addEventListener("mouseover", (e) => {
      if (!settings.hoverReveal) return;
      const item = e.target.closest(ITEM_SELECTORS);
      if (item && !item.classList.contains("wps-revealed")) {
        item.classList.add("wps-revealed");
        scheduleBadgeRefresh();
      }
    });

    pane.addEventListener("mouseout", (e) => {
      if (!settings.hoverReveal) return;
      const item = e.target.closest(ITEM_SELECTORS);
      if (item) {
        const related = e.relatedTarget;
        if (!item.contains(related)) {
          item.classList.remove("wps-revealed");
          scheduleBadgeRefresh();
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

    archived.addEventListener("scroll", scheduleBadgeRefresh, { passive: true });

    const ITEM_SELECTORS = '[data-testid^="list-item-"]';

    archived.addEventListener("mouseover", (e) => {
      if (!settings.hoverReveal) return;
      const item = e.target.closest(ITEM_SELECTORS);
      if (item && !item.classList.contains("wps-revealed")) {
        item.classList.add("wps-revealed");
        scheduleBadgeRefresh();
      }
    });

    archived.addEventListener("mouseout", (e) => {
      if (!settings.hoverReveal) return;
      const item = e.target.closest(ITEM_SELECTORS);
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

    // ---- Auto-cerrar al sacar el cursor (como si se hubiera dado en la X) ----
    // A diferencia del botón de pin, esto NO se guarda en storage — es un
    // estado de la sesión actual. Si se guardara, el panel empezaría
    // oculto en la próxima carga de WhatsApp, que no es lo que se quiere:
    // la idea es que deje de estorbar mientras no se usa, pero siga
    // apareciendo normalmente la próxima vez que se abra la página.
    // Un pequeño retraso evita que se cierre por sacar el cursor un
    // instante sin querer entre un botón y otro.
    let panelAutoHideTimer = null;

    panel.addEventListener("mouseleave", () => {
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
    pinBtn?.setAttribute("data-tip", cpsT("panelTooltipHidePanel", settings.lang));
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
  }

  // ---- Badge de no leídos: overlay que "escapa" del blur del item ----
  // Un elemento hijo no puede des-difuminarse a sí mismo si su ancestro
  // tiene `filter: blur()` (el filtro se aplica sobre todo el subárbol ya
  // renderizado). Por eso, en vez de intentar levantar el blur en el badge
  // original, se clona y se posiciona como overlay fuera del árbol difuminado.
  const BADGE_SELECTOR = '[data-testid="icon-unread-count"]';
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

    const items = document.querySelectorAll(
      `#pane-side [data-testid^="list-item-"], [data-testid="archived-chatlist"] [data-testid^="list-item-"]`
    );

    let found = false;
    items.forEach((item) => {
      // Las filas de Estados reutilizan el mismo contenedor "list-item-N"
      // que las filas de chat, pero tienen adentro este marcador exclusivo
      // — confirmado inspeccionando el DOM. Si está presente, no es un
      // chat real y el "contador" que pueda traer no debe des-difuminarse.
      if (item.querySelector('[data-testid="status-row-cell"]')) {
        const staleClone = item._wpsBadgeClone;
        if (staleClone) staleClone.style.display = "none";
        return;
      }

      const existingClone = item._wpsBadgeClone;
      const badge = item.querySelector(BADGE_SELECTOR);

      if (!badge) {
        // El badge ya no existe (se leyó el mensaje, por ejemplo) — si había
        // un clon de una versión anterior, hay que ocultarlo también.
        if (existingClone) existingClone.style.display = "none";
        return;
      }

      const rect = badge.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        // Tamaño cero normalmente significa que el badge (o todo su
        // contenedor, p.ej. el panel de chats completo) está oculto con
        // `display:none` — WhatsApp mantiene la lista de chats montada en
        // segundo plano al cambiar a Estados/Llamadas en vez de
        // desmontarla, así que sin este chequeo el clon se queda
        // "flotando" con la última posición conocida.
        if (existingClone) existingClone.style.display = "none";
        return;
      }

      // Aunque el badge tenga tamaño válido, puede seguir "vivo" pero
      // tapado por otro panel encima (p.ej. Estados dibujado sobre la
      // lista de chats que sigue montada detrás, sin destruirse). Se
      // verifica qué elemento está realmente arriba en esas coordenadas;
      // si no es el badge ni parte de su propio árbol, está tapado.
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

      // Recortar contra el área visible real del panel de chats (#pane-side
      // o archived-chatlist). Un clon vive en <body>, así que ignora por
      // completo el `overflow` del contenedor con scroll — sin este chequeo,
      // un item scrolleado fuera de vista seguiría "flotando" en pantalla.
      const container = item.closest('#pane-side') || item.closest('[data-testid="archived-chatlist"]');
      const clip = container ? container.getBoundingClientRect() : null;
      const withinBounds = !clip || (
        rect.top >= clip.top &&
        rect.bottom <= clip.bottom &&
        rect.left >= clip.left &&
        rect.right <= clip.right
      );

      // Si el item ya está "revelado" (hover reveal activo y el mouse
      // encima), el badge real ya es visible — mantener el clon también
      // visible se ve como un contador duplicado.
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

    // El loop sigue vivo mientras la opción esté activa, sin importar si
    // en este tick se encontró algún badge — si se detiene justo cuando
    // no hay ninguno visible (p.ej. scrolleado a una zona vacía, o al
    // cambiar a la pestaña de Estados/Llamadas), nunca volvería a
    // ejecutarse para notar el cambio y limpiar los clones que quedaron
    // huérfanos, dejándolos "flotando" sobre una vista que no es la lista
    // de chats.
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
  const COMPOSE_INPUT_SELECTOR = '[data-testid="conversation-compose-box-input"]';

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

  ["mousemove", "keydown", "mousedown", "wheel", "touchstart"].forEach((evt) => {
    document.addEventListener(evt, scheduleAutoBlur, { passive: true });
  });

  // ---- Hover sobre la conversación activa (#main) ----
  // Delegado en `document` en vez de atado al nodo #main puntual: WhatsApp
  // remonta ese contenedor al cambiar de chat, así que un listener atado
  // directamente al elemento deja de funcionar después del primer cambio
  // de conversación. La delegación por bubbling no tiene ese problema.
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest?.("#main")) {
      document.body.classList.add("wps-main-hovered");
    }
  });

  document.addEventListener("mouseout", (e) => {
    const main = document.getElementById("main");
    if (!main || !e.target.closest?.("#main")) return;
    const related = e.relatedTarget;
    if (!related || !main.contains(related)) {
      document.body.classList.remove("wps-main-hovered");
    }
  });

  // ---- Hover específico sobre el bloque de info del encabezado ----
  // (foto + nombre + "en línea"/"última vez") — a propósito NO se usa
  // wps-main-hovered para esto: esa clase se activa con solo pasar el
  // cursor por cualquier parte del chat (incluido el fondo/mensajes),
  // revelando el nombre aunque el mouse ni siquiera esté cerca del
  // encabezado. Acá se ancla puntualmente a ese bloque.
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest?.('[data-testid="conversation-info-header"]')) {
      document.body.classList.add("wps-header-hovered");
    }
  });

  document.addEventListener("mouseout", (e) => {
    const infoHeader = e.target.closest?.('[data-testid="conversation-info-header"]');
    if (!infoHeader) return;
    const related = e.relatedTarget;
    if (!related || !infoHeader.contains(related)) {
      document.body.classList.remove("wps-header-hovered");
    }
  });

  // ---- Hover por mensaje individual dentro de la conversación activa ----
  // Más privado que revelar toda la conversación: solo se des-difumina la
  // burbuja bajo el cursor. Delegado en `document` porque la lista de
  // mensajes se re-renderiza constantemente (mensajes nuevos, scroll, etc).
  const MESSAGE_SELECTOR = '[data-testid="msg-container"]';

  document.addEventListener("mouseover", (e) => {
    if (!settings.privacyActive || !settings.blurMain) return;
    const msg = e.target.closest?.(MESSAGE_SELECTOR);
    if (msg) msg.classList.add("wps-msg-revealed");
  });

  document.addEventListener("mouseout", (e) => {
    if (!settings.privacyActive || !settings.blurMain) return;
    const msg = e.target.closest?.(MESSAGE_SELECTOR);
    if (msg) {
      const related = e.relatedTarget;
      if (!related || !msg.contains(related)) {
        msg.classList.remove("wps-msg-revealed");
      }
    }
  });

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

      checkPendingChangelog();
    });
  }

  // ---- Popup de "novedades" al actualizar de versión ----
  // Se muestra una sola vez por versión — background.js deja la bandera
  // en storage cuando Chrome actualiza la extensión (chrome.runtime.
  // onInstalled con reason "update"); acá solo se consume esa bandera.
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

  // Esperar a que WhatsApp cargue el DOM
  if (document.readyState === "complete") {
    init();
  } else {
    window.addEventListener("load", init);
  }

  // ---- Descargar estados (fotos y videos) ----
  // El visor de estados usa <video>/<img>. Las fotos suelen cargar como
  // `src="blob:..."`, pero los videos a veces usan una ruta relativa
  // propia de WhatsApp (`/stream/video?key=...`) en vez de blob — como es
  // same-origin, el fetch() funciona igual en ambos casos.
  function findStatusMenuButton() {
    // Se ancla al <title> interno "ic-more-vert" del ícono de tres puntos
    // en vez del aria-label ("Menú"), que cambia según el idioma de
    // WhatsApp — el nombre del ícono no se traduce.
    return findButtonByIconTitle((name) => name === "ic-more-vert");
  }

  function findStatusPlayButton() {
    // Solo existe en estados de video (reproducir/pausar); las fotos no
    // tienen este botón, por eso el ícono de menú queda como respaldo.
    return findButtonByIconTitle((name) => name.startsWith("ic-play") || name.startsWith("ic-pause"));
  }

  function isInsideChatListHeader(btn) {
    // El header de la lista de chats (junto al botón "+") comparte el
    // mismo ícono "ic-more-vert" en su propio menú de opciones. Se
    // descarta buscando el marcador "new-chat-outline" (confirmado real,
    // exclusivo de ese header) en un par de ancestros hacia arriba, en
    // vez de adivinar clases o IDs generados por WhatsApp.
    let el = btn;
    for (let i = 0; i < 6 && el; i++) {
      if (el.querySelector?.('[data-testid="new-chat-outline"]')) return true;
      el = el.parentElement;
    }
    return false;
  }

  function findButtonByIconTitle(matches) {
    const titles = document.querySelectorAll("svg title");
    for (const t of titles) {
      if (!matches(t.textContent || "")) continue;
      const btn = t.closest("button");
      if (!btn) continue;
      if (isInsideChatListHeader(btn)) continue;
      const rect = btn.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      return btn;
    }
    return null;
  }

  function getActiveStatusMedia() {
    // Puede haber más de un <video>/<img> en el DOM a la vez (WhatsApp
    // precarga el estado siguiente/anterior) — se toma el que esté
    // realmente visible en pantalla en este momento.
    // Las fotos SÍ deben exigir blob: (si no, se cuela algún thumbnail
    // pequeño de por medio); los videos se dejan abiertos a cualquier
    // src porque WhatsApp a veces usa una ruta /stream/video en vez de
    // blob para ellos.
    const candidates = document.querySelectorAll('video, img[src^="blob:"]');
    for (const el of candidates) {
      if (!el.src) continue;
      // Una foto o video de un MENSAJE dentro del chat abierto también usa
      // blob: — sin excluir #main, un mensaje grande visible en pantalla
      // se detectaba como si fuera contenido del visor de Estados (que es
      // una vista totalmente aparte, nunca anidada dentro de #main).
      if (el.closest("#main")) continue;
      const style = window.getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none") continue;
      const rect = el.getBoundingClientRect();
      if (rect.width > 200 && rect.height > 200) return el;
    }
    return null;
  }

  function findActiveTextStatus() {
    // Los estados de texto no tienen foto/video — su contenido vive en
    // este contenedor (confirmado por inspección) en vez de un <img>/<video>.
    const candidates = document.querySelectorAll('[data-testid="status-text"]');
    for (const el of candidates) {
      if (el.closest("#main")) continue;
      const style = window.getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none") continue;
      const rect = el.getBoundingClientRect();
      if (rect.width > 100 && rect.height > 40) return el;
    }
    return null;
  }

  function findStatusBackgroundColor(el) {
    // Sube por los ancestros buscando el primer color de fondo sólido
    // real — el propio contenedor del texto suele ser transparente, el
    // color/gradiente vive en algún ancestro (la "tarjeta" del estado).
    let node = el;
    for (let i = 0; i < 8 && node; i++) {
      const bg = window.getComputedStyle(node).backgroundColor;
      if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") return bg;
      node = node.parentElement;
    }
    return "#075E54"; // verde WhatsApp como respaldo si no se encuentra nada
  }

  function downloadTextStatusAsImage(textEl) {
    // No hay imagen real que descargar — se reconstruye el estado como
    // una imagen (fondo + texto centrado) para poder guardarlo igual.
    const bgColor = findStatusBackgroundColor(textEl);
    const text = (textEl.textContent || "").trim();
    if (!text) return;

    const width = 720;
    const height = 1280;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#ffffff";
    ctx.font = "600 42px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Ajuste de línea simple por ancho disponible
    const maxWidth = width - 100;
    const words = text.split(" ");
    const lines = [];
    let current = "";
    words.forEach((word) => {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    });
    if (current) lines.push(current);

    const lineHeight = 56;
    const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, i) => {
      ctx.fillText(line, width / 2, startY + i * lineHeight);
    });

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `estado-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }, "image/png");
  }

  async function downloadCurrentStatus() {
    const media = getActiveStatusMedia();
    if (media) {
      try {
        const response = await fetch(media.src);
        const blob = await response.blob();
        const isVideo = media.tagName === "VIDEO";
        const ext = isVideo ? "mp4" : (blob.type.includes("png") ? "png" : "jpg");
        const filename = `estado-${Date.now()}.${ext}`;

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      } catch (err) {
        console.error("[CPS] No se pudo descargar el estado:", err);
      }
      return;
    }

    // Sin foto/video visible: puede ser un estado de texto
    const textStatus = findActiveTextStatus();
    if (textStatus) downloadTextStatusAsImage(textStatus);
  }

  function buildStatusDownloadButton(anchorBtn) {
    // Se clona el botón nativo completo (en vez de armar uno desde cero)
    // para heredar exactamente el mismo padding, tamaño y comportamiento
    // hover — así no queda desalineado respecto a los demás íconos.
    const btn = anchorBtn.cloneNode(true);
    btn.removeAttribute("data-tab");
    btn.removeAttribute("aria-expanded");
    btn.removeAttribute("aria-haspopup");

    const label = cpsT("downloadStatus", settings.lang);
    btn.setAttribute("aria-label", label);
    btn.title = label;

    const svg = btn.querySelector("svg");
    if (svg) {
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.innerHTML = `<path fill="currentColor" d="M12 16.5 6.5 11l1.4-1.45L11 12.67V4h2v8.67l3.1-3.12L17.5 11 12 16.5ZM6 20a1.94 1.94 0 0 1-1.43-.57A1.94 1.94 0 0 1 4 18v-3h2v3h12v-3h2v3a1.94 1.94 0 0 1-.57 1.43A1.94 1.94 0 0 1 18 20H6Z"/>`;
    }

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      downloadCurrentStatus();
    });

    return btn;
  }

  function injectStatusDownloadButton() {
    // Se exige que haya de verdad una foto/video/texto de estado visible
    // en pantalla en este momento. Sin este chequeo, el botón terminaba
    // colándose en cualquier otro lugar de WhatsApp que reutilice el
    // mismo ícono "⋮" (lista de chats, panel de info de contacto, etc.) —
    // excluir esos sitios uno por uno es un juego perdido, así que en vez
    // de eso se confirma positivamente el contexto correcto.
    if (!getActiveStatusMedia() && !findActiveTextStatus()) return;

    const playBtn = findStatusPlayButton();
    const menuBtn = findStatusMenuButton();
    const anchorBtn = playBtn || menuBtn;
    if (!anchorBtn) return;

    const wrapper = anchorBtn.closest("span.html-span") || anchorBtn.parentElement;
    if (!wrapper || wrapper._wpsDownloadInjected) return;
    wrapper._wpsDownloadInjected = true;

    const span = document.createElement("span");
    span.className = wrapper.className || "";
    span.appendChild(buildStatusDownloadButton(anchorBtn));

    if (playBtn) {
      // Junto a Reproducir/Pausar (estados de video)
      wrapper.after(span);
    } else {
      // Sin botón de play (foto): se ubica antes del menú
      wrapper.parentElement?.insertBefore(span, wrapper);
    }
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
    // El visor de estados se remonta cada vez que se abre uno nuevo —
    // se revisa en cada tanda de mutaciones (barato, y el propio flag
    // `_wpsDownloadInjected` evita duplicados dentro de un mismo visor).
    injectStatusDownloadButton();
  });
  observer.observe(document.body, { childList: true, subtree: true });

})();

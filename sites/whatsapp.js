// Adaptador de WhatsApp Web: todo lo que depende de su DOM vive aquí.
// content.js lo recibe de cpsCreateSite; cada sitio trae su propia versión.
function cpsCreateSite(core) {
  "use strict";

  const lang = () => core.getSettings().lang;
  const TITLE_COUNT_RE = /^\(\d+\)\s*/;

  // ---- Listas con revelado por hover ----

  // Filas de chats, archivados y Llamadas: las tres usan el mismo componente.
  const HOVER_ITEM_SELECTOR = '[data-testid^="list-item-"]';

  // Favoritos (Llamadas > "Ver todos los favoritos") usa tarjetas sueltas, sin fila.
  const HOVER_CARD_SELECTOR = '[data-testid="cell-frame-container"]';

  // La fila manda: el CSS la espera y la tarjeta puede ir anidada dentro de ella.
  function hoverItem(target) {
    if (!target || !target.closest) return null;
    return target.closest(HOVER_ITEM_SELECTOR) || target.closest(HOVER_CARD_SELECTOR);
  }

  // Llamadas monta un segundo #pane-side (id duplicado): getElementById solo
  // devolvería el de chats y la lista de llamadas no se revelaría.
  function bindHoverContainers() {
    document.querySelectorAll("#pane-side").forEach(core.bindHoverContainer);
    bindArchivedChatlist();
    bindCallsDrawer();
    bindFavoritesDrawer();
  }

  function bindArchivedChatlist() {
    core.bindHoverContainer(document.querySelector('[data-testid="archived-chatlist"]'));
  }

  // La lista vive en un #pane-side propio del drawer, que puede montarse un poco después.
  function bindCallsDrawer(retries = 10) {
    const drawer = document.querySelector('[data-testid="calls-tab-drawer"]');
    if (!drawer) return;

    const pane = drawer.querySelector("#pane-side");
    if (pane) {
      core.bindHoverContainer(pane);
    } else if (retries > 0) {
      setTimeout(() => bindCallsDrawer(retries - 1), 200);
    }
  }

  function bindFavoritesDrawer() {
    document.querySelectorAll('[data-testid="favorites-drawer"]').forEach((el) => {
      // WhatsApp anida dos con el mismo data-testid; basta con el externo.
      if (el.parentElement?.closest('[data-testid="favorites-drawer"]')) return;
      core.bindHoverContainer(el);
    });
  }

  function matchesOrContains(node, selector) {
    return node.matches?.(selector) || !!node.querySelector?.(selector);
  }

  // Secciones que WhatsApp monta al entrar en ellas.
  function onNodeAdded(node) {
    if (matchesOrContains(node, '[data-testid="archived-chatlist"]')) bindArchivedChatlist();
    if (matchesOrContains(node, '[data-testid="calls-tab-drawer"]')) bindCallsDrawer();
    if (matchesOrContains(node, '[data-testid="favorites-drawer"]')) bindFavoritesDrawer();
    if (matchesOrContains(node, '[data-testid="status-drawer"]')) setupStatusPreview();
  }

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
      if (!core.getSettings().privacyActive) return;

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
        ? `👁 ${countLabel} ${cpsT("statusPreviewCount", lang())}`
        : cpsT("statusPreviewOnly", lang());

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
      if (!core.getSettings().privacyActive) return;
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

  // Se revisa periódicamente si el drawer sigue presente y
  // visible; si no, se oculta el preview.
  setInterval(() => {
    const preview = document.getElementById("cps-status-preview");
    if (!preview || !preview.classList.contains("visible")) return;

    const drawer = document.querySelector('[data-testid="status-drawer"]');
    if (!drawer) {
      preview.classList.remove("visible");
      return;
    }
    const rect = drawer.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      preview.classList.remove("visible");
    }
  }, 500);

  // El drawer de Estados puede montarse después del arranque.
  function start() {
    function tryBindStatus() {
      const drawer = document.querySelector('[data-testid="status-drawer"]');
      if (drawer) {
        setupStatusPreview();
      } else {
        setTimeout(tryBindStatus, 500);
      }
    }
    tryBindStatus();
  }

  // ---- Descargar estados (fotos y videos) ----

  // Partes de WhatsApp que nunca son el visor de estados. El header de chats
  // tiene su propio ⋮ y no puede servir de ancla.
  const OUTSIDE_STATUS_VIEWER = '#pane-side, #main, [data-testid="status-drawer"], [data-testid="navbar-primary-section"]';

  // Sube desde el estado hasta justo antes del ancestro que ya abarca otra
  // parte de WhatsApp: los botones del visor se buscan solo ahí dentro.
  function statusViewerRoot(content) {
    const outside = [...document.querySelectorAll(OUTSIDE_STATUS_VIEWER)];
    let root = content;
    while (root.parentElement && root.parentElement !== document.body) {
      const parent = root.parentElement;
      if (outside.some((el) => parent.contains(el))) break;
      root = parent;
    }
    return root;
  }

  function findStatusMenuButton(root) {
    // Se ancla al <title> "ic-more-vert" del ícono y no al aria-label ("Menú"),
    // que cambia con el idioma de WhatsApp.
    return findButtonByIconTitle(root, (name) => name === "ic-more-vert");
  }

  function findStatusPlayButton(root) {
    // Solo existe en estados de video; en fotos queda el menú como respaldo.
    return findButtonByIconTitle(root, (name) => name.startsWith("ic-play") || name.startsWith("ic-pause"));
  }

  function findButtonByIconTitle(root, matches) {
    for (const t of root.querySelectorAll("svg title")) {
      if (!matches(t.textContent || "")) continue;
      const btn = t.closest("button");
      if (!btn || !root.contains(btn)) continue;
      const rect = btn.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      return btn;
    }
    return null;
  }

  // WhatsApp precarga el estado vecino: se toma el que está visible. Las fotos
  // exigen blob: (evita miniaturas); los videos a veces usan /stream/video.
  function getActiveStatusMedia() {
    const candidates = document.querySelectorAll('video, img[src^="blob:"]');
    for (const el of candidates) {
      if (!el.src) continue;
      // Las fotos de mensajes del chat abierto también son blob:; el visor de
      // Estados nunca va dentro de #main.
      if (el.closest("#main")) continue;
      const style = window.getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none") continue;
      const rect = el.getBoundingClientRect();
      if (rect.width > 200 && rect.height > 200) return el;
    }
    return null;
  }

  function findActiveTextStatus() {
    // Los estados de texto no traen <img>/<video>: el contenido vive aquí.
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

  // El contenedor del texto suele ser transparente; el color vive en algún ancestro.
  function findStatusBackgroundColor(el) {
    let node = el;
    for (let i = 0; i < 8 && node; i++) {
      const bg = window.getComputedStyle(node).backgroundColor;
      if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") return bg;
      node = node.parentElement;
    }
    return "#075E54"; // verde WhatsApp como respaldo si no se encuentra nada
  }

  // No hay imagen real que descargar: se reconstruye el estado (fondo + texto).
  function downloadTextStatusAsImage(textEl) {
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

  // Al descargar justo cuando se abre un estado, el blob: a veces aún no está
  // listo y el primer intento trae 0 bytes.
  async function fetchBlobWithRetry(url, maxRetries = 4, delayMs = 350) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const response = await fetch(url);
      const blob = await response.blob();
      if (blob.size > 0) return blob;
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    return null;
  }

  async function downloadCurrentStatus() {
    const media = getActiveStatusMedia();
    if (media) {
      try {
        const blob = await fetchBlobWithRetry(media.src);
        if (!blob) {
          console.error("[CPS] El estado llegó vacío tras varios intentos — puede que el contenido aún no terminara de cargar.");
          return;
        }
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

  // Se clona el botón nativo para heredar padding, tamaño y hover, y que no
  // quede desalineado respecto a los demás íconos.
  function buildStatusDownloadButton(anchorBtn) {
    const btn = anchorBtn.cloneNode(true);
    btn.removeAttribute("data-tab");
    btn.removeAttribute("aria-expanded");
    btn.removeAttribute("aria-haspopup");

    const label = cpsT("downloadStatus", lang());
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

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Sin flecha en el visor es el último estado; fuera de él podría ser otra pantalla.
  function findNextStatusButton() {
    const content = getActiveStatusContent();
    if (!content) return null;
    return findButtonByIconTitle(statusViewerRoot(content), (name) => name === "ic-chevron-right");
  }

  async function downloadAllStatuses() {
    const MAX_STATUSES = 30; // resguardo de seguridad ante algo inesperado
    let count = 0;

    while (count < MAX_STATUSES) {
      await downloadCurrentStatus();
      count++;

      const nextBtn = findNextStatusButton();
      if (!nextBtn) break; // no hay más estados de este contacto

      nextBtn.click();
      await sleep(700); // dar tiempo a que cargue el siguiente estado
    }
  }

  function buildStatusDownloadAllButton(anchorBtn) {
    const btn = anchorBtn.cloneNode(true);
    btn.removeAttribute("data-tab");
    btn.removeAttribute("aria-expanded");
    btn.removeAttribute("aria-haspopup");

    const label = cpsT("downloadAllStatuses", lang());
    btn.setAttribute("aria-label", label);
    btn.title = label;

    const svg = btn.querySelector("svg");
    if (svg) {
      svg.setAttribute("viewBox", "0 0 24 24");
      // ïcono descargar todos los estados
      svg.innerHTML = `
        <path fill="currentColor" d="M12 13.2 8.3 9.5l1.3-1.3L11 9.4V2h2v7.4l1.4-1.2 1.3 1.3L12 13.2Z"/>
        <rect x="5" y="15.6" width="14" height="1.6" rx="0.8" fill="currentColor"/>
        <rect x="5" y="18.3" width="14" height="1.6" rx="0.8" fill="currentColor" opacity="0.6"/>
        <rect x="5" y="21" width="14" height="1.6" rx="0.8" fill="currentColor" opacity="0.32"/>
      `;
    }

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      downloadAllStatuses();
    });

    return btn;
  }

  function getActiveStatusContent() {
    return getActiveStatusMedia() || findActiveTextStatus();
  }

  function injectStatusDownloadButton() {
    const content = getActiveStatusContent();
    if (!content) return;
    const root = statusViewerRoot(content);

    // El visor nativo ya trae descarga en fotos/videos (no en texto); si se ve, no se duplica.
    const nativeDownloadBtn = root.querySelector('[data-testid="ic-download"]');
    if (nativeDownloadBtn) {
      const rect = nativeDownloadBtn.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return;
    }

    const playBtn = findStatusPlayButton(root);
    const menuBtn = findStatusMenuButton(root);
    const anchorBtn = playBtn || menuBtn;
    if (!anchorBtn) return;

    const htmlSpan = anchorBtn.closest("span.html-span");
    const wrapper = htmlSpan && root.contains(htmlSpan) ? htmlSpan : anchorBtn.parentElement;
    if (!wrapper || wrapper._wpsDownloadInjected) return;
    wrapper._wpsDownloadInjected = true;

    const span = document.createElement("span");
    span.className = wrapper.className || "";
    span.appendChild(buildStatusDownloadButton(anchorBtn));

    const spanAll = document.createElement("span");
    spanAll.className = wrapper.className || "";
    spanAll.appendChild(buildStatusDownloadAllButton(anchorBtn));

    if (playBtn) {
      // Junto a Reproducir/Pausar (estados de video)
      wrapper.after(span);
      span.after(spanAll);
    } else {
      // Sin botón de play (foto): se ubica antes del menú
      wrapper.parentElement?.insertBefore(span, wrapper);
      wrapper.parentElement?.insertBefore(spanAll, wrapper);
    }
  }

  return {
    id: "whatsapp",

    // La SPA montó su raíz: hay que construir el panel y enganchar las listas.
    isAppRoot: (node) => node.id === "app",
    chatListReady: () => !!document.getElementById("pane-side"),
    bindHoverContainers,
    hoverItem,
    onNodeAdded,
    start,
    // El visor de estados se remonta cada vez que se abre uno nuevo.
    onMutations: injectStatusDownloadButton,

    badgeItemSelector: '#pane-side [data-testid^="list-item-"], [data-testid="archived-chatlist"] [data-testid^="list-item-"]',
    badgeSelector: '[data-testid="icon-unread-count"]',
    // Las filas de Estados reusan list-item-N; su "contador" no es de un chat.
    skipBadgeItem: (item) => !!item.querySelector('[data-testid="status-row-cell"]'),
    badgeClip: (item) => item.closest("#pane-side") || item.closest('[data-testid="archived-chatlist"]'),

    composeInputSelector: '[data-testid="conversation-compose-box-input"]',
    conversationSelector: "#main",
    conversationHeaderSelector: '[data-testid="conversation-info-header"]',
    messageRowSelector: ".focusable-list-item",
    messageSelector: '[data-testid="msg-container"]',

    // WhatsApp pone el contador como "(3) WhatsApp".
    titleHasCount: (title) => TITLE_COUNT_RE.test(title),
    cleanTitle: (title) => title.replace(TITLE_COUNT_RE, ""),
    // Número sobre el ícono de Chats (confirmado via consola); los puntos verdes
    // de Estados y Canales también son [role="status"], pero sin número.
    navCountSelector: '[data-testid="navbar-primary-section"] [role="status"]',
  };
}

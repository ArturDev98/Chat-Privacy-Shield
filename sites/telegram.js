// Adaptador de Telegram Web K (web.telegram.org/k): selectores de su DOM.
// Se registra solo si el usuario concede el permiso opcional desde el popup.
function cpsCreateSite(core) {
  "use strict";

  // Las listas de chats (carpetas, archivados, búsqueda) viven en la columna izquierda.
  const CHAT_LIST_SELECTOR = "#column-left .chatlist";
  const CHAT_ROW_SELECTOR = ".chatlist-chat";

  // WebK alterna el título con "3 notificaciones" (traducido) cuando la pestaña
  // no está activa; también puede venir con dígitos árabes.
  const TITLE_COUNT_RE = /^[\d٠-٩۰-۹]/;
  const CLEAN_TITLE = "Telegram Web";

  function hoverItem(target) {
    if (!target || !target.closest) return null;
    return target.closest(CHAT_ROW_SELECTOR);
  }

  // Se engancha el contenedor con scroll de cada lista: el evento scroll no
  // burbujea y es el que refresca los contadores clonados.
  function bindChatLists(root) {
    const lists = root.matches?.(".chatlist") ? [root] : root.querySelectorAll?.(".chatlist") ?? [];
    for (const list of lists) {
      if (!list.closest("#column-left")) continue;
      core.bindHoverContainer(list.closest(".scrollable") || list);
    }
  }

  return {
    id: "telegram",

    isAppRoot: (node) => node.id === "page-chats",
    chatListReady: () => !!document.querySelector(CHAT_LIST_SELECTOR),
    bindHoverContainers: () => bindChatLists(document),
    hoverItem,
    // Cada carpeta, el archivo y la búsqueda montan su lista al abrirse.
    onNodeAdded: bindChatLists,
    start: () => {},
    onMutations: () => {},

    badgeItemSelector: `${CHAT_LIST_SELECTOR} ${CHAT_ROW_SELECTOR}`,
    // Oculto, WebK lo deja montado sin .is-visible (o saliendo con .backwards).
    badgeSelector: ".dialog-subtitle-badge-unread.is-visible:not(.backwards)",
    skipBadgeItem: () => false,
    badgeClip: (item) => item.closest(".scrollable"),

    composeInputSelector: ".input-message-input",
    conversationSelector: "#column-center",
    conversationHeaderSelector: "#column-center .chat-info",
    messageRowSelector: ".bubble",
    messageSelector: ".bubble-content-wrapper",

    titleHasCount: (title) => TITLE_COUNT_RE.test(title),
    cleanTitle: (title) => (TITLE_COUNT_RE.test(title) ? CLEAN_TITLE : title),
    // Total del menú hamburguesa y de la flecha "atrás"; las carpetas se dejan,
    // igual que los filtros de WhatsApp.
    navCountSelector: ".sidebar-tools-button-notifications, .back-unread-badge",
  };
}

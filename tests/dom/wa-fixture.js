// Lista falsa con la forma del sondeo real: fila de Archivados sin título + chats.
window.waRow = (i, name) => `
  <div data-testid="list-item-${i}" role="row"><div tabindex="-1" aria-selected="false">
    <div data-testid="cell-frame-container">
      ${name == null ? "" : `<div data-testid="cell-frame-title"><span dir="auto" title="${name.replace(/"/g, "&quot;")}">${name}</span></div>`}
      <div data-testid="cell-frame-secondary"><span>último mensaje</span></div>
    </div>
  </div></div>`;
window.mountWhatsApp = (names) => {
  const app = document.createElement("div");
  app.id = "app";
  app.innerHTML = `<div id="pane-side"><button><div data-testid="cell-frame-container"><span>Archived</span></div></button>
    ${names.map((n, i) => waRow(i + 1, n)).join("")}</div>
    <div id="main"><header><div data-testid="conversation-info-header"><span dir="auto" title="">none</span></div></header>
    <div data-testid="conversation-panel-messages"><div data-testid="msg-container">hola</div></div></div>`;
  document.body.appendChild(app);
};
window.openChat = (name) => {
  const span = document.querySelector('#main header [data-testid="conversation-info-header"] span');
  span.setAttribute("title", name);
  span.textContent = name;
};
window.rowOf = (name) => [...document.querySelectorAll('[data-testid="cell-frame-title"] span')]
  .find((s) => s.getAttribute("title") === name)?.closest('[data-testid^="list-item-"]');

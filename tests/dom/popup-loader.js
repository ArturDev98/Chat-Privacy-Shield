// Monta el body de popup.html en la página de prueba y carga sus scripts en orden.
window.loadPopup = async function () {
  const html = await new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "../../popup.html");
    xhr.onload = () => resolve(xhr.responseText);
    xhr.send();
  });
  const doc = new DOMParser().parseFromString(html, "text/html");
  const results = document.getElementById("results");
  doc.querySelectorAll("script").forEach((s) => s.remove());
  document.body.innerHTML = doc.body.innerHTML;
  document.body.appendChild(results);
  for (const style of doc.querySelectorAll("style")) document.head.appendChild(style);
  for (const src of ["i18n.js", "pro.js", "sites.js", "profiles.js", "rules.js", "popup.js"]) {
    await new Promise((resolve) => {
      const el = document.createElement("script");
      el.src = "../../" + src;
      el.onload = resolve;
      el.onerror = resolve;
      document.body.appendChild(el);
    });
  }
};

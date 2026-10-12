// Asserts para páginas de prueba: run.sh lee las líneas PASS/FAIL/RESULT de #results.
(function () {
  const lines = [];
  let passed = 0;
  let failed = 0;
  window.check = (name, cond) => {
    if (cond) { passed++; lines.push("PASS " + name); } else { failed++; lines.push("FAIL " + name); }
  };
  window.done = () => {
    lines.push("RESULT: " + passed + " passed, " + failed + " failed");
    document.getElementById("results").textContent = "\n" + lines.join("\n") + "\n";
  };
  window.settle = (ms = 50) => new Promise((r) => setTimeout(r, ms));
  window.addEventListener("error", (e) => { failed++; lines.push("FAIL uncaught: " + e.message); });
  // Una prueba async que lanza no llega a done(): se cierra aquí con el error.
  window.addEventListener("unhandledrejection", (e) => {
    failed++;
    lines.push("FAIL rejected: " + (e.reason && e.reason.message || e.reason));
    window.done();
  });
})();

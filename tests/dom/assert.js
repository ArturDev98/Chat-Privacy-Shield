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
})();

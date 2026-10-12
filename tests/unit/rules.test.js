const test = require("node:test");
const assert = require("node:assert");
const R = require("../../rules.js");

test("key round-trip", () => {
  assert.strictEqual(R.cpsRuleKey("whatsapp", 'Ana "La Jefa" 💝 '), 'whatsapp:Ana "La Jefa" 💝 ');
  assert.strictEqual(R.cpsRuleKey("whatsapp", ""), null);
  assert.strictEqual(R.cpsRuleKey("whatsapp", null), null);
});

test("set/remove", () => {
  const added = R.cpsRulesSet({}, "whatsapp:A", "blur", 5);
  assert.deepStrictEqual(added, { "whatsapp:A": { mode: "blur", lastSeen: 5 } });
  assert.deepStrictEqual(R.cpsRulesSet(added, "whatsapp:A", null, 6), {});
});

test("set no muta el original", () => {
  const rules = {};
  R.cpsRulesSet(rules, "whatsapp:A", "hide", 1);
  assert.deepStrictEqual(rules, {});
});

test("hide sin Pro", () => {
  assert.strictEqual(R.cpsRuleEffectiveMode({ mode: "hide" }, false), "blur");
  assert.strictEqual(R.cpsRuleEffectiveMode({ mode: "hide" }, true), "hide");
  assert.strictEqual(R.cpsRuleEffectiveMode(undefined, true), null);
});

test("touch throttle", () => {
  const rules = { k: { mode: "blur", lastSeen: 0 } };
  assert.strictEqual(R.cpsRulesTouch(rules, "k", 59999), false);
  assert.strictEqual(rules.k.lastSeen, 0);
  assert.strictEqual(R.cpsRulesTouch(rules, "k", 60000), true);
  assert.strictEqual(rules.k.lastSeen, 60000);
  assert.strictEqual(R.cpsRulesTouch(rules, "missing", 60000), false);
});

test("export sin hide", () => {
  const out = R.cpsRulesForExport({ a: { mode: "hide", lastSeen: 1 }, b: { mode: "blur", lastSeen: 1 } });
  assert.deepStrictEqual(Object.keys(out), ["b"]);
});

test("import conserva hide", () => {
  const current = { a: { mode: "hide", lastSeen: 1 }, b: { mode: "blur", lastSeen: 1 } };
  const imported = { c: { mode: "blur", lastSeen: 2 }, d: { mode: "hide", lastSeen: 2 }, e: { mode: "x" } };
  assert.deepStrictEqual(R.cpsRulesMergeImport(current, imported), {
    a: { mode: "hide", lastSeen: 1 }, c: { mode: "blur", lastSeen: 2 },
  });
  assert.deepStrictEqual(R.cpsRulesMergeImport(current, null), { a: { mode: "hide", lastSeen: 1 } });
});

test("hiddenCount", () => {
  assert.strictEqual(R.cpsRulesHiddenCount({ a: { mode: "hide" }, b: { mode: "blur" }, c: { mode: "hide" } }), 2);
  assert.strictEqual(R.cpsRulesHiddenCount(null), 0);
});

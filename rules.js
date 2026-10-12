// rules.js - Reglas por chat (difuminar siempre / esconder con PIN).
// La clave es el nombre visible: WhatsApp no expone el ID del chat fuera del MAIN world.

const CPS_RULES_KEY = "cps_chat_rules";
const CPS_RULE_TOUCH_MS = 60000;
const CPS_RULE_MODES = ["blur", "hide"];

function cpsRuleKey(siteId, name) {
  if (!name) return null;
  return `${siteId}:${name}`;
}

function cpsRulesSet(rules, key, mode, now) {
  const out = { ...rules };
  if (!mode) {
    delete out[key];
  } else if (out[key]?.mode !== mode) {
    out[key] = { mode, lastSeen: now };
  }
  return out;
}

function cpsRuleEffectiveMode(rule, proActive) {
  if (!rule || !CPS_RULE_MODES.includes(rule.mode)) return null;
  // Sin Pro, un chat escondido nunca queda a la vista: baja a difuminado.
  if (rule.mode === "hide" && !proActive) return "blur";
  return rule.mode;
}

function cpsRulesTouch(rules, key, now) {
  const rule = rules[key];
  if (!rule || now - (rule.lastSeen || 0) < CPS_RULE_TOUCH_MS) return false;
  rule.lastSeen = now;
  return true;
}

function cpsRulesOfMode(rules, mode) {
  const out = {};
  Object.entries(rules || {}).forEach(([key, rule]) => {
    if (rule?.mode === mode) out[key] = { ...rule };
  });
  return out;
}

function cpsRulesForExport(rules) {
  return cpsRulesOfMode(rules, "blur");
}

function cpsRulesMergeImport(current, imported) {
  return { ...cpsRulesOfMode(imported, "blur"), ...cpsRulesOfMode(current, "hide") };
}

function cpsRulesHiddenCount(rules) {
  return Object.keys(cpsRulesOfMode(rules, "hide")).length;
}

if (typeof module !== "undefined") {
  module.exports = {
    CPS_RULES_KEY, CPS_RULE_TOUCH_MS, cpsRuleKey, cpsRulesSet, cpsRuleEffectiveMode, cpsRulesTouch,
    cpsRulesForExport, cpsRulesMergeImport, cpsRulesHiddenCount,
  };
}

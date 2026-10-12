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

// ---- Parte DOM: aplica las reglas a las filas y a la conversación abierta ----

const CPS_RULES_INERT = {
  start() {}, apply() {}, isRevealed: () => false, reveal() {}, conceal() {},
  hasHidden: () => false, modeOf: () => null, setRule() {},
};

function cpsCreateRules(core, site) {
  if (!site || !site.ruleRowSelector) return CPS_RULES_INERT;

  let rules = {};
  let revealed = false;
  let frame = 0;
  const lang = () => core.getSettings().lang;

  function modeOf(name) {
    const key = cpsRuleKey(site.id, name);
    return key ? cpsRuleEffectiveMode(rules[key], core.isPro()) : null;
  }

  function apply() {
    const now = Date.now();
    let touched = false;
    document.querySelectorAll(".cps-rule-blur, .cps-rule-hide").forEach((el) => {
      el.classList.remove("cps-rule-blur", "cps-rule-hide");
    });
    document.querySelectorAll(site.ruleRowSelector).forEach((cell) => {
      const name = site.ruleRowKey(cell);
      let mode = modeOf(name);
      if (!mode) return;
      if (cpsRulesTouch(rules, cpsRuleKey(site.id, name), now)) touched = true;
      if (mode === "hide" && revealed) return;
      site.ruleRowContainer(cell).classList.add(mode === "hide" ? "cps-rule-hide" : "cps-rule-blur");
    });
    applyOpenChat();
    if (touched) cpsStorageSet({ [CPS_RULES_KEY]: rules });
  }

  function applyOpenChat() {
    const mode = modeOf(site.openChatKey());
    const cover = mode === "hide" && !revealed;
    document.body.classList.toggle("wps-rule-main-blur", mode === "blur");
    document.body.classList.toggle("wps-rule-main-cover", cover);
    const existing = document.getElementById("cps-hidden-cover");
    const conversation = document.querySelector(site.conversationSelector);
    if (!cover || !conversation) {
      existing?.remove();
      return;
    }
    if (existing && conversation.contains(existing)) return;
    existing?.remove();
    const el = document.createElement("div");
    el.id = "cps-hidden-cover";
    const text = document.createElement("div");
    text.textContent = cpsT("hiddenChatCover", lang());
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = cpsT("hiddenShow", lang());
    btn.addEventListener("click", () => core.requestReveal?.());
    el.append(text, btn);
    conversation.appendChild(el);
  }

  // setTimeout y no rAF: rAF no corre con la pestaña en segundo plano.
  function schedule() {
    if (frame) return;
    frame = setTimeout(() => {
      frame = 0;
      apply();
    }, 16);
  }

  function start() {
    cpsStorageGet(CPS_RULES_KEY).then((data) => {
      rules = data[CPS_RULES_KEY] || {};
      apply();
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local" || !changes[CPS_RULES_KEY]) return;
      rules = changes[CPS_RULES_KEY].newValue || {};
      schedule();
    });
    // title cubre las filas que la lista virtualizada recicla para otro chat.
    new MutationObserver(schedule).observe(document.body, {
      childList: true, subtree: true, attributes: true, attributeFilter: ["title"],
    });
  }

  function setRule(name, mode) {
    const key = cpsRuleKey(site.id, name);
    if (!key) return;
    rules = cpsRulesSet(rules, key, mode, Date.now());
    cpsStorageSet({ [CPS_RULES_KEY]: rules });
    apply();
  }

  return {
    start,
    apply,
    modeOf,
    setRule,
    isRevealed: () => revealed,
    hasHidden: () => cpsRulesHiddenCount(rules) > 0 && core.isPro(),
    reveal() { revealed = true; apply(); },
    conceal() { revealed = false; apply(); },
  };
}

if (typeof module !== "undefined") {
  module.exports = {
    CPS_RULES_KEY, CPS_RULE_TOUCH_MS, cpsRuleKey, cpsRulesSet, cpsRuleEffectiveMode, cpsRulesTouch,
    cpsRulesForExport, cpsRulesMergeImport, cpsRulesHiddenCount,
  };
}

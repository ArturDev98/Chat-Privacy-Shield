// profiles.js - Perfiles Oficina/Casa y su horario. Lógica pura: no toca DOM ni chrome.*.

const CPS_PROFILE_IDS = ["office", "home"];

// Solo lo visual va por perfil; PIN, idioma y posiciones son globales.
const CPS_VISUAL_KEYS = [
  "privacyActive", "blurLevel", "opacity", "hideAvatars", "hideNames", "hoverReveal",
  "showBadges", "blurMain", "hideTypedText", "autoBlurEnabled", "hideChatSubtitle",
  "blurOnTabHidden", "hideHeaderAvatar", "hideTabCount", "hidePreview",
];

// Lo que el horario de 2.0 encendía al entrar en la ventana.
const CPS_SCHEDULE_FULL_PRIVACY_KEYS = [
  "hideAvatars", "hideNames", "blurMain", "hideTypedText", "hideChatSubtitle",
  "hideTabCount", "hoverReveal", "showBadges", "hidePreview",
];

const CPS_PROFILE_DEFAULTS = {
  activeProfile: "office",
  profiles: null,
  profileSchedule: { enabled: false, start: "09:00", end: "17:00" },
  profileScheduleLast: null,
};

function cpsVisualSnapshot(settings) {
  const snap = {};
  CPS_VISUAL_KEYS.forEach((key) => {
    if (settings[key] !== undefined) snap[key] = settings[key];
  });
  return snap;
}

function cpsScheduleWithin(schedule, now) {
  if (!schedule || !schedule.enabled) return false;
  const [startH, startM] = String(schedule.start || "09:00").split(":").map(Number);
  const [endH, endM] = String(schedule.end || "17:00").split(":").map(Number);
  if ([startH, startM, endH, endM].some((n) => Number.isNaN(n))) return false;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes === endMinutes) return false;
  if (startMinutes < endMinutes) return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  return nowMinutes >= startMinutes || nowMinutes < endMinutes;
}

function cpsScheduleProfileFor(schedule, now) {
  if (!schedule || !schedule.enabled) return null;
  return cpsScheduleWithin(schedule, now) ? "office" : "home";
}

function cpsProfilesMigrate(settings, now) {
  const out = { ...settings };
  const legacy = {
    enabled: !!out.scheduleEnabled,
    start: out.scheduleStart || "09:00",
    end: out.scheduleEnd || "17:00",
  };
  delete out.scheduleEnabled;
  delete out.scheduleStart;
  delete out.scheduleEnd;

  if (out.profiles && out.profiles.office && out.profiles.home) {
    // Un JSON importado podría colar PIN o candado dentro de un perfil.
    out.profiles = { office: cpsVisualSnapshot(out.profiles.office), home: cpsVisualSnapshot(out.profiles.home) };
    if (!CPS_PROFILE_IDS.includes(out.activeProfile)) out.activeProfile = "office";
    if (!out.profileSchedule) out.profileSchedule = { ...CPS_PROFILE_DEFAULTS.profileSchedule };
    if (out.profileScheduleLast === undefined) out.profileScheduleLast = null;
    return out;
  }

  const current = cpsVisualSnapshot(out);
  out.profileSchedule = legacy;
  if (legacy.enabled) {
    const office = { ...current, privacyActive: true };
    CPS_SCHEDULE_FULL_PRIVACY_KEYS.forEach((key) => { office[key] = true; });
    out.profiles = { office, home: { ...current, privacyActive: false } };
    out.activeProfile = cpsScheduleProfileFor(legacy, now);
    // Fuera del horario, 2.0 respetaba la privacidad encendida a mano: actualizar no la apaga.
    if (out.activeProfile === "home" && current.privacyActive) out.profiles.home.privacyActive = true;
    out.profileScheduleLast = out.activeProfile;
  } else {
    out.profiles = { office: { ...current }, home: { ...current } };
    out.activeProfile = "office";
    out.profileScheduleLast = null;
  }
  return { ...out, ...out.profiles[out.activeProfile] };
}

function cpsProfilesCapture(settings) {
  if (!settings.profiles || !CPS_PROFILE_IDS.includes(settings.activeProfile)) return settings;
  return {
    ...settings,
    profiles: { ...settings.profiles, [settings.activeProfile]: cpsVisualSnapshot(settings) },
  };
}

function cpsProfilesSwitch(settings, id) {
  if (!CPS_PROFILE_IDS.includes(id) || !settings.profiles) return settings;
  const captured = cpsProfilesCapture(settings);
  return { ...captured, ...cpsVisualSnapshot(captured.profiles[id]), activeProfile: id };
}

if (typeof module !== "undefined") {
  module.exports = {
    CPS_PROFILE_IDS, CPS_VISUAL_KEYS, CPS_SCHEDULE_FULL_PRIVACY_KEYS, CPS_PROFILE_DEFAULTS,
    cpsProfilesMigrate, cpsProfilesCapture, cpsProfilesSwitch, cpsScheduleWithin, cpsScheduleProfileFor,
  };
}

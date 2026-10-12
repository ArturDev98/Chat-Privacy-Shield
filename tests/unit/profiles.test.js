const test = require("node:test");
const assert = require("node:assert");
const P = require("../../profiles.js");

const at = (hh, mm = 0) => new Date(2026, 9, 11, hh, mm);
const legacy = (extra = {}) => ({
  privacyActive: false, blurLevel: 8, hideNames: false, hideAvatars: true, lang: "es",
  pinLockEnabled: true, scheduleEnabled: true, scheduleStart: "09:00", scheduleEnd: "17:00", ...extra,
});

test("migrate con horario", () => {
  const out = P.cpsProfilesMigrate(legacy(), at(10));
  assert.strictEqual(out.activeProfile, "office");
  assert.strictEqual(out.profiles.office.privacyActive, true);
  assert.strictEqual(out.profiles.office.hideNames, true);
  assert.strictEqual(out.profiles.home.privacyActive, false);
  assert.deepStrictEqual(out.profileSchedule, { enabled: true, start: "09:00", end: "17:00" });
  assert.strictEqual("scheduleEnabled" in out, false);
  assert.strictEqual("scheduleStart" in out, false);
});

test("migrate con horario fuera de la ventana", () => {
  const out = P.cpsProfilesMigrate(legacy(), at(18));
  assert.strictEqual(out.activeProfile, "home");
  assert.strictEqual(out.privacyActive, false);
  assert.strictEqual(out.hideNames, false);
});

test("migrate dentro de la ventana deja los planos en office", () => {
  const out = P.cpsProfilesMigrate(legacy(), at(10));
  assert.strictEqual(out.privacyActive, true);
  assert.strictEqual(out.hideNames, true);
});

test("migrate sin horario", () => {
  const out = P.cpsProfilesMigrate(legacy({ scheduleEnabled: false }), at(10));
  assert.strictEqual(out.activeProfile, "office");
  assert.deepStrictEqual(out.profiles.office, out.profiles.home);
  assert.strictEqual(out.profiles.office.hideNames, false);
  assert.strictEqual(out.profileSchedule.enabled, false);
});

test("migrate idempotente", () => {
  const once = P.cpsProfilesMigrate(legacy(), at(10));
  assert.deepStrictEqual(P.cpsProfilesMigrate(once, at(18)), once);
});

test("switch conserva lo tocado", () => {
  let s = P.cpsProfilesMigrate(legacy(), at(10));
  s.hideNames = false;
  s = P.cpsProfilesSwitch(s, "home");
  s = P.cpsProfilesSwitch(s, "office");
  assert.strictEqual(s.hideNames, false);
  assert.strictEqual(s.activeProfile, "office");
});

test("switch no toca globales", () => {
  let s = P.cpsProfilesMigrate(legacy(), at(10));
  s = P.cpsProfilesSwitch(s, "home");
  assert.strictEqual(s.lang, "es");
  assert.strictEqual(s.pinLockEnabled, true);
});

test("switch con id inválido no cambia nada", () => {
  const s = P.cpsProfilesMigrate(legacy(), at(10));
  assert.deepStrictEqual(P.cpsProfilesSwitch(s, "gym"), s);
});

test("capture escribe en el perfil activo", () => {
  const s = P.cpsProfilesMigrate(legacy(), at(10));
  s.blurLevel = 15;
  const out = P.cpsProfilesCapture(s);
  assert.strictEqual(out.profiles.office.blurLevel, 15);
  assert.strictEqual(out.profiles.home.blurLevel, 8);
});

test("schedule cruza medianoche", () => {
  const sch = { enabled: true, start: "22:00", end: "06:00" };
  assert.strictEqual(P.cpsScheduleWithin(sch, at(23, 30)), true);
  assert.strictEqual(P.cpsScheduleWithin(sch, at(5, 59)), true);
  assert.strictEqual(P.cpsScheduleWithin(sch, at(6, 0)), false);
  assert.strictEqual(P.cpsScheduleWithin({ enabled: true, start: "09:00", end: "09:00" }, at(9)), false);
});

test("profileFor", () => {
  assert.strictEqual(P.cpsScheduleProfileFor({ enabled: false, start: "09:00", end: "17:00" }, at(10)), null);
  assert.strictEqual(P.cpsScheduleProfileFor({ enabled: true, start: "09:00", end: "17:00" }, at(10)), "office");
  assert.strictEqual(P.cpsScheduleProfileFor({ enabled: true, start: "09:00", end: "17:00" }, at(17)), "home");
});

test("perfiles importados solo aceptan claves visuales", () => {
  const crafted = { ...P.cpsProfilesMigrate(legacy(), at(10)), pinLockEnabled: true };
  crafted.profiles.home = { ...crafted.profiles.home, pinLockEnabled: false, autoLockMinutes: 0, lang: "zh" };
  const migrated = P.cpsProfilesMigrate(crafted, at(10));
  assert.strictEqual("pinLockEnabled" in migrated.profiles.home, false);
  const switched = P.cpsProfilesSwitch(crafted, "home");
  assert.strictEqual(switched.pinLockEnabled, true);
  assert.strictEqual(switched.lang, "es");
});

test("migrate conserva la privacidad encendida a mano fuera del horario", () => {
  const out = P.cpsProfilesMigrate(legacy({ privacyActive: true }), at(20));
  assert.strictEqual(out.activeProfile, "home");
  assert.strictEqual(out.privacyActive, true);
});

test("migrate anota el último perfil puesto por el horario", () => {
  assert.strictEqual(P.cpsProfilesMigrate(legacy(), at(20)).profileScheduleLast, "home");
  assert.strictEqual(P.cpsProfilesMigrate(legacy({ scheduleEnabled: false }), at(20)).profileScheduleLast, null);
});

// pro.js - Gating de funciones de pago y utilidades del PIN.
// Compartido por content.js y popup.js; se carga antes que ambos.

const CPS_PRO_KEY = "cps_pro";
const CPS_PIN_KEY = "cps_pin";
const CPS_PIN_ATTEMPTS_KEY = "cps_pin_attempts";

// Llave pública de firma de licencias. La privada nunca entra al repo: vive en
// ~/.cps-keys/private.jwk y solo la usa tools/genkey.js.
const CPS_PRO_PUBLIC_KEY = {
  kty: "EC",
  crv: "P-256",
  x: "8HAI4C60GiJvzNIZ5UaFm-IBM7_OlJMpJYMPPeafyYY",
  y: "H36NnC537RYdLSKOVHg-pgYToA9WnF8nvW3F5rf4wZs",
};

// Series filtradas o reembolsadas. La licencia se revalida en cada arranque,
// así que agregar una aquí la desactiva en la siguiente versión publicada.
const CPS_PRO_REVOKED_SERIALS = [];

const CPS_LICENSE_PREFIX = "CPS1";
const CPS_LICENSE_EPOCH = Date.UTC(2020, 0, 1);
const CPS_LICENSE_PAYLOAD_BYTES = 16;
const CPS_LICENSE_SIGNATURE_BYTES = 64;

// Único sitio donde vive la URL de compra: el popup la lee de aquí.
const CPS_PRO_BUY_URL = "https://arturdev.gumroad.com/l/pin-lock";

// PBKDF2 a 150k iteraciones: frena la lectura casual del storage, no a un
// atacante con acceso al perfil del navegador (un PIN de 4-6 dígitos cae igual).
const CPS_PIN_ITERATIONS = 150000;
const CPS_PIN_MIN = 4;
const CPS_PIN_MAX = 6;

// Segundos de espera según fallos acumulados (el índice es el nº de fallos).
// El último valor se repite de ahí en adelante.
const CPS_PIN_COOLDOWNS = [0, 0, 0, 0, 30, 60, 300];

// ---- Utilidades ----

function cpsBufToHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function cpsHexToBuf(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

async function cpsSha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return cpsBufToHex(buf);
}

function cpsB64UrlToBytes(text) {
  const b64 = text.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function cpsStorageGet(keys) {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(keys, (data) => resolve(data || {}));
    } catch {
      resolve({});
    }
  });
}

function cpsStorageSet(obj) {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.set(obj, () => resolve(true));
    } catch {
      resolve(false);
    }
  });
}

function cpsStorageRemove(keys) {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.remove(keys, () => resolve(true));
    } catch {
      resolve(false);
    }
  });
}

// ---- Licencia ----

// base64url distingue mayúsculas de minúsculas: aquí solo se quitan espacios,
// nunca se cambia la caja.
function cpsProNormalizeCode(code) {
  return String(code || "").trim().replace(/\s+/g, "");
}

function cpsLicenseDateToISO(days) {
  return new Date(CPS_LICENSE_EPOCH + days * 86400000).toISOString().slice(0, 10);
}

function cpsProParseLicense(code) {
  const parts = cpsProNormalizeCode(code).split(".");
  if (parts.length !== 3 || parts[0] !== CPS_LICENSE_PREFIX) return null;

  try {
    const payload = cpsB64UrlToBytes(parts[1]);
    const signature = cpsB64UrlToBytes(parts[2]);
    if (payload.length !== CPS_LICENSE_PAYLOAD_BYTES) return null;
    if (signature.length !== CPS_LICENSE_SIGNATURE_BYTES) return null;

    const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
    return {
      payload,
      signature,
      version: view.getUint8(0),
      tier: view.getUint8(1),
      issuedAt: cpsLicenseDateToISO(view.getUint16(2)),
      serial: view.getUint32(4),
    };
  } catch {
    return null;
  }
}

// Devuelve los datos de la licencia si la firma es válida, o null.
async function cpsProVerifyCode(code) {
  const parsed = cpsProParseLicense(code);
  if (!parsed || parsed.version !== 1) return null;
  if (CPS_PRO_REVOKED_SERIALS.includes(parsed.serial)) return null;

  try {
    const key = await crypto.subtle.importKey(
      "jwk",
      CPS_PRO_PUBLIC_KEY,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"]
    );
    const ok = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      parsed.signature,
      parsed.payload
    );
    return ok ? parsed : null;
  } catch {
    return null;
  }
}

// La licencia guardada es la única fuente de verdad y se revalida en cada
// lectura: poner active:true a mano en el storage no alcanza.
async function cpsProGet() {
  const data = await cpsStorageGet(CPS_PRO_KEY);
  const state = data[CPS_PRO_KEY];
  if (!state?.license) return { active: false, serial: null, issuedAt: null, activatedAt: null };

  const license = await cpsProVerifyCode(state.license);
  if (!license) return { active: false, serial: null, issuedAt: null, activatedAt: null };

  return {
    active: true,
    serial: license.serial,
    issuedAt: license.issuedAt,
    activatedAt: state.activatedAt || null,
  };
}

async function cpsProIsActive() {
  return (await cpsProGet()).active;
}

async function cpsProActivate(code) {
  if (!(await cpsProVerifyCode(code))) return false;
  await cpsStorageSet({
    [CPS_PRO_KEY]: { license: cpsProNormalizeCode(code), activatedAt: Date.now() },
  });
  return true;
}

async function cpsProDeactivate() {
  await cpsStorageRemove(CPS_PRO_KEY);
}

// ---- PIN ----

function cpsPinIsValidFormat(pin) {
  return new RegExp(`^\\d{${CPS_PIN_MIN},${CPS_PIN_MAX}}$`).test(String(pin ?? ""));
}

async function cpsPinDerive(pin, saltHex, iterations) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(String(pin)),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: cpsHexToBuf(saltHex), iterations, hash: "SHA-256" },
    key,
    256
  );
  return cpsBufToHex(bits);
}

async function cpsPinGetRecord() {
  const data = await cpsStorageGet(CPS_PIN_KEY);
  const rec = data[CPS_PIN_KEY];
  return rec?.hash && rec?.salt ? rec : null;
}

async function cpsPinExists() {
  return !!(await cpsPinGetRecord());
}

async function cpsPinLength() {
  const rec = await cpsPinGetRecord();
  return rec?.length || CPS_PIN_MIN;
}

async function cpsPinSet(pin) {
  if (!cpsPinIsValidFormat(pin)) return false;
  const saltHex = cpsBufToHex(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await cpsPinDerive(pin, saltHex, CPS_PIN_ITERATIONS);
  await cpsStorageSet({
    [CPS_PIN_KEY]: {
      salt: saltHex,
      hash,
      iterations: CPS_PIN_ITERATIONS,
      length: String(pin).length,
      createdAt: Date.now(),
    },
  });
  await cpsStorageRemove(CPS_PIN_ATTEMPTS_KEY);
  return true;
}

async function cpsPinVerify(pin) {
  const rec = await cpsPinGetRecord();
  if (!rec) return false;
  const hash = await cpsPinDerive(pin, rec.salt, rec.iterations || CPS_PIN_ITERATIONS);
  return hash === rec.hash;
}

async function cpsPinClear() {
  await cpsStorageRemove([CPS_PIN_KEY, CPS_PIN_ATTEMPTS_KEY]);
}

// ---- Enfriamiento tras fallos ----
// Vive en storage, no en memoria: recargar la página no debe regalar intentos.

async function cpsPinCooldownLeft() {
  const data = await cpsStorageGet(CPS_PIN_ATTEMPTS_KEY);
  const until = data[CPS_PIN_ATTEMPTS_KEY]?.until || 0;
  return Math.max(0, Math.ceil((until - Date.now()) / 1000));
}

async function cpsPinFailCount() {
  const data = await cpsStorageGet(CPS_PIN_ATTEMPTS_KEY);
  return data[CPS_PIN_ATTEMPTS_KEY]?.fails || 0;
}

async function cpsPinRegisterFail() {
  const data = await cpsStorageGet(CPS_PIN_ATTEMPTS_KEY);
  const fails = (data[CPS_PIN_ATTEMPTS_KEY]?.fails || 0) + 1;
  const seconds = CPS_PIN_COOLDOWNS[Math.min(fails, CPS_PIN_COOLDOWNS.length - 1)];
  await cpsStorageSet({
    [CPS_PIN_ATTEMPTS_KEY]: { fails, until: seconds ? Date.now() + seconds * 1000 : 0 },
  });
  return seconds;
}

async function cpsPinResetFails() {
  await cpsStorageRemove(CPS_PIN_ATTEMPTS_KEY);
}

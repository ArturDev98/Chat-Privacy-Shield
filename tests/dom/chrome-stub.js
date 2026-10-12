// Stub mínimo de chrome.* para correr el código real en páginas de prueba.
(function () {
  const store = {};
  const changeListeners = [];
  const pick = (keys) => {
    if (keys == null) return JSON.parse(JSON.stringify(store));
    const list = typeof keys === "string" ? [keys] : Array.isArray(keys) ? keys : Object.keys(keys);
    const out = {};
    list.forEach((k) => { if (k in store) out[k] = JSON.parse(JSON.stringify(store[k])); });
    return out;
  };
  const later = (fn) => setTimeout(fn, 0);
  window.__cpsStore = store;
  window.chrome = {
    runtime: {
      id: "test",
      lastError: undefined,
      onMessage: { addListener() {} },
      sendMessage() {},
      getManifest: () => ({ version: "2.1.0" }),
      getURL: (p) => p,
    },
    storage: {
      local: {
        get(keys, cb) {
          const res = pick(keys);
          if (cb) later(() => cb(res));
          return Promise.resolve(res);
        },
        set(obj, cb) {
          const changes = {};
          Object.keys(obj).forEach((k) => {
            changes[k] = { oldValue: store[k], newValue: JSON.parse(JSON.stringify(obj[k])) };
            store[k] = JSON.parse(JSON.stringify(obj[k]));
          });
          later(() => changeListeners.forEach((l) => l(changes, "local")));
          if (cb) later(cb);
          return Promise.resolve();
        },
        remove(keys, cb) {
          (Array.isArray(keys) ? keys : [keys]).forEach((k) => delete store[k]);
          if (cb) later(cb);
          return Promise.resolve();
        },
      },
      onChanged: { addListener(fn) { changeListeners.push(fn); } },
    },
    tabs: { query(_q, cb) { cb && cb([]); }, sendMessage() {} },
    permissions: { contains(_p, cb) { cb && cb(false); return Promise.resolve(false); } },
  };
})();

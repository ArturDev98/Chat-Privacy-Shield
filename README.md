# 🛡 Chat Privacy Shield

> Visual privacy for WhatsApp Web in shared spaces and offices.  
> **Not affiliated with WhatsApp, Meta, or Google.**

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-4285F4?logo=google-chrome&logoColor=white)](https://chrome.google.com/webstore)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Privacy: No data collected](https://img.shields.io/badge/Privacy-No%20data%20collected-00a884)](privacy-policy.html)

---

## What it does

Chat Privacy Shield blurs your chat list, names, profile photos, and shared images on WhatsApp Web — so coworkers walking by can't see your private conversations. Reveal everything instantly by hovering your mouse or pressing a keyboard shortcut.

---

## Features

| Feature | Description |
|---|---|
| 👁 **Blur toggle** | Blur the entire chat list panel |
| 👤 **Hide profile photos** | Blur avatars and shared images |
| 📝 **Hide names** | Blur contact/group names |
| 🖱 **Reveal on hover** | Mouse over the panel to reveal temporarily |
| 🎚 **Blur intensity** | Adjustable slider (2px — 20px) |
| 💾 **Persistent settings** | Your preferences saved locally |
| 👁 **Status preview** | Hover over a contact's status to preview it without marking as read |
| 🌐 **Change Language** | Switch between EN, ES, DE, RU, AR, ZH |

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+H` | Toggle privacy ON/OFF |
| `Ctrl+Shift+K` | Show/hide floating panel |

> On Mac, use `Cmd` instead of `Ctrl`

**Status Preview**: Shows a low-resolution thumbnail of the first status.
Additional statuses are not loaded to avoid triggering read receipts.

---

## Installation (Developer Mode)

Until published to the Chrome Web Store:

1. Download and unzip this repository
2. Open Chrome → `chrome://extensions/`
3. Enable **Developer mode** (top right)
4. Click **"Load unpacked"**
5. Select the `chat-privacy-shield` folder

---

## Privacy

This extension:
- ✅ Stores settings **locally only** (`chrome.storage.local`)
- ✅ Does **not** read message content
- ✅ Does **not** transmit any data externally
- ✅ Does **not** use analytics or tracking
- ✅ Works **fully offline**

[Full Privacy Policy](privacy-policy.html)

---

## Roadmap

- [ ] Instagram DMs support
- [ ] Google Chat support  
- [ ] Telegram Web support
- [ ] Per-platform profiles

---

## Legal

Chat Privacy Shield is an independent open-source project not affiliated with WhatsApp LLC, Meta Platforms Inc., or Google LLC. This extension applies purely visual CSS transformations to the browser DOM and does not intercept, read, or modify message data.

---

## License

MIT — free to use, modify, and distribute.

---

## ES · Instalación

1. Descarga y descomprime el repositorio
2. Abre Chrome → `chrome://extensions/`
3. Activa **Modo de desarrollador** (arriba a la derecha)
4. Clic en **"Cargar extensión sin empaquetar"**
5. Selecciona la carpeta `chat-privacy-shield`

Para actualizar después de cambios: botón 🔄 en `chrome://extensions/`

# 🛡 Chat Privacy Shield

> Visual privacy for WhatsApp Web and Telegram Web in shared spaces and offices.  
> **Not affiliated with WhatsApp, Meta, Telegram, or Google.**

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-4285F4?logo=google-chrome&logoColor=white)](https://chrome.google.com/webstore)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Privacy: No data collected](https://img.shields.io/badge/Privacy-No%20data%20collected-00a884)](privacy-policy.html)

---

## What it does

Chat Privacy Shield blurs your chat list, names, profile photos, and shared images on WhatsApp Web and Telegram Web — so coworkers walking by can't see your private conversations. Reveal everything instantly by hovering your mouse or pressing a keyboard shortcut.

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
| 🔔 **Show unread badges** | Keep unread message counters visible even while the chat list is blurred |
| 💬 **Blur active conversation** | Blur the open chat's messages (compose box stays usable) |
| ⌨️ **Hide typed text on blur** | Blur what you're typing when the chat input loses focus |
| 📥 **Donwload Status** | Donwload statuses (Images or videos) |
| 👁️ **Auto-Blur** | Auto-blur due to inactivity |
| 🥷🏽 **Hidden online/last seen** | Hide online status, last seen, or typing status |
| #️⃣ **Hide unread counter** | Hide the "(3)" in the tab title, the number on the tab icon (pinned tabs too) and the one on the Chats icon in the left menu while privacy is on |
| ✈️ **Telegram Web** | The same protection on `web.telegram.org/k`, opt-in from the popup — see [Telegram Web](#telegram-web) |
| 🔒 **PIN Lock** ⭐ | Full lock screen — WhatsApp Web and Telegram Web ask for your PIN every time they open |
| ⏱ **Auto-lock** ⭐ | Lock with PIN after 1–30 min of inactivity, or as soon as you leave the tab |

⭐ = Pro feature. See [Pro](#pro).

---

## Telegram Web

Telegram Web support is off by default, so installing or updating the extension never asks for access to Telegram.

1. Open the extension popup on a Telegram Web tab and click **Turn on for Telegram Web** (or use the **Telegram Web** toggle further down)
2. Accept Chrome's permission prompt for `web.telegram.org`
3. Open Telegram Web tabs reload by themselves and get the same protection

Only the **K version** (`web.telegram.org/k`) is supported. Settings are shared with WhatsApp Web, and so is PIN Lock: one license covers both. Status preview and status download are WhatsApp-only.

Turning it off removes the permission. If PIN Lock is on, turning it off asks for your PIN, so the popup can't be used to take the lock off Telegram.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+H` | Toggle privacy ON/OFF |
| `Ctrl+Shift+K` | Show/hide floating panel |
| `Ctrl+Shift+L` | Lock now with PIN (Pro) |

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

## Pro

Everything listed above is free except **PIN Lock** and its **Auto-lock** options.

**What it does**

A full lock screen covers WhatsApp Web (and Telegram Web, if enabled) every time the page opens or reloads. Nothing is readable until the right PIN is entered. You can also lock on demand with `Ctrl+Shift+L` or the padlock in the floating panel.

**Auto-lock**

Once PIN Lock is on, the popup offers two more triggers:

- **Auto-lock when idle** — after 1, 5, 15 or 30 minutes with no mouse, keyboard or scroll activity inside WhatsApp Web. Working in another tab counts as idle for WhatsApp.
- **Lock when leaving the tab** — locks the moment you switch tabs or minimize the window, so the lock screen is already up when you come back.

Opening the extension popup doesn't count as leaving, so you can change settings without locking yourself out.

**How to activate**

1. Open the extension popup → **PIN Lock** section
2. Paste the license you received by email and click **Activate**
3. Flip the **Lock with PIN** toggle and set a 4–6 digit PIN (entered twice)

Your license is tied to your purchase, not to a device — use it on every computer you want. It is verified offline with a signature check, so activating it never contacts any server.

Turning the lock off, changing the PIN, or deactivating Pro all require the current PIN — otherwise the popup would be a way around the lock screen.

**How the PIN is stored**

The PIN is never stored in plain text and never leaves your machine. It is saved as a PBKDF2-SHA256 hash (150,000 iterations) with a random 16-byte salt, in `chrome.storage.local`. Exporting your settings does **not** include the PIN.

**If you forget your PIN**

After a few wrong attempts the lock screen offers **Forgot your PIN?** — paste your license there and the PIN is cleared, so you can set a new one. Only the license that activated this installation works, so someone sitting at your desk can't use it to get in. Keep your purchase email.

**What it is not**

This is a deterrent against someone walking up to your unlocked computer. It is not encryption: it does not protect WhatsApp's own local data, and anyone who can disable extensions or read your browser profile can get past it. After 4 wrong attempts the keypad locks for 30s, then 60s, then 5 minutes — and that counter survives a page reload.

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
- [x] Telegram Web support (K version)
- [ ] Per-platform profiles

---

## Legal

Chat Privacy Shield is an independent open-source project not affiliated with WhatsApp LLC, Meta Platforms Inc., Telegram, or Google LLC. This extension applies purely visual CSS transformations to the browser DOM and does not intercept, read, or modify message data.

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

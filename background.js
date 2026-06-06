// Background Service Worker - WhatsApp Privacy Shield
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.includes("web.whatsapp.com")) return;

  if (command === "toggle-privacy") {
    chrome.tabs.sendMessage(tab.id, { action: "toggle-privacy" });
  }
  if (command === "toggle-panel") {
    chrome.tabs.sendMessage(tab.id, { action: "toggle-panel" });
  }
});

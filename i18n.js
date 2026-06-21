// i18n.js - Chat Privacy Shield translations
// Shared between content.js and popup.js

const CPS_I18N = {
  en: {
    panelTooltipPrivacyOn: "Disable privacy (Ctrl+Shift+H)",
    panelTooltipPrivacyOff: "Enable privacy (Ctrl+Shift+H)",
    panelTooltipPhotos: "Hide photos",
    panelTooltipNames: "Hide names",
    panelTooltipHover: "Reveal on hover",
    panelTooltipHidePanel: "Hide panel (Ctrl+Shift+K)",
    restoreHint: "🛡 CPS — click to show panel",

    popupTitle: "Chat Privacy Shield",
    popupSubtitle: "web.whatsapp.com",
    statusActive: "Active",
    statusInactive: "Inactive",
    sectionBlurIntensity: "Blur Intensity",
    blurLevel: "Blur level",
    sectionOptions: "Options",
    hidePhotos: "Hide profile photos",
    hideNames: "Hide names",
    revealOnHover: "Reveal on hover",
    togglePrivacy: "Toggle privacy",
    showHidePanel: "Show/hide panel",
    openWhatsApp: "Open WhatsApp Web →",
    disclaimer: "Not affiliated with WhatsApp, Meta, or Google.",
    disclaimer2: "No data is collected or transmitted.",
    language: "Language",
  },
  es: {
    panelTooltipPrivacyOn: "Desactivar privacidad (Ctrl+Shift+H)",
    panelTooltipPrivacyOff: "Activar privacidad (Ctrl+Shift+H)",
    panelTooltipPhotos: "Ocultar fotos",
    panelTooltipNames: "Ocultar nombres",
    panelTooltipHover: "Revelar al pasar el cursor",
    panelTooltipHidePanel: "Ocultar panel (Ctrl+Shift+K)",
    restoreHint: "🛡 CPS — clic para mostrar el panel",

    popupTitle: "Chat Privacy Shield",
    popupSubtitle: "web.whatsapp.com",
    statusActive: "Activo",
    statusInactive: "Inactivo",
    sectionBlurIntensity: "Intensidad de difuminado",
    blurLevel: "Nivel de difuminado",
    sectionOptions: "Opciones",
    hidePhotos: "Ocultar fotos de perfil",
    hideNames: "Ocultar nombres",
    revealOnHover: "Revelar al pasar el cursor",
    togglePrivacy: "Activar/desactivar privacidad",
    showHidePanel: "Mostrar/ocultar panel",
    openWhatsApp: "Abrir WhatsApp Web →",
    disclaimer: "No afiliado a WhatsApp, Meta ni Google.",
    disclaimer2: "No se recopilan ni transmiten datos.",
    language: "Idioma",
  },
};

function cpsT(key, lang) {
  return (CPS_I18N[lang] && CPS_I18N[lang][key]) || CPS_I18N.en[key] || key;
}

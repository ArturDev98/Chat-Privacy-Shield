// Changelog de Chat Privacy Shield — un popup "novedades" se muestra una
// sola vez por versión, la primera vez que se abre WhatsApp Web después
// de que la extensión se actualiza. Solo se muestra el changelog de la
// versión actual (no se acumulan versiones saltadas).
//
// Al lanzar una nueva versión: agregar una entrada nueva aquí con la
// clave = version del manifest.json, y una traducción por idioma.
const CPS_CHANGELOG = {
  "1.12.3": {
    en: {
      title: "What's new",
      items: [
        "Fixed: the status preview thumbnail no longer stays stuck on screen after switching away from the Status section to Chats or another tab",
      ],
    },
    es: {
      title: "Novedades",
      items: [
        "Corregido: la vista previa de estado ya no se queda pegada en pantalla al cambiar de la sección de Estados a Chats u otra pestaña",
      ],
    },
    de: {
      title: "Neuigkeiten",
      items: [
        "Behoben: Die Status-Vorschau bleibt nicht mehr auf dem Bildschirm hängen, wenn du von Status zu Chats oder einem anderen Tab wechselst",
      ],
    },
    ru: {
      title: "Что нового",
      items: [
        "Исправлено: предпросмотр статуса больше не остаётся зависшим на экране при переходе из раздела «Статусы» в «Чаты» или другую вкладку",
      ],
    },
    ar: {
      title: "الجديد",
      items: [
        "إصلاح: لم تعد معاينة الحالة تبقى عالقة على الشاشة عند الانتقال من قسم الحالات إلى الدردشات أو أي علامة تبويب أخرى",
      ],
    },
    zh: {
      title: "更新内容",
      items: [
        "修复：从状态部分切换到聊天或其他标签页后，状态预览图不再卡在屏幕上",
      ],
    },
  },
  "1.13.0": {
    en: {
      title: "What's new",
      items: [
        "New: auto-blur immediately when you switch tabs or minimize the window — no need to wait for the inactivity timer",
        "New: hide the contact's photo in the open chat header, independent of blurring the whole conversation",
        "New: download all of a contact's statuses at once with a single click, instead of one by one",
      ],
    },
    es: {
      title: "Novedades",
      items: [
        "Nuevo: auto-difuminado inmediato al cambiar de pestaña o minimizar la ventana — sin esperar el temporizador de inactividad",
        "Nuevo: ocultar la foto del contacto en el encabezado del chat abierto, independiente de difuminar toda la conversación",
        "Nuevo: descargar todos los estados de un contacto de una sola vez, en vez de uno por uno",
      ],
    },
    de: {
      title: "Neuigkeiten",
      items: [
        "Neu: sofortige automatische Unschärfe beim Tabwechsel oder Minimieren des Fensters — kein Warten auf den Inaktivitäts-Timer nötig",
        "Neu: Kontaktfoto im geöffneten Chat-Header ausblenden, unabhängig vom Unscharfstellen der gesamten Unterhaltung",
        "Neu: alle Status eines Kontakts mit einem Klick herunterladen, statt einzeln",
      ],
    },
    ru: {
      title: "Что нового",
      items: [
        "Новое: мгновенное автоматическое размытие при переключении вкладки или сворачивании окна — не нужно ждать таймер бездействия",
        "Новое: скрытие фото контакта в шапке открытого чата, независимо от размытия всей переписки",
        "Новое: скачивание всех статусов контакта одним кликом, а не по одному",
      ],
    },
    ar: {
      title: "الجديد",
      items: [
        "جديد: تمويه تلقائي فوري عند تبديل التبويب أو تصغير النافذة — دون الحاجة لانتظار مؤقت عدم النشاط",
        "جديد: إخفاء صورة جهة الاتصال في رأس الدردشة المفتوحة، بشكل مستقل عن تمويه المحادثة بأكملها",
        "جديد: تنزيل جميع حالات جهة الاتصال دفعة واحدة بنقرة واحدة، بدلاً من واحدة تلو الأخرى",
      ],
    },
    zh: {
      title: "更新内容",
      items: [
        "新功能：切换标签页或最小化窗口时立即自动模糊——无需等待闲置计时器",
        "新功能：隐藏已打开聊天头部的联系人照片，与模糊整个对话相互独立",
        "新功能：一键下载联系人的所有状态，而不用逐个下载",
      ],
    },
  },
  "1.13.1": {
    en: {
      title: "What's new",
      items: [
        "Fixed: in the Calls section, hovering over an entry now reveals it, just like in the chat list — before, calls stayed blurred with no way to read them",
        "Fixed: the Favorites list inside Calls is now blurred and revealed on hover too, the same as every other list",
      ],
    },
    es: {
      title: "Novedades",
      items: [
        "Corregido: en la sección de Llamadas, pasar el cursor por una entrada ahora la revela, igual que en la lista de chats — antes se quedaban difuminadas sin forma de leerlas",
        "Corregido: la lista de Favoritos dentro de Llamadas ahora también se difumina y se revela al pasar el cursor, igual que el resto de las listas",
      ],
    },
    de: {
      title: "Neuigkeiten",
      items: [
        "Behoben: Im Bereich „Anrufe“ wird ein Eintrag jetzt beim Daraufzeigen sichtbar, genau wie in der Chatliste — vorher blieben Anrufe unscharf und unlesbar",
        "Behoben: Die Favoritenliste innerhalb von „Anrufe“ wird jetzt ebenfalls unscharf und beim Daraufzeigen sichtbar, wie alle anderen Listen",
      ],
    },
    ru: {
      title: "Что нового",
      items: [
        "Исправлено: в разделе «Звонки» запись теперь раскрывается при наведении курсора, как в списке чатов — раньше звонки оставались размытыми и их нельзя было прочитать",
        "Исправлено: список «Избранные» внутри раздела «Звонки» теперь тоже размывается и раскрывается при наведении курсора, как остальные списки",
      ],
    },
    ar: {
      title: "الجديد",
      items: [
        "إصلاح: في قسم المكالمات، أصبح تمرير المؤشر فوق أي إدخال يكشفه الآن، تمامًا كما في قائمة الدردشات — سابقًا كانت المكالمات تبقى مموّهة دون إمكانية قراءتها",
        "إصلاح: قائمة المفضلة داخل قسم المكالمات أصبحت أيضًا مموّهة وتُكشف عند تمرير المؤشر، مثل بقية القوائم",
      ],
    },
    zh: {
      title: "更新内容",
      items: [
        "修复：在通话部分，将光标悬停在某条记录上现在会显示它，与聊天列表一致——此前通话记录会一直保持模糊且无法查看",
        "修复：通话内的收藏列表现在也会模糊，并在悬停时显示，与其他列表保持一致",
      ],
    },
  },
};

function cpsGetChangelog(version, lang) {
  const entry = CPS_CHANGELOG[version];
  if (!entry) return null;
  return entry[lang] || entry.en || null;
}

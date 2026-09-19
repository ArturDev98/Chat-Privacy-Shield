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
  "1.14.0": {
    en: {
      title: "What's new",
      items: [
        "New (Pro): PIN Lock \u2014 WhatsApp Web asks for your PIN every time it opens, behind a full lock screen",
        "New: lock instantly with Ctrl+Shift+L or the padlock button in the floating panel",
        "New: activate Pro from the extension popup with your activation code",
      ],
    },
    es: {
      title: "Novedades",
      items: [
        "Nuevo (Pro): Bloqueo con PIN \u2014 WhatsApp Web pide tu PIN cada vez que se abre, detr\u00e1s de una pantalla de bloqueo completa",
        "Nuevo: bloquea al instante con Ctrl+Shift+L o con el candado del panel flotante",
        "Nuevo: activa Pro desde el popup de la extensi\u00f3n con tu c\u00f3digo de activaci\u00f3n",
      ],
    },
    de: {
      title: "Neuigkeiten",
      items: [
        "Neu (Pro): PIN-Sperre \u2014 WhatsApp Web fragt bei jedem \u00d6ffnen nach deiner PIN, hinter einem vollen Sperrbildschirm",
        "Neu: sofort sperren mit Ctrl+Shift+L oder \u00fcber das Schloss-Symbol im schwebenden Panel",
        "Neu: Pro direkt im Erweiterungs-Popup mit deinem Aktivierungscode freischalten",
      ],
    },
    ru: {
      title: "\u0427\u0442\u043e \u043d\u043e\u0432\u043e\u0433\u043e",
      items: [
        "\u041d\u043e\u0432\u043e\u0435 (Pro): \u0431\u043b\u043e\u043a\u0438\u0440\u043e\u0432\u043a\u0430 PIN-\u043a\u043e\u0434\u043e\u043c \u2014 WhatsApp Web \u0437\u0430\u043f\u0440\u0430\u0448\u0438\u0432\u0430\u0435\u0442 PIN \u043f\u0440\u0438 \u043a\u0430\u0436\u0434\u043e\u043c \u043e\u0442\u043a\u0440\u044b\u0442\u0438\u0438, \u0437\u0430 \u043f\u043e\u043b\u043d\u044b\u043c \u044d\u043a\u0440\u0430\u043d\u043e\u043c \u0431\u043b\u043e\u043a\u0438\u0440\u043e\u0432\u043a\u0438",
        "\u041d\u043e\u0432\u043e\u0435: \u043c\u0433\u043d\u043e\u0432\u0435\u043d\u043d\u0430\u044f \u0431\u043b\u043e\u043a\u0438\u0440\u043e\u0432\u043a\u0430 \u0447\u0435\u0440\u0435\u0437 Ctrl+Shift+L \u0438\u043b\u0438 \u043a\u043d\u043e\u043f\u043a\u0443-\u0437\u0430\u043c\u043e\u043a \u043d\u0430 \u043f\u043b\u0430\u0432\u0430\u044e\u0449\u0435\u0439 \u043f\u0430\u043d\u0435\u043b\u0438",
        "\u041d\u043e\u0432\u043e\u0435: \u0430\u043a\u0442\u0438\u0432\u0430\u0446\u0438\u044f Pro \u0432\u043e \u0432\u0441\u043f\u043b\u044b\u0432\u0430\u044e\u0449\u0435\u043c \u043e\u043a\u043d\u0435 \u0440\u0430\u0441\u0448\u0438\u0440\u0435\u043d\u0438\u044f \u043f\u043e \u043a\u043e\u0434\u0443 \u0430\u043a\u0442\u0438\u0432\u0430\u0446\u0438\u0438",
      ],
    },
    ar: {
      title: "\u0627\u0644\u062c\u062f\u064a\u062f",
      items: [
        "\u062c\u062f\u064a\u062f (Pro): \u0627\u0644\u0642\u0641\u0644 \u0628\u0631\u0645\u0632 PIN \u2014 \u064a\u0637\u0644\u0628 \u0648\u0627\u062a\u0633\u0627\u0628 \u0648\u064a\u0628 \u0631\u0645\u0632\u0643 \u0641\u064a \u0643\u0644 \u0645\u0631\u0629 \u064a\u064f\u0641\u062a\u062d \u0641\u064a\u0647\u0627\u060c \u062e\u0644\u0641 \u0634\u0627\u0634\u0629 \u0642\u0641\u0644 \u0643\u0627\u0645\u0644\u0629",
        "\u062c\u062f\u064a\u062f: \u0627\u0644\u0642\u0641\u0644 \u0627\u0644\u0641\u0648\u0631\u064a \u0628\u0640 Ctrl+Shift+L \u0623\u0648 \u0645\u0646 \u0632\u0631 \u0627\u0644\u0642\u0641\u0644 \u0641\u064a \u0627\u0644\u0644\u0648\u062d\u0629 \u0627\u0644\u0639\u0627\u0626\u0645\u0629",
        "\u062c\u062f\u064a\u062f: \u062a\u0641\u0639\u064a\u0644 Pro \u0645\u0646 \u0646\u0627\u0641\u0630\u0629 \u0627\u0644\u0625\u0636\u0627\u0641\u0629 \u0628\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0631\u0645\u0632 \u0627\u0644\u062a\u0641\u0639\u064a\u0644",
      ],
    },
    zh: {
      title: "\u66f4\u65b0\u5185\u5bb9",
      items: [
        "\u65b0\u589e\uff08Pro\uff09\uff1aPIN \u7801\u9501 \u2014 \u6bcf\u6b21\u6253\u5f00 WhatsApp Web \u90fd\u4f1a\u5728\u5168\u5c4f\u9501\u5b9a\u754c\u9762\u540e\u8981\u6c42\u8f93\u5165 PIN \u7801",
        "\u65b0\u589e\uff1a\u4f7f\u7528 Ctrl+Shift+L \u6216\u60ac\u6d6e\u9762\u677f\u4e0a\u7684\u9501\u5f62\u6309\u94ae\u7acb\u5373\u9501\u5b9a",
        "\u65b0\u589e\uff1a\u5728\u6269\u5c55\u5f39\u7a97\u4e2d\u8f93\u5165\u6fc0\u6d3b\u7801\u5373\u53ef\u542f\u7528 Pro",
      ],
    },
  },
};

function cpsGetChangelog(version, lang) {
  const entry = CPS_CHANGELOG[version];
  if (!entry) return null;
  return entry[lang] || entry.en || null;
}

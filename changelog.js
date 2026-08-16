// Changelog de Chat Privacy Shield — un popup "novedades" se muestra una
// sola vez por versión, la primera vez que se abre WhatsApp Web después
// de que la extensión se actualiza. Solo se muestra el changelog de la
// versión actual (no se acumulan versiones saltadas).
//
// Al lanzar una nueva versión: agregar una entrada nueva aquí con la
// clave = version del manifest.json, y una traducción por idioma.
const CPS_CHANGELOG = {
  "1.8.0": {
    en: {
      title: "What's new",
      items: [
        "New: download photos and videos from Statuses (your own and others') with one click, right from the status viewer",
        "New: keep unread-message badges visible while the chat list stays blurred",
        "New: blur the active conversation too — only the message under your cursor is revealed",
        "New: hide what you're typing when the chat input loses focus",
        "New: this \"what's new\" popup, so you don't have to go looking for what changed",
      ],
    },
    es: {
      title: "Novedades",
      items: [
        "Nuevo: descarga fotos y videos de los Estados (los tuyos y los de otros) con un clic, directo desde el visor",
        "Nuevo: mantén visible el contador de mensajes no leídos aunque la lista esté difuminada",
        "Nuevo: difumina también la conversación activa — solo se revela el mensaje bajo el cursor",
        "Nuevo: oculta lo que estás escribiendo cuando el input del chat pierde el foco",
        "Nuevo: este popup de \"novedades\", para que no tengas que ir a buscar qué cambió",
      ],
    },
    de: {
      title: "Neuigkeiten",
      items: [
        "Neu: Fotos und Videos aus Status-Updates (eigene und fremde) mit einem Klick direkt im Status-Viewer herunterladen",
        "Neu: Zähler für ungelesene Nachrichten bleibt sichtbar, auch wenn die Chatliste unscharf ist",
        "Neu: aktive Unterhaltung ebenfalls unscharf stellen — nur die Nachricht unter dem Mauszeiger wird angezeigt",
        "Neu: eingegebenen Text ausblenden, wenn das Chat-Eingabefeld den Fokus verliert",
        "Neu: dieses \"Neuigkeiten\"-Popup, damit du nicht selbst nachschauen musst, was sich geändert hat",
      ],
    },
    ru: {
      title: "Что нового",
      items: [
        "Новое: скачивайте фото и видео из статусов (своих и чужих) одним кликом прямо из просмотра статуса",
        "Новое: счётчик непрочитанных сообщений остаётся видимым, даже когда список чатов размыт",
        "Новое: размытие активного чата — виден только тот пришло, над которым курсор",
        "Новое: скрытие набираемого текста при потере фокуса поля ввода",
        "Новое: это окно \"что нового\", чтобы не искать изменения самостоятельно",
      ],
    },
    ar: {
      title: "الجديد",
      items: [
        "جديد: تنزيل الصور ومقاطع الفيديو من الحالات (حالاتك وحالات الآخرين) بنقرة واحدة من داخل عارض الحالة",
        "جديد: إبقاء عداد الرسائل غير المقروءة ظاهرًا حتى مع تمويه قائمة الدردشات",
        "جديد: تمويه المحادثة النشطة أيضًا — تظهر فقط الرسالة التي يمر عليها المؤشر",
        "جديد: إخفاء النص المكتوب عند فقدان التركيز في حقل إدخال الدردشة",
        "جديد: نافذة \"الجديد\" هذه، حتى لا تحتاج للبحث عمّا تغيّر بنفسك",
      ],
    },
    zh: {
      title: "更新内容",
      items: [
        "新功能：在状态查看器中一键下载照片和视频（自己的和他人的状态）",
        "新功能：即使聊天列表处于模糊状态，未读消息角标仍保持可见",
        "新功能：也可以模糊当前对话——只显示鼠标悬停的那条消息",
        "新功能：聊天输入框失去焦点时隐藏正在输入的文字",
        "新功能：这个\"更新内容\"弹窗，让你不用自己去找有什么变化",
      ],
    },
  },
  "1.10.0": {
    en: {
      title: "What's new",
      items: [
        "New: auto-blur after 30 seconds of inactivity — stays blurred until you turn it off yourself",
        "New: hide \"online\"/\"last seen\"/\"typing...\" in the chat header, without affecting the contact's name",
        "Improved: downloading text-only Statuses is now supported too (rebuilt as an image), not just photos and videos",
        "Fixed: \"reveal on hover\" now also works for names and profile photos (chat list and open chat header)",
        "New: the control panel now closes itself automatically when you move the cursor away — no need to click the X every time",
        "Fixed: \"hide typed text\" now also triggers when you move the cursor away, not only when you click elsewhere",
        "New: added a small \"Support this project\" button (Ko-fi) in the popup, for anyone who wants to help keep this going",
      ],
    },
    es: {
      title: "Novedades",
      items: [
        "Nuevo: auto-difuminado tras 30 segundos de inactividad — se queda difuminado hasta que lo apagues tú mismo",
        "Nuevo: ocultar \"en línea\"/\"última vez\"/\"escribiendo...\" en el encabezado del chat, sin afectar el nombre del contacto",
        "Mejorado: ahora también se pueden descargar los Estados de solo texto (se reconstruyen como imagen), no solo fotos y videos",
        "Corregido: \"revelar al pasar el cursor\" ahora también funciona para nombres y fotos de perfil (lista de chats y encabezado del chat abierto)",
        "Nuevo: el panel de control se cierra solo al sacar el cursor — ya no hace falta darle a la X cada vez",
        "Corregido: \"ocultar texto escrito\" ahora también se activa al sacar el cursor, no solo al hacer clic en otro lado",
        "Nuevo: se agregó un pequeño botón de \"Apoyar este proyecto\" (Ko-fi) en el popup, para quien quiera colaborar a que esto siga adelante",
      ],
    },
    de: {
      title: "Neuigkeiten",
      items: [
        "Neu: automatische Unschärfe nach 30 Sekunden Inaktivität — bleibt unscharf, bis du sie selbst ausschaltest",
        "Neu: \"online\"/\"zuletzt online\"/\"schreibt...\" im Chat-Header ausblenden, ohne den Namen des Kontakts zu beeinflussen",
        "Verbessert: reine Text-Status-Updates können jetzt ebenfalls heruntergeladen werden (als Bild rekonstruiert), nicht nur Fotos und Videos",
        "Behoben: \"Bei Mauszeiger anzeigen\" funktioniert jetzt auch für Namen und Profilfotos (Chatliste und geöffneter Chat-Header)",
        "Neu: Das Bedienfeld schließt sich jetzt automatisch, wenn du den Mauszeiger wegbewegst — kein Klick mehr auf das X nötig",
        "Behoben: \"Geschriebenen Text ausblenden\" wird jetzt auch beim Wegbewegen des Mauszeigers ausgelöst, nicht nur bei Klick woanders",
        "Neu: ein kleiner \"Projekt unterstützen\"-Button (Ko-fi) im Popup für alle, die gerne beitragen möchten",
      ],
    },
    ru: {
      title: "Что нового",
      items: [
        "Новое: автоматическое размытие через 30 секунд бездействия — остаётся размытым, пока вы не выключите его сами",
        "Новое: скрытие \"в сети\"/\"был(а) в сети\"/\"печатает...\" в шапке чата, без влияния на имя контакта",
        "Улучшено: теперь можно скачивать и текстовые статусы (собираются как изображение), а не только фото и видео",
        "Исправлено: \"показывать при наведении\" теперь работает и для имён, и для фото профиля (список чатов и шапка открытого чата)",
        "Новое: панель управления теперь закрывается автоматически при отведении курсора — больше не нужно каждый раз нажимать X",
        "Исправлено: \"скрывать набираемый текст\" теперь срабатывает и при отведении курсора, а не только при клике в другом месте",
        "Новое: в попапе появилась небольшая кнопка \"Поддержать проект\" (Ko-fi) для тех, кто хочет помочь развитию",
      ],
    },
    ar: {
      title: "الجديد",
      items: [
        "جديد: تمويه تلقائي بعد 30 ثانية من عدم النشاط — يبقى ممويهًا حتى تقوم بإيقافه بنفسك",
        "جديد: إخفاء \"متصل الآن\"/\"آخر ظهور\"/\"يكتب الآن...\" في رأس الدردشة، دون التأثير على اسم جهة الاتصال",
        "تحسين: أصبح بالإمكان الآن تنزيل الحالات النصية أيضًا (يُعاد بناؤها كصورة)، وليس فقط الصور ومقاطع الفيديو",
        "إصلاح: \"الكشف عند التحويم\" يعمل الآن أيضًا مع الأسماء وصور الملف الشخصي (قائمة الدردشات ورأس الدردشة المفتوحة)",
        "جديد: لوحة التحكم تُغلق الآن تلقائيًا عند إبعاد المؤشر — لم تعد بحاجة للنقر على X في كل مرة",
        "إصلاح: \"إخفاء النص المكتوب\" يُفعَّل الآن أيضًا عند إبعاد المؤشر، وليس فقط عند النقر في مكان آخر",
        "جديد: تمت إضافة زر صغير \"دعم هذا المشروع\" (Ko-fi) في النافذة المنبثقة لمن يرغب في المساهمة",
      ],
    },
    zh: {
      title: "更新内容",
      items: [
        "新功能：闲置 30 秒后自动模糊——会一直保持模糊，直到你自己关闭",
        "新功能：在聊天头部隐藏「在线」/「最后上线」/「正在输入...」，且不影响联系人姓名的显示",
        "改进：现在纯文字状态也支持下载了（会重新生成为图片），不再局限于照片和视频",
        "修复：「悬停时显示」现在也适用于姓名和头像（聊天列表和已打开聊天的头部）",
        "新功能：现在移开光标后控制面板会自动关闭——不用每次都点 X 了",
        "修复：「隐藏正在输入的文字」现在移开光标也会触发，不再只是点击别处才生效",
        "新功能：弹出窗口中新增了一个小小的「支持这个项目」（Ko-fi）按钮，欢迎愿意支持的用户",
      ],
    },
  },
  "1.10.1": {
    en: {
      title: "What's new",
      items: [
        "Fixed: revealing a long message on hover no longer cuts off text near WhatsApp's own reaction/options menu",
        "Fixed: downloading a Status right when it opens sometimes produced an empty file — now retries automatically until the content is ready",
      ],
    },
    es: {
      title: "Novedades",
      items: [
        "Corregido: al revelar un mensaje largo con el cursor, ya no se corta el texto cerca del menú de reacciones/opciones de WhatsApp",
        "Corregido: descargar un Estado justo al abrirlo a veces generaba un archivo vacío — ahora reintenta automáticamente hasta que el contenido esté listo",
      ],
    },
    de: {
      title: "Neuigkeiten",
      items: [
        "Behoben: beim Anzeigen einer langen Nachricht per Mauszeiger wird der Text nicht mehr in der Nähe des WhatsApp-Reaktions-/Optionsmenüs abgeschnitten",
        "Behoben: das Herunterladen eines Status direkt beim Öffnen erzeugte manchmal eine leere Datei — es wird jetzt automatisch erneut versucht, bis der Inhalt bereit ist",
      ],
    },
    ru: {
      title: "Что нового",
      items: [
        "Исправлено: при наведении на длинное сообщение текст больше не обрезается рядом с меню реакций/опций WhatsApp",
        "Исправлено: скачивание статуса сразу при открытии иногда создавало пустой файл — теперь система автоматически повторяет попытку, пока контент не будет готов",
      ],
    },
    ar: {
      title: "الجديد",
      items: [
        "إصلاح: عند إظهار رسالة طويلة بالتحويم، لم يعد النص يُقطَع بالقرب من قائمة التفاعلات/الخيارات الخاصة بواتساب",
        "إصلاح: كان تنزيل حالة فور فتحها ينتج أحيانًا ملفًا فارغًا — والآن تتم إعادة المحاولة تلقائيًا حتى يصبح المحتوى جاهزًا",
      ],
    },
    zh: {
      title: "更新内容",
      items: [
        "修复：悬停显示长消息时，文字不再在 WhatsApp 自带的表情回应/选项菜单附近被截断",
        "修复：刚打开状态就下载有时会得到空文件——现在会自动重试，直到内容准备就绪",
      ],
    },
  },
  "1.11.0": {
    en: {
      title: "What's new",
      items: [
        "New: export and import your settings as a backup file, from the extension popup",
      ],
    },
    es: {
      title: "Novedades",
      items: [
        "Nuevo: exporta e importa tu configuración como archivo de respaldo, desde el popup de la extensión",
      ],
    },
    de: {
      title: "Neuigkeiten",
      items: [
        "Neu: Einstellungen als Sicherungsdatei exportieren und importieren, direkt im Erweiterungs-Popup",
      ],
    },
    ru: {
      title: "Что нового",
      items: [
        "Новое: экспорт и импорт настроек в виде резервного файла прямо из всплывающего окна расширения",
      ],
    },
    ar: {
      title: "الجديد",
      items: [
        "جديد: تصدير واستيراد إعداداتك كملف نسخة احتياطية، من النافذة المنبثقة للإضافة",
      ],
    },
    zh: {
      title: "更新内容",
      items: [
        "新功能：可以在扩展程序弹出窗口中导出和导入设置备份文件",
      ],
    },
  },
  "1.11.2": {
    en: {
      title: "What's new",
      items: [
        "Fixed: the Status download button no longer appears when viewing a photo/video attachment inside a chat — WhatsApp already has its own download button there",
      ],
    },
    es: {
      title: "Novedades",
      items: [
        "Corregido: el botón de descargar estado ya no aparece al ver una foto/video adjunto dentro de un chat — ahí WhatsApp ya tiene su propio botón de descarga",
      ],
    },
    de: {
      title: "Neuigkeiten",
      items: [
        "Behoben: Der Status-Download-Button erscheint nicht mehr beim Anzeigen eines Foto-/Video-Anhangs in einem Chat — dort hat WhatsApp bereits einen eigenen Download-Button",
      ],
    },
    ru: {
      title: "Что нового",
      items: [
        "Исправлено: кнопка скачивания статуса больше не появляется при просмотре фото/видео вложения в чате — там у WhatsApp уже есть своя кнопка загрузки",
      ],
    },
    ar: {
      title: "الجديد",
      items: [
        "إصلاح: لم يعد زر تنزيل الحالة يظهر عند عرض مرفق صورة/فيديو داخل محادثة — فهناك يمتلك واتساب زر تنزيل خاصًا به بالفعل",
      ],
    },
    zh: {
      title: "更新内容",
      items: [
        "修复：在聊天中查看照片/视频附件时不再显示状态下载按钮——那里 WhatsApp 本身已经有自己的下载按钮",
      ],
    },
  },
  "1.12.0": {
    en: {
      title: "What's new",
      items: [
        "New: scheduled auto-blur — set a daily time range (e.g. 9am-5pm) to have privacy turn on by itself. Turning it off manually during that window is respected until the next cycle",
      ],
    },
    es: {
      title: "Novedades",
      items: [
        "Nuevo: auto-difuminado por horario — define un rango de horas al día (ej. 9am-5pm) para que la privacidad se active sola. Si la apagas manualmente dentro de esa ventana, se respeta hasta el siguiente ciclo",
      ],
    },
    de: {
      title: "Neuigkeiten",
      items: [
        "Neu: geplante automatische Unschärfe — lege einen täglichen Zeitraum fest (z. B. 9-17 Uhr), in dem sich die Privatsphäre automatisch aktiviert. Ein manuelles Ausschalten innerhalb dieses Zeitraums wird bis zum nächsten Zyklus respektiert",
      ],
    },
    ru: {
      title: "Что нового",
      items: [
        "Новое: автоматическое размытие по расписанию — задайте ежедневный временной диапазон (например, 9:00–17:00), и приватность будет включаться сама. Если вы выключите её вручную в этом окне, это сохранится до следующего цикла",
      ],
    },
    ar: {
      title: "الجديد",
      items: [
        "جديد: تمويه تلقائي مجدول — حدد نطاقًا زمنيًا يوميًا (مثل 9 صباحًا-5 مساءً) ليتم تفعيل الخصوصية تلقائيًا. إذا أوقفتها يدويًا خلال تلك الفترة، يُحترم ذلك حتى الدورة التالية",
      ],
    },
    zh: {
      title: "更新内容",
      items: [
        "新功能：按计划自动模糊——设置每天的时间段（例如上午9点到下午5点），隐私保护会自动开启。如果在此期间手动关闭，会一直保持到下一个周期",
      ],
    },
  },
};

function cpsGetChangelog(version, lang) {
  const entry = CPS_CHANGELOG[version];
  if (!entry) return null;
  return entry[lang] || entry.en || null;
}

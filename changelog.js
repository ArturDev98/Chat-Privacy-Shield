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
  "1.9.0": {
    en: {
      title: "What's new",
      items: [
        "New: auto-blur after 30 seconds of inactivity — stays blurred until you turn it off yourself",
        "New: hide \"online\"/\"last seen\"/\"typing...\" in the chat header, without affecting the contact's name",
        "Improved: downloading text-only Statuses is now supported too (rebuilt as an image), not just photos and videos",
      ],
    },
    es: {
      title: "Novedades",
      items: [
        "Nuevo: auto-difuminado tras 30 segundos de inactividad — se queda difuminado hasta que lo apagues tú mismo",
        "Nuevo: ocultar \"en línea\"/\"última vez\"/\"escribiendo...\" en el encabezado del chat, sin afectar el nombre del contacto",
        "Mejorado: ahora también se pueden descargar los Estados de solo texto (se reconstruyen como imagen), no solo fotos y videos",
      ],
    },
    de: {
      title: "Neuigkeiten",
      items: [
        "Neu: automatische Unschärfe nach 30 Sekunden Inaktivität — bleibt unscharf, bis du sie selbst ausschaltest",
        "Neu: \"online\"/\"zuletzt online\"/\"schreibt...\" im Chat-Header ausblenden, ohne den Namen des Kontakts zu beeinflussen",
        "Verbessert: reine Text-Status-Updates können jetzt ebenfalls heruntergeladen werden (als Bild rekonstruiert), nicht nur Fotos und Videos",
      ],
    },
    ru: {
      title: "Что нового",
      items: [
        "Новое: автоматическое размытие через 30 секунд бездействия — остаётся размытым, пока вы не выключите его сами",
        "Новое: скрытие \"в сети\"/\"был(а) в сети\"/\"печатает...\" в шапке чата, без влияния на имя контакта",
        "Улучшено: теперь можно скачивать и текстовые статусы (собираются как изображение), а не только фото и видео",
      ],
    },
    ar: {
      title: "الجديد",
      items: [
        "جديد: تمويه تلقائي بعد 30 ثانية من عدم النشاط — يبقى ممويهًا حتى تقوم بإيقافه بنفسك",
        "جديد: إخفاء \"متصل الآن\"/\"آخر ظهور\"/\"يكتب الآن...\" في رأس الدردشة، دون التأثير على اسم جهة الاتصال",
        "تحسين: أصبح بالإمكان الآن تنزيل الحالات النصية أيضًا (يُعاد بناؤها كصورة)، وليس فقط الصور ومقاطع الفيديو",
      ],
    },
    zh: {
      title: "更新内容",
      items: [
        "新功能：闲置 30 秒后自动模糊——会一直保持模糊，直到你自己关闭",
        "新功能：在聊天头部隐藏「在线」/「最后上线」/「正在输入...」，且不影响联系人姓名的显示",
        "改进：现在纯文字状态也支持下载了（会重新生成为图片），不再局限于照片和视频",
      ],
    },
  },
};

function cpsGetChangelog(version, lang) {
  const entry = CPS_CHANGELOG[version];
  if (!entry) return null;
  return entry[lang] || entry.en || null;
}

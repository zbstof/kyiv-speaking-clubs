"use strict";
(() => {
  const CFG = window.SC_CONFIG || {};
  const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const STALE_DAYS = 183; // after this many days without evidence, a club counts as "not confirmed"
  const OLD_DAYS = 365;   // after this many days, a club is hidden unless "show old" is on

  // Member counts are snapshots, not live numbers, so the page shows them rounded:
  // under 10 as is, under 100 to 10, under 1000 to 50, under 10000 to 100, above that to 1000.
  const roughCount = (n) => {
    if (n < 10) return n;
    const step = n < 100 ? 10 : n < 1000 ? 50 : n < 10000 ? 100 : 1000;
    return Math.round(n / step) * step;
  };

  // ---------- texts ----------
  const T = {
    uk: {
      title: "Розмовні клуби Києва",
      addClub: "+ Додати клуб",
      searchPh: "Пошук: назва, місце, організатор",
      freeOnly: "Лише безкоштовні",
      showOld: "Показати старі й закриті",
      empty: "Нічого не знайдено. Змініть фільтри або додайте клуб.",
      allLangs: "Усі мови", anyDay: "Будь-який день", anyFormat: "Будь-який формат",
      summary: (shown, total) => `Показано ${shown} з ${total}. Список редагують відвідувачі, зміни перевіряє модератор.`,
      footer: (repo) => `Дані відкриті: <a href="https://github.com/${repo}">github.com/${repo}</a>. Бачите помилку? Натисніть «Виправити» на картці клубу.`,
      days: { mon: "Пн", tue: "Вт", wed: "Ср", thu: "Чт", fri: "Пт", sat: "Сб", sun: "Нд" },
      daysLong: { mon: "Понеділок", tue: "Вівторок", wed: "Середа", thu: "Четвер", fri: "Пʼятниця", sat: "Субота", sun: "Неділя" },
      freq: { weekly: "щотижня", biweekly: "раз на 2 тижні", monthly: "щомісяця", irregular: "нерегулярно" },
      format: { offline: "Наживо", online: "Онлайн", hybrid: "Змішаний" },
      status: { active: "Діє", stale: "Не підтверджено", paused: "Пауза", closed: "Закрито", unknown: "Невідомо" },
      reg: { required: "Потрібна реєстрація", optional: "Реєстрація бажана", none: "Без реєстрації" },
      free: "Безкоштовно", paid: "Платно", min: "хв",
      levels: "Рівень", anyLevel: "будь-який", notesOnly: "Примітки", andNotes: " і примітки",
      lastSeen: "Остання згадка", checked: "Підтверджено", since: "З", organizer: "Організатор",
      sources: "Джерела", edit: "Виправити", confirm: "Ще працює ✓", close: "Закрився",
      dlgAdd: "Новий клуб", dlgEdit: "Виправити клуб", dlgConfirm: "Клуб ще працює?", dlgClose: "Клуб закрився?",
      confirmText: "Ви бачили, що клуб зустрічався нещодавно? Модератор оновить дату перевірки.",
      closeText: "Клуб більше не збирається? Модератор позначить його як закритий. Клуб залишиться в архіві.",
      cancel: "Скасувати", send: "Надіслати на перевірку", sending: "Надсилаємо…",
      closeBtn: "Закрити", trackPr: "Стежити за перевіркою на GitHub",
      slotFormat: { offline: "наживо", online: "онлайн" },
      members: (n) => {
        const r = roughCount(n);
        if (r >= 1000) return `≈ ${(r / 1000).toLocaleString("uk-UA", { maximumFractionDigits: 1 })} тис. учасників`;
        const form = { one: "учасник", few: "учасники", many: "учасників", other: "учасника" }[new Intl.PluralRules("uk").select(r)];
        return `≈ ${r} ${form}`;
      },
      membersAsOf: (d) => (d ? `станом на ${d}` : ""),
      sharedPlace: (n) => `${n} ${new Intl.PluralRules("uk").select(n) === "few" ? "клуби" : "клубів"} за цією адресою`,
      legendShared: "число: кілька клубів за однією адресою",
      approxMetro: (m) => `Точне місце невідоме. Точка стоїть на станції метро «${m}».`,
      legendApprox: "пунктир: точка на станції метро, точне місце невідоме",
      viewList: "Список", viewMap: "Мапа", more: "Детальніше", approx: "Місце визначено автоматично за адресою, може бути неточним.",
      mapFailed: "Не вдалося завантажити мапу. Перевірте інтернет.",
      mapNote: (n, total) => `На мапі ${n} з ${total} клубів. Решта онлайн або без точної адреси: їх видно у списку.`,
      legend: { uk: "українська", en: "англійська", de: "німецька", other: "інші мови" },
      loadFailed: "Не вдалося завантажити список клубів. Оновіть сторінку.",
      ariaFilters: "Фільтри", ariaLang: "Мова клубу", ariaDay: "День тижня", ariaFormat: "Формат", ariaClose: "Закрити", ariaSwitch: "Switch to English",
      ctype: { telegram: "Telegram", instagram: "Instagram", facebook: "Facebook", website: "Сайт", meetup: "Meetup", email: "Пошта", phone: "Телефон", youtube: "YouTube", whatsapp: "WhatsApp", viber: "Viber", discord: "Discord", other: "Інше" },
      errors: {
        rate_limit: "Забагато запитів. Спробуйте за хвилину.",
        captcha: "Перевірка «я не робот» не пройшла. Спробуйте ще раз.",
        contacts: "Перевірте контакти. Посилання-запрошення до закритої групи публікуємо лише за згоди адмінів. Для закритої групи оберіть «закрита група» і напишіть, як потрапити.",
        name_required: "Вкажіть назву.",
        lang_required: "Оберіть хоча б одну мову.",
        not_found: "Цього клубу вже немає в списку. Оновіть сторінку.",
        too_large: "Забагато тексту. Скоротіть опис або примітки.",
        origin: "Надсилати можна лише зі сторінки клубів.",
        bad_request: "Сервер не прийняв дані. Оновіть сторінку і спробуйте ще раз.",
        network: "Немає зʼєднання із сервером. Перевірте інтернет і спробуйте ще раз.",
        server: "Помилка на сервері. Спробуйте пізніше.",
      },
      sent: "Дякуємо! Зміну надіслано на перевірку.", sentGh: "Відкрито GitHub з готовим запитом. Надішліть його там.",
      needName: "Вкажіть назву.", needLang: "Оберіть хоча б одну мову.", needCaptcha: "Пройдіть перевірку «я не робот».",
      inviteWarn: "Це посилання-запрошення до закритої групи. Оберіть «закрита група» і напишіть у примітці, як потрапити (напр. «напишіть @адмін»). Обирайте «запрошення», лише якщо адміни погодились його опублікувати.",
      closedGroup: "закрита група", inviteLink: "запрошення",
      f: {
        name: "Назва", description: "Опис", languages: "Мови", otherLangs: "Інші мови (коди ISO через кому, напр. ka, hy)",
        levels: "Рівні", format: "Формат", venue: "Місце (заклад)", address: "Адреса", metro: "Метро",
        slotFormat: "Формат", slotSame: "як у клубу",
        mapUrl: "Посилання на Google Maps", mapUrlHint: "У Google Maps: «Поділитися» → «Копіювати посилання». Без посилання знайдемо місце за адресою.",
        locNote: "Як знайти на місці", locNoteHint: "Поверх, кімната, вхід, вивіска. Напр. «2 поверх, зала 116, вхід з двору».",
        schedule: "Розклад", addRow: "+ рядок", day: "День", time: "Час", duration: "Тривалість, хв", frequency: "Частота",
        scheduleNote: "Розклад текстом (якщо складний)", free: "Безкоштовно", amount: "Ціна (текстом)",
        registration: "Реєстрація", contacts: "Контакти", url: "Посилання / @нік / телефон",
        access: "Доступ", contactNote: "Як потрапити (для закритих груп)",
        accessOpt: { public: "відкрите", on_request: "закрита група", invite: "запрошення (адміни дозволили)" },
        organizer: "Організатор (публічне імʼя або організація)", status: "Статус", notes: "Примітки",
        comment: "Коментар для модератора", commentHint: "Звідки ви знаєте? Буде видно публічно в запиті на зміну.",
        none: "—", remove: "Прибрати рядок", contactType: "Тип контакту",
      },
    },
    en: {
      title: "Kyiv Speaking Clubs",
      addClub: "+ Add a club",
      searchPh: "Search: name, place, organizer",
      freeOnly: "Free only",
      showOld: "Show old and closed",
      empty: "Nothing found. Change the filters or add a club.",
      allLangs: "All languages", anyDay: "Any day", anyFormat: "Any format",
      summary: (shown, total) => `Showing ${shown} of ${total}. Visitors edit this list; a moderator reviews every change.`,
      footer: (repo) => `Open data: <a href="https://github.com/${repo}">github.com/${repo}</a>. See a mistake? Press "Fix" on the club card.`,
      days: { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" },
      daysLong: { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" },
      freq: { weekly: "weekly", biweekly: "every 2 weeks", monthly: "monthly", irregular: "irregular" },
      format: { offline: "In person", online: "Online", hybrid: "Hybrid" },
      status: { active: "Active", stale: "Not confirmed", paused: "Paused", closed: "Closed", unknown: "Unknown" },
      reg: { required: "Registration required", optional: "Registration recommended", none: "No registration" },
      free: "Free", paid: "Paid", min: "min",
      levels: "Level", anyLevel: "any", notesOnly: "Notes", andNotes: " and notes",
      lastSeen: "Last seen", checked: "Confirmed", since: "Since", organizer: "Organizer",
      sources: "Sources", edit: "Fix", confirm: "Still running ✓", close: "Closed",
      dlgAdd: "New club", dlgEdit: "Fix club", dlgConfirm: "Is the club still running?", dlgClose: "Has the club closed?",
      confirmText: "Did you see this club meet recently? The moderator will update the check date.",
      closeText: "The club no longer meets? The moderator will mark it closed. It stays in the archive.",
      cancel: "Cancel", send: "Send for review", sending: "Sending…",
      closeBtn: "Close", trackPr: "Follow the review on GitHub",
      slotFormat: { offline: "in person", online: "online" },
      members: (n) => {
        const r = roughCount(n);
        return r >= 1000 ? `≈ ${(r / 1000).toLocaleString("en-GB", { maximumFractionDigits: 1 })}k members` : `≈ ${r} ${r === 1 ? "member" : "members"}`;
      },
      membersAsOf: (d) => (d ? `as of ${d}` : ""),
      sharedPlace: (n) => `${n} clubs at this address`,
      legendShared: "number: several clubs at one address",
      approxMetro: (m) => `Exact place unknown. The dot marks the "${m}" metro station.`,
      legendApprox: "dashed: dot at the metro station, exact place unknown",
      viewList: "List", viewMap: "Map", more: "Details", approx: "Place found automatically from the address; it may be off.",
      mapFailed: "Could not load the map. Check your connection.",
      mapNote: (n, total) => `${n} of ${total} clubs are on the map. The rest are online or have no exact address; see the list.`,
      legend: { uk: "Ukrainian", en: "English", de: "German", other: "other languages" },
      loadFailed: "Could not load the list of clubs. Reload the page.",
      ariaFilters: "Filters", ariaLang: "Club language", ariaDay: "Day of week", ariaFormat: "Format", ariaClose: "Close", ariaSwitch: "Перейти на українську",
      ctype: { telegram: "Telegram", instagram: "Instagram", facebook: "Facebook", website: "Website", meetup: "Meetup", email: "Email", phone: "Phone", youtube: "YouTube", whatsapp: "WhatsApp", viber: "Viber", discord: "Discord", other: "Other" },
      errors: {
        rate_limit: "Too many requests. Try again in a minute.",
        captcha: "The \"I am human\" check failed. Try again.",
        contacts: "Check the contacts. We publish an invite link to a private group only if the admins agreed. For a private group, choose \"closed group\" and write how to get in.",
        name_required: "Enter a name.",
        lang_required: "Pick at least one language.",
        not_found: "This club is no longer in the list. Reload the page.",
        too_large: "Too much text. Shorten the description or notes.",
        origin: "Suggestions can only be sent from the clubs page.",
        bad_request: "The server did not accept the data. Reload the page and try again.",
        network: "Cannot reach the server. Check your connection and try again.",
        server: "Server error. Try again later.",
      },
      sent: "Thank you! Your change is waiting for review.", sentGh: "GitHub opened with a ready request. Submit it there.",
      needName: "Enter a name.", needLang: "Pick at least one language.", needCaptcha: "Complete the \"I am human\" check.",
      inviteWarn: "This is an invite link to a private group. Choose \"closed group\" and write in the note how to get in (e.g. \"message @admin\"). Choose \"invite\" only if the admins agreed to publish the link.",
      closedGroup: "closed group", inviteLink: "invite",
      f: {
        name: "Name", description: "Description", languages: "Languages", otherLangs: "Other languages (ISO codes, comma separated, e.g. ka, hy)",
        levels: "Levels", format: "Format", venue: "Venue", address: "Address", metro: "Metro",
        slotFormat: "Format", slotSame: "same as club",
        mapUrl: "Google Maps link", mapUrlHint: "In Google Maps: Share → Copy link. Without a link, we find the place by its address.",
        locNote: "How to find it there", locNoteHint: "Floor, room, entrance, sign. E.g. \"2nd floor, room 116, entrance from the yard\".",
        schedule: "Schedule", addRow: "+ row", day: "Day", time: "Time", duration: "Length, min", frequency: "Frequency",
        scheduleNote: "Schedule as text (if complex)", free: "Free", amount: "Price (text)",
        registration: "Registration", contacts: "Contacts", url: "Link / @handle / phone",
        access: "Access", contactNote: "How to get in (for closed groups)",
        accessOpt: { public: "open", on_request: "closed group", invite: "invite (admins allowed)" },
        organizer: "Organizer (public name or organization)", status: "Status", notes: "Notes",
        comment: "Note for the moderator", commentHint: "How do you know? This is public in the change request.",
        none: "—", remove: "Remove row", contactType: "Contact type",
      },
    },
  };

  const LANGS = {
    uk: ["українська", "Ukrainian"], en: ["англійська", "English"], de: ["німецька", "German"],
    fr: ["французька", "French"], es: ["іспанська", "Spanish"], it: ["італійська", "Italian"],
    pl: ["польська", "Polish"], pt: ["португальська", "Portuguese"], cs: ["чеська", "Czech"],
    sk: ["словацька", "Slovak"], sv: ["шведська", "Swedish"], no: ["норвезька", "Norwegian"],
    da: ["данська", "Danish"], fi: ["фінська", "Finnish"], nl: ["нідерландська", "Dutch"],
    el: ["грецька", "Greek"], lt: ["литовська", "Lithuanian"], lv: ["латиська", "Latvian"],
    et: ["естонська", "Estonian"], hu: ["угорська", "Hungarian"], ro: ["румунська", "Romanian"],
    bg: ["болгарська", "Bulgarian"], sr: ["сербська", "Serbian"], hr: ["хорватська", "Croatian"],
    be: ["білоруська", "Belarusian"], ka: ["грузинська", "Georgian"], hy: ["вірменська", "Armenian"],
    ga: ["ірландська", "Irish"], la: ["латина", "Latin"], ru: ["російська", "Russian"],
    he: ["іврит", "Hebrew"], yi: ["їдиш", "Yiddish"], ja: ["японська", "Japanese"],
    zh: ["китайська", "Chinese"], ko: ["корейська", "Korean"], tr: ["турецька", "Turkish"],
    ar: ["арабська", "Arabic"], fa: ["перська", "Persian"], hi: ["гінді", "Hindi"],
    vi: ["вʼєтнамська", "Vietnamese"], az: ["азербайджанська", "Azerbaijani"], kk: ["казахська", "Kazakh"],
    id: ["індонезійська", "Indonesian"], th: ["тайська", "Thai"], eo: ["есперанто", "Esperanto"],
    crh: ["кримськотатарська", "Crimean Tatar"], ukl: ["українська жестова", "Ukrainian Sign Language"],
  };
  const FORM_LANGS = ["uk", "en", "de", "fr", "es", "it", "pl", "pt", "cs", "he", "ja", "zh", "ko", "tr", "ar", "eo", "crh", "ukl", "ru"];
  const LEVELS = ["any", "A1", "A2", "B1", "B2", "C1", "C2"];
  const CONTACT_TYPES = ["telegram", "instagram", "facebook", "website", "meetup", "email", "phone", "youtube", "whatsapp", "viber", "discord", "other"];
  // Copy of INVITE_RE in lib/rules.mjs: links that let anyone join a private group.
  const INVITE_RE = /(?:t\.me|telegram\.me|telegram\.dog)\/(?:\+|joinchat\/)|chat\.whatsapp\.com\/|invite\.viber\.com|discord\.gg\/|discord\.com\/invite\//i;

  // ---------- state ----------
  let ui = "uk"; // Ukrainian for everyone; English only if the visitor switched to it
  try { ui = localStorage.getItem("sc-ui") || ui; } catch { /* storage blocked */ }
  let clubs = [];
  const $ = (s, el = document) => el.querySelector(s);
  const t = () => T[ui];

  // ---------- helpers ----------
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const langName = (code) => (LANGS[code] ? LANGS[code][ui === "uk" ? 0 : 1] : code);
  const toDate = (s) => {
    if (!s) return null;
    // A bare year or month counts from its first day: "2026" proves activity only on 1 Jan 2026.
    const [y, m = "1", d = "1"] = s.split("-");
    return new Date(Date.UTC(+y, +m - 1, +d));
  };
  const fmtDate = (s) => {
    if (!s) return "";
    const parts = s.split("-");
    const loc = ui === "uk" ? "uk-UA" : "en-GB";
    if (parts.length === 1) return s;
    const d = new Date(Date.UTC(+parts[0], +parts[1] - 1, +(parts[2] || 1)));
    const opts = parts.length === 2 ? { year: "numeric", month: "long" } : { year: "numeric", month: "short", day: "numeric" };
    return d.toLocaleDateString(loc, { ...opts, timeZone: "UTC" });
  };
  const freshest = (c) => [c.last_checked, c.last_seen].map(toDate).filter(Boolean).sort((a, b) => b - a)[0] || null;
  const ageDays = (c) => { const d = freshest(c); return d ? (Date.now() - d) / 864e5 : Infinity; };
  const shownStatus = (c) => {
    if (c.status === "closed" || c.status === "paused") return c.status;
    const age = ageDays(c);
    if (c.status === "active" && age <= STALE_DAYS) return "active";
    if (age <= STALE_DAYS) return "active";
    return c.status === "active" ? "stale" : "unknown";
  };
  const isOld = (c) => c.status === "closed" || ageDays(c) > OLD_DAYS;

  const contactHref = (ct) => {
    const u = ct.url.trim();
    if (ct.type === "email") return "mailto:" + u.replace(/^mailto:/, "");
    if (ct.type === "phone") return "tel:" + u.replace(/[^+\d]/g, "");
    if (ct.type === "telegram" && /^@?[\w]{4,}$/.test(u)) return "https://t.me/" + u.replace(/^@/, "");
    if (ct.type === "instagram" && /^@?[\w.]{2,}$/.test(u)) return "https://instagram.com/" + u.replace(/^@/, "");
    if (/^https?:\/\//i.test(u)) return u;
    if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(u)) return "https://" + u;
    return null;
  };
  // Copy of coordsFromMapUrl in lib/geo.mjs; keep the two in sync.
  function coordsFromMapUrl(url) {
    if (!url) return null;
    const pats = [
      /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/,
      /[?&](?:q|query|ll|destination|center)=(-?\d{1,2}\.\d+)(?:,|%2C)\s*(-?\d{1,3}\.\d+)/i,
      /@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/,
      /[?&]mlat=(-?\d{1,2}\.\d+)&mlon=(-?\d{1,3}\.\d+)/,
      /#map=\d+\/(-?\d{1,2}\.\d+)\/(-?\d{1,3}\.\d+)/,
    ];
    for (const p of pats) { const m = url.match(p); if (m) return { lat: +m[1], lon: +m[2] }; }
    return null;
  }
  // Link to the place: the stored map link, else a Google Maps pin from coordinates, else a search by address.
  function mapHref(loc) {
    if (!loc) return null;
    if (loc.map_url) return loc.map_url;
    const base = "https://www.google.com/maps/search/?api=1&query=";
    if (loc.lat !== undefined) return base + `${loc.lat},${loc.lon}`;
    if (loc.address) return base + encodeURIComponent([loc.venue, loc.address, "Київ"].filter(Boolean).join(", "));
    return null;
  }

  // Escapes text and turns web addresses and Telegram @nicknames into links.
  // "@" right after a letter is an email address, not a nickname, so it stays text.
  function linkify(text) {
    const re = /(https?:\/\/[^\s<>"'«»]*[^\s<>"'«».,;:!?)\]])|(?<![\p{L}\p{N}_@.])@([A-Za-z][A-Za-z0-9_]{3,31})(?![A-Za-z0-9_@])/gu;
    let out = "", last = 0;
    for (const m of String(text).matchAll(re)) {
      out += esc(text.slice(last, m.index));
      const href = m[1] || `https://t.me/${m[2]}`;
      out += `<a href="${esc(href)}" target="_blank" rel="noopener nofollow">${esc(m[0].replace(/^https?:\/\/(www\.)?/, ""))}</a>`;
      last = m.index + m[0].length;
    }
    return out + esc(text.slice(last));
  }

  const contactLabel = (ct) => {
    const u = ct.url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
    return u.length > 40 ? u.slice(0, 38) + "…" : u;
  };

  // ---------- rendering ----------
  function fillFilters() {
    const langCounts = {};
    clubs.forEach((c) => c.languages.forEach((l) => { langCounts[l] = (langCounts[l] || 0) + 1; }));
    const langSel = $("#f-lang"), daySel = $("#f-day"), fmtSel = $("#f-format");
    const keep = [langSel.value, daySel.value, fmtSel.value];
    langSel.innerHTML = `<option value="">${esc(t().allLangs)}</option>` +
      Object.keys(langCounts).sort((a, b) => langCounts[b] - langCounts[a] || langName(a).localeCompare(langName(b)))
        .map((l) => `<option value="${esc(l)}">${esc(langName(l))} (${langCounts[l]})</option>`).join("");
    daySel.innerHTML = `<option value="">${esc(t().anyDay)}</option>` + DAYS.map((d) => `<option value="${d}">${esc(t().daysLong[d])}</option>`).join("");
    fmtSel.innerHTML = `<option value="">${esc(t().anyFormat)}</option>` + ["offline", "online", "hybrid"].map((f) => `<option value="${f}">${esc(t().format[f])}</option>`).join("");
    [langSel.value, daySel.value, fmtSel.value] = keep;
  }

  function applyTexts() {
    document.documentElement.lang = ui;
    document.title = t().title;
    document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t()[el.dataset.i18n]; });
    document.querySelectorAll("[data-i18n-ph]").forEach((el) => { el.placeholder = t()[el.dataset.i18nPh]; });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t()[el.dataset.i18nAria]); });
    $(".foot p").innerHTML = t().footer(esc(CFG.repo || ""));
    $("#ui-lang").textContent = ui === "uk" ? "EN" : "UA";
  }

  function render() {
    const q = $("#q").value.trim().toLowerCase();
    const lang = $("#f-lang").value, day = $("#f-day").value, fmt = $("#f-format").value;
    const freeOnly = $("#f-free").checked, showOld = $("#f-old").checked;

    const list = clubs.filter((c) => {
      if (!showOld && isOld(c)) return false;
      if (lang && !c.languages.includes(lang)) return false;
      if (day && !(c.schedule || []).some((s) => s.day === day)) return false;
      if (fmt && c.format !== fmt && !(c.format === "hybrid" && fmt !== "hybrid")) return false;
      if (freeOnly && !(c.price && c.price.free)) return false;
      if (q) {
        const hay = [c.name, c.description, c.organizer, c.notes, c.schedule_note, c.location && Object.values(c.location).join(" "), c.languages.map(langName).join(" ")].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => {
      const order = { active: 0, stale: 1, unknown: 2, paused: 3, closed: 4 };
      return order[shownStatus(a)] - order[shownStatus(b)] || (freshest(b) || 0) - (freshest(a) || 0) || a.name.localeCompare(b.name);
    });

    shown = list;
    $("#list").innerHTML = list.map(card).join("");
    $("#empty").hidden = list.length > 0 || view === "map";
    $("#summary").textContent = t().summary(list.length, clubs.length);
    if (view === "map") drawMap(true);
  }

  function card(c) {
    const st = shownStatus(c);
    const L = t();
    const sched = (c.schedule || []).map((s) =>
      `${L.days[s.day]}${s.time ? " " + s.time : ""}${s.format ? " " + L.slotFormat[s.format] : ""}${s.duration_min ? ` (${s.duration_min} ${L.min})` : ""}${s.frequency && s.frequency !== "weekly" ? ", " + L.freq[s.frequency] : ""}`).join("; ");
    const loc = c.location || {};
    const place = [loc.venue, loc.address, loc.metro && "м. " + loc.metro]
      .filter(Boolean)
      .filter((part, i, all) => !all.slice(0, i).some((prev) => prev.includes(part))) // address already inside venue text
      .join(", ");
    const price = c.price ? (c.price.free ? L.free : (c.price.amount || L.paid)) : "";
    const dates = [
      c.last_checked && `${L.checked}: ${fmtDate(c.last_checked)}`,
      c.last_seen && `${L.lastSeen}: ${fmtDate(c.last_seen)}`,
      c.first_seen && `${L.since} ${fmtDate(c.first_seen)}`,
    ].filter(Boolean).join(" · ");
    const typeName = (ct) => L.ctype[ct.type] || ct.type;
    const contacts = (c.contacts || []).map((ct) => {
      const size = ct.members !== undefined ? `<span class="members" title="${esc(L.membersAsOf(ct.members_checked))}">${esc(L.members(ct.members))}</span>` : "";
      if (ct.access === "on_request" || !ct.url) {
        return `<span>🔒 ${esc(typeName(ct))} (${esc(L.closedGroup)})${size ? " " + size : ""}${ct.note ? ": " + esc(ct.note) : ""}</span>`;
      }
      const href = contactHref(ct);
      const label = ct.type === "website" || ct.type === "other" ? contactLabel(ct) : typeName(ct) + (ct.access === "invite" ? ` (${L.inviteLink})` : "");
      const link = href ? `<a href="${esc(href)}" target="_blank" rel="noopener nofollow">${esc(label)}</a>` : `<span>${esc(ct.url)}</span>`;
      return `<span>${link}${size ? " " + size : ""}${ct.note ? " — " + esc(ct.note) : ""}</span>`;
    }).join("");
    const sources = (c.sources || []).filter((s) => /^https?:\/\//.test(s));

    return `<li class="card${isOld(c) ? " old" : ""}" data-id="${esc(c.id)}">
      <div class="row"><span class="badge ${st}">${esc(L.status[st])}</span>${c.languages.map((l) => `<span class="chip">${esc(langName(l))}</span>`).join("")}${c.format ? `<span class="chip">${esc(L.format[c.format])}</span>` : ""}</div>
      <h3>${esc(c.name)}</h3>
      ${c.description ? `<p class="desc">${esc(c.description)}</p>` : ""}
      ${sched || c.schedule_note ? `<p class="meta"><span class="ico">🗓</span><b>${esc(sched)}</b>${sched && c.schedule_note ? " — " : ""}${esc(c.schedule_note || "")}</p>` : ""}
      ${place || loc.note ? `<p class="meta"><span class="ico">📍</span>${esc(place)}${mapHref(loc) ? ` · <a href="${esc(mapHref(loc))}" target="_blank" rel="noopener nofollow">Google Maps</a>` : ""}${loc.note ? `${place ? "<br>" : ""}<span class="ico">🧭</span>${esc(loc.note)}` : ""}</p>` : ""}
      ${price || c.registration || c.levels?.length ? `<p class="meta">${[price && `<span class="ico">💳</span>${esc(price)}`, c.registration && esc(L.reg[c.registration]), c.levels?.length && esc(L.levels + ": " + c.levels.map((l) => (l === "any" ? L.anyLevel : l)).join(", "))].filter(Boolean).join(" · ")}</p>` : ""}
      ${c.organizer ? `<p class="meta">${esc(L.organizer)}: ${linkify(c.organizer)}</p>` : ""}
      ${contacts ? `<div class="contacts">${contacts}</div>` : ""}
      ${dates ? `<p class="meta">${esc(dates)}</p>` : ""}
      ${sources.length || c.notes ? `<details class="src"><summary>${esc(sources.length ? `${L.sources} (${sources.length})` : L.notesOnly)}${sources.length && c.notes ? esc(L.andNotes) : ""}</summary>${c.notes ? `<p>${esc(c.notes)}</p>` : ""}${sources.length ? `<ul>${sources.map((s) => `<li><a href="${esc(s)}" target="_blank" rel="noopener nofollow">${esc(s.length > 70 ? s.slice(0, 68) + "…" : s)}</a></li>`).join("")}</ul>` : ""}</details>` : ""}
      <div class="card-actions">
        <button type="button" class="small" data-act="edit">${esc(L.edit)}</button>
        ${c.status !== "closed" ? `<button type="button" class="small" data-act="confirm">${esc(L.confirm)}</button><button type="button" class="small" data-act="close">${esc(L.close)}</button>` : ""}
      </div>
    </li>`;
  }

  // ---------- form ----------
  let mode = "add", current = null, turnstileId = null;

  const opt = (v, label, sel) => `<option value="${esc(v)}"${sel ? " selected" : ""}>${esc(label)}</option>`;
  const field = (name, label, inner, hint) => `<label class="field"><span>${esc(label)}</span>${inner}${hint ? `<small>${esc(hint)}</small>` : ""}</label>`;

  // Each input in a repeated row has a small visible label above it; placeholders got cut off on phones.
  const mini = (label, inner, wide) => `<label class="mini${wide ? " wide" : ""}"><span>${esc(label)}</span>${inner}</label>`;
  function scheduleRow(s = {}) {
    const F = t().f;
    return `<div class="rep-row" data-rep="schedule">
      ${mini(F.day, `<select name="s_day">${DAYS.map((d) => opt(d, t().daysLong[d], s.day === d)).join("")}</select>`)}
      ${mini(F.time, `<input name="s_time" type="time" value="${esc(s.time || "")}">`)}
      ${mini(F.duration, `<input name="s_dur" type="number" min="10" max="600" step="5" inputmode="numeric" value="${esc(s.duration_min || "")}">`)}
      ${mini(F.frequency, `<select name="s_freq">${["weekly", "biweekly", "monthly", "irregular"].map((f) => opt(f, t().freq[f], (s.frequency || "weekly") === f)).join("")}</select>`)}
      ${mini(F.slotFormat, `<select name="s_format">${opt("", F.slotSame, !s.format)}${["offline", "online"].map((f) => opt(f, t().format[f], s.format === f)).join("")}</select>`)}
      <button type="button" class="ghost small del" data-del aria-label="${esc(F.remove)}">✕</button>
    </div>`;
  }
  function contactRow(ct = {}) {
    const F = t().f;
    return `<div class="rep-row" data-rep="contacts">
      ${mini(F.contactType, `<select name="c_type">${CONTACT_TYPES.map((x) => opt(x, t().ctype[x], (ct.type || "telegram") === x)).join("")}</select>`)}
      ${mini(F.access, `<select name="c_access">${["public", "on_request", "invite"].map((x) => opt(x, F.accessOpt[x], (ct.access || "public") === x)).join("")}</select>`)}
      <button type="button" class="ghost small del" data-del aria-label="${esc(F.remove)}">✕</button>
      ${mini(F.url, `<input name="c_url" value="${esc(ct.url || "")}">`, true)}
      ${mini(F.contactNote, `<input name="c_note" value="${esc(ct.note || "")}">`, true)}
    </div>`;
  }

  function buildForm(c) {
    const F = t().f, L = t();
    const loc = c.location || {};
    const known = new Set(FORM_LANGS);
    const other = (c.languages || []).filter((l) => !known.has(l)).join(", ");
    return [
      field("name", F.name + " *", `<input name="name" required maxlength="150" value="${esc(c.name || "")}">`),
      `<fieldset><legend>${esc(F.languages)} *</legend><div class="checks">${FORM_LANGS.map((l) => `<label class="check"><input type="checkbox" name="lang" value="${l}"${(c.languages || []).includes(l) ? " checked" : ""}> ${esc(langName(l))}</label>`).join("")}</div>
        ${field("otherLangs", F.otherLangs, `<input name="otherLangs" value="${esc(other)}">`)}</fieldset>`,
      field("description", F.description, `<textarea name="description" maxlength="2000">${esc(c.description || "")}</textarea>`),
      `<div class="grid2">
        ${field("format", F.format, `<select name="format">${opt("", F.none, !c.format)}${["offline", "online", "hybrid"].map((x) => opt(x, L.format[x], c.format === x)).join("")}</select>`)}
        ${field("status", F.status, `<select name="status">${["active", "paused", "closed", "unknown"].map((x) => opt(x, L.status[x], (c.status || "active") === x)).join("")}</select>`)}
      </div>`,
      `<fieldset><legend>${esc(F.levels)}</legend><div class="checks">${LEVELS.map((l) => `<label class="check"><input type="checkbox" name="level" value="${l}"${(c.levels || []).includes(l) ? " checked" : ""}> ${l === "any" ? (ui === "uk" ? "будь-який" : "any") : l}</label>`).join("")}</div></fieldset>`,
      `<fieldset><legend>${esc(F.schedule)}</legend><div class="rep" id="rep-schedule">${(c.schedule || []).map(scheduleRow).join("")}</div>
        <button type="button" class="ghost small" data-add="schedule">${esc(F.addRow)}</button>
        ${field("schedule_note", F.scheduleNote, `<input name="schedule_note" maxlength="500" value="${esc(c.schedule_note || "")}">`)}</fieldset>`,
      `<div class="grid2">
        ${field("venue", F.venue, `<input name="venue" maxlength="200" value="${esc(loc.venue || "")}">`)}
        ${field("address", F.address, `<input name="address" maxlength="300" value="${esc(loc.address || "")}">`)}
        ${field("metro", F.metro, `<input name="metro" maxlength="100" value="${esc(loc.metro || "")}">`)}
      </div>`,
      field("locNote", F.locNote, `<input name="locNote" maxlength="300" value="${esc(loc.note || "")}">`, F.locNoteHint),
      field("mapUrl", F.mapUrl, `<input name="mapUrl" type="url" inputmode="url" maxlength="500" value="${esc(loc.map_url || "")}">`, F.mapUrlHint),
      `<div class="grid2">
        <label class="check"><input type="checkbox" name="free"${c.price?.free ? " checked" : ""}> ${esc(F.free)}</label>
        ${field("amount", F.amount, c.price?.free
          ? `<input name="amount" maxlength="100" value="" disabled>`
          : `<input name="amount" maxlength="100" value="${esc(c.price?.amount || "")}">`)}
        ${field("registration", F.registration, `<select name="registration">${opt("", F.none, !c.registration)}${["required", "optional", "none"].map((x) => opt(x, L.reg[x], c.registration === x)).join("")}</select>`)}
      </div>`,
      `<fieldset><legend>${esc(F.contacts)}</legend><div class="rep" id="rep-contacts">${(c.contacts?.length ? c.contacts : [{}]).map(contactRow).join("")}</div>
        <button type="button" class="ghost small" data-add="contacts">${esc(F.addRow)}</button></fieldset>`,
      field("organizer", F.organizer, `<input name="organizer" maxlength="200" value="${esc(c.organizer || "")}">`),
      field("notes", F.notes, `<textarea name="notes" maxlength="2000">${esc(c.notes || "")}</textarea>`),
      field("comment", F.comment, `<textarea name="comment" maxlength="1000"></textarea>`, F.commentHint),
    ].join("");
  }

  function readForm(form) {
    const v = (n) => (form.elements[n]?.value || "").trim();
    const c = { ...(current || {}) };
    c.name = v("name");
    const otherLangs = v("otherLangs").toLowerCase().split(/[\s,;]+/).filter((x) => /^[a-z]{2,3}$/.test(x));
    c.languages = [...new Set([...[...form.querySelectorAll("input[name=lang]:checked")].map((x) => x.value), ...otherLangs])];
    c.levels = [...form.querySelectorAll("input[name=level]:checked")].map((x) => x.value);
    c.description = v("description");
    c.format = v("format");
    c.status = v("status") || "active";
    c.schedule = [...form.querySelectorAll("[data-rep=schedule]")].map((r) => {
      const s = { day: r.querySelector("[name=s_day]").value };
      const time = r.querySelector("[name=s_time]").value; if (time) s.time = time;
      const dur = parseInt(r.querySelector("[name=s_dur]").value, 10); if (dur >= 10 && dur <= 600) s.duration_min = dur;
      s.frequency = r.querySelector("[name=s_freq]").value;
      const sf = r.querySelector("[name=s_format]").value; if (sf) s.format = sf;
      return s;
    });
    c.schedule_note = v("schedule_note");
    // Visitors never type coordinates. They come from a full map link; otherwise the saved point is kept
    // while venue, address and link are unchanged; otherwise the worker finds the place from the link or address.
    const prev = current?.location || {};
    const samePlace = prev.lat !== undefined && v("venue") === (prev.venue || "") && v("address") === (prev.address || "") && v("metro") === (prev.metro || "") && v("mapUrl") === (prev.map_url || "");
    const ll = coordsFromMapUrl(v("mapUrl")) || (samePlace ? { lat: prev.lat, lon: prev.lon } : null);
    c.location = { venue: v("venue"), address: v("address"), metro: v("metro"), note: v("locNote"),
      map_url: /^https:\/\//.test(v("mapUrl")) ? v("mapUrl") : "", ...(ll ? { lat: ll.lat, lon: ll.lon } : {}) };
    const free = form.elements.free.checked;
    c.price = { free, amount: free ? "" : v("amount") }; // a free club never sends a leftover price
    c.registration = v("registration");
    c.contacts = [...form.querySelectorAll("[data-rep=contacts]")].map((r) => {
      const ct = { type: r.querySelector("[name=c_type]").value, url: r.querySelector("[name=c_url]").value.trim(), access: r.querySelector("[name=c_access]").value, note: r.querySelector("[name=c_note]").value.trim() };
      if (ct.access === "public") delete ct.access;
      if (ct.access === "on_request") delete ct.url; // never publish a link for a closed group
      return ct;
    }).filter((x) => x.url || x.note);
    c.organizer = v("organizer");
    c.notes = v("notes");
    return { club: prune(c), comment: v("comment") };
  }

  // Drop empty strings, empty arrays and empty objects, so the YAML stays short.
  function prune(o) {
    if (Array.isArray(o)) return o.map(prune).filter((x) => x !== undefined);
    if (o && typeof o === "object") {
      const out = {};
      for (const [k, val] of Object.entries(o)) {
        const p = prune(val);
        if (p === undefined || p === "" || (Array.isArray(p) && !p.length) || (p && typeof p === "object" && !Array.isArray(p) && !Object.keys(p).length)) continue;
        out[k] = p;
      }
      return out;
    }
    return o;
  }

  function openDialog(m, club) {
    mode = m; current = club ? JSON.parse(JSON.stringify(club)) : null;
    const L = t();
    $("#dlg-title").textContent = { add: L.dlgAdd, edit: L.dlgEdit, confirm: L.dlgConfirm, close: L.dlgClose }[m] + (club && m !== "add" ? `: ${club.name}` : "");
    $("#form-body").innerHTML = m === "add" || m === "edit"
      ? buildForm(club || {})
      : `<p>${esc(m === "confirm" ? L.confirmText : L.closeText)}</p>${field("comment", L.f.comment, `<textarea name="comment" maxlength="1000"></textarea>`, L.f.commentHint)}`;
    $("#form-msg").textContent = ""; $("#form-msg").className = "msg";
    $("#submit-btn").disabled = false; $("#submit-btn").textContent = L.send; $("#submit-btn").hidden = false;
    $("#cancel-btn").textContent = L.cancel;
    $("#turnstile").hidden = false;
    $("#dlg").showModal();
    setupTurnstile();
  }

  function setupTurnstile() {
    if (!CFG.workerUrl || !CFG.turnstileSiteKey) return;
    const render = () => {
      if (turnstileId !== null) { window.turnstile.reset(turnstileId); return; }
      turnstileId = window.turnstile.render("#turnstile", { sitekey: CFG.turnstileSiteKey, language: ui });
    };
    if (window.turnstile) return render();
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.onload = render;
    document.head.appendChild(s);
  }

  async function submit(e) {
    e.preventDefault();
    const form = e.target, L = t(), msg = $("#form-msg");
    let payload;
    if (mode === "add" || mode === "edit") {
      const { club, comment } = readForm(form);
      if (!club.name) return showMsg(L.needName, true);
      if (!club.languages?.length) return showMsg(L.needLang, true);
      if ((club.contacts || []).some((ct) => ct.url && INVITE_RE.test(ct.url) && ct.access !== "invite")) return showMsg(L.inviteWarn, true);
      payload = { action: mode, id: current?.id, club, comment };
    } else {
      payload = { action: mode, id: current.id, comment: (form.elements.comment?.value || "").trim() };
    }

    if (!CFG.workerUrl) return openGithubIssue(payload);

    const token = window.turnstile && turnstileId !== null ? window.turnstile.getResponse(turnstileId) : "";
    if (CFG.turnstileSiteKey && !token) return showMsg(L.needCaptcha, true);
    $("#submit-btn").disabled = true; $("#submit-btn").textContent = L.sending;
    try {
      const res = await fetch(CFG.workerUrl.replace(/\/$/, "") + "/suggest", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...payload, turnstileToken: token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw Object.assign(new Error(data.error || String(res.status)), { code: data.code || (res.status === 429 ? "rate_limit" : "server") });
      showDone(L.sent, data.pr);
    } catch (err) {
      // fetch() throws TypeError with no code when the network is down
      showMsg(L.errors[err.code || "network"] || L.errors.server, true);
      $("#submit-btn").disabled = false; $("#submit-btn").textContent = L.send;
      if (window.turnstile && turnstileId !== null) window.turnstile.reset(turnstileId);
    }
  }

  function showMsg(text, isErr, link) {
    const m = $("#form-msg");
    m.className = "msg " + (isErr ? "err" : "ok");
    m.innerHTML = esc(text) + (link ? ` <a href="${esc(link)}" target="_blank" rel="noopener">${esc(link)}</a>` : "");
  }

  // No worker configured: open a pre-filled GitHub issue with the change as YAML.
  function openGithubIssue(p) {
    const title = { add: "Новий клуб", edit: "Виправлення", confirm: "Ще працює", close: "Закрився" }[p.action] + ": " + (p.club?.name || current?.name || "");
    const yamlText = p.club ? (window.jsyaml ? window.jsyaml.dump(p.club, { lineWidth: 120 }) : JSON.stringify(p.club, null, 2)) : `id: ${p.id}`;
    const body = `action: ${p.action}\n${p.id ? "id: " + p.id + "\n" : ""}\n${p.comment ? p.comment + "\n\n" : ""}\`\`\`yaml\n${yamlText}\`\`\`\n`;
    const url = `https://github.com/${CFG.repo}/issues/new?labels=suggestion&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
    window.open(url, "_blank", "noopener");
    showDone(t().sentGh, null);
  }

  // After sending: replace the form with a thank-you note and leave one "Close" button.
  function showDone(text, prUrl) {
    const L = t();
    $("#form-body").innerHTML = `<p class="done">✓ ${esc(text)}</p>` +
      (prUrl ? `<p><a href="${esc(prUrl)}" target="_blank" rel="noopener">${esc(L.trackPr)}</a></p>` : "");
    $("#form-msg").textContent = "";
    $("#turnstile").hidden = true;
    $("#submit-btn").hidden = true;
    $("#cancel-btn").textContent = L.closeBtn;
    $("#cancel-btn").focus();
  }

  // ---------- map ----------
  // Fixed order: a language keeps its colour whatever the filters show. Only three colours plus grey,
  // because more hues cannot be told apart on a map (checked with the dataviz palette validator).
  const MAP_LANGS = ["uk", "en", "de"];
  let view = location.hash === "#map" ? "map" : "list";
  let shown = [];
  let map = null, markers = null, leafletPromise = null;

  function loadLeaflet() {
    if (window.L) return Promise.resolve();
    leafletPromise ||= new Promise((resolve, reject) => {
      const css = document.createElement("link");
      css.rel = "stylesheet"; css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css";
      document.head.appendChild(css);
      const js = document.createElement("script");
      js.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js";
      js.onload = resolve; js.onerror = reject;
      document.head.appendChild(js);
    });
    return leafletPromise;
  }

  const pinKey = (c) => (MAP_LANGS.includes(c.languages[0]) ? c.languages[0] : "other");
  // Pin labels: language codes, except Ukrainian, which people know as UA.
  const pinCode = (code) => (code === "uk" ? "UA" : code.toUpperCase());

  function popupGroupHtml(group) {
    return `<div class="pop-group"><b>${esc(t().sharedPlace(group.length))}</b>${group.map((c) => popupHtml(c, true)).join("")}</div>`;
  }

  function popupHtml(c, inGroup) {
    const L = t(), loc = c.location, st = shownStatus(c);
    // Only slots that happen at this place: online slots of a hybrid club are not at the dot.
    const sched = (c.schedule || []).filter((s) => s.format !== "online").map((s) => `${L.days[s.day]}${s.time ? " " + s.time : ""}`).join(", ");
    const href = mapHref(loc);
    return `<div class="pop${inGroup ? " pop-item" : ""}">
      <b>${esc(c.name)}</b>
      <div class="pop-meta"><span class="badge ${st}">${esc(L.status[st])}</span> ${esc(c.languages.map(langName).join(", "))}</div>
      ${sched ? `<div>🗓 ${esc(sched)}</div>` : ""}
      <div>📍 ${esc([loc.venue, loc.address].filter(Boolean).join(", "))}</div>
      ${loc.note ? `<div>🧭 ${esc(loc.note)}</div>` : ""}
      ${loc.near_metro ? `<div class="pop-approx">${esc(L.approxMetro(loc.metro))}</div>` : loc.geocoded ? `<div class="pop-approx">${esc(L.approx)}</div>` : ""}
      <div class="pop-links">${href ? `<a href="${esc(href)}" target="_blank" rel="noopener nofollow">Google Maps</a>` : ""}
        <button type="button" class="small" data-goto="${esc(c.id)}">${esc(L.more)}</button></div>
    </div>`;
  }

  async function drawMap(fit) {
    try { await loadLeaflet(); } catch { $("#map-note").textContent = t().mapFailed; return; }
    const L = window.L, T_ = t();
    if (!map) {
      map = L.map("map", { scrollWheelZoom: true }).setView([50.45, 30.52], 11);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      markers = L.layerGroup().addTo(map);
    }
    snapMap();
    map.invalidateSize();
    markers.clearLayers();

    const placed = shown.filter((c) => c.location?.lat !== undefined && c.format !== "online");
    // Clubs within ~10 m of each other share one marker that shows how many clubs are there.
    const byPoint = {};
    placed.forEach((c) => { (byPoint[`${c.location.lat.toFixed(4)},${c.location.lon.toFixed(4)}`] ||= []).push(c); });
    const counts = { uk: 0, en: 0, de: 0, other: 0 };
    for (const group of Object.values(byPoint)) {
      group.forEach((c) => counts[pinKey(c)]++);
      const first = group[0];
      let html, popup;
      if (group.length === 1) {
        const code = pinCode(first.languages[0]) + (first.languages.length > 1 ? "+" : "");
        html = `<span class="pin pin-${pinKey(first)}${isOld(first) ? " old" : ""}${first.location.near_metro ? " approx" : ""}" title="${esc(first.languages.map(langName).join(", "))}">${esc(code)}</span>`;
        popup = () => popupHtml(first);
      } else {
        // Ring split into equal parts, one per club, in that club's language colour.
        const step = 100 / group.length;
        const ring = group.map((c, i) => `var(--lang-${pinKey(c)}) ${i * step}% ${(i + 1) * step}%`).join(", ");
        html = `<span class="pin pin-multi${group.every(isOld) ? " old" : ""}" style="--ring: conic-gradient(${ring})" title="${esc(group.map((c) => c.name).join(" · "))}">${group.length}</span>`;
        popup = () => popupGroupHtml(group);
      }
      const icon = L.divIcon({ className: "pin-wrap", html, iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -14] });
      L.marker([first.location.lat, first.location.lon], { icon, title: group.map((c) => c.name).join(" · "), alt: group.map((c) => c.name).join(" · ") })
        .bindPopup(popup, { maxWidth: 300, maxHeight: 360 })
        .addTo(markers);
    }
    if (fit && placed.length) map.fitBounds(L.latLngBounds(placed.map((c) => [c.location.lat, c.location.lon])), { padding: [30, 30], maxZoom: 15 });

    $("#map-legend").innerHTML = ["uk", "en", "de", "other"].map((k) =>
      `<span class="leg"><span class="pin pin-${k} pin-sm"></span>${esc(T_.legend[k])} (${counts[k]})</span>`).join("") +
      (placed.some((c) => c.location.near_metro) ? `<span class="leg"><span class="pin pin-other pin-sm approx"></span>${esc(T_.legendApprox)}</span>` : "") +
      (Object.values(byPoint).some((g) => g.length > 1) ? `<span class="leg"><span class="pin pin-multi pin-sm" style="--ring: conic-gradient(var(--lang-uk) 0 50%, var(--lang-en) 50% 100%)"></span>${esc(T_.legendShared)}</span>` : "");
    $("#map-note").textContent = T_.mapNote(placed.length, shown.length);
  }

  // The centred page can put the map box at a fractional pixel (e.g. x = 58.5). Tiles then sit
  // between pixels and the browser draws hairline seams between them. Shift the box onto whole pixels.
  function snapMap() {
    const el = $("#map");
    el.style.transform = "";
    const r = el.getBoundingClientRect();
    const dx = Math.round(r.left) - r.left, dy = Math.round(r.top) - r.top;
    if (dx || dy) el.style.transform = `translate(${dx}px, ${dy}px)`;
  }
  window.addEventListener("resize", () => { if (view === "map" && map) snapMap(); });

  function setView(v) {
    view = v;
    $("#v-list").setAttribute("aria-selected", v === "list");
    $("#v-map").setAttribute("aria-selected", v === "map");
    $("#list").hidden = v !== "list";
    $("#map-view").hidden = v !== "map";
    $("#empty").hidden = v === "map" || shown.length > 0;
    history.replaceState(null, "", v === "map" ? "#map" : location.pathname + location.search);
    if (v === "map") drawMap(true);
  }

  function gotoCard(id) {
    setView("list");
    const el = document.querySelector(`.card[data-id="${CSS.escape(id)}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
  }

  // ---------- events ----------
  function bind() {
    ["#q", "#f-lang", "#f-day", "#f-format", "#f-free", "#f-old"].forEach((s) => $(s).addEventListener("input", render));
    $("#add-club").addEventListener("click", () => openDialog("add", null));
    $("#ui-lang").addEventListener("click", () => {
      ui = ui === "uk" ? "en" : "uk";
      try { localStorage.setItem("sc-ui", ui); } catch { /* ignore */ }
      applyTexts(); fillFilters(); render();
    });
    $("#list").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-act]");
      if (!btn) return;
      const club = clubs.find((c) => c.id === btn.closest(".card").dataset.id);
      openDialog(btn.dataset.act, club);
    });
    const dlg = $("#dlg");
    // "Безкоштовно" clears the price and locks the field; unticking unlocks it, still empty.
    dlg.addEventListener("change", (e) => {
      if (e.target.name !== "free") return;
      const amount = e.target.form.elements.amount;
      amount.value = "";
      amount.disabled = e.target.checked;
    });
    dlg.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]")) dlg.close();
      const add = e.target.closest("[data-add]");
      if (add) $("#rep-" + add.dataset.add).insertAdjacentHTML("beforeend", add.dataset.add === "schedule" ? scheduleRow() : contactRow());
      const del = e.target.closest("[data-del]");
      if (del) del.closest(".rep-row").remove();
    });
    $("#club-form").addEventListener("submit", submit);
    $("#v-list").addEventListener("click", () => setView("list"));
    $("#v-map").addEventListener("click", () => setView("map"));
    $("#map").addEventListener("click", (e) => {
      const b = e.target.closest("[data-goto]");
      if (b) gotoCard(b.dataset.goto);
    });
  }

  async function init() {
    applyTexts();
    bind();
    try {
      const res = await fetch("clubs.json", { cache: "no-cache" });
      clubs = (await res.json()).clubs;
    } catch (e) {
      $("#summary").textContent = t().loadFailed;
      return;
    }
    fillFilters();
    render();
    setView(view);
  }
  init();
})();

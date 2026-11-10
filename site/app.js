"use strict";
(() => {
  const CFG = window.SC_CONFIG || {};
  const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const STALE_DAYS = 183; // after this many days without evidence, a club counts as "not confirmed"
  const OLD_DAYS = 365;   // after this many days, a club is hidden unless "show old" is on

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
        levels: "Рівні", format: "Формат", venue: "Місце (заклад)", address: "Адреса", district: "Район", metro: "Метро",
        locNote: "Як знайти на місці", locNoteHint: "Поверх, кімната, вхід, вивіска. Напр. «2 поверх, зала 116, вхід з двору».",
        schedule: "Розклад", addRow: "+ рядок", day: "День", time: "Час", duration: "Хвилин", frequency: "Частота",
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
        levels: "Levels", format: "Format", venue: "Venue", address: "Address", district: "District", metro: "Metro",
        locNote: "How to find it there", locNoteHint: "Floor, room, entrance, sign. E.g. \"2nd floor, room 116, entrance from the yard\".",
        schedule: "Schedule", addRow: "+ row", day: "Day", time: "Time", duration: "Minutes", frequency: "Frequency",
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
  const DISTRICTS = ["Голосіївський", "Дарницький", "Деснянський", "Дніпровський", "Оболонський", "Печерський", "Подільський", "Святошинський", "Солом'янський", "Шевченківський"];
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

    $("#list").innerHTML = list.map(card).join("");
    $("#empty").hidden = list.length > 0;
    $("#summary").textContent = t().summary(list.length, clubs.length);
  }

  function card(c) {
    const st = shownStatus(c);
    const L = t();
    const sched = (c.schedule || []).map((s) =>
      `${L.days[s.day]}${s.time ? " " + s.time : ""}${s.duration_min ? ` (${s.duration_min} ${L.min})` : ""}${s.frequency && s.frequency !== "weekly" ? ", " + L.freq[s.frequency] : ""}`).join("; ");
    const loc = c.location || {};
    const place = [loc.venue, loc.address, loc.metro && "м. " + loc.metro, loc.district && loc.district + " р-н"]
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
      if (ct.access === "on_request" || !ct.url) {
        return `<span>🔒 ${esc(typeName(ct))} (${esc(L.closedGroup)})${ct.note ? ": " + esc(ct.note) : ""}</span>`;
      }
      const href = contactHref(ct);
      const label = ct.type === "website" || ct.type === "other" ? contactLabel(ct) : typeName(ct) + (ct.access === "invite" ? ` (${L.inviteLink})` : "");
      const link = href ? `<a href="${esc(href)}" target="_blank" rel="noopener nofollow">${esc(label)}</a>` : `<span>${esc(ct.url)}</span>`;
      return ct.note ? `<span>${link} — ${esc(ct.note)}</span>` : link;
    }).join("");
    const sources = (c.sources || []).filter((s) => /^https?:\/\//.test(s));

    return `<li class="card${isOld(c) ? " old" : ""}" data-id="${esc(c.id)}">
      <div class="row"><span class="badge ${st}">${esc(L.status[st])}</span>${c.languages.map((l) => `<span class="chip">${esc(langName(l))}</span>`).join("")}${c.format ? `<span class="chip">${esc(L.format[c.format])}</span>` : ""}</div>
      <h3>${esc(c.name)}</h3>
      ${c.description ? `<p class="desc">${esc(c.description)}</p>` : ""}
      ${sched || c.schedule_note ? `<p class="meta"><span class="ico">🗓</span><b>${esc(sched)}</b>${sched && c.schedule_note ? " — " : ""}${esc(c.schedule_note || "")}</p>` : ""}
      ${place || loc.note ? `<p class="meta"><span class="ico">📍</span>${esc(place)}${loc.note ? `${place ? "<br>" : ""}<span class="ico">🧭</span>${esc(loc.note)}` : ""}</p>` : ""}
      ${price || c.registration || c.levels?.length ? `<p class="meta">${[price && `<span class="ico">💳</span>${esc(price)}`, c.registration && esc(L.reg[c.registration]), c.levels?.length && esc(L.levels + ": " + c.levels.map((l) => (l === "any" ? L.anyLevel : l)).join(", "))].filter(Boolean).join(" · ")}</p>` : ""}
      ${c.organizer ? `<p class="meta">${esc(L.organizer)}: ${esc(c.organizer)}</p>` : ""}
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

  function scheduleRow(s = {}) {
    const F = t().f;
    return `<div class="rep-row" data-rep="schedule">
      <select name="s_day" aria-label="${esc(F.day)}">${DAYS.map((d) => opt(d, t().daysLong[d], s.day === d)).join("")}</select>
      <input name="s_time" type="time" aria-label="${esc(F.time)}" value="${esc(s.time || "")}">
      <input name="s_dur" type="number" min="10" max="600" step="5" placeholder="${esc(F.duration)}" aria-label="${esc(F.duration)}" value="${esc(s.duration_min || "")}">
      <select name="s_freq" aria-label="${esc(F.frequency)}">${["weekly", "biweekly", "monthly", "irregular"].map((f) => opt(f, t().freq[f], (s.frequency || "weekly") === f)).join("")}</select>
      <button type="button" class="ghost small" data-del aria-label="${esc(F.remove)}">✕</button>
    </div>`;
  }
  function contactRow(ct = {}) {
    const F = t().f;
    return `<div class="rep-row" data-rep="contacts">
      <select name="c_type" aria-label="${esc(F.contactType)}">${CONTACT_TYPES.map((x) => opt(x, t().ctype[x], (ct.type || "telegram") === x)).join("")}</select>
      <select name="c_access" aria-label="${esc(F.access)}">${["public", "on_request", "invite"].map((x) => opt(x, F.accessOpt[x], (ct.access || "public") === x)).join("")}</select>
      <input name="c_url" placeholder="${esc(F.url)}" aria-label="${esc(F.url)}" value="${esc(ct.url || "")}" style="flex:3 1 180px">
      <input name="c_note" placeholder="${esc(F.contactNote)}" aria-label="${esc(F.contactNote)}" value="${esc(ct.note || "")}" style="flex:3 1 180px">
      <button type="button" class="ghost small" data-del aria-label="${esc(F.remove)}">✕</button>
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
        ${field("district", F.district, `<select name="district">${opt("", F.none, !loc.district)}${DISTRICTS.map((d) => opt(d, d, loc.district === d)).join("")}</select>`)}
        ${field("metro", F.metro, `<input name="metro" maxlength="100" value="${esc(loc.metro || "")}">`)}
      </div>`,
      field("locNote", F.locNote, `<input name="locNote" maxlength="300" value="${esc(loc.note || "")}">`, F.locNoteHint),
      `<div class="grid2">
        <label class="check"><input type="checkbox" name="free"${c.price?.free ? " checked" : ""}> ${esc(F.free)}</label>
        ${field("amount", F.amount, `<input name="amount" maxlength="100" value="${esc(c.price?.amount || "")}">`)}
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
      return s;
    });
    c.schedule_note = v("schedule_note");
    c.location = { venue: v("venue"), address: v("address"), district: v("district"), metro: v("metro"), note: v("locNote") };
    c.price = { free: form.elements.free.checked, amount: v("amount") };
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
    dlg.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]")) dlg.close();
      const add = e.target.closest("[data-add]");
      if (add) $("#rep-" + add.dataset.add).insertAdjacentHTML("beforeend", add.dataset.add === "schedule" ? scheduleRow() : contactRow());
      const del = e.target.closest("[data-del]");
      if (del) del.closest(".rep-row").remove();
    });
    $("#club-form").addEventListener("submit", submit);
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
  }
  init();
})();

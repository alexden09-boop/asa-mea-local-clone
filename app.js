(function () {
  "use strict";

  const data = window.ASA_DATA || {};
  const root = document.getElementById("root");
  let revealObserver = null;

  const localImages = {
    heroes: ["assets/images/hero-football-1600.webp", "assets/images/hero-fitness-1600.webp", "assets/images/hero-padel-1600.webp"],
    heroSrcsets: [
      "assets/images/hero-football-900.webp 900w, assets/images/hero-football-1600.webp 1600w",
      "assets/images/hero-fitness-900.webp 900w, assets/images/hero-fitness-1600.webp 1600w",
      "assets/images/hero-padel-900.webp 900w, assets/images/hero-padel-1600.webp 1600w"
    ],
    values: [
      "assets/images/icon-development.png",
      "assets/images/icon-professionalism.png",
      "assets/images/icon-discipline.png",
      "assets/images/icon-teamwork.png",
      "assets/images/icon-performance.png"
    ],
    academies: {
      6: "assets/images/academy-football.png",
      5: "assets/images/academy-padel.png",
      4: "assets/images/academy-tennis.png"
    },
    academyDetails: {
      6: "assets/images/detail-football.png",
      5: "assets/images/detail-padel.png",
      4: "assets/images/detail-tennis.png"
    }
  };

  function fixText(value) {
    return String(value == null ? "" : value)
      .replace(/â€¦/g, "…")
      .replace(/â€™/g, "’")
      .replace(/â€œ/g, "“")
      .replace(/â€/g, "”")
      .replace(/â€“/g, "–")
      .replace(/â€”/g, "—")
      .replace(/Â /g, " ")
      .replace(/Â /g, " ")
      .replace(/â€‹/g, "")
      .replace(/​/g, "")
      .replace(/Ã…/g, "Å")
      .replace(/Ã§/g, "ç")
      .replace(/Ã©/g, "é");
  }

  function escapeHTML(value) {
    return fixText(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function sanitizedSourceMarkup(value) {
    return fixText(value)
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<(?:link|meta)\b[^>]*>/gi, "")
      .replace(/\s(?:style|on[a-z]+)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  }

  function safeHTML(value) {
    const input = sanitizedSourceMarkup(value);
    const parsed = new DOMParser().parseFromString(input, "text/html");
    const allowed = new Set(["P", "BR", "STRONG", "B", "EM", "I", "UL", "OL", "LI"]);
    const clean = document.createElement("div");

    function appendSafe(source, target) {
      source.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          target.appendChild(document.createTextNode(node.textContent || ""));
          return;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        if (!allowed.has(node.tagName)) {
          appendSafe(node, target);
          return;
        }
        const next = document.createElement(node.tagName.toLowerCase());
        appendSafe(node, next);
        target.appendChild(next);
      });
    }

    appendSafe(parsed.body, clean);
    return clean.innerHTML;
  }

  function plainText(value) {
    const parsed = new DOMParser().parseFromString(sanitizedSourceMarkup(value), "text/html");
    return (parsed.body.textContent || "").replace(/\s+/g, " ").trim();
  }

  function icon(name) {
    const icons = {
      cart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 1.9-1.4L21 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>',
      bell: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>',
      user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4"/><path d="M4 22v-2a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7v2"/></svg>',
      menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
      close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4l16 16M20 4L4 20"/></svg>'
    };
    return icons[name] || "";
  }

  function routePath() {
    const hash = window.location.hash.replace(/^#/, "");
    return hash && hash.startsWith("/") ? hash.split("?")[0] : "/";
  }

  function header(path) {
    const active = (target) => path === target || (target !== "/" && path.startsWith(target)) ? " is-active" : "";
    return `
      <header class="Header">
        <div class="Header__inner">
          <a class="Header__logo" href="#/" aria-label="ASA home"><img src="assets/images/logo.png" width="251" height="250" alt="Advanced Sports Academy"></a>
          <nav class="Header__nav" aria-label="Main navigation">
            <a class="Header__link${active("/")}" href="#/">Home</a>
            <details class="Header__academy">
              <summary>Academy</summary>
              <div class="Header__dropdown">
                <a href="#/academy/6">Football</a>
                <a href="#/academy/5">Padel</a>
                <a href="#/academy/4">Tennis</a>
              </div>
            </details>
            <a class="Header__link${active("/fitness")}" href="#/fitness">Fitness</a>
            <a class="Header__link${active("/reservation")}" href="#/reservation">Reservation</a>
            <a class="Header__link${active("/personal-trainer")}" href="#/personal-trainer">Private Training</a>
            <a class="Header__link${active("/shop")}" href="#/shop">Shop</a>
            <a class="Header__link${active("/our-team")}" href="#/our-team">Our Team</a>
            <a class="Header__link${active("/contact-us")}" href="#/contact-us">Contact Us</a>
          </nav>
          <div class="Header__actions">
            <a class="icon-link" href="#/checkout" aria-label="Cart">${icon("cart")}</a>
            <a class="icon-link" href="#/notifications" aria-label="Notifications">${icon("bell")}</a>
            <a class="icon-link icon-link--account" href="#/sign-in" aria-label="Sign in or sign up">${icon("user")}<span>Sign In/Up</span></a>
            <button class="menu-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">${icon("menu")}</button>
          </div>
        </div>
      </header>
      <nav id="mobile-menu" class="mobile-menu" aria-label="Mobile navigation">
        <a class="mobile-link${active("/")}" href="#/">Home</a>
        <a class="mobile-link${active("/academy/6")}" href="#/academy/6">Football</a>
        <a class="mobile-link${active("/academy/5")}" href="#/academy/5">Padel</a>
        <a class="mobile-link${active("/academy/4")}" href="#/academy/4">Tennis</a>
        <a class="mobile-link${active("/fitness")}" href="#/fitness">Fitness</a>
        <a class="mobile-link${active("/reservation")}" href="#/reservation">Reservation</a>
        <a class="mobile-link${active("/personal-trainer")}" href="#/personal-trainer">Private Training</a>
        <a class="mobile-link${active("/shop")}" href="#/shop">Shop</a>
        <a class="mobile-link${active("/our-team")}" href="#/our-team">Our Team</a>
        <a class="mobile-link${active("/contact-us")}" href="#/contact-us">Contact Us</a>
      </nav>`;
  }

  function footer() {
    return `
      <footer class="Footer">
        <div class="Footer__grid">
          <div class="Footer__brand">
            <img src="assets/images/logo.png" width="251" height="250" loading="lazy" decoding="async" alt="ASA">
            <p>Sports teaches your child discipline, agility, endurance, team work, leadership, and much more...</p>
          </div>
          <nav class="Footer__links" aria-label="Footer academy links">
            <a href="#/academy/6">Academy</a>
            <a href="#/reservation">Reservation</a>
            <a href="#/shop">Shop</a>
          </nav>
          <nav class="Footer__links" aria-label="Footer company links">
            <a href="#/personal-trainer">Private Training</a>
            <a href="#/our-team">Our Team</a>
            <a href="#/contact-us">Contact Us</a>
          </nav>
          <div class="Footer__social">
            <h3>STAY CONNECTED</h3>
            <div class="social-row"><a href="https://www.instagram.com/advancedsportsacademy/" target="_blank" rel="noreferrer" aria-label="Instagram">◎</a><a href="https://www.facebook.com/AdvancedSportsAcademy/" target="_blank" rel="noreferrer" aria-label="Facebook">f</a><a href="https://www.tiktok.com/@asa_academy" target="_blank" rel="noreferrer" aria-label="TikTok">♪</a></div>
            <h3>DOWNLOAD THE APP</h3>
            <div class="app-badges"><a class="app-badge" href="https://apps.apple.com/ae/app/advanced-sports-academy/id6636536554" target="_blank" rel="noreferrer"><img src="assets/images/app-store.png" width="1200" height="1425" loading="lazy" decoding="async" alt=""><span>Download on the<br><b>App Store</b></span></a><a class="app-badge" href="https://play.google.com/store/apps/details?id=com.knockservices.asamea&amp;hl=en" target="_blank" rel="noreferrer"><img src="assets/images/google-play.png" width="500" height="500" loading="lazy" decoding="async" alt=""><span>Get it on<br><b>Google Play</b></span></a></div>
          </div>
        </div>
      </footer>
      <div class="CopyRight">Copyright 2024 - All rights reserved to ASA</div>`;
  }

  function page(content, path, includeFooter = true) {
    return `${header(path)}<main class="site-main">${content}</main>${includeFooter ? footer() : ""}`;
  }

  function home() {
    const heroItems = (data.homeBanners || []).slice(0, 3);
    const values = (data.services || []).slice(0, 5);
    const academies = (data.academies || []).slice().sort((a, b) => b.id - a.id);
    const members = data.members || [];
    return page(`
      <section class="HomeBanner" aria-label="Featured ASA programs">
        ${heroItems.map((item, index) => `
          <article class="HomeBanner__slide${index === 0 ? " is-active" : ""}" data-slide="${index}" aria-hidden="${index !== 0}">
            <img class="HomeBanner__image" ${index === 0 ? `src="${localImages.heroes[index]}" srcset="${localImages.heroSrcsets[index]}" fetchpriority="high"` : `data-src="${localImages.heroes[index]}" data-srcset="${localImages.heroSrcsets[index]}" loading="lazy"`} sizes="100vw" width="1600" height="871" decoding="async" alt="">
            <div class="HomeBanner__content">
              <h1 class="HomeBanner__title">${escapeHTML(item.title)}</h1>
              <p class="HomeBanner__copy">${escapeHTML(plainText(item.description))}</p>
            </div>
          </article>`).join("")}
        <button class="HomeBanner__arrow HomeBanner__arrow--prev" type="button" aria-label="Previous slide">←</button>
        <button class="HomeBanner__arrow HomeBanner__arrow--next" type="button" aria-label="Next slide">→</button>
        <div class="HomeBanner__pagination" aria-label="Choose featured program">
          ${heroItems.map((item, index) => `<button type="button" data-hero-page="${index}" aria-label="Show slide ${index + 1}: ${escapeHTML(item.title)}"${index === 0 ? ' aria-current="true"' : ""}></button>`).join("")}
        </div>
      </section>
      <section class="SectionWe">
        <div class="SectionWe__grid">
          ${values.map((item, index) => `<article class="value-card"><img src="${localImages.values[index]}" alt=""><h2>${escapeHTML(item.title)}</h2><p>${escapeHTML(plainText(item.description))}</p></article>`).join("")}
        </div>
      </section>
      <section class="SectionOurAcdemy">
        <div class="container">
          <h2 class="section-title">Our Academy</h2>
          <div class="academy-grid">
            ${academies.map((item) => `<article class="academy-card"><div class="academy-card__image"><img src="${localImages.academies[item.id]}" loading="lazy" decoding="async" alt="${escapeHTML(item.name)}"></div><div class="academy-card__body"><h3>${escapeHTML(item.name)}</h3><p>${escapeHTML(item.title)}</p><a href="#/academy/${item.id}">Learn More</a></div></article>`).join("")}
          </div>
        </div>
      </section>
      ${members.length ? `<section class="SectionMember">
        <div class="container"><h2 class="section-title">Our Members</h2><div class="member-grid">${members.map((item) => `<article class="member-card"><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(plainText(item.description))}</p></article>`).join("")}</div></div>
      </section>` : ""}
      <section class="AboutASA">
        <div class="container"><h2 class="section-title">${escapeHTML(data.about && data.about.title)}</h2><div class="AboutASA__layout"><img class="AboutASA__image" src="assets/images/about-asa.png" width="711" height="1079" loading="lazy" decoding="async" alt="ASA sports equipment"><div class="AboutASA__copy">${safeHTML(data.about && data.about.description)}</div></div></div>
      </section>
      <section class="OurPartner">
        <h2 class="section-title">Our Partners</h2><div class="logo-grid">${["assets/images/partner-egypt.png", "assets/images/partner-uae.png"].map((src) => `<div class="logo-card"><img src="${src}" loading="lazy" decoding="async" alt="Partner logo"></div>`).join("")}</div>
      </section>
      <section class="OurSponsors">
        <h2 class="section-title">Our Sponsors</h2><div class="logo-grid">${["assets/images/sponsor-nox.png", "assets/images/sponsor-knock.png", "assets/images/sponsor-gerimax.png"].map((src) => `<div class="logo-card"><img src="${src}" loading="lazy" decoding="async" alt="Sponsor logo"></div>`).join("")}</div>
      </section>
      <section class="OurCommitment"><div class="OurCommitment__layout"><div class="OurCommitment__copy"><h2>${escapeHTML(data.commitment && data.commitment.title)}</h2><p>${escapeHTML(plainText(data.commitment && data.commitment.description))}</p></div><img src="assets/images/commitment.jpg" width="1843" height="1003" loading="lazy" decoding="async" alt="Athlete training with battle ropes"></div></section>
      <section class="OurAchievements"><h2 class="section-title">${escapeHTML(data.achievements && data.achievements.title)}</h2><div class="achievements-layout"><img src="assets/images/achievements.png" width="456" height="516" loading="lazy" decoding="async" alt="First-place trophy"><div class="achievements-copy">${safeHTML(data.achievements && data.achievements.description)}</div></div></section>
      <section class="Raed"><div class="Raed__layout"><blockquote class="Raed__quote"><strong>TRUST<br>THE PROCESS</strong><small>- RAED AL SADDIK -</small></blockquote><img class="Raed__image" src="assets/images/quote-raed.png" width="569" height="570" loading="lazy" decoding="async" alt="Raed Al Saddik"></div></section>
      <section class="Youtube"><h2 class="section-title">Follow Us For The Latest Updates!</h2><div class="Youtube__layout"><img class="Youtube__image" src="assets/images/youtube.png" width="648" height="385" loading="lazy" decoding="async" alt="Trust the process on YouTube"><a class="btn" href="https://www.youtube.com/@ASA-LEBANON" target="_blank" rel="noreferrer">Visit us on YouTube</a></div></section>
    `, "/");
  }

  function gallerySection(itemCount) {
    const pageCount = Math.max(1, Number(itemCount || 3) - 2);
    return `<section class="gallery-section"><h2 class="section-title">Gallery</h2><div class="gallery-carousel" data-gallery-page="1" data-gallery-pages="${pageCount}"><button class="gallery-arrow gallery-arrow--prev" type="button" aria-label="Previous gallery page" disabled>‹</button><div class="gallery-row"><div class="broken-media" aria-label="Source gallery image unavailable"></div><div class="broken-media" aria-label="Source gallery image unavailable"></div><div class="broken-media" aria-label="Source gallery image unavailable"></div></div><button class="gallery-arrow gallery-arrow--next" type="button" aria-label="Next gallery page">›</button><div class="gallery-pagination" aria-label="Gallery pages">${Array.from({ length: pageCount }, (_, index) => `<button type="button" data-page="${index + 1}"${index === 0 ? ' aria-current="page"' : ""}>${index + 1}</button>`).join("")}</div></div></section>`;
  }

  function communityBand() {
    return '<section class="community-band"><h2><span aria-hidden="true">‹</span>JOIN THE COMMUNITY<span aria-hidden="true">›</span></h2></section>';
  }

  function academyPage(id) {
    const academy = (data.academies || []).find((item) => String(item.id) === String(id));
    if (!academy) return emptyPage("Academy not found", "The requested academy was not present in the captured public data.");
    return page(`
      <div class="page-shell AcademyPage">
        <section class="page-hero"><div class="page-hero__media"><img src="${localImages.academies[academy.id]}" alt="${escapeHTML(academy.name)}"></div><div class="page-hero__copy"><h1>${escapeHTML(academy.title)}</h1><p>${escapeHTML(plainText(academy.description))}</p><a class="btn" href="#/${String(academy.id) === "4" ? "personal-trainer" : `enroll/${academy.id}`}">Enroll Now</a></div></section>
        <section class="quote-band"><blockquote>${escapeHTML(plainText(academy.quote))}</blockquote></section>
        <section class="detail-section"><div class="detail-section__layout"><img class="detail-section__image" src="${localImages.academyDetails[academy.id]}" alt="${escapeHTML(academy.name)} training"><div class="detail-section__copy"><h2>${escapeHTML(academy.our_academy_name)}</h2>${safeHTML(academy.our_academy_description)}</div></div></section>
        ${gallerySection(academy.files && academy.files.gallery && academy.files.gallery.length)}
        ${communityBand()}
      </div>`, `/academy/${id}`);
  }

  function fitnessPage() {
    const fitness = data.fitness || {};
    return page(`
      <div class="page-shell FitnessPage">
        <section class="page-hero"><div class="page-hero__media"><div class="broken-media" aria-label="Source fitness image unavailable"></div></div><div class="page-hero__copy"><h1>${escapeHTML(fitness.title)}</h1><p>${escapeHTML(plainText(fitness.description))}</p><a class="btn" href="#/fitness-trainer">Enroll Now</a></div></section>
        <section class="quote-band"><blockquote>${escapeHTML(plainText(fitness.quote))}</blockquote></section>
        <section class="detail-section"><div class="detail-section__layout"><img class="detail-section__image" src="assets/images/hero-fitness.jpg" alt="Fitness training"><div class="detail-section__copy"><h2>${escapeHTML(fitness.our_fitness_name)}</h2><p>${escapeHTML(plainText(fitness.our_fitness_description))}</p></div></div></section>
        ${gallerySection(fitness.files && fitness.files.gallery && fitness.files.gallery.length)}
        ${communityBand()}
      </div>`, "/fitness");
  }

  function options(items, placeholder) {
    return `<option value="">${escapeHTML(placeholder)}</option>${items.map((item) => `<option value="${escapeHTML(item.value == null ? item : item.value)}"${item.selected ? " selected" : ""}>${escapeHTML(item.text == null ? item : item.text)}</option>`).join("")}`;
  }

  function field(label, type, name, extra, wide) {
    const classes = `field${wide ? " field--wide" : ""}`;
    if (type === "textarea") return `<div class="${classes}"><label for="${name}">${label}</label><textarea id="${name}" name="${name}" placeholder="${escapeHTML(label)}" ${extra || ""}></textarea></div>`;
    if (type === "select") return `<div class="${classes}"><label for="${name}">${label}</label><select id="${name}" name="${name}" ${extra || ""}></select></div>`;
    return `<div class="${classes}"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}" placeholder="${escapeHTML(label)}" ${extra || ""}></div>`;
  }

  function phoneField(name, required, wide) {
    const classes = `field phone-field${wide ? " field--wide" : ""}`;
    return `<div class="${classes}"><label for="${name}">Mobile</label><div class="phone-control"><span class="phone-country-picker"><span aria-hidden="true"><img src="assets/images/lebanon-flag.svg" alt="">⌄</span><select name="phone_country" aria-label="Country code"></select></span><input id="${name}" name="${name}" type="tel" placeholder="Mobile" inputmode="tel" maxlength="24"${required ? " required" : ""}></div></div>`;
  }

  function enrollPage(id) {
    const academy = (data.academies || []).find((item) => String(item.id) === String(id));
    if (!academy) return emptyPage("Academy not found", "The requested academy was not present in the captured public data.");
    return page(`<section class="FormPage FormPage--enroll"><div class="FormPage__card"><h1 class="form-heading">Trial Enroll</h1><form class="local-form" data-purpose="trial enrollment"><div class="form-grid">${field("Full Name", "text", "name", "required maxlength=100", true)}${field("E-mail", "email", "email", "maxlength=254", true)}${phoneField("phone", true, true)}${field("Birth date", "date", "birth_date", "required", true)}</div><div class="form-actions"><button class="btn" type="submit">Submit</button></div><p class="form-note" role="status"></p></form></div></section>`, `/enroll/${id}`);
  }

  function reservationPage() {
    const timeOptions = Array.from({ length: 34 }, (_, index) => {
      const minutes = 8 * 60 + index * 30;
      const hour = Math.floor(minutes / 60) % 24;
      const minute = minutes % 60;
      return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    });
    return page(`<section class="FormPage FormPage--reservation"><img class="reservation-logo" src="assets/images/reservation-logo.png" alt="ASA Padel Arena"><div class="FormPage__card"><h1 class="form-heading">Reservation</h1><form class="local-form" data-purpose="reservation"><div class="form-grid">
      ${field("Date", "date", "date", "required")}${field("From Time", "select", "from_time", "required")}${field("Duration", "select", "duration", "required")}${field("Area", "select", "area_id", "required")}${field("Racket Rental", "select", "rackets_number")}${field("Padel Ball Cans", "select", "balls_boxes_number")}${field("Full Name", "text", "name", "required maxlength=100")}${phoneField("phone", true)}${field("Received OTP", "text", "otp", "inputmode=numeric maxlength=8")}
      </div><div class="price-actions"><div><p>Field Price: <span>$0.00</span></p><p>Rackets Price: <span>$0.00</span></p><p>Balls Price: <span>$0.00</span></p><p>Total Price: <span>$0.00</span></p></div><button class="btn otp-button" type="button">Send OTP</button></div><div class="form-actions"><button class="btn" type="submit">Submit</button></div><p class="form-note" role="status"></p></form></div></section>`, "/reservation");
  }

  function trainerPage() {
    return page(`<section class="FormPage FormPage--trainer"><div class="FormPage__card"><h1 class="form-heading">Private Training</h1><form class="local-form" data-purpose="private training"><div class="form-grid">
      ${field("Category", "select", "category", "required")}${field("Subcategory", "select", "subcategory", "required")}${field("Package", "select", "package", "required")}${field("Start Date", "date", "start_date", "required")}${field("Full Name", "text", "name", "required maxlength=100")}${phoneField("mobile", true)}${field("E-mail", "email", "email", "required maxlength=254", true)}
      </div><div class="form-actions"><button class="btn" type="submit">Register</button></div><p class="form-note" role="status"></p></form></div></section>`, "/personal-trainer");
  }

  function contactPage() {
    const contacts = data.contactInformations || [];
    return page(`<section class="ContactPage"><div class="ContactPage__card"><h1 class="form-heading">Contact Us</h1><div class="ContactPage__layout"><form class="local-form" data-purpose="contact"><div class="form-grid">
      ${field("Full Name", "text", "name", "required maxlength=100", true)}${field("E-mail", "email", "email", "required maxlength=254", true)}${phoneField("mobile", true, true)}${field("Note", "textarea", "note", "required maxlength=2000", true)}
      </div><div class="form-actions"><button class="btn" type="submit">Submit</button></div><p class="form-note" role="status"></p></form><div class="contact-list"><h2>Contact Information</h2>${contacts.map((item) => `<article class="contact-item"><p>Location: ${escapeHTML(item.address)}</p>${item.phone ? `<p>Mobile: ${escapeHTML(item.phone)}</p>` : ""}${item.tel ? `<p>Tel: ${escapeHTML(item.tel)}</p>` : ""}${item.reservation_mobile ? `<p>For Reservations: ${escapeHTML(item.reservation_mobile)}</p>` : ""}<p>Direction</p></article>`).join("")}</div></div></div></section>`, "/contact-us");
  }

  function authPage(kind) {
    if (kind === "sign-up") {
      return page(`<section class="AuthPage AuthPage--signup"><div class="AuthPage__card"><h1 class="form-heading">Sign Up</h1><form class="local-form" data-purpose="sign up"><div class="form-grid">${field("Full Name", "text", "name", "required maxlength=100", true)}${field("E-mail", "email", "email", "required maxlength=254", true)}${phoneField("mobile", true, true)}${field("Country", "select", "country")}${field("Address", "text", "address", "required maxlength=300")}${field("Birth Date", "date", "dob")}${field("Password", "password", "password", "required minlength=8 maxlength=128")}</div><div class="form-actions"><button class="btn" type="submit">Sign Up</button></div><p class="form-note" role="status"></p></form><div class="auth-links"><span>Already have an account? <a href="#/sign-in">Sign in</a></span></div></div></section>`, "/sign-up");
    }
    if (kind === "forgot-password") {
      return page(`<section class="AuthPage AuthPage--forgot"><div class="AuthPage__card"><h1 class="form-heading">Forgot Password?</h1><form class="local-form" data-purpose="password reset"><div class="form-grid">${field("E-mail", "email", "email", "required maxlength=254", true)}</div><div class="form-actions"><button class="btn" type="submit">Continue</button></div><p class="form-note" role="status"></p></form><div class="auth-links"><span>Already have an account? <a href="#/sign-in">Sign in</a></span></div></div></section>`, "/forgot-password");
    }
    return page(`<section class="AuthPage AuthPage--signin"><div class="AuthPage__card"><h1 class="form-heading">Sign In</h1><p class="auth-intro">New In ASA? <a href="#/sign-up">Create An Account</a></p><form class="local-form" data-purpose="sign in"><div class="form-grid">${field("E-mail", "email", "email", "required maxlength=254", true)}${field("Password", "password", "password", "required minlength=8 maxlength=128", true)}</div><a class="forgot-link" href="#/forgot-password">Forgot Password?</a><div class="form-actions"><button class="btn" type="submit">Sign In</button></div><p class="form-note" role="status"></p></form></div></section>`, "/sign-in");
  }

  function shopPage() {
    return page(`<section class="ShopPage"><div class="shop-intro"><h1>RIGHT<br>GEAR</h1><span class="missing-dots" aria-label="Source banner unavailable"></span></div><div class="shop-offers"><article class="shop-offer shop-offer--football"><div><span>INTERESTED IN</span><h2>Football</h2><p>EQUIPMENT?</p><a class="btn" href="#/products?academy=6">Shop Now</a></div></article><article class="shop-offer shop-offer--missing"><span class="missing-dots" aria-label="Source offer image unavailable"></span><a class="btn" href="#/products?academy=5">Shop Now</a></article><article class="shop-offer shop-offer--missing"><span class="missing-dots" aria-label="Source offer image unavailable"></span><a class="btn" href="#/products?academy=4">Shop Now</a></article></div><h2 class="featured-heading">Featured Product</h2><div class="featured-empty"></div><section class="shop-category"><h2>SHOP BY CATEGORY</h2><article class="category-offer"><h3>Padel Equipment</h3><span class="missing-dots" aria-label="Source category image unavailable"></span><a class="btn" href="#/products">Shop Now</a></article></section></section>`, "/shop");
  }

  function productsPage() {
    const categories = data.productCategories || [];
    const academies = (data.academies || []).slice().sort((a, b) => b.id - a.id);
    return page(`<section class="ProductsPage"><h1>‹ Products</h1><div class="product-filters"><label><span class="sr-only">Search products</span><input type="search" name="product_search" placeholder="Search..."></label><label><span class="sr-only">Category</span><select name="product_category">${options(categories.map((item) => ({text:item.name,value:item.id})), "Select Category")}</select></label><label><span class="sr-only">Academy</span><select name="product_academy">${options(academies.map((item) => ({text:item.name,value:item.id})), "Select Academy")}</select></label></div><div class="product-results" aria-live="polite"></div></section>`, "/products");
  }

  function accountListPage(kind) {
    const isCart = kind === "checkout";
    return page(`<section class="AccountListPage"><h1>‹ ${isCart ? "Your Cart" : "Notifications"}</h1>${isCart ? `<button class="clear-cart" type="button">Clear Cart</button>` : ""}</section>`, isCart ? "/checkout" : "/notifications");
  }

  function productPage(id) {
    return page(`<section class="ProductDetailPage"><p class="route-alert" role="status">ID #${escapeHTML(id)} not found</p><div class="product-detail-layout"><div class="broken-media" aria-label="Source product image unavailable"></div><div class="product-detail-copy"><h1>Product</h1><strong>$0.00</strong><form class="local-form quantity-form" data-purpose="add to cart"><label for="quantity">Quantity</label><div class="quantity-control"><button type="button" aria-label="Decrease quantity">−</button><input id="quantity" name="quantity" type="number" min="1" value="1"><button type="button" aria-label="Increase quantity">+</button></div><button class="btn" type="submit">Add To Cart</button><p class="form-note" role="status"></p></form></div></div></section>`, `/product/${id}`);
  }

  function orderDetailsPage() {
    return page(`<section class="OrderDetailsPage"><h1>Order Details</h1><p>Order # was placed on and is currently</p><div class="order-summary"><h2>Product <span>Total</span></h2><p>Address:</p><p>Delivery Fees: <strong>$0.00</strong></p><p>Total: <strong>$0.00</strong></p></div></section>`, "/order-details");
  }

  function qrPage() {
    const sections = [
      ["Zero7", "https://www.instagram.com/zero7byasa?igsh=MXNqM2txYjB4aDJzaA%3D%3D&utm_source=qr"],
      ["ASA official instagram", "https://www.instagram.com/advancedsportsacademy?igsh=MTZoOGViMDBqcHkyag=="],
      ["Padel Arena", "https://www.instagram.com/asapadelarena?igsh=MWZ6b3dlamdkcWNnZg=="]
    ];
    return page(`<section class="QrPage"><h1>Our Sections</h1><div class="qr-links">${sections.map(([label, href]) => `<a href="${href}" target="_blank" rel="noreferrer">${label}</a>`).join("")}</div></section>`, "/qr");
  }

  function teamPage() {
    const sections = data.employeeSections || [];
    return page(`<section class="TeamPage"><div class="team-tabs" role="tablist">${sections.map((section, index) => `<button class="team-tab${index === 0 ? " is-active" : ""}" type="button" role="tab" data-team-id="${section.id}" aria-selected="${index === 0}">${escapeHTML(section.name)}</button>`).join("")}</div><div class="team-content"></div></section>`, "/our-team");
  }

  function renderTeamSection(id) {
    const section = (data.employeeSections || []).find((item) => String(item.id) === String(id)) || (data.employeeSections || [])[0];
    const content = document.querySelector(".team-content");
    if (!section || !content) return;
    content.innerHTML = section.employee_sub_sections.map((subsection) => `<section class="team-subsection"><h2>${escapeHTML(subsection.name)}</h2><div class="team-grid">${subsection.employees.map((employee) => `<article class="team-card"><div class="broken-media" aria-label="Source portrait unavailable"></div><h3>${escapeHTML(employee.name)}</h3><p>${escapeHTML(employee.position)}</p></article>`).join("")}</div></section>`).join("");
  }

  function renderProductResults() {
    const search = document.querySelector('[name="product_search"]');
    const category = document.querySelector('[name="product_category"]');
    const academy = document.querySelector('[name="product_academy"]');
    const results = document.querySelector(".product-results");
    if (!search || !category || !academy || !results) return;
    const query = search.value.trim().toLowerCase();
    if (!query && !category.value && !academy.value) {
      results.innerHTML = "";
      return;
    }
    const matches = (data.products || []).filter((product) => {
      const nameMatches = !query || fixText(product.name).toLowerCase().includes(query);
      const categoryMatches = !category.value || String(product.product_category_id) === category.value;
      const academyMatches = !academy.value || String(product.academy_id) === academy.value;
      return nameMatches && categoryMatches && academyMatches;
    });
    results.innerHTML = matches.length ? `<div class="product-grid">${matches.map((product) => `<article class="product-card"><div class="broken-media" aria-label="Source product image unavailable"></div><h3>${escapeHTML(product.name)}</h3><strong>${escapeHTML(product.discount_price || product.price || 0)} USD</strong></article>`).join("")}</div>` : `<p class="no-results">No products found.</p>`;
  }

  function emptyPage(title, copy, path) {
    return page(`<section class="EmptyPage"><h1>${escapeHTML(title)}</h1><p>${escapeHTML(copy)}</p><a class="btn" href="#/">Back home</a></section>`, path || routePath());
  }

  function fillSelect(name, html) {
    const select = document.querySelector(`[name="${name}"]`);
    if (select) select.innerHTML = html;
  }

  function hydrateForms() {
    const phoneItems = (data.phoneCountries || []).map((country) => ({ text: country.text, value: country.value, selected: country.selected }));
    const countryItems = (data.countries || []).map((country) => ({ text: country.name, value: country.id }));
    fillSelect("phone_country", options(phoneItems, "Select country"));
    fillSelect("country", options(countryItems, "Select country"));
    fillSelect("from_time", options(Array.from({ length: 34 }, (_, index) => {
      const total = 8 * 60 + index * 30;
      const label = `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
      return { text: label, value: label };
    }), "Select time"));
    fillSelect("duration", options([{ text: "60 minutes", value: 60 }, { text: "90 minutes", value: 90 }, { text: "120 minutes", value: 120 }], "Select Duration"));
    fillSelect("area_id", options([], "No available courts for the selected time"));
    fillSelect("rackets_number", options([{ text: "1 racket / $3", value: 1 }, { text: "2 rackets / $6", value: 2 }, { text: "3 rackets / $9", value: 3 }, { text: "4 rackets / $12", value: 4 }], "Racket Rental"));
    fillSelect("balls_boxes_number", options([{ text: "1 box / $12", value: 1 }, { text: "2 boxes / $24", value: 2 }, { text: "3 boxes / $36", value: 3 }, { text: "4 boxes / $48", value: 4 }], "Padel Ball Cans"));
    fillSelect("category", options((data.categories || []).filter((item) => !item.parent_category).map((item) => ({ text: item.name, value: item.id })), "Select category"));
    fillSelect("subcategory", options((data.categories || []).filter((item) => item.parent_category).map((item) => ({ text: item.name, value: item.id })), "Select subcategory"));
    fillSelect("package", options((data.packages || []).map((item) => ({ text: `${item.name} — ${item.price} ${item.currency && item.currency.symbol ? item.currency.symbol : "USD"}`, value: item.id })), "Select package"));
  }

  function bindEvents(path) {
    const menuButton = document.querySelector(".menu-toggle");
    const menu = document.getElementById("mobile-menu");
    if (menuButton && menu) {
      menuButton.addEventListener("click", () => {
        const isOpen = menu.classList.toggle("is-open");
        menuButton.setAttribute("aria-expanded", String(isOpen));
        menuButton.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
        menuButton.innerHTML = icon(isOpen ? "close" : "menu");
      });
      menu.addEventListener("click", (event) => {
        if (event.target.closest("a")) {
          menu.classList.remove("is-open");
          menuButton.setAttribute("aria-expanded", "false");
          menuButton.setAttribute("aria-label", "Open menu");
          menuButton.innerHTML = icon("menu");
        }
      });
      root.onkeydown = (event) => {
        if (event.key === "Escape" && menu.classList.contains("is-open")) {
          menu.classList.remove("is-open");
          menuButton.setAttribute("aria-expanded", "false");
          menuButton.setAttribute("aria-label", "Open menu");
          menuButton.innerHTML = icon("menu");
          menuButton.focus();
        }
      };
    }

    document.querySelectorAll(".gallery-carousel").forEach((gallery) => {
      const pages = Number(gallery.dataset.galleryPages || 1);
      const update = (requestedPage) => {
        const page = Math.max(1, Math.min(pages, requestedPage));
        gallery.dataset.galleryPage = String(page);
        gallery.querySelector(".gallery-arrow--prev").disabled = page === 1;
        gallery.querySelector(".gallery-arrow--next").disabled = page === pages;
        gallery.querySelectorAll(".gallery-pagination button").forEach((button) => {
          if (Number(button.dataset.page) === page) button.setAttribute("aria-current", "page");
          else button.removeAttribute("aria-current");
        });
      };
      gallery.querySelector(".gallery-arrow--prev").addEventListener("click", () => update(Number(gallery.dataset.galleryPage) - 1));
      gallery.querySelector(".gallery-arrow--next").addEventListener("click", () => update(Number(gallery.dataset.galleryPage) + 1));
      gallery.querySelectorAll(".gallery-pagination button").forEach((button) => button.addEventListener("click", () => update(Number(button.dataset.page))));
      update(1);
    });

    document.querySelectorAll(".local-form").forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const note = form.querySelector(".form-note");
        if (!form.reportValidity()) return;
        if (note) note.textContent = "Local preview: no information was sent or stored.";
      });
    });

    document.querySelectorAll(".quantity-control").forEach((control) => {
      const input = control.querySelector("input[type=number]");
      const buttons = control.querySelectorAll("button");
      if (!input || buttons.length !== 2) return;
      buttons[0].addEventListener("click", () => { input.value = String(Math.max(1, Number(input.value || 1) - 1)); });
      buttons[1].addEventListener("click", () => { input.value = String(Math.max(1, Number(input.value || 1) + 1)); });
    });

    document.querySelectorAll(".otp-button").forEach((button) => {
      button.addEventListener("click", () => {
        const note = button.closest("form")?.querySelector(".form-note");
        if (note) note.textContent = "Local preview: no OTP was requested or sent.";
      });
    });

    if (path === "/") bindHero();
    if (path === "/our-team") {
      const firstTab = document.querySelector(".team-tab");
      if (firstTab) renderTeamSection(firstTab.dataset.teamId);
      document.querySelectorAll(".team-tab").forEach((tab) => {
        tab.addEventListener("click", () => {
          document.querySelectorAll(".team-tab").forEach((item) => {
            const selected = item === tab;
            item.classList.toggle("is-active", selected);
            item.setAttribute("aria-selected", String(selected));
          });
          renderTeamSection(tab.dataset.teamId);
        });
      });
    }
    if (path === "/products") {
      document.querySelectorAll('[name="product_search"], [name="product_category"], [name="product_academy"]').forEach((control) => {
        control.addEventListener("input", renderProductResults);
        control.addEventListener("change", renderProductResults);
      });
    }
    hydrateForms();
    bindReveals();
  }

  function bindReveals() {
    if (revealObserver) revealObserver.disconnect();
    revealObserver = null;

    const groups = [
      ".SectionOurAcdemy .section-title",
      ".academy-card",
      ".AboutASA .section-title",
      ".AboutASA__image, .AboutASA__copy",
      ".OurPartner .section-title, .OurSponsors .section-title",
      ".OurPartner .logo-card",
      ".OurSponsors .logo-card",
      ".OurCommitment__copy, .OurCommitment img",
      ".OurAchievements .section-title",
      ".achievements-layout > *",
      ".Raed__quote, .Raed__image",
      ".Youtube .section-title, .Youtube__image, .Youtube .btn",
      ".detail-section__copy, .detail-section__image",
      ".gallery-section .section-title",
      ".gallery-row > *",
      ".shop-offer",
      ".category-offer",
      ".team-card",
      ".product-card"
    ];

    const elements = [];
    groups.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element, index) => {
        element.classList.add("reveal", `reveal-delay-${Math.min(index, 4)}`);
        elements.push(element);
      });
    });

    if (!elements.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, {
      root,
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.12
    });
    elements.forEach((element) => revealObserver.observe(element));
  }

  function bindHero() {
    const slides = Array.from(document.querySelectorAll(".HomeBanner__slide"));
    const pages = Array.from(document.querySelectorAll("[data-hero-page]"));
    if (!slides.length) return;
    let current = 0;
    const show = (index) => {
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        const selected = slideIndex === current;
        const image = slide.querySelector("img[data-src]");
        if (selected && image) {
          image.src = image.dataset.src;
          if (image.dataset.srcset) image.srcset = image.dataset.srcset;
          image.removeAttribute("data-src");
          image.removeAttribute("data-srcset");
        }
        slide.classList.toggle("is-active", selected);
        slide.setAttribute("aria-hidden", String(!selected));
      });
      pages.forEach((page, pageIndex) => {
        if (pageIndex === current) page.setAttribute("aria-current", "true");
        else page.removeAttribute("aria-current");
      });
    };
    document.querySelector(".HomeBanner__arrow--prev").addEventListener("click", () => show(current - 1));
    document.querySelector(".HomeBanner__arrow--next").addEventListener("click", () => show(current + 1));
    pages.forEach((page) => page.addEventListener("click", () => show(Number(page.dataset.heroPage))));
  }

  function render() {
    if (revealObserver) revealObserver.disconnect();
    revealObserver = null;
    const path = routePath();
    let markup;
    if (path === "/") markup = home();
    else if (/^\/academy\/(4|5|6)$/.test(path)) markup = academyPage(path.split("/").pop());
    else if (/^\/enroll\/(4|5|6)$/.test(path)) markup = enrollPage(path.split("/").pop());
    else if (path === "/fitness") markup = fitnessPage();
    else if (path === "/reservation") markup = reservationPage();
    else if (path === "/personal-trainer" || path === "/fitness-trainer") markup = trainerPage();
    else if (path === "/shop") markup = shopPage();
    else if (path === "/products") markup = productsPage();
    else if (/^\/product\/\d+$/.test(path)) markup = productPage(path.split("/").pop());
    else if (path === "/our-team") markup = teamPage();
    else if (path === "/contact-us") markup = contactPage();
    else if (path === "/sign-up") markup = authPage("sign-up");
    else if (path === "/forgot-password") markup = authPage("forgot-password");
    else if (path === "/sign-in") markup = authPage("sign-in");
    else if (path === "/checkout") markup = accountListPage("checkout");
    else if (path === "/notifications") markup = accountListPage("notifications");
    else if (path === "/order-details") markup = orderDetailsPage();
    else if (path === "/qr") markup = qrPage();
    else markup = emptyPage("Page not found", "This route was not part of the captured public site.", path);
    root.innerHTML = markup;
    const scroller = document.getElementById("root");
    scroller.scrollTo(0, 0);
    bindEvents(path);
    const routeTitles = {
      "/": "ASA",
      "/academy/6": "ASA | Football",
      "/academy/5": "ASA | Padel",
      "/academy/4": "ASA | Tennis",
      "/fitness": "ASA | Fitness",
      "/reservation": "ASA | Reservation",
      "/personal-trainer": "ASA | Private Training",
      "/fitness-trainer": "ASA | Private Training",
      "/shop": "ASA | Shop",
      "/products": "ASA | Search",
      "/our-team": "ASA | Our Team",
      "/contact-us": "ASA | Contact Us",
      "/sign-in": "ASA | Contact Us",
      "/sign-up": "ASA | Contact Us",
      "/forgot-password": "ASA | Contact Us",
      "/checkout": "ASA | Checkout",
      "/notifications": "ASA | Notification",
      "/order-details": "ASA | Order Detail",
      "/qr": "ASA | Order Detail"
    };
    document.title = /^\/enroll\//.test(path) ? "ASA | Enroll" : /^\/product\//.test(path) ? "ASA | undefined" : (routeTitles[path] || "Advanced Sports Academy");
  }

  window.addEventListener("hashchange", render);
  render();
})();

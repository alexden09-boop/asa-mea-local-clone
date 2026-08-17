(function () {
  "use strict";

  const data = window.ASA_DATA || {};
  const root = document.getElementById("root");
  const keyboardKeys = new Set(["Tab", "Enter", " ", "Escape", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"]);
  let revealObserver = null;
  let storyObserver = null;
  let counterObserver = null;
  let megaOutsideHandler = null;
  let megaKeyHandler = null;
  let pendingRevealElements = new Set();

  document.addEventListener("keydown", (event) => {
    if (keyboardKeys.has(event.key)) root.classList.add("is-keyboard-input");
  });
  document.addEventListener("pointerdown", () => root.classList.remove("is-keyboard-input"), { passive: true });
  let scrollProgressFrame = 0;

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
            <div class="Header__academy">
              <button class="Header__academy-trigger${active("/academy")}" type="button" aria-expanded="false" aria-controls="academy-mega">Academy</button>
              <div id="academy-mega" class="Header__dropdown Header__mega" aria-hidden="true">
                <a href="#/academy/6"><img src="assets/images/hero-football-900.webp" width="900" height="490" loading="lazy" decoding="async" alt=""><span><b>Football</b><small>Build the complete player</small></span></a>
                <a href="#/academy/5"><img src="assets/images/hero-padel-900.webp" width="900" height="490" loading="lazy" decoding="async" alt=""><span><b>Padel</b><small>Read the court differently</small></span></a>
                <a href="#/academy/4"><img src="assets/images/shop-tennis-editorial.webp" width="1536" height="1024" loading="lazy" decoding="async" alt=""><span><b>Tennis</b><small>Own every point</small></span></a>
              </div>
            </div>
            <a class="Header__link${active("/fitness")}" href="#/fitness">Fitness</a>
            <a class="Header__link${active("/reservation")}" href="#/reservation">Reservation</a>
            <a class="Header__link${active("/personal-trainer")}" href="#/personal-trainer">Private Training</a>
            <a class="Header__link${active("/shop")}" href="#/shop">Shop</a>
            <a class="Header__link${active("/our-team")}" href="#/our-team">Our Team</a>
            <a class="Header__link${active("/contact-us")}" href="#/contact-us">Contact Us</a>
          </nav>
          <div class="Header__actions">
            <a class="Header__book" href="#/reservation">Book a Session</a>
            <a class="icon-link" href="#/checkout" aria-label="Cart">${icon("cart")}</a>
            <a class="icon-link" href="#/notifications" aria-label="Notifications">${icon("bell")}</a>
            <a class="icon-link icon-link--account" href="#/sign-in" aria-label="Sign in or sign up">${icon("user")}<span>Sign In/Up</span></a>
            <button class="menu-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">${icon("menu")}</button>
          </div>
        </div>
        <progress class="Header__progress" max="1" value="0" aria-hidden="true" tabindex="-1"></progress>
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
        <a class="mobile-link mobile-link--primary" href="#/reservation">Book a Session</a>
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
    return `${header(path)}<main class="site-main${path === "/" ? "" : " route-enter"}">${content}</main>${includeFooter ? footer() : ""}`;
  }

  function legacyHome() {
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

  function home() {
    const values = (data.services || []).slice(0, 5);
    const academies = (data.academies || []).slice().sort((a, b) => b.id - a.id);
    const heroPrograms = [
      {
        name: "Football",
        kicker: "Football Academy",
        title: ["PLAY WITH", "PURPOSE"],
        copy: "Technical detail, game intelligence and the confidence to make the next decision.",
        image: "assets/images/hero-football-1600.webp",
        srcset: "assets/images/hero-football-900.webp 900w, assets/images/hero-football-1600.webp 1600w",
        route: "#/academy/6"
      },
      {
        name: "Padel",
        kicker: "Padel Academy",
        title: ["READ THE", "COURT"],
        copy: "Sharper positioning, smarter partnerships and a training rhythm built around the rally.",
        image: "assets/images/hero-padel-1600.webp",
        srcset: "assets/images/hero-padel-900.webp 900w, assets/images/hero-padel-1600.webp 1600w",
        route: "#/academy/5"
      },
      {
        name: "Tennis",
        kicker: "Tennis Academy",
        title: ["OWN EVERY", "POINT"],
        copy: "Build the technique, discipline and point-by-point mindset that keeps you moving forward.",
        image: "assets/images/shop-tennis-editorial.webp",
        route: "#/academy/4"
      }
    ];
    const achievements = [
      { year: "2022", place: "Lebanon", title: "Afro Asian Tournament", note: "Team 2014 at Sadaka wel Salem al duwaliye." },
      { year: "2023", place: "Italy", title: "Mirabilanda Tournament", note: "Teams 2014 and 2015." },
      { year: "2023", place: "Lebanon", title: "Lebanese League", note: "Team 2012." },
      { year: "2023", place: "Qatar", title: "Afro Asian Tournament", note: "Teams 2014, 2015 and 2008-2009." }
    ];
    const team = [
      { initials: "RS", name: "Raed el Saddik", role: "CEO / Founder" },
      { initials: "BN", name: "Bilal Nasser", role: "Technical Director, Football" },
      { initials: "HA", name: "Hamza Abboud", role: "Fitness Director" },
      { initials: "MB", name: "Maria Breidy", role: "Padel Coach" },
      { initials: "MM", name: "Mohamad El Masri", role: "Tennis Coach" }
    ];
    const gear = [
      { sport: "Football", title: "Built for the full ninety", image: "assets/images/shop-football-editorial.webp", route: "#/shop" },
      { sport: "Padel", title: "Find your court setup", image: "assets/images/shop-padel-editorial.webp", route: "#/shop" },
      { sport: "Tennis", title: "Control starts here", image: "assets/images/shop-tennis-editorial.webp", route: "#/shop" }
    ];

    return page(`
      <section class="HomeBanner campaign-hero" aria-label="Featured ASA programs">
        <div class="campaign-hero__trajectory" aria-hidden="true"></div>
        ${heroPrograms.map((item, index) => `
          <article id="hero-panel-${index}" role="tabpanel" class="HomeBanner__slide${index === 0 ? " is-active" : ""}" data-slide="${index}" aria-hidden="${index !== 0}"${index === 0 ? "" : " inert"}>
            <img class="HomeBanner__image" ${index === 0 ? `src="${item.image}"${item.srcset ? ` srcset="${item.srcset}"` : ""} fetchpriority="high"` : `data-src="${item.image}"${item.srcset ? ` data-srcset="${item.srcset}"` : ""} loading="lazy"`} sizes="100vw" width="1600" height="900" decoding="async" alt="">
            <div class="HomeBanner__content">
              <p class="campaign-hero__kicker">${item.kicker}</p>
              <h1 class="HomeBanner__title" aria-label="${item.title.join(" ")}"><span>${item.title[0]}</span><span>${item.title[1]}</span></h1>
              <p class="HomeBanner__copy">${item.copy}</p>
              <div class="campaign-hero__actions"><a class="btn btn--light" href="${item.route}">Explore Academy</a><a class="text-link" href="#/reservation">Book a Session <span aria-hidden="true">↗</span></a></div>
            </div>
          </article>`).join("")}
        <div class="campaign-hero__controls">
          <button class="HomeBanner__arrow HomeBanner__arrow--prev" type="button" aria-label="Previous program">←</button>
          <div class="HomeBanner__pagination" role="tablist" aria-label="Choose featured program">
            ${heroPrograms.map((item, index) => `<button type="button" role="tab" data-hero-page="${index}" aria-controls="hero-panel-${index}" aria-label="Show ${item.name}" aria-selected="${index === 0}"${index === 0 ? ' aria-current="true"' : ""}><span>${item.name}</span></button>`).join("")}
          </div>
          <button class="HomeBanner__arrow HomeBanner__arrow--next" type="button" aria-label="Next program">→</button>
        </div>
      </section>

      <section class="ValueRail" aria-labelledby="values-title">
        <div class="section-heading section-heading--split"><div><p class="eyebrow">The ASA standard</p><h2 id="values-title">MORE THAN<br>A SESSION</h2></div><p>Every program is built on five behaviours that travel beyond sport and stay with the athlete.</p></div>
        <div class="ValueRail__track">
          ${values.map((item, index) => `<article class="value-rail__item"><span>0${index + 1}</span><img src="${localImages.values[index]}" width="160" height="160" loading="lazy" decoding="async" alt=""><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(plainText(item.description))}</p></article>`).join("")}
        </div>
      </section>

      <section class="AcademyExplorer" aria-labelledby="academies-title">
        <div class="section-heading section-heading--inverse"><p class="eyebrow">Choose your discipline</p><h2 id="academies-title">THREE COURTS.<br>ONE STANDARD.</h2></div>
        <div class="AcademyExplorer__layout">
          <div class="AcademyExplorer__tabs" role="tablist" aria-label="ASA academies">
            ${academies.map((item, index) => `<button type="button" role="tab" data-academy-tab="${item.id}" aria-controls="academy-panel-${item.id}" aria-selected="${index === 0}" class="${index === 0 ? "is-active" : ""}"><span>0${index + 1}</span><strong>${escapeHTML(item.name)}</strong><small>${escapeHTML(item.title)}</small></button>`).join("")}
          </div>
          <div class="AcademyExplorer__stage">
            ${academies.map((item, index) => `<article id="academy-panel-${item.id}" class="AcademyExplorer__panel${index === 0 ? " is-active" : ""}" data-academy-panel="${item.id}" aria-hidden="${index !== 0}"><img src="${localImages.academies[item.id]}" width="900" height="900" loading="lazy" decoding="async" alt="${escapeHTML(item.name)} training"><div class="AcademyExplorer__panel-copy"><p>${escapeHTML(plainText(item.description))}</p><div><a class="btn btn--light" href="#/academy/${item.id}">Discover ${escapeHTML(item.name)}</a><a class="text-link" href="#/reservation">Book training ↗</a></div></div></article>`).join("")}
          </div>
        </div>
      </section>

      <section class="ASAStory" aria-labelledby="story-title">
        <div class="ASAStory__sticky">
          <div class="ASAStory__media"><img src="assets/images/commitment.jpg" width="1843" height="1003" loading="lazy" decoding="async" alt="Athlete training with battle ropes"><p>Built through repetition.<br>Proven under pressure.</p></div>
          <div class="ASAStory__intro"><p class="eyebrow">Our commitment</p><h2 id="story-title" data-story-title>${escapeHTML(values[0] && values[0].title || "Development")}</h2><p>${escapeHTML(plainText(data.commitment && data.commitment.description))}</p></div>
        </div>
        <div class="ASAStory__steps" aria-label="ASA principles">
          ${values.map((item, index) => `<button type="button" data-story-step="${index}" data-story-label="${escapeHTML(item.title)}" class="${index === 0 ? "is-active" : ""}" aria-pressed="${index === 0}"><span>0${index + 1}</span><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(plainText(item.description))}</small></button>`).join("")}
        </div>
      </section>

      <section class="ASAMetrics" aria-labelledby="metrics-title">
        <div class="ASAMetrics__heading"><p class="eyebrow">A growing community</p><h2 id="metrics-title">THE NUMBERS<br>KEEP MOVING</h2></div>
        <div class="ASAMetrics__grid">
          <article><p><span data-counter="800">0</span><b>+</b></p><h3>Members</h3><small>One connected sports community.</small></article>
          <article><p><span data-counter="9">0</span></p><h3>Schools</h3><small>Programs that meet athletes where they learn.</small></article>
          <article><p><span data-counter="70">0</span></p><h3>Ages 3-70</h3><small>Progress has no single starting line.</small></article>
        </div>
      </section>

      <section class="AchievementStory" aria-labelledby="achievement-title">
        <div class="AchievementStory__lead"><p class="eyebrow">Milestones</p><h2 id="achievement-title">PROGRESS<br>YOU CAN PLACE</h2><img src="assets/images/achievements.png" width="456" height="516" loading="lazy" decoding="async" alt="First-place trophy"></div>
        <div class="AchievementStory__timeline">
          ${achievements.map((item, index) => `<article><span>0${index + 1}</span><time>${item.year}</time><p>${item.place}</p><h3>${item.title}</h3><small>${item.note}</small></article>`).join("")}
        </div>
      </section>

      <section class="TeamSpotlight" aria-labelledby="team-title">
        <div class="section-heading section-heading--inverse section-heading--split"><div><p class="eyebrow">The people behind the progress</p><h2 id="team-title">COACHED WITH<br>INTENTION</h2></div><a class="text-link" href="#/our-team">Meet the full team ↗</a></div>
        <div class="TeamSpotlight__track">
          ${team.map((member, index) => `<article class="coach-tile"><span class="coach-tile__index">0${index + 1}</span><strong aria-hidden="true">${member.initials}</strong><div><p>${member.role}</p><h3>${member.name}</h3></div></article>`).join("")}
        </div>
      </section>

      <section class="TrainingRhythm" aria-labelledby="rhythm-title">
        <div class="section-heading section-heading--split"><div><p class="eyebrow">Training rhythm</p><h2 id="rhythm-title">FIND YOUR<br>FORMAT</h2></div><p>Start with the structure that fits. The reservation route takes you through current package and venue choices.</p></div>
        <div class="TrainingRhythm__tabs" role="tablist" aria-label="Training formats">
          <button type="button" role="tab" class="is-active" data-training-tab="football" aria-selected="true" aria-controls="training-football">Football</button>
          <button type="button" role="tab" data-training-tab="padel" aria-selected="false" aria-controls="training-padel">Padel</button>
          <button type="button" role="tab" data-training-tab="private" aria-selected="false" aria-controls="training-private">Private</button>
        </div>
        <div class="TrainingRhythm__stage">
          <article id="training-football" class="TrainingRhythm__panel is-active" data-training-panel="football" aria-hidden="false"><span>TEAM DEVELOPMENT</span><h3>2 or 3 days every week</h3><p>Consistent team work with a clear technical rhythm.</p><a class="btn" href="#/reservation">Explore reservation</a></article>
          <article id="training-padel" class="TrainingRhythm__panel" data-training-panel="padel" aria-hidden="true"><span>COURT RESERVATION</span><h3>60, 90 or 120 minutes</h3><p>Choose the court duration that matches your game.</p><a class="btn" href="#/reservation">Choose a court</a></article>
          <article id="training-private" class="TrainingRhythm__panel" data-training-panel="private" aria-hidden="true"><span>FOCUSED COACHING</span><h3>1 on 1, 1 on 2 or 1 on 3</h3><p>More direct feedback, adapted to the people in the session.</p><a class="btn" href="#/personal-trainer">See private training</a></article>
        </div>
      </section>

      <section class="GearShowcase" aria-labelledby="gear-title">
        <div class="section-heading section-heading--split"><div><p class="eyebrow">ASA equipment edit</p><h2 id="gear-title">GEAR FOR THE<br>NEXT REP</h2></div><a class="text-link text-link--dark" href="#/shop">Enter the shop ↗</a></div>
        <div class="GearShowcase__grid">
          ${gear.map((item, index) => `<a class="gear-panel gear-panel--${index + 1}" href="${item.route}"><img src="${item.image}" width="1536" height="1024" loading="lazy" decoding="async" alt="${item.sport} training equipment"><div><span>0${index + 1} / ${item.sport}</span><h3>${item.title}</h3><p>Shop the edit <b aria-hidden="true">↗</b></p></div></a>`).join("")}
        </div>
      </section>

      <section class="SocialPulse" aria-labelledby="social-title">
        <div class="SocialPulse__copy"><p class="eyebrow">Inside ASA</p><h2 id="social-title">THE WORK<br>BETWEEN WINS</h2><p>Training days, people and progress from across the ASA community.</p><div><a class="btn" href="https://www.instagram.com/advancedsportsacademy/" target="_blank" rel="noreferrer">Instagram</a><a class="text-link" href="https://www.tiktok.com/@asa_academy" target="_blank" rel="noreferrer">TikTok ↗</a></div></div>
        <div class="SocialPulse__grid">
          <figure class="social-tile social-tile--wide"><img src="assets/images/hero-football-900.webp" width="900" height="490" loading="lazy" decoding="async" alt="Football training"><figcaption>Build the player</figcaption></figure>
          <figure class="social-tile"><img src="assets/images/hero-padel-900.webp" width="900" height="490" loading="lazy" decoding="async" alt="Padel training"><figcaption>Read the court</figcaption></figure>
          <figure class="social-tile"><img src="assets/images/quote-raed.png" width="569" height="570" loading="lazy" decoding="async" alt="Raed el Saddik"><figcaption>Trust the process</figcaption></figure>
          <figure class="social-tile social-tile--wide"><img src="assets/images/about-asa.png" width="711" height="1079" loading="lazy" decoding="async" alt="ASA sports equipment"><figcaption>Keep moving</figcaption></figure>
        </div>
      </section>

      <section class="TrustWall" aria-labelledby="trust-title">
        <p class="eyebrow" id="trust-title">Partners and sponsors</p>
        <div class="TrustWall__logos">${["assets/images/partner-egypt.png", "assets/images/partner-uae.png", "assets/images/sponsor-nox.png", "assets/images/sponsor-knock.png", "assets/images/sponsor-gerimax.png"].map((src, index) => `<div><img src="${src}" loading="lazy" decoding="async" alt="${index < 2 ? "Partner" : "Sponsor"} logo"></div>`).join("")}</div>
      </section>

      <section class="FinalCTA" aria-labelledby="final-cta-title">
        <img src="assets/images/shop-football-editorial.webp" width="1536" height="1024" loading="lazy" decoding="async" alt="Football training equipment">
        <div class="FinalCTA__shape" aria-hidden="true"></div>
        <div class="FinalCTA__content"><p class="eyebrow">Your next session</p><h2 id="final-cta-title">START WHERE<br>YOU ARE.</h2><p>Choose your discipline. We will help you build the rhythm.</p><div><a class="btn btn--light magnetic-cta" data-magnetic href="#/reservation">Book a Session</a><a class="text-link" href="#/contact-us">Talk to ASA ↗</a></div></div>
      </section>
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
    const edits = [
      { id: 6, sport: "Football", title: "Built for the full ninety", copy: "Training essentials selected for repetition, control and match-day focus.", image: "assets/images/shop-football-editorial.webp" },
      { id: 5, sport: "Padel", title: "Own the next rally", copy: "A focused edit for court movement, cleaner contact and longer sessions.", image: "assets/images/shop-padel-editorial.webp" },
      { id: 4, sport: "Tennis", title: "Control starts here", copy: "Equipment built around balance, feel and point-by-point consistency.", image: "assets/images/shop-tennis-editorial.webp" }
    ];
    return page(`<section class="ShopPage ShopEditorial">
      <header class="ShopEditorial__hero"><div><p class="eyebrow">ASA equipment edit</p><h1>RIGHT GEAR.<br>BETTER RHYTHM.</h1><p>Three disciplines. One focused collection for the work that happens before the result.</p><a class="btn btn--light" href="#/products">Explore all products</a></div><span aria-hidden="true">ASA / SHOP</span></header>
      <div class="ShopEditorial__edits">${edits.map((item, index) => `<article class="shop-edit shop-edit--${index + 1}"><a class="shop-edit__media" href="#/products?academy=${item.id}" aria-label="Shop ${item.sport} equipment"><img src="${item.image}" width="1536" height="1024" ${index === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" alt="${item.sport} training equipment"><span>0${index + 1}</span></a><div><p>${item.sport} edit</p><h2>${item.title}</h2><small>${item.copy}</small><a class="text-link text-link--dark" href="#/products?academy=${item.id}">Shop ${item.sport} ↗</a></div></article>`).join("")}</div>
      <section class="ShopEditorial__closing"><p class="eyebrow">Need a place to use it?</p><h2>TAKE THE GEAR<br>TO THE COURT.</h2><div><a class="btn" href="#/reservation">Book a session</a><a class="text-link text-link--dark" href="#/contact-us">Ask ASA ↗</a></div></section>
    </section>`, "/shop");
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

  function legacyProductPage(id) {
    return page(`<section class="ProductDetailPage"><p class="route-alert" role="status">ID #${escapeHTML(id)} not found</p><div class="product-detail-layout"><div class="broken-media" aria-label="Source product image unavailable"></div><div class="product-detail-copy"><h1>Product</h1><strong>$0.00</strong><form class="local-form quantity-form" data-purpose="add to cart"><label for="quantity">Quantity</label><div class="quantity-control"><button type="button" aria-label="Decrease quantity">−</button><input id="quantity" name="quantity" type="number" min="1" value="1"><button type="button" aria-label="Increase quantity">+</button></div><button class="btn" type="submit">Add To Cart</button><p class="form-note" role="status"></p></form></div></div></section>`, `/product/${id}`);
  }

  function productImage(academyId) {
    const images = {
      6: "assets/images/shop-football-editorial.webp",
      5: "assets/images/shop-padel-editorial.webp",
      4: "assets/images/shop-tennis-editorial.webp"
    };
    return images[academyId] || images[6];
  }

  function productPage(id) {
    const product = (data.products || []).find((item) => String(item.id) === String(id));
    if (!product) return emptyPage("Product not found", `Product ID #${id} was not present in the captured public catalog.`, `/product/${id}`);
    return page(`<section class="ProductDetailPage"><div class="product-detail-layout"><div class="product-detail-media"><img src="${productImage(product.academy_id)}" width="1536" height="1024" alt="${escapeHTML(product.name)}"></div><div class="product-detail-copy"><p class="eyebrow">ASA equipment</p><h1>${escapeHTML(product.name)}</h1><strong>${escapeHTML(product.discount_price || product.price || 0)} USD</strong><form class="local-form quantity-form" data-purpose="add to cart"><label for="quantity">Quantity</label><div class="quantity-control"><button type="button" aria-label="Decrease quantity">−</button><input id="quantity" name="quantity" type="number" min="1" value="1"><button type="button" aria-label="Increase quantity">+</button></div><button class="btn" type="submit">Add To Cart</button><p class="form-note" role="status"></p></form></div></div></section>`, `/product/${id}`);
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
    return page(`<section class="TeamPage TeamDirectory"><header class="TeamDirectory__hero"><p class="eyebrow">Our team</p><h1>THE PEOPLE<br>BEHIND PROGRESS.</h1><p>Directors, coaches and specialists connected by one training standard.</p></header><div class="team-tabs" role="tablist" aria-label="Team departments">${sections.map((section, index) => `<button class="team-tab${index === 0 ? " is-active" : ""}" type="button" role="tab" data-team-id="${section.id}" aria-selected="${index === 0}">${escapeHTML(section.name)}</button>`).join("")}</div><div class="team-content" aria-live="polite"></div></section>`, "/our-team");
  }

  function renderTeamSection(id) {
    const section = (data.employeeSections || []).find((item) => String(item.id) === String(id)) || (data.employeeSections || [])[0];
    const content = document.querySelector(".team-content");
    if (!section || !content) return;
    content.innerHTML = section.employee_sub_sections.map((subsection) => `<section class="team-subsection"><h2>${escapeHTML(subsection.name)}</h2><div class="team-grid">${subsection.employees.map((employee, index) => {
      const initials = fixText(employee.name).split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
      return `<article class="team-card"><div class="team-card__identity"><span>0${index + 1}</span><strong aria-hidden="true">${escapeHTML(initials)}</strong></div><div><h3>${escapeHTML(employee.name)}</h3><p>${escapeHTML(employee.position)}</p></div></article>`;
    }).join("")}</div></section>`).join("");
  }

  function renderProductResults() {
    const search = document.querySelector('[name="product_search"]');
    const category = document.querySelector('[name="product_category"]');
    const academy = document.querySelector('[name="product_academy"]');
    const results = document.querySelector(".product-results");
    if (!search || !category || !academy || !results) return;
    const query = search.value.trim().toLowerCase();
    const matches = (data.products || []).filter((product) => {
      const nameMatches = !query || fixText(product.name).toLowerCase().includes(query);
      const categoryMatches = !category.value || String(product.product_category_id) === category.value;
      const academyMatches = !academy.value || String(product.academy_id) === academy.value;
      return nameMatches && categoryMatches && academyMatches;
    });
    results.innerHTML = matches.length ? `<div class="product-grid">${matches.map((product) => `<article class="product-card"><a href="#/product/${product.id}"><img src="${productImage(product.academy_id)}" width="1536" height="1024" loading="lazy" decoding="async" alt=""><span>${escapeHTML(product.name)}</span></a><strong>${escapeHTML(product.discount_price || product.price || 0)} USD</strong></article>`).join("")}</div>` : `<p class="no-results">No products found.</p>`;
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
    bindScrollProgress();
    bindMegaMenu();
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

    if (path === "/") {
      bindHero();
      bindAcademyExplorer();
      bindStorySteps();
      bindCounters();
      bindTrainingPlanner();
      bindMagneticCTA();
    }
    if (path === "/our-team") {
      const firstTab = document.querySelector(".team-tab");
      if (firstTab) renderTeamSection(firstTab.dataset.teamId);
      const teamTabs = Array.from(document.querySelectorAll(".team-tab"));
      teamTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          document.querySelectorAll(".team-tab").forEach((item) => {
            const selected = item === tab;
            item.classList.toggle("is-active", selected);
            item.setAttribute("aria-selected", String(selected));
          });
          renderTeamSection(tab.dataset.teamId);
        });
      });
      bindTabKeyboard(teamTabs, (index) => teamTabs[index].click());
    }
    if (path === "/products") {
      const academyParam = new URLSearchParams(window.location.hash.split("?")[1] || "").get("academy");
      const academySelect = document.querySelector('[name="product_academy"]');
      if (academyParam && academySelect) academySelect.value = academyParam;
      document.querySelectorAll('[name="product_search"], [name="product_category"], [name="product_academy"]').forEach((control) => {
        control.addEventListener("input", renderProductResults);
        control.addEventListener("change", renderProductResults);
      });
      renderProductResults();
    }
    hydrateForms();
    bindReveals();
  }

  function bindTabKeyboard(tabs, activate) {
    tabs.forEach((tab, index) => tab.addEventListener("keydown", (event) => {
      const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      activate(next);
      tabs[next].focus();
    }));
  }

  function bindMegaMenu() {
    if (megaOutsideHandler) document.removeEventListener("pointerdown", megaOutsideHandler);
    if (megaKeyHandler) document.removeEventListener("keydown", megaKeyHandler);
    const group = document.querySelector(".Header__academy");
    const trigger = document.querySelector(".Header__academy-trigger");
    const menu = document.querySelector(".Header__mega");
    if (!group || !trigger || !menu) return;

    const close = (returnFocus = false) => {
      group.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
      menu.setAttribute("aria-hidden", "true");
      if (returnFocus) trigger.focus();
    };
    const open = () => {
      group.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
      menu.setAttribute("aria-hidden", "false");
    };

    trigger.addEventListener("click", () => group.classList.contains("is-open") ? close() : open());
    menu.addEventListener("click", (event) => { if (event.target.closest("a")) close(); });
    megaOutsideHandler = (event) => { if (!group.contains(event.target)) close(); };
    megaKeyHandler = (event) => { if (event.key === "Escape" && group.classList.contains("is-open")) close(true); };
    document.addEventListener("pointerdown", megaOutsideHandler);
    document.addEventListener("keydown", megaKeyHandler);
  }

  function bindAcademyExplorer() {
    const tabs = Array.from(document.querySelectorAll("[data-academy-tab]"));
    const panels = Array.from(document.querySelectorAll("[data-academy-panel]"));
    if (!tabs.length || !panels.length) return;
    const activate = (id) => {
      tabs.forEach((tab) => {
        const selected = tab.dataset.academyTab === id;
        tab.classList.toggle("is-active", selected);
        tab.setAttribute("aria-selected", String(selected));
      });
      panels.forEach((panel) => {
        const selected = panel.dataset.academyPanel === id;
        panel.classList.toggle("is-active", selected);
        panel.setAttribute("aria-hidden", String(!selected));
      });
    };
    tabs.forEach((tab) => tab.addEventListener("click", () => activate(tab.dataset.academyTab)));
    bindTabKeyboard(tabs, (index) => activate(tabs[index].dataset.academyTab));
  }

  function bindStorySteps() {
    if (storyObserver) storyObserver.disconnect();
    const steps = Array.from(document.querySelectorAll("[data-story-step]"));
    const title = document.querySelector("[data-story-title]");
    if (!steps.length || !title) return;
    const activate = (step) => {
      title.textContent = step.dataset.storyLabel || "ASA";
      steps.forEach((item) => {
        const selected = item === step;
        item.classList.toggle("is-active", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
    };
    steps.forEach((step) => step.addEventListener("click", () => activate(step)));
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    storyObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) activate(visible.target);
    }, { root, rootMargin: "-30% 0px -30% 0px", threshold: [0.25, 0.6] });
    steps.forEach((step) => storyObserver.observe(step));
  }

  function bindCounters() {
    if (counterObserver) counterObserver.disconnect();
    const counters = Array.from(document.querySelectorAll("[data-counter]"));
    if (!counters.length) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const run = (counter) => {
      const target = Number(counter.dataset.counter || 0);
      if (reduced) {
        counter.textContent = String(target);
        return;
      }
      const started = performance.now();
      const tick = (now) => {
        const progress = Math.min(1, (now - started) / 900);
        const eased = 1 - Math.pow(1 - progress, 4);
        counter.textContent = String(Math.round(target * eased));
        if (progress < 1 && counter.isConnected) window.requestAnimationFrame(tick);
      };
      window.requestAnimationFrame(tick);
    };
    if (!("IntersectionObserver" in window)) {
      counters.forEach(run);
      return;
    }
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      run(entry.target);
      observer.unobserve(entry.target);
    }), { root, threshold: 0.55 });
    counterObserver = observer;
    counters.forEach((counter) => observer.observe(counter));
  }

  function bindTrainingPlanner() {
    const tabs = Array.from(document.querySelectorAll("[data-training-tab]"));
    const panels = Array.from(document.querySelectorAll("[data-training-panel]"));
    if (!tabs.length || !panels.length) return;
    tabs.forEach((tab) => tab.addEventListener("click", () => {
      const id = tab.dataset.trainingTab;
      tabs.forEach((item) => {
        const selected = item === tab;
        item.classList.toggle("is-active", selected);
        item.setAttribute("aria-selected", String(selected));
      });
      panels.forEach((panel) => {
        const selected = panel.dataset.trainingPanel === id;
        panel.classList.toggle("is-active", selected);
        panel.setAttribute("aria-hidden", String(!selected));
      });
    }));
    bindTabKeyboard(tabs, (index) => tabs[index].click());
  }

  function bindMagneticCTA() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    document.querySelectorAll("[data-magnetic]").forEach((element) => {
      element.addEventListener("pointermove", (event) => {
        const bounds = element.getBoundingClientRect();
        const horizontal = (event.clientX - bounds.left) / bounds.width;
        const vertical = (event.clientY - bounds.top) / bounds.height;
        element.classList.remove("magnetic-left", "magnetic-right", "magnetic-up", "magnetic-down");
        if (horizontal < 0.35) element.classList.add("magnetic-left");
        else if (horizontal > 0.65) element.classList.add("magnetic-right");
        if (vertical < 0.4) element.classList.add("magnetic-up");
        else if (vertical > 0.6) element.classList.add("magnetic-down");
      });
      element.addEventListener("pointerleave", () => element.classList.remove("magnetic-left", "magnetic-right", "magnetic-up", "magnetic-down"));
    });
  }

  function bindScrollProgress() {
    const progress = document.querySelector(".Header__progress");
    if (!progress) return;

    const update = () => {
      const distance = Math.max(1, root.scrollHeight - root.clientHeight);
      progress.value = Math.min(1, Math.max(0, root.scrollTop / distance));
      revealVisibleElements();
      scrollProgressFrame = 0;
    };

    root.onscroll = () => {
      if (scrollProgressFrame) return;
      scrollProgressFrame = window.requestAnimationFrame(update);
    };
    update();
  }

  function bindReveals() {
    if (revealObserver) revealObserver.disconnect();
    revealObserver = null;

    const groups = [
      ".section-heading",
      ".value-rail__item",
      ".AcademyExplorer__tabs > button, .AcademyExplorer__stage",
      ".ASAStory__media, .ASAStory__intro",
      ".ASAMetrics__heading, .ASAMetrics__grid article",
      ".AchievementStory__lead, .AchievementStory__timeline article",
      ".coach-tile",
      ".TrainingRhythm > .section-heading, .TrainingRhythm__tabs, .TrainingRhythm__stage",
      ".GearShowcase > .section-heading, .gear-panel",
      ".SocialPulse__copy, .social-tile",
      ".TrustWall__logos > div",
      ".FinalCTA__content",
      ".ShopEditorial__hero > *, .shop-edit, .ShopEditorial__closing",
      ".TeamDirectory__hero > *, .team-tab",
      ".section-title",
      ".value-card",
      ".academy-card",
      ".member-card",
      ".AboutASA__image, .AboutASA__copy",
      ".OurPartner .logo-card",
      ".OurSponsors .logo-card",
      ".OurCommitment__copy, .OurCommitment img",
      ".achievements-layout > *",
      ".Raed__quote, .Raed__image",
      ".Youtube__image, .Youtube .btn",
      ".page-hero__media, .page-hero__copy > *",
      ".quote-band blockquote",
      ".detail-section__copy, .detail-section__image",
      ".gallery-row > *",
      ".shop-offer",
      ".category-offer",
      ".team-card",
      ".product-card",
      ".FormPage__card, .ContactPage__card, .AuthPage__card",
      ".Footer__grid > *"
    ];

    const elements = new Set();
    groups.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element, index) => {
        element.classList.add("reveal", `reveal-delay-${Math.min(index, 4)}`);
        if (element.matches(".section-title, .section-heading, .ASAMetrics__heading, .TeamDirectory__hero > h1, .ShopEditorial__hero > div")) element.classList.add("reveal--title");
        if (element.matches(".academy-card, .member-card, .logo-card, .shop-offer, .category-offer, .team-card, .product-card, .value-rail__item, .coach-tile")) element.classList.add("reveal--card");
        if (element.matches("img, .page-hero__media, .gallery-row > *, .AcademyExplorer__stage, .gear-panel, .social-tile, .shop-edit")) element.classList.add("reveal--media");
        if (element.matches(".AboutASA__image, .OurCommitment__copy, .achievements-layout > img, .Raed__quote, .detail-section__copy, .page-hero__media, .ASAStory__media, .AchievementStory__lead, .SocialPulse__copy")) element.classList.add("reveal--left");
        if (element.matches(".AboutASA__copy, .OurCommitment img, .achievements-copy, .Raed__image, .detail-section__image, .page-hero__copy > *, .ASAStory__intro, .TrainingRhythm__stage")) element.classList.add("reveal--right");
        if (element.matches(".AchievementStory__timeline article:nth-child(even), .social-tile:nth-child(even), .shop-edit:nth-child(even)")) element.classList.add("reveal--rotate");
        elements.add(element);
      });
    });

    if (!elements.size) return;
    pendingRevealElements = elements;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const revealElement = (element, observer) => {
      element.classList.add("is-visible");
      pendingRevealElements.delete(element);
      observer.unobserve(element);
    };
    revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        revealElement(entry.target, observer);
      });
      const rootRect = root.getBoundingClientRect();
      elements.forEach((element) => {
        if (element.classList.contains("is-visible")) return;
        const rect = element.getBoundingClientRect();
        if (rect.bottom > rootRect.top && rect.top < rootRect.bottom) revealElement(element, observer);
      });
    }, {
      root,
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.12
    });
    elements.forEach((element) => revealObserver.observe(element));
  }

  function revealVisibleElements() {
    if (!pendingRevealElements.size) return;
    const rootRect = root.getBoundingClientRect();
    pendingRevealElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.bottom <= rootRect.top || rect.top >= rootRect.bottom) return;
      element.classList.add("is-visible");
      pendingRevealElements.delete(element);
      if (revealObserver) revealObserver.unobserve(element);
    });
  }

  function bindHero() {
    const banner = document.querySelector(".HomeBanner");
    const slides = Array.from(document.querySelectorAll(".HomeBanner__slide"));
    const pages = Array.from(document.querySelectorAll("[data-hero-page]"));
    if (!banner || !slides.length) return;
    let current = 0;
    const show = (index) => {
      const next = (index + slides.length) % slides.length;
      if (next === current) return;
      const forwardDistance = (next - current + slides.length) % slides.length;
      banner.classList.toggle("is-moving-forward", forwardDistance <= slides.length / 2);
      banner.classList.toggle("is-moving-backward", forwardDistance > slides.length / 2);
      current = next;
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
        slide.toggleAttribute("inert", !selected);
      });
      pages.forEach((page, pageIndex) => {
        const selected = pageIndex === current;
        page.setAttribute("aria-selected", String(selected));
        if (selected) page.setAttribute("aria-current", "true");
        else page.removeAttribute("aria-current");
      });
    };
    document.querySelector(".HomeBanner__arrow--prev").addEventListener("click", () => show(current - 1));
    document.querySelector(".HomeBanner__arrow--next").addEventListener("click", () => show(current + 1));
    pages.forEach((page) => page.addEventListener("click", () => show(Number(page.dataset.heroPage))));
    bindTabKeyboard(pages, (index) => show(index));

    if (window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) {
      let pointerFrame = 0;
      let pointerZone = "";
      banner.addEventListener("pointermove", (event) => {
        const bounds = banner.getBoundingClientRect();
        const ratio = (event.clientX - bounds.left) / bounds.width;
        pointerZone = ratio < 0.42 ? "motion-left" : ratio > 0.58 ? "motion-right" : "";
        if (pointerFrame) return;
        pointerFrame = window.requestAnimationFrame(() => {
          banner.classList.remove("motion-left", "motion-right");
          if (pointerZone) banner.classList.add(pointerZone);
          pointerFrame = 0;
        });
      }, { passive: true });
      banner.addEventListener("pointerleave", () => banner.classList.remove("motion-left", "motion-right"));
    }
  }

  function render() {
    if (revealObserver) revealObserver.disconnect();
    revealObserver = null;
    pendingRevealElements = new Set();
    if (storyObserver) storyObserver.disconnect();
    storyObserver = null;
    if (counterObserver) counterObserver.disconnect();
    counterObserver = null;
    if (scrollProgressFrame) window.cancelAnimationFrame(scrollProgressFrame);
    scrollProgressFrame = 0;
    root.onscroll = null;
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
      "/sign-in": "ASA | Sign In",
      "/sign-up": "ASA | Sign Up",
      "/forgot-password": "ASA | Reset Password",
      "/checkout": "ASA | Checkout",
      "/notifications": "ASA | Notification",
      "/order-details": "ASA | Order Detail",
      "/qr": "ASA | Sections"
    };
    const productHeading = document.querySelector(".ProductDetailPage h1, .EmptyPage h1");
    document.title = /^\/enroll\//.test(path) ? "ASA | Enroll" : /^\/product\//.test(path) && productHeading ? `ASA | ${productHeading.textContent.trim()}` : (routeTitles[path] || "Advanced Sports Academy");
  }

  window.addEventListener("hashchange", render);
  render();
})();

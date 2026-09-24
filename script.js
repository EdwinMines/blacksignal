(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const page = document.body;

  if (page?.dataset.page === "home" && !reduceMotion) {
    page.classList.add("home-entering");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => page.classList.add("is-ready"));
    });
  } else {
    page?.classList.add("is-ready");
  }

  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const open = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });

    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        navToggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
      }
    });
  }

  const revealSelectors = {
    home: [
      ".transmission-label",
      ".transmission p",
      ".situation .section-heading > *",
      ".situation-copy > *",
      ".data-grid > div > *",
      ".home-registration-meter > *",
      ".corporate-record__body > *",
      ".factions-section .section-code",
      ".factions-section h2",
      ".factions-section .split-heading > p",
      ".faction-card > h3",
      ".faction-card > p:not(.section-code)",
      ".faction-card > a",
      ".protocol .section-heading > *",
      ".protocol-list > li",
      ".final-cta .section-code",
      ".final-cta h2"
    ],
    factions: [
      ".dossier-number",
      ".dossier-body > .section-code",
      ".dossier-body > h2",
      ".dossier-intro",
      ".article-block > *",
      ".notice > *",
      ".final-cta .section-code",
      ".final-cta h2"
    ],
    info: [
      ".content-section > .shell > .section-code",
      ".info-cell > *",
      ".section-heading > *",
      ".brief-card > *",
      ".final-cta .section-code",
      ".final-cta h2"
    ],
    briefing: [
      ".content-section .section-heading > *",
      ".side-choice .section-code",
      ".side-choice h2",
      ".side-intro",
      ".gameplay-loop > li",
      ".fit-note > *",
      ".side-action",
      ".common-brief .brief-card > *",
      ".final-cta .section-code",
      ".final-cta h2"
    ],
    register: [
      ".registration-copy > *",
      ".registration-card__body > *",
      ".registration-stats__head > *",
      ".registration-bar"
    ]
  };

  const selectors = revealSelectors[page?.dataset.page];
  if (selectors) {
    const revealElements = Array.from(document.querySelectorAll(selectors.join(",")));

    revealElements.forEach((element) => {
      element.classList.add("reveal-copy");
      if (element.matches("h2, h3")) element.classList.add("reveal-title");

      const siblings = Array.from(element.parentElement?.children || [])
        .filter((sibling) => revealElements.includes(sibling));
      const siblingIndex = Math.max(0, siblings.indexOf(element));
      element.style.setProperty("--reveal-delay", `${Math.min(siblingIndex * 75, 300)}ms`);
    });

    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealElements.forEach((element) => element.classList.add("is-visible"));
    } else {
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: .12, rootMargin: "0px 0px -7%" });

      revealElements.forEach((element) => revealObserver.observe(element));
    }
  }

  const statsRoots = Array.from(document.querySelectorAll("[data-registration-stats]"));
  statsRoots.forEach((statsRoot) => {
    const endpoint = statsRoot.dataset.endpoint?.trim();
    const status = statsRoot.querySelector("[data-stats-status]");
    const keys = ["aegis", "brodyagi", "morrow"];

    const setStatus = (message, state) => {
      if (status) status.textContent = message;
      statsRoot.dataset.state = state;
    };

    const renderStats = (data) => {
      const counts = data?.factions || {};
      const total = Number.isFinite(Number(data?.total)) ? Number(data.total) : 0;
      const totalField = statsRoot.querySelector('[data-stat="total"]');
      const capacityBar = statsRoot.querySelector('[data-bar="capacity"]');
      if (totalField) totalField.textContent = String(total);
      if (capacityBar) capacityBar.style.width = `${Math.min(100, Math.max(0, total))}%`;

      keys.forEach((key) => {
        const count = Number(counts[key]?.count) || 0;
        const field = statsRoot.querySelector(`[data-stat="${key}"]`);
        const bar = statsRoot.querySelector(`[data-bar="${key}"]`);
        if (field) field.textContent = String(count);
        if (bar) bar.style.width = `${total > 0 ? Math.min(100, (count / total) * 100) : 0}%`;
      });

      setStatus("Актуальные данные", "ready");
    };

    if (!endpoint) {
      setStatus("Статистика недоступна", "unconfigured");
    } else {
      setStatus("Обновление…", "loading");
      fetch(endpoint, { redirect: "follow", cache: "no-store" })
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        })
        .then(renderStats)
        .catch(() => setStatus("Статистика временно недоступна.", "error"));
    }
  });

  const countdown = document.querySelector("[data-countdown]");
  if (!countdown) return;

  const target = new Date(countdown.dataset.countdown).getTime();
  const glyphs = "#%?+=/<>[]";
  const fields = {
    days: countdown.querySelector('[data-unit="days"]'),
    hours: countdown.querySelector('[data-unit="hours"]'),
    minutes: countdown.querySelector('[data-unit="minutes"]'),
    seconds: countdown.querySelector('[data-unit="seconds"]')
  };

  const getValues = () => {
    const remaining = Math.max(0, target - Date.now());
    return {
      remaining,
      days: Math.floor(remaining / 86400000),
      hours: Math.floor((remaining / 3600000) % 24),
      minutes: Math.floor((remaining / 60000) % 60),
      seconds: Math.floor((remaining / 1000) % 60)
    };
  };

  const render = (values) => {
    Object.entries(fields).forEach(([unit, field]) => {
      const value = values[unit];
      if (field) field.textContent = String(value).padStart(2, "0");
    });
  };

  let timer;
  let decoding = false;
  let decoded = false;

  const update = () => {
    const values = getValues();
    if (!decoding) render(values);

    if (values.remaining === 0) {
      countdown.setAttribute("aria-label", "Операция началась");
      clearInterval(timer);
    }
  };

  const decode = () => {
    if (decoded) return;
    decoded = true;

    if (reduceMotion) {
      update();
      return;
    }

    decoding = true;
    countdown.classList.add("is-decoding");
    countdown.setAttribute("aria-busy", "true");
    countdown.setAttribute("aria-live", "off");

    const units = Object.keys(fields);
    const start = performance.now();
    const baseDuration = 680;
    const unitDelay = 150;

    const frame = (now) => {
      const elapsed = now - start;
      const values = getValues();
      let complete = true;

      units.forEach((unit, index) => {
        const field = fields[unit];
        if (!field) return;

        const duration = baseDuration + index * 120;
        const progress = Math.max(0, Math.min(1, (elapsed - index * unitDelay) / duration));
        const finalValue = String(values[unit]).padStart(2, "0");

        if (progress < 1) {
          complete = false;
          field.textContent = Array.from(finalValue, (character, characterIndex) => {
            const revealAt = .58 + characterIndex * .18;
            return progress >= revealAt
              ? character
              : glyphs[Math.floor(Math.random() * glyphs.length)];
          }).join("");
        } else {
          field.textContent = finalValue;
          field.parentElement?.classList.add("is-resolved");
        }
      });

      if (!complete) {
        requestAnimationFrame(frame);
        return;
      }

      decoding = false;
      countdown.classList.remove("is-decoding");
      countdown.classList.add("is-decoded");
      countdown.setAttribute("aria-busy", "false");
      countdown.setAttribute("aria-live", "polite");
      update();
    };

    requestAnimationFrame(frame);
  };

  update();
  if (Date.now() < target) timer = setInterval(update, 1000);

  if ("IntersectionObserver" in window && !reduceMotion) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      decode();
    }, { threshold: .28 });
    observer.observe(countdown);
  } else {
    decode();
  }
})();

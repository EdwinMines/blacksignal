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

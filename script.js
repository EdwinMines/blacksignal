(() => {
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
  const fields = {
    days: countdown.querySelector('[data-unit="days"]'),
    hours: countdown.querySelector('[data-unit="hours"]'),
    minutes: countdown.querySelector('[data-unit="minutes"]'),
    seconds: countdown.querySelector('[data-unit="seconds"]')
  };

  const update = () => {
    const remaining = Math.max(0, target - Date.now());
    const values = {
      days: Math.floor(remaining / 86400000),
      hours: Math.floor((remaining / 3600000) % 24),
      minutes: Math.floor((remaining / 60000) % 60),
      seconds: Math.floor((remaining / 1000) % 60)
    };

    Object.entries(values).forEach(([unit, value]) => {
      if (fields[unit]) fields[unit].textContent = String(value).padStart(2, "0");
    });

    if (remaining === 0) {
      countdown.setAttribute("aria-label", "Операция началась");
      clearInterval(timer);
    }
  };

  let timer;
  update();
  if (Date.now() < target) timer = setInterval(update, 1000);
})();

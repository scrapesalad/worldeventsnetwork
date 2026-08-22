(function () {
  const labels = {
    en: { nav: ["About", "Expertise", "Work", "Let's Talk"], focus: "Focus" },
    da: { nav: ["Om", "Ekspertise", "Arbejde", "Lad os tale"], focus: "Fokus" },
    pt: { nav: ["Sobre", "Especialidades", "Trabalho", "Vamos conversar"], focus: "Foco" },
    es: { nav: ["Acerca", "Experiencia", "Trabajo", "Hablemos"], focus: "Idioma" }
  };
  const buttonLabels = { en: "English", da: "Dansk", pt: "Português", es: "Español" };

  function ensureSpanishButton() {
    const options = document.querySelector(".site-footer-language-options");
    if (!options || options.querySelector('[data-language-code="es"]')) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "site-footer-language-button";
    button.setAttribute("aria-pressed", "false");
    button.dataset.languageCode = "es";
    button.innerHTML = '<span class="site-footer-language-button-fill" aria-hidden="true"></span><span class="site-footer-language-button-text" data-text="Español"><span>Español</span></span>';
    options.appendChild(button);
  }

  function applyLanguage(code) {
    const copy = labels[code] || labels.en;
    document.documentElement.lang = code;
    document.querySelectorAll(".site-footer-language-button").forEach((button) => {
      const label = button.textContent.trim();
      const active = button.dataset.languageCode === code || (!button.dataset.languageCode && label === buttonLabels[code]);
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    document.querySelectorAll(".topbar-nav .topbar-link-label, .site-footer-nav a").forEach((element, index) => {
      element.textContent = copy.nav[index % 4];
    });
    const focusTitle = document.querySelector(".site-footer-language-title");
    if (focusTitle) focusTitle.textContent = copy.focus;
    document.body.dataset.language = code;
  }

  function bind() {
    ensureSpanishButton();
    document.querySelectorAll(".site-footer-language-button").forEach((button) => {
      if (button.dataset.languageBound === "true") return;
      button.dataset.languageBound = "true";
      button.addEventListener("click", () => {
        const label = button.dataset.languageCode || button.textContent.trim();
        const code = Object.keys(buttonLabels).find((key) => buttonLabels[key] === label) || "en";
        applyLanguage(code);
        window.setTimeout(() => applyLanguage(code), 0);
      });
    });
  }

  bind();
  new MutationObserver(bind).observe(document.body, { childList: true, subtree: true });
})();

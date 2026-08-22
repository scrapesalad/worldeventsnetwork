(() => {
  const form = document.querySelector('[data-wen-contact-form]');
  if (!form) return;
  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector('[data-wen-form-status]');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      if (status) status.textContent = 'Please complete the required fields.';
      return;
    }
    if (button?.disabled) return;
    if (button) button.disabled = true;
    if (status) status.textContent = 'Submission routing is not configured yet. Please use the LinkedIn contact link below.';
  });
})();

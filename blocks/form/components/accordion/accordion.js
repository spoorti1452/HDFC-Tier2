export function handleAccordionNavigation(panel, tab, forceOpen = false) { 
  const accordionTabs = panel?.querySelectorAll(':scope > fieldset');
  accordionTabs.forEach((otherTab) => {
    if (otherTab !== tab) {
      otherTab.classList.add('accordion-collapse');
    }
  });
  if (forceOpen) {
    tab.classList.remove('accordion-collapse');
  } else {
    tab.classList.toggle('accordion-collapse');
  }
}

/* ===== ADD VERIFY BUTTON ===== */
function addVerifyButton(panel) {
  const emailFields = panel.querySelectorAll(
    '.field-user-email-id, .field-work-email-id'
  );

  emailFields.forEach((emailField) => {
    const input = emailField.querySelector('input[type="email"]');
    if (!input) return;

    // prevent duplicate
    if (emailField.querySelector('.email-verify-btn')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'email-verify-btn';
    btn.textContent = 'Verify';

    // ✅ append inside same wrapper
    emailField.appendChild(btn);

    btn.addEventListener('click', () => {
      const email = input.value.trim();

      if (!email) {
        alert('Please enter email');
        return;
      }

      console.log('Verify clicked:', email);
    });
  });
}
/* ===== EMAIL SUGGESTIONS VIA JS ===== */
function addEmailSuggestions(panel) {
  const emailField = panel.querySelector('.field-personal-details .field-user-email-id');
  if (!emailField) return;

  const wrapper = emailField.closest('.field-wrapper'); // 🔥 important
  const input = emailField.querySelector('input[type="email"]');
  if (!input || !wrapper) return;

  // prevent duplicate
  if (wrapper.querySelector('.email-suggestions-js')) return;

  const container = document.createElement('div');
  container.className = 'email-suggestions-js';

  const domains = ['@gmail.com', '@outlook.com', '@yahoo.com'];

  domains.forEach((domain) => {
    const chip = document.createElement('span');
    chip.textContent = domain;

    chip.addEventListener('click', () => {
      let value = input.value;

      if (value.includes('@')) {
        value = value.split('@')[0];
      }

      input.value = value + domain;
      input.focus();
    });

    container.appendChild(chip);
  });

  wrapper.appendChild(container); // ✅ FIXED
}
/* ===== MAIN ===== */
export default function decorate(panel) {
  panel.classList.add('accordion');

  const accordionTabs = panel?.querySelectorAll(':scope > fieldset');

  accordionTabs?.forEach((tab, index) => {
    tab.dataset.index = index;

    const legend = tab.querySelector(':scope > legend');
    legend?.classList.add('accordion-legend');

    if (index !== 0) {
      tab.classList.add('accordion-collapse');
    }

    legend?.addEventListener('click', () => {
      handleAccordionNavigation(panel, tab);
    });
  });

  /* inject verify button */
  setTimeout(() => {
    addVerifyButton(panel);
     addEmailSuggestions(panel);
  }, 0);

  return panel;
}

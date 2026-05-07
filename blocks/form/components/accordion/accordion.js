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

    if (emailField.querySelector('.email-verify-btn')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'email-verify-btn';
    btn.textContent = 'Verify';

    emailField.appendChild(btn);

    /* ===== SEND OTP ===== */
    btn.addEventListener('click', async () => {
      const email = input.value.trim();

      if (!email) {
        alert('Please enter email');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert('Enter valid email');
        return;
      }

      try {
        const res = await fetch(
          'https://ricotta-overcook-abrasive.ngrok-free.dev/api/sendEmailOtp',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          }
        );

        const data = await res.json();

        if (data?.status?.responseCode === "0") {

          alert(`OTP sent: ${data.responseString.otpValue}`);

          emailField.setAttribute('data-email', email);

          input.setAttribute('readonly', true);

          showOtpField(emailField, input);

        } else {
          alert('Failed to send OTP');
        }

      } catch (e) {
        console.error(e);
        alert('API Error');
      }
    });
  });
}

/* ===== OTP FIELD ===== */
function showOtpField(emailField, input) {
  if (emailField.querySelector('.otp-container')) return;

  const container = document.createElement('div');
  container.className = 'otp-container';

  const otpInput = document.createElement('input');
  otpInput.type = 'text';
  otpInput.placeholder = 'Enter OTP';
  otpInput.className = 'otp-input';

  otpInput.setAttribute('autocomplete', 'one-time-code');
  otpInput.setAttribute('inputmode', 'numeric');
  otpInput.setAttribute('maxlength', '6');
  otpInput.name = 'otp_input_unique'; // prevent AEM overwrite

  const verifyBtn = document.createElement('button');
  verifyBtn.textContent = 'Submit OTP';
  verifyBtn.className = 'otp-submit-btn';

  container.appendChild(otpInput);
  container.appendChild(verifyBtn);

  emailField.appendChild(container);

  /* ===== VERIFY OTP ===== */
  verifyBtn.addEventListener('click', async () => {
    const otp = otpInput.value.trim();

    const email = emailField.getAttribute('data-email');

    if (!otp) {
      alert('Please enter OTP');
      return;
    }

    if (!email || !email.includes('@')) {
      alert('Email invalid. Please verify again.');
      return;
    }

    try {
      const res = await fetch(
        'https://ricotta-overcook-abrasive.ngrok-free.dev/api/verifyEmailOtp',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            otpValue: otp
          })
        }
      );

      const data = await res.json();

      if (data?.responseString?.otpValid === "Y") {

        window.emailVerified = true;

        alert('Email Verified');

        const mainBtn = emailField.querySelector('.email-verify-btn');
        if (mainBtn) {
          mainBtn.textContent = 'Verified';
          mainBtn.style.color = 'green';
          mainBtn.disabled = true;
        }

        otpInput.disabled = true;
        verifyBtn.disabled = true;

        // OPTIONAL: remove OTP field
        // container.remove();

      } else {
        alert('Invalid OTP');
      }

    } catch (e) {
      console.error(e);
      alert('Verify API Error');
    }
  });
}

/* ===== EMAIL SUGGESTIONS ===== */
function addEmailSuggestions(panel) {
  const emailFields = panel.querySelectorAll('.field-user-email-id');

  emailFields.forEach((emailField) => {
    const wrapper = emailField.closest('.field-wrapper');
    const input = emailField.querySelector('input[type="email"]');

    if (!wrapper || !input) return;
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

    wrapper.appendChild(container);
  });
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

  // 🔥 DELAY FOR AEM RENDER
  setTimeout(() => {
    addVerifyButton(panel);
    addEmailSuggestions(panel);
  }, 300);

  return panel;
}
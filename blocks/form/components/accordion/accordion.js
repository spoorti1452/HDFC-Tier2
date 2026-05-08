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

  // prevent duplicate OTP field
  if (emailField.querySelector('.otp-container')) return;

  /* ===== OTP CONTAINER ===== */
  const container = document.createElement('div');
  container.className = 'otp-container';

  /* ===== OTP INPUT ===== */
  const otpInput = document.createElement('input');

  otpInput.type = 'text';
  otpInput.placeholder = 'Enter OTP';
  otpInput.className = 'otp-input';

  // IMPORTANT FOR AEM
  otpInput.setAttribute('autocomplete', 'off');
  otpInput.setAttribute('data-ignore', 'true');
  otpInput.setAttribute('data-aem-ignore', 'true');

  otpInput.setAttribute('inputmode', 'numeric');
  otpInput.setAttribute('maxlength', '6');

  // remove AEM binding
  otpInput.removeAttribute('name');
  otpInput.removeAttribute('id');

  /* ===== SUBMIT BUTTON ===== */
  const verifyBtn = document.createElement('button');

  verifyBtn.type = 'button';
  verifyBtn.textContent = 'Submit OTP';
  verifyBtn.className = 'otp-submit-btn';

  /* ===== APPEND ===== */
  container.appendChild(otpInput);
  container.appendChild(verifyBtn);

  // append INSIDE email wrapper
  emailField.appendChild(container);

  /* ===== VERIFY OTP ===== */
  verifyBtn.addEventListener('click', async () => {

    const otp = otpInput.value.trim();

    const email = emailField.getAttribute('data-email');

    // no alert
    if (!otp) {
      verifyBtn.textContent = 'Enter OTP';
      verifyBtn.style.background = '#dc2626';
      return;
    }

    try {

      // disable button while verifying
      verifyBtn.disabled = true;
      verifyBtn.textContent = 'Verifying...';

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

      /* ===== SUCCESS ===== */
      if (data?.responseString?.otpValid === "Y") {

        // top verify button
        const mainBtn = emailField.querySelector('.email-verify-btn');

        if (mainBtn) {
          mainBtn.textContent = 'Verified';
          mainBtn.style.color = 'green';
          mainBtn.disabled = true;
        }

        // disable otp field
        otpInput.disabled = true;

        // success state
        verifyBtn.textContent = 'Verified';
        verifyBtn.style.background = '#16a34a';

      } else {

        // invalid otp
        verifyBtn.disabled = false;
        verifyBtn.textContent = 'Invalid OTP';
        verifyBtn.style.background = '#dc2626';

      }

    } catch (e) {

      console.error(e);

      verifyBtn.disabled = false;
      verifyBtn.textContent = 'Error';
      verifyBtn.style.background = '#dc2626';

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
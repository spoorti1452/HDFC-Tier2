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

    // ✅ SEND OTP (THIS WAS MISSING)
    btn.addEventListener('click', async () => {
      const email = input.value.trim();

      if (!email) {
        alert('Please enter email');
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

          // 👉 CREATE OTP INPUT
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

function showOtpField(emailField, input) {
  if (emailField.querySelector('.otp-container')) return;

  const container = document.createElement('div');
  container.className = 'otp-container';

  const otpInput = document.createElement('input');
  otpInput.type = 'text';
  otpInput.placeholder = 'Enter OTP';

  const verifyBtn = document.createElement('button');
  verifyBtn.textContent = 'Submit OTP';

  container.appendChild(otpInput);
  container.appendChild(verifyBtn);

  emailField.appendChild(container);

  // ✅ VERIFY OTP
  verifyBtn.addEventListener('click', async () => {
    const otp = otpInput.value.trim();
    const email = input.value.trim();

    const res = await fetch(
      'https://ricotta-overcook-abrasive.ngrok-free.dev/api/verifyEmailOtp',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpValue: otp })
      }
    );

    const data = await res.json();

    if (data?.responseString?.otpValid === "Y") {

      // ✅ THIS IS IMPORTANT
      window.emailVerified = true;

      alert('Email Verified ✅');

      const btn = emailField.querySelector('.email-verify-btn');
      btn.textContent = 'Verified';
      btn.disabled = true;

      container.remove();

    } else {
      alert('Invalid OTP ❌');
    }
  });
}
/* ===== EMAIL SUGGESTIONS VIA JS ===== */
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

  requestAnimationFrame(() => {
    addVerifyButton(panel);
    addEmailSuggestions(panel);
  });

  return panel;
}
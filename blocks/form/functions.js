let otpResendAttemptsLeft = 3;
let otpTimerInterval = null;

/**
 * Get Full Name
 * @name getFullName Concats first name and last name
 * @param {string} firstname in Stringformat
 * @param {string} lastname in Stringformat
 * @return {string}
 */
function getFullName(firstname, lastname) {
  return `${firstname} ${lastname}`.trim();
}

/**
 * Custom submit function
 * @param {scope} globals
 */
function submitFormArrayToString(globals) {
  const data = globals.functions.exportData();
  Object.keys(data).forEach((key) => {
    if (Array.isArray(data[key])) {
      data[key] = data[key].join(',');
    }
  });
  globals.functions.submitForm(data, true, 'application/json');
}

/**
 * Calculate the number of days between two dates.
 * @param {*} endDate
 * @param {*} startDate
 * @returns {number} returns the number of days between two dates
 */
function days(endDate, startDate) {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  // return zero if dates are valid
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const diffInMs = Math.abs(end.getTime() - start.getTime());
  return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
}

/**
* Masks the first 5 digits of the mobile number with *
* @param {*} mobileNumber
* @returns {string} returns the mobile number with first 5 digits masked
*/
function maskMobileNumber(mobileNumber) {
  if (!mobileNumber) {
    return '';
  }
  const value = mobileNumber.toString();
  // Mask first 5 digits and keep the rest
  return ` ${'*'.repeat(5)}${value.substring(5)}`;
}

/* =========================
   HELPERS
========================= */
function updateAttemptsInfo(globals) {
  const field = globals.form?.otp_verification?.attempts;

  if (!field) return;

  globals.functions.setProperty(field, {
    value: `${otpResendAttemptsLeft}/3 attempts left`
  });
}

/* =========================
   OTP TIMER
========================= */
function startOtpTimer(globals) {
  const timerField = globals.form?.otp_verification?.resendOTP;
  const resendBtn = globals.form?.otp_verification?.resendOTP_btn;

  if (!timerField) return;

  let seconds = 10;

  if (otpTimerInterval) {
    clearInterval(otpTimerInterval);
  }

  globals.functions.setProperty(resendBtn, { enabled: false });

  otpTimerInterval = setInterval(() => {
    seconds--;

    globals.functions.setProperty(timerField, {
      value: `Resend OTP in ${seconds}s`
    });

    if (seconds <= 0) {
      clearInterval(otpTimerInterval);

      globals.functions.setProperty(timerField, {
        value: "Resend OTP"
      });

      if (otpResendAttemptsLeft > 0) {
        globals.functions.setProperty(resendBtn, { enabled: true });
      }
    }
  }, 1000);

  updateAttemptsInfo(globals);
}

function stopOtpTimer() {
  if (otpTimerInterval) {
    clearInterval(otpTimerInterval);
    otpTimerInterval = null;
  }
}

/**
 * GENERATE OTP
 * @param {scope} globals
 */
function generateOTP(globals) {
  try {
    const data = globals.functions.exportData();

    const mobile = data.aadhaar_linked_mobile_number || "";
    const dob = data.date_of_birth || "";
    const pan = data.pan_card || "";

    let identifierType = "";
    let identifierValue = "";

    if (pan) {
      identifierType = "PAN";
      identifierValue = pan;
    } else {
      identifierType = "DOB";
      identifierValue = dob;
    }

    if (!mobile || !identifierValue) {
      console.log("Missing values ");
      return;
    }

    fetch("https://ricotta-overcook-abrasive.ngrok-free.dev/api/initiateCustomerIdentification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        requestString: {
          mobileNo: mobile,
          identifierType,
          identifierValue
        }
      })
    })
      .then(res => res.json())
      .then(data => {
        const otp = data?.responseString?.otpValue;

        if (otp) {
          // show section
          globals.functions.setProperty(
            globals.form.otp_verification,
            { visible: true }
          );

          // set OTP
          globals.functions.setProperty(
            globals.form.otp_verification.otp_Value,
            { value: otp }
          );

          // clear validation
          globals.functions.setProperty(
            globals.form.otp_verification.otpValid,
            { value: "" }
          );

          // reset attempts
          otpResendAttemptsLeft = 3;

          globals.functions.setProperty(
            globals.form.otp_verification.resendOTP_btn,
            { enabled: false }
          );

          updateAttemptsInfo(globals);
          startOtpTimer(globals);
        }
      });

  } catch (e) {
    console.log("ERROR:", e);
  }
}

/**
 * RESEND OTP
 * @param {scope} globals
 */
function resendOTP(globals) {
  try {
    if (otpResendAttemptsLeft <= 0) {
      console.log("No attempts left ");
      return;
    }

    otpResendAttemptsLeft--;

    const data = globals.functions.exportData();

    const mobile = data.aadhaar_linked_mobile_number || "";
    const dob = data.date_of_birth || "";
    const pan = data.pan_card || "";

    let identifierType = "";
    let identifierValue = "";

    if (pan) {
      identifierType = "PAN";
      identifierValue = pan;
    } else {
      identifierType = "DOB";
      identifierValue = dob;
    }

    fetch("https://ricotta-overcook-abrasive.ngrok-free.dev/api/initiateCustomerIdentification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        requestString: {
          mobileNo: mobile,
          identifierType,
          identifierValue
        }
      })
    })
      .then(res => res.json())
      .then(data => {
        const otp = data?.responseString?.otpValue;

        globals.functions.setProperty(
          globals.form.otp_verification.otp_Value,
          { value: otp || "" }
        );

        globals.functions.setProperty(
          globals.form.otp_verification.otpValid,
          { value: "" }
        );

        globals.functions.setProperty(
          globals.form.otp_verification.resendOTP_btn,
          { enabled: false }
        );

        if (otpResendAttemptsLeft <= 0) {
          globals.functions.setProperty(
            globals.form.otp_verification.resendOTP_btn,
            { enabled: false }
          );
        }

        updateAttemptsInfo(globals);
        startOtpTimer(globals);
      });

  } catch (e) {
    console.log("RESEND ERROR:", e);
  }
}

/**
 * VALIDATE OTP
 * @param {scope} globals
 */
/**
 * VALIDATE OTP
 * @param {scope} globals
 */
/**
 * VALIDATE OTP
 * @param {scope} globals
 */
function validateOTP(globals) {
  try {

    const data = globals.functions.exportData();

    const mobile =
      data.aadhaar_linked_mobile_number || "";

    const dob =
      data.date_of_birth || "";

    const pan =
      data.pan_card || "";

    const otp =
      data.otp_Value || "";

    let identifierType = "";
    let identifierValue = "";

    // ✅ IDENTIFIER LOGIC
    if (pan) {
      identifierType = "PAN";
      identifierValue = pan;
    } else {
      identifierType = "DOB";
      identifierValue = dob;
    }

    // ✅ API CALL
    fetch(
      "https://ricotta-overcook-abrasive.ngrok-free.dev/api/validateOtp",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          requestString: {
            mobileNo: mobile,
            identifierType,
            identifierValue,
            otpValue: otp
          }
        })
      }
    )
      .then((res) => res.json())
      .then((response) => {

        console.log("VALIDATE RESPONSE:", response);

        const isValid =
          response?.responseString?.otpValid;

        // ✅ SUCCESS
        if (isValid === "Y") {

          stopOtpTimer();

          // ✅ OTP SUCCESS MESSAGE
          globals.functions.setProperty(
            globals.form.otp_verification.otpValid,
            {
              value: "OTP Verified"
            }
          );

          // ✅ GET CUSTOMER DETAILS
          const customer =
            response?.responseString?.customerDetails || {};

          const fullName =
            customer.fullName || "";

          const address =
            customer.address || "";

          console.log("FULL NAME:", fullName);
          console.log("ADDRESS:", address);

          // ✅ SHOW DETAILS PANEL FIRST
          globals.functions.setProperty(
            globals.form.details,
            {
              visible: true
            }
          );

          // ✅ WAIT FOR PANEL TO RENDER
          setTimeout(() => {

            try {

              // ✅ FULL NAME FIELD
              globals.functions.setProperty(
                globals.form.details.customer_details.full_name_as_per_aadhaar,
                {
                  value: fullName
                }
              );

              // ✅ ADDRESS FIELD
              globals.functions.setProperty(
                globals.form.details.address_details.address_as_per_aadhaar_records,
                {
                  value: address
                }
              );

            } catch (err) {
              console.log("FIELD SET ERROR:", err);
            }

          }, 1000);

        }

        // ❌ INVALID OTP
        else {

          globals.functions.setProperty(
            globals.form.otp_verification.otpValid,
            {
              value: "Invalid OTP"
            }
          );
        }

      })
      .catch((err) => {
        console.log("API ERROR:", err);
      });

  } catch (e) {
    console.log("VALIDATE ERROR:", e);
  }
}
/**
 * SEND EMAIL OTP FUNCTION (AEM EDS COMPATIBLE)
 * @param {scope} globals
 */
function sendEmailOTP(globals) {
  try {
    const data = globals.functions.exportData();

    const email = data.work_email_id || "";

    if (!email) {
      alert("Enter email");
      return;
    }

    fetch("https://ricotta-overcook-abrasive.ngrok-free.dev/api/sendEmailOtp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email
      })
    })
      .then(res => res.json())
      .then(res => {
        const otp = res?.responseString?.otpValue;

        if (otp) {
          console.log("EMAIL OTP:", otp);

          // 🔥 OPTIONAL → show OTP in form (for testing)
          globals.functions.setProperty(
            globals.form.emp_details.work_email_id_panel.email_otp,
            { value: otp }
          );

          globals.functions.setProperty(
            globals.form.emp_details.work_email_id_panel.email_otp_status,
            { value: "" }
          );
        }
      });

  } catch (e) {
    console.log("EMAIL OTP ERROR:", e);
  }
}

/**
 * VERIFY EMAIL OTP FUNCTION
 * @param {scope} globals
 */
function verifyEmailOTP(globals) {

  try {

    const data = globals.functions.exportData();

    console.log("EXPORT DATA:", data);

    /* =========================================
       FIELD VALUES
    ========================================= */

    const email =
      data?.emp_details
        ?.work_email_id_panel
        ?.work_email_id || "";

    const otp =
      data?.emp_details
        ?.work_email_id_panel
        ?.email_otp || "";

    console.log("EMAIL:", email);
    console.log("OTP:", otp);

    /* =========================================
       EMPTY CHECK
    ========================================= */

    if (!email || !otp) {

      globals.functions.setProperty(
        globals.form.emp_details
          .work_email_id_panel
          .email_otp_status,
        {
          value: "Enter OTP"
        }
      );

      return;
    }

    /* =========================================
       API CALL
    ========================================= */

    fetch(
      "https://ricotta-overcook-abrasive.ngrok-free.dev/api/verifyEmailOtp",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        // IMPORTANT FIX
        body: JSON.stringify({
          email,
          otpValue: otp
        })
      }
    )
      .then(res => res.json())
      .then(res => {

        console.log("VERIFY RESPONSE:", res);

        const valid =
          res?.responseString?.otpValid;

        /* =========================================
           SUCCESS
        ========================================= */

        if (valid === "Y") {

          // SAVE VERIFIED STATUS
          const emailField =
            document.querySelector('.field-work-email-id');

          if (emailField) {

            emailField.setAttribute(
              'data-email-verified',
              'Y'
            );
          }

          globals.functions.setProperty(
            globals.form.emp_details
              .work_email_id_panel
              .email_otp_status,
            {
              value: "Verified"
            }
          );

          globals.functions.setProperty(
            globals.form.emp_details
              .work_email_id_panel
              .verify_btn,
            {
              enabled: false
            }
          );

          console.log("EMAIL VERIFIED");

        }

        /* =========================================
           INVALID OTP
        ========================================= */

        else {

          globals.functions.setProperty(
            globals.form.emp_details
              .work_email_id_panel
              .email_otp_status,
            {
              value: "Invalid OTP"
            }
          );

          console.log("INVALID OTP");

        }

      })
      .catch((err) => {

        console.log("VERIFY ERROR:", err);

      });

  } catch (e) {

    console.log("VERIFY EMAIL ERROR:", e);

  }

}
/**
 * SAVE CUSTOMER DETAILS FUNCTION
 * @param {scope} globals
 */
function submitCustomerDetails(globals) {

  try {

    const data = globals.functions.exportData();

    console.log("FORM DATA:", data);

    /* =====================================================
       EMAIL VERIFIED CHECK
    ===================================================== */

    const emailField =
      document.querySelector('.field-work-email-id');

    const isVerified =
      emailField?.getAttribute('data-email-verified');

    if (isVerified !== 'Y') {

      alert("Please verify email first");

      return;
    }

    /* =====================================================
       GET VALUES
    ===================================================== */

    const fullName =
      data.full_name_as_per_aadhaar || "";

    const address =
      data.address_as_per_aadhaar_records || "";

    const mobile =
      data.aadhaar_linked_mobile_number || "";

    const dob =
      data.date_of_birth || "";

    const pan =
      data.pan_card || "";

    console.log("FULL NAME:", fullName);
    console.log("ADDRESS:", address);

    /* =====================================================
       REVIEW PANEL MAPPING
    ===================================================== */

    // FULL NAME
    globals.functions.setProperty(
      globals.form.review_panel
        .review_fragment
        .trier2_fragment
        .personal_accordion
        .full_name,
      {
        value: fullName
      }
    );

    // CURRENT ADDRESS
    globals.functions.setProperty(
      globals.form.review_panel
        .review_fragment
        .trier2_fragment
        .personal_accordion
        .current_address,
      {
        value: address
      }
    );

    // MOBILE NUMBER
    globals.functions.setProperty(
      globals.form.review_panel
        .review_fragment
        .trier2_fragment
        .personal_accordion
        .mobile_number,
      {
        value: mobile
      }
    );

    // DATE OF BIRTH
    globals.functions.setProperty(
      globals.form.review_panel
        .review_fragment
        .trier2_fragment
        .personal_accordion
        .date_of_birth,
      {
        value: dob
      }
    );

    // PAN
    globals.functions.setProperty(
      globals.form.review_panel
        .review_fragment
        .trier2_fragment
        .personal_accordion
        .pan,
      {
        value: pan
      }
    );

    alert("Details Added Successfully");

    console.log("REVIEW PANEL UPDATED");

  } catch (e) {

    console.log("SUBMIT ERROR:", e);

  }

}
/**
 * EMI CALCULATION FUNCTION (AEM EDS COMPATIBLE)
 * @param {scope} globals
 */
function updateValues(globals) {
  try {
    // ✅ GET VALUES FROM SLIDER (IMPORTANT)
    const loanAmount = Number(
      document.querySelector('[name="loanAmount"]')?.dataset?.actualValue
    ) || 0;

    const tenure = Number(
      document.querySelector('[name="loanTenure"]')?.dataset?.actualValue
    ) || 0;

    if (!loanAmount || !tenure) return;

    const annualRate = 10.97;
    const r = annualRate / (12 * 100);

    const emi =
      (loanAmount * r * Math.pow(1 + r, tenure)) /
      (Math.pow(1 + r, tenure) - 1);

    const emiRounded = Math.round(emi);

    // ✅ UPDATE CORRECT FIELDS (YOUR PATH)
    globals.functions.setProperty(
      globals.form.loan_offer_summary.avail_XPRESS_Personal_Loan_of,
      { value: `₹${loanAmount.toLocaleString("en-IN")}` }
    );

    globals.functions.setProperty(
      globals.form.loan_offer_summary.emi_Amount,
      { value: `₹${emiRounded.toLocaleString("en-IN")}` }
    );

    globals.functions.setProperty(
      globals.form.loan_offer_summary.rate_of_Interest,
      { value: "10.97%" }
    );

    globals.functions.setProperty(
      globals.form.loan_offer_summary.taxes,
      { value: "₹4,000" }
    );

  } catch (e) {
    console.log("EMI ERROR:", e);
  }
}

/**
 * generate loan application number
 * @param {scope} globals
 */
function generateLoanDetails(globals) {
  try {
    // 1. Generate Loan Application Number (8-digit random)
    const loanAppNumber = Math.floor(10000000 + Math.random() * 90000000);

    // 2. Get Loan Amount from nested structure
    const loanAmount =
      globals.form?.offer_display_panel?.offer_panel?.loanAmount?.value || '';

    // 3. Set Loan Application Number in thankYou_panel
    if (globals.form?.thankYou_panel?.loan_Application_Number) {
      globals.functions.setProperty(
        globals.form.thankYou_panel.loan_Application_Number,
        { value: String(loanAppNumber) }
      );
    }

    // 4. Set Loan Amount in thankYou_panel
    if (globals.form?.thankYou_panel?.loan_Amount) {
      globals.functions.setProperty(
        globals.form.thankYou_panel.loan_Amount,
        { value: loanAmount }
      );
    }

    return '';
  } catch (error) {
    console.error('Error in generateLoanDetails:', error);
    return '';
  }
}

/* ---------------------------------bureaupage----------------------------------------------*/
 
/**
 * Returns bank logo based on value
 */
function getBankLogo(bank) {
    const logos = {
        hdfc_bank: '/content/dam/s_hdfc_capstone/hdfc.png',
        icici_bank: '/content/dam/s_hdfc_capstone/icici.png',
        axis_bank: '/content/dam/s_hdfc_capstone/axis.png',
        kotak: '/content/dam/s_hdfc_capstone/kotak.png',
        sbi: '/content/dam/s_hdfc_capstone/sbi.png',
        bank_of_baroda: '/content/dam/s_hdfc_capstone/bob.jpeg',
        idfc_first: '/content/dam/s_hdfc_capstone/idfc.png'
    };
 
    return logos[bank] || '';
}
 
/**
 * Create bank card
 */
function createBankItem(option, select) {
 
    const item = document.createElement('div');
    item.className = 'bank-item';
    item.dataset.value = option.value;
 
    item.innerHTML = `
        <img src="${getBankLogo(option.value)}" alt="${option.text}">
        <span>${option.text}</span>
    `;
 
    item.addEventListener('click', () => {
        updateActiveBank(item, select);
    });
 
    return item;
}
 
/**
 * Active selection
 */
function updateActiveBank(selectedItem, select) {
 
    document.querySelectorAll('.bank-item').forEach((el) => {
        el.classList.remove('active');
    });
 
    selectedItem.classList.add('active');
 
    select.value = selectedItem.dataset.value;
 
    select.dispatchEvent(new Event('change'));
}
 
/**
 * Initialize UI
 */
function initBankSelection() {
 
    const select = document.querySelector("select[name='salary_bank']");
 
    if (!select || select.dataset.initialized) return;
 
    select.dataset.initialized = 'true';
 
    /* hide original dropdown */
    select.style.display = 'none';
 
    const container = document.createElement('div');
    container.className = 'bank-container';
 
    const left = document.createElement('div');
    left.className = 'bank-left';
 
    const row = document.createElement('div');
    row.className = 'bank-row';
 
    const defaultValue = select.value || 'hdfc_bank';
 
    const defaultOption = Array.from(select.options)
        .find((o) => o.value === defaultValue);
 
    /* show default icon */
    const defaultItem = createBankItem(defaultOption, select);
 
    defaultItem.classList.add('active');
 
    row.appendChild(defaultItem);
 
    left.appendChild(row);
 
    /* dropdown */
    const dropdown = document.createElement('select');
 
    dropdown.className = 'bank-other-dropdown';
 
    const hdfcOpt = document.createElement('option');
    hdfcOpt.value = defaultOption.value;
    hdfcOpt.text = defaultOption.text;
 
    dropdown.appendChild(hdfcOpt);
 
    const otherOpt = document.createElement('option');
    otherOpt.value = 'other_bank';
    otherOpt.text = 'Other Bank';
 
    dropdown.appendChild(otherOpt);
 
    const right = document.createElement('div');
    right.className = 'bank-right';
 
    right.appendChild(dropdown);
 
    container.appendChild(left);
    container.appendChild(right);
 
    select.parentNode.appendChild(container);
 
    /* dropdown change */
    dropdown.addEventListener('change', () => {
 
        if (dropdown.value === 'other_bank') {
 
            row.innerHTML = '';
 
            Array.from(select.options).forEach((opt) => {
 
                if (!opt.value || opt.value === 'other_bank') return;
 
                const item = createBankItem(opt, select);
 
                row.appendChild(item);
            });
 
            dropdown.innerHTML = '';
 
            Array.from(select.options).forEach((opt) => {
 
                if (!opt.value || opt.value === 'other_bank') return;
 
                const option = document.createElement('option');
 
                option.value = opt.value;
                option.text = opt.text;
 
                dropdown.appendChild(option);
            });
 
        } else {
 
            select.value = dropdown.value;
        }
    });
}
 
/**
 * AEM render safe
 */
function observeBankField() {
 
    const observer = new MutationObserver(() => {
 
        if (document.querySelector("select[name='salary_bank']")) {
            initBankSelection();
        }
    });
 
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}
 
observeBankField();
 
// eslint-disable-next-line import/prefer-default-export
export {
  getFullName,
  days,
  submitFormArrayToString,
  maskMobileNumber,
  generateOTP,
  resendOTP,
  validateOTP,
  startOtpTimer,
  stopOtpTimer,
  updateAttemptsInfo,
  sendEmailOTP,
  verifyEmailOTP,
  submitCustomerDetails,
  updateValues,
  generateLoanDetails, getBankLogo,
    observeBankField, updateActiveBank, createBankItem, initBankSelection
};

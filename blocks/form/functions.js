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
      console.log("Missing values ❌");
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
      console.log("No attempts left ❌");
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
function validateOTP(globals) {
  try {
    const data = globals.functions.exportData();

    const mobile = data.aadhaar_linked_mobile_number || "";
    const dob = data.date_of_birth || "";
    const pan = data.pan_card || "";
    const otp = data.otp_Value || "";

    let identifierType = "";
    let identifierValue = "";

    if (pan) {
      identifierType = "PAN";
      identifierValue = pan;
    } else {
      identifierType = "DOB";
      identifierValue = dob;
    }

    fetch("https://ricotta-overcook-abrasive.ngrok-free.dev/api/validateOtp", {
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
    })
      .then(res => res.json())
      .then(data => {
        const isValid = data?.responseString?.otpValid;

        if (isValid === "Y") {
          stopOtpTimer();

          globals.functions.setProperty(
            globals.form.otp_verification.otpValid,
            { value: "OTP Verified ✅" }
          );
        } else {
          globals.functions.setProperty(
            globals.form.otp_verification.otpValid,
            { value: "Invalid OTP ❌" }
          );
        }
      });

  } catch (e) {
    console.log("VALIDATE ERROR:", e);
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
  updateValues
};

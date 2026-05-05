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

/**
 * GENERATE OTP (DOB / PAN)
 * @param {scope} globals
 */
function generateOTP(globals) {
  if (!globals || !globals.form) {
    console.log("Globals not received ❌");
    return;
  }

  try {
    console.log("Globals OK ✅");

    const mobile = globals.form.aadhaar_linked_mob?.value || "";
    const dob = globals.form.date_of_birth?.value || "";
    const pan = globals.form.pan_card?.value || "";

    let identifierType = "";
    let identifierValue = "";

    if (pan) {
      identifierType = "PAN";
      identifierValue = pan;
    } else {
      identifierType = "DOB";
      identifierValue = dob;
    }

    console.log("DATA:", { mobile, identifierType, identifierValue });

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
        console.log("OTP RESPONSE:", data);

        const otp = data?.responseString?.otpValue;

        if (otp) {
          console.log("SETTING OTP:", otp);

          globals.functions.setProperty(
            globals.form.otp_verification.otp_Value,
            { value: otp }
          );

          globals.functions.setProperty(
            globals.form.otp_verification,
            { visible: true }
          );
        }
      });

  } catch (e) {
    console.log("ERROR:", e);
  }
}

/**
 * VALIDATE OTP
 * @param {scope} globals
 */
function validateOTP(globals) {
  try {
    const mobile = globals.form.aadhaar_linked_mob?.value || "";
    const dob = globals.form.date_of_birth?.value || "";
    const pan = globals.form.pan_card?.value || "";
    const otp = globals.form.otp_verification.otp_Value?.value || "";

    let identifierType = "";
    let identifierValue = "";

    if (pan) {
      identifierType = "PAN";
      identifierValue = pan;
    } else {
      identifierType = "DOB";
      identifierValue = dob;
    }

    const payload = {
      requestString: {
        mobileNo: mobile,
        identifierType,
        identifierValue,
        otpValue: otp
      }
    };

    fetch("https://ricotta-overcook-abrasive.ngrok-free.dev/api/validateOtp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("VALIDATE RESPONSE:", data);

        const isValid = data?.responseString?.otpValid;

        if (isValid === "Y") {
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
  validateOTP,
  updateValues
};

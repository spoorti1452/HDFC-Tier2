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
 * EMI CALCULATION FUNCTION (AEM EDS COMPATIBLE)
 * @param {scope} globals
 */
function updateValues(globals) {

  function calculateEMI(P, rate, n) {
    const r = rate / (12 * 100);
    return Math.round(
      (P * r * Math.pow(1 + r, n)) /
      (Math.pow(1 + r, n) - 1)
    );
  }

  try {
    const loanField = globals.form.offer_Panel.loanAmount;
    const tenureField = globals.form.offer_Panel.loanTenure;

    // ✅ READ FROM dataset (EDS SAFE)
    const loanAmount = Number(loanField?.dataset?.value || 0);
    const tenure = Number(tenureField?.dataset?.value || 0);

    if (!loanAmount || !tenure) return;

    const emi = calculateEMI(loanAmount, 10.97, tenure);

    const formattedLoan = `₹${loanAmount.toLocaleString("en-IN")}`;
    const formattedEMI = `₹${emi.toLocaleString("en-IN")}`;

    globals.functions.setProperty(
      globals.form.loan_offer_summary.avail_XPRESS_Personal_Loan_of,
      { value: formattedLoan }
    );

    globals.functions.setProperty(
      globals.form.loan_offer_summary.emi_Amount,
      { value: formattedEMI }
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
  updateValues
};

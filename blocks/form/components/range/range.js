const AMOUNT_VALUES = [
  50000,
  200000,
  400000,
  600000,
  800000,
  1000000,
  1500000
];

const TENURE_VALUES = [
  12,
  24,
  36,
  48,
  60,
  72,
  84
];

/* =========================
   FORMAT VALUE
========================= */
function formatValue(input, actualValue) {

  // ✅ LOAN AMOUNT
  if (input.name === "loanAmount") {

    return `₹${Number(actualValue)
      .toLocaleString("en-IN")}`;
  }

  // ✅ TENURE
  if (input.name === "loanTenure") {

    return `${actualValue} months`;
  }

  return actualValue;
}

/* =========================
   GET INTERPOLATED VALUE
   (MIDDLE VALUES SUPPORT)
========================= */
/* =========================
   GET ACTUAL VALUE
   (SMOOTH + EXACT VALUES)
========================= */
function getActualValue(input, percent) {

  /* =========================
     LOAN AMOUNT
  ========================= */
  if (input.name === "loanAmount") {

    const values = AMOUNT_VALUES;

    const segmentSize =
      100 / (values.length - 1);

    // current segment
    const segmentIndex =
      Math.floor(percent / segmentSize);

    // prevent overflow
    const safeIndex =
      Math.min(
        segmentIndex,
        values.length - 2
      );

    const start =
      values[safeIndex];

    const end =
      values[safeIndex + 1];

    // progress inside segment
    const segmentProgress =
      (percent - (safeIndex * segmentSize))
      / segmentSize;

    // interpolate
    const value =
      start + ((end - start) * segmentProgress);

    // nearest 10K
    return Math.round(value / 10000) * 10000;
  }

  /* =========================
     TENURE
  ========================= */
  if (input.name === "loanTenure") {

    const values = TENURE_VALUES;

    const segmentSize =
      100 / (values.length - 1);

    const segmentIndex =
      Math.floor(percent / segmentSize);

    const safeIndex =
      Math.min(
        segmentIndex,
        values.length - 2
      );

    const start =
      values[safeIndex];

    const end =
      values[safeIndex + 1];

    const segmentProgress =
      (percent - (safeIndex * segmentSize))
      / segmentSize;

    const value =
      start + ((end - start) * segmentProgress);

    return Math.round(value);
  }

  return percent;
}
/* =========================
   ADD TICKS
========================= */
function addTicks(wrapper, input) {

  const values =
    input.name === "loanAmount"
      ? AMOUNT_VALUES
      : TENURE_VALUES;

  values.forEach((val, i) => {

    const tick =
      document.createElement("span");

    tick.className =
      "custom-range-tick";

    const label =
      document.createElement("span");

    /* =========================
       LABELS
    ========================= */
    if (input.name === "loanAmount") {

      label.textContent =
        val >= 100000
          ? (val / 100000) + "L"
          : (val / 1000) + "K";

    } else {

      label.textContent =
        val + "m";
    }

    // ✅ POSITION
    tick.style.left =
      `${(i / (values.length - 1)) * 100}%`;

    /* =========================
       CLICK SUPPORT
    ========================= */
    label.onclick = () => {

      const percent =
        (i / (values.length - 1)) * 100;

      input.value = percent;

      input.dispatchEvent(
        new Event("input", {
          bubbles: true
        })
      );
    };

    tick.appendChild(label);

    wrapper.appendChild(tick);
  });
}

/* =========================
   UPDATE UI + VALUE
========================= */
function updateBubble(input, wrapper) {

  const percent =
    Number(input.value);

  const bubble =
    wrapper.querySelector(".range-bubble");

  // ✅ GET SMOOTH VALUE
  const actual =
    getActualValue(input, percent);

  // ✅ STORE REAL VALUE
  input.dataset.actualValue =
    actual;

  // ✅ UPDATE UI
  bubble.innerText =
    formatValue(input, actual);

  const totalSteps = 100;
  const currentSteps = percent;

  wrapper.style.setProperty(
    "--total-steps",
    totalSteps
  );

  wrapper.style.setProperty(
    "--current-steps",
    currentSteps
  );

  // ✅ BUBBLE POSITION
  bubble.style.left =
    `calc(${percent}% - 15px)`;
}

/* =========================
   DECORATE
========================= */
export default function decorate(fieldDiv) {

  const input =
    fieldDiv.querySelector("input");

  if (!input) return fieldDiv;

  /* =========================
     RANGE SETUP
  ========================= */
  input.type = "range";

  input.min = 0;
  input.max = 100;

  // ✅ SMOOTH MOVEMENT
  input.step = 1;

  // ✅ INITIAL POSITION
  input.value = 50;

  /* =========================
     WRAPPER
  ========================= */
  const wrapper =
    document.createElement("div");

  wrapper.className =
    "range-widget-wrapper decorated";

  const bubble =
    document.createElement("span");

  bubble.className =
    "range-bubble";

  input.after(wrapper);

  wrapper.appendChild(bubble);

  wrapper.appendChild(input);

  /* =========================
     TICKS
  ========================= */
  addTicks(wrapper, input);

  /* =========================
     INPUT EVENT
  ========================= */
  input.addEventListener(
    "input",
    () => {

      updateBubble(input, wrapper);
    }
  );

  /* =========================
     INITIAL RENDER
  ========================= */
  updateBubble(input, wrapper);

  return fieldDiv;
}
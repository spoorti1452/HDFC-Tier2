const AMOUNT_VALUES = [50000, 200000, 400000, 600000, 800000, 1000000, 1500000];
const TENURE_VALUES = [12, 24, 36, 48, 60, 72, 84];

/* =========================
   FORMAT VALUE
========================= */
function formatValue(input, percent) {
  const name = input.name;

  if (name === "loanAmount") {
    const index = Math.round((percent / 100) * (AMOUNT_VALUES.length - 1));
    return `₹${AMOUNT_VALUES[index].toLocaleString("en-IN")}`;
  }

  if (name === "loanTenure") {
    const index = Math.round((percent / 100) * (TENURE_VALUES.length - 1));
    return `${TENURE_VALUES[index]} months`;
  }

  return percent;
}

/* =========================
   GET ACTUAL VALUE
========================= */
function getActualValue(input, percent) {
  const name = input.name;

  if (name === "loanAmount") {
    const index = Math.round((percent / 100) * (AMOUNT_VALUES.length - 1));
    return AMOUNT_VALUES[index];
  }

  if (name === "loanTenure") {
    const index = Math.round((percent / 100) * (TENURE_VALUES.length - 1));
    return TENURE_VALUES[index];
  }

  return percent;
}

/* =========================
   ADD TICKS
========================= */
function addTicks(wrapper, input) {
  const ticks = document.createElement("div");
  ticks.className = "range-ticks";

  const values =
    input.name === "loanAmount" ? AMOUNT_VALUES : TENURE_VALUES;

  values.forEach((val, i) => {
    const span = document.createElement("span");

    if (input.name === "loanAmount") {
      span.textContent = val >= 100000
        ? val / 100000 + "L"
        : val / 1000 + "K";
    } else {
      span.textContent = val + "m";
    }

    span.onclick = () => {
      const percent = (i / (values.length - 1)) * 100;
      input.value = percent;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    };

    ticks.appendChild(span);
  });

  wrapper.appendChild(ticks);
}

/* =========================
   UPDATE UI + VALUE
========================= */
function updateBubble(input, wrapper) {
  const percent = Number(input.value);
  const bubble = wrapper.querySelector(".range-bubble");

  const actual = getActualValue(input, percent);

  // ✅ store real value (IMPORTANT)
  input.dataset.actualValue = actual;

  // UI
  bubble.innerText = formatValue(input, percent);

  const totalSteps = 100;
  const currentSteps = percent;

  wrapper.style.setProperty("--total-steps", totalSteps);
  wrapper.style.setProperty("--current-steps", currentSteps);

  bubble.style.left = `calc(${percent}% - 15px)`;
}

/* =========================
   DECORATE
========================= */
export default function decorate(fieldDiv) {
  const input = fieldDiv.querySelector("input");
  if (!input) return fieldDiv;

  // ✅ USE PERCENT BASED SLIDER
  input.type = "range";
  input.min = 0;
  input.max = 100;
  input.step = 1;
  input.value = 50;

  const wrapper = document.createElement("div");
  wrapper.className = "range-widget-wrapper decorated";

  const bubble = document.createElement("span");
  bubble.className = "range-bubble";

  input.after(wrapper);
  wrapper.appendChild(bubble);
  wrapper.appendChild(input);

  addTicks(wrapper, input);

  input.addEventListener("input", () => {
    updateBubble(input, wrapper);
  });

  // INIT
  updateBubble(input, wrapper);

  return fieldDiv;
}
const LOAN_STEPS = [50000, 200000, 400000, 600000, 800000, 1000000, 1500000];
const TENURE_STEPS = [12, 24, 36, 48, 60, 72, 84];

function isLoan(fieldDiv) {
  return fieldDiv.classList.contains("field-loanamount");
}

function format(val, loan) {
  return loan
    ? "₹" + Number(val).toLocaleString("en-IN")
    : val + " months";
}

export default function decorate(fieldDiv) {
  const input = fieldDiv.querySelector("input");
  if (!input) return fieldDiv;

  const originalName = input.name;
  const loan = isLoan(fieldDiv);
  const steps = loan ? LOAN_STEPS : TENURE_STEPS;

  /* ===== SLIDER SETUP ===== */
  input.type = "range";
  input.min = 0;
  input.max = steps.length - 1;
  input.step = 1;

  /* ===== WRAPPER ===== */
  const wrapper = document.createElement("div");
  wrapper.className = "range-widget-wrapper decorated";

  const bubble = document.createElement("span");
  bubble.className = "range-bubble";

  input.after(wrapper);
  wrapper.appendChild(bubble);
  wrapper.appendChild(input);

  /* ===== TICKS ===== */
  steps.forEach((val, i) => {
    const tick = document.createElement("span");
    tick.className = "custom-range-tick";

    const label = document.createElement("span");
    label.innerText = loan
      ? (val === 50000 ? "50K" : val / 100000 + "L")
      : val + "m";

    tick.style.left = `${(i / (steps.length - 1)) * 100}%`;

    label.onclick = () => {
      input.value = i;
      update();
    };

    tick.appendChild(label);
    wrapper.appendChild(tick);
  });

  /* ===== UPDATE FUNCTION (CRITICAL) ===== */
  function update() {
    const index = Number(input.value);
    const actual = steps[index];

    const percent = (index / (steps.length - 1)) * 100;

    // UI update
    wrapper.style.setProperty("--progress", percent + "%");
    bubble.innerText = format(actual, loan);
    bubble.style.left = `calc(${percent}% - 15px)`;

    // 🔥 IMPORTANT: update actual AEM value
    input.value = actual;

    // 🔥 trigger AEM rule engine
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  /* ===== EVENTS ===== */
  input.addEventListener("input", update);

  /* ===== INIT ===== */
  input.value = steps.length - 1;
  update();

  return fieldDiv;
}
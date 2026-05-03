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

  /* ✅ CREATE HIDDEN INPUT (THIS FIXES AEM) */
  const hidden = document.createElement("input");
  hidden.type = "hidden";
  hidden.name = originalName;

  input.removeAttribute("name");

  /* ===== SLIDER ===== */
  input.type = "range";
  input.min = 0;
  input.max = steps.length - 1;
  input.step = 1;
  input.value = steps.length - 1;

  /* ===== UI ===== */
  const wrapper = document.createElement("div");
  wrapper.className = "range-widget-wrapper decorated";

  const bubble = document.createElement("span");
  bubble.className = "range-bubble";

  input.after(wrapper);
  wrapper.appendChild(bubble);
  wrapper.appendChild(input);
  wrapper.appendChild(hidden); // ✅ IMPORTANT

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

  /* ===== UPDATE ===== */
  function update() {
    const index = Number(input.value);
    const actual = steps[index];

    const percent = (index / (steps.length - 1)) * 100;

    // UI
    wrapper.style.setProperty("--progress", percent + "%");
    bubble.innerText = format(actual, loan);
    bubble.style.left = `calc(${percent}% - 15px)`;

    // ✅ SEND REAL VALUE TO AEM
    hidden.value = actual;

    // 🔥 TRIGGER RULES
    hidden.dispatchEvent(new Event("change", { bubbles: true }));
  }

  input.addEventListener("input", update);

  /* INIT */
  update();

  return fieldDiv;
}
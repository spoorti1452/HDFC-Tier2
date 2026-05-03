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

  const loan = isLoan(fieldDiv);
  const steps = loan ? LOAN_STEPS : TENURE_STEPS;

  input.type = "range";
  input.min = 0;
  input.max = steps.length - 1;
  input.step = 1;

  let index = steps.length - 1;
  input.value = index;

  const wrapper = document.createElement("div");
  wrapper.className = "range-widget-wrapper decorated";

  const bubble = document.createElement("span");
  bubble.className = "range-bubble";

  input.after(wrapper);
  wrapper.appendChild(bubble);
  wrapper.appendChild(input);

  steps.forEach((val, i) => {
    const tick = document.createElement("span");
    tick.className = "custom-range-tick";

    const label = document.createElement("span");
    label.innerText = loan
      ? (val === 50000 ? "50K" : val / 100000 + "L")
      : val + "m";

    tick.style.left = `${(i / (steps.length - 1)) * 100}%`;

    label.onclick = () => {
      index = i;
      update();
    };

    tick.appendChild(label);
    wrapper.appendChild(tick);
  });

  function update() {
    const actual = steps[index];
    const percent = (index / (steps.length - 1)) * 100;

    wrapper.style.setProperty("--progress", percent + "%");

    bubble.innerText = format(actual, loan);
    bubble.style.left = `calc(${percent}% - 15px)`;

    // ✅ slider stays smooth
    input.value = index;

    // 🔥 STORE REAL VALUE HERE (IMPORTANT)
    input.dataset.value = actual;

    // 🔥 trigger AEM
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  input.addEventListener("input", () => {
    index = Number(input.value);
    update();
  });

  update();

  return fieldDiv;
}
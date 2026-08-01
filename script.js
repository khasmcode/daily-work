const KHMER_DAYS = ["អាទិត្យ", "ចន្ទ", "អង្គារ", "ពុធ", "ព្រហស្បតិ៍", "សុក្រ", "សៅរ៍"];
const KHMER_MONTHS = [
  "មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា",
  "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"
];

const DAY_LABELS = ["ថ្ងៃច័ន្ទ", "ថ្ងៃអង្គារ", "ថ្ងៃពុធ", "ថ្ងៃព្រហស្បតិ៍", "ថ្ងៃសុក្រ"];

const MEMBER_OF_EACH_DAY = [
  [
    "កង ចាន់",
    "ឆុន រដ្ឋា",
    "វេន វិសាល",
    "ស៊ាន សៀវ",
    "នៅ សក្តា",
    "ស្រ៊ុន សិរី"
  ],
  [
    "ចក់ គឹមហ៊ាន",
    "យូ សុវណ្ណារិទ្ធិ",
    "ណន វ៉ានដា",
    "ថេង ស៊ីវុង",
    "រ៉ន ភាណុង",
    "ថា សេងហ៊ាង"
  ],
  [
    "ឆេង សុខា",
    "ឈាន់ រ៉ាឆាត",
    "កិ អង្គា",
    "មឿន សុវណ្ណារ៉ា",
    "ទា ចយ",
    "សុខុន ខែមបូ"
  ],
  [
    "សួស ធឿក",
    "ងន វណ្ណេត",
    "គ្រួច ចំរើន",
    "ហ៊ឺ សង្ហី",
    "ហេង ស៊ីហួន",
    "ចែម វុធ"
  ],
  [
    "ផាន់ណា មករា",
    "តេង វាសនា",
    "ចាន់ សុខវិសាល",
    "វឿន កុសល្យ",
    "ឡៃ វាសនា",
    "ស៊ុន ឆាលី"
  ]
];

const TASKS = [
  "សម្អាតផ្ទះបាយ",
  "សម្អាតបន្ទប់ទឹក",
  "សម្អាតកន្លែងងូតទឹកខាងលើ",
  "សម្អាតកន្លែងងូតទឹកខាងក្រោម",
  "ចាក់សោរ និងបោសផ្ទះ",
  "សម្អាតកន្លែងងូតទឹកខាងលើ និងខាងក្រោម"
];

let rows = [];
let editingIndex = null;
let suppressResetHandler = false;
let leaveMembers = new Set();

const daySelect = document.getElementById("daySelect");
const responsibilityInput = document.getElementById("responsibility");
const memberPicker = document.getElementById("memberPicker");
const form = document.getElementById("dailyWorkForm");
const submitButton = document.getElementById("submitButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const tableBody = document.getElementById("tableBody");
const emptyState = document.getElementById("emptyState");

document.addEventListener("DOMContentLoaded", () => {
  updateDate();
  populateDaySelect();
  populateTaskSelect();
  renderMemberPicker(Number(daySelect.value));
  renderTable();

  daySelect.addEventListener("change", () => {
    leaveMembers = new Set();
    renderMemberPicker(Number(daySelect.value));
  });

  form.addEventListener("reset", () => {
    if (suppressResetHandler) return;
    setTimeout(cancelEdit, 0);
  });
});

function getDefaultDayIndex() {
  const weekday = new Date().getDay();
  if (weekday >= 1 && weekday <= 5) return weekday - 1;
  return 0;
}

function populateDaySelect() {
  daySelect.innerHTML = DAY_LABELS
    .map((label, index) => `<option value="${index}">${label}</option>`)
    .join("");

  daySelect.value = String(getDefaultDayIndex());
}

function populateTaskSelect() {
  responsibilityInput.innerHTML = TASKS
    .map((task) => `<option value="${escapeHTML(task)}">${escapeHTML(task)}</option>`)
    .join("");
}

function getUsedMembers(dayIndex) {
  const used = new Set();

  rows.forEach((item, index) => {
    if (index === editingIndex) return;
    if (item.day !== dayIndex) return;

    item.names.forEach((name) => used.add(name));
    (item.leave || []).forEach((name) => used.add(name));
  });

  return used;
}

function renderMemberPicker(dayIndex) {
  const usedMembers = getUsedMembers(dayIndex);
  const members = (MEMBER_OF_EACH_DAY[dayIndex] || []).filter((name) => !usedMembers.has(name));

  if (members.length === 0) {
    memberPicker.innerHTML = `<p class="member-picker-empty">សមាជិកទាំងអស់សម្រាប់ថ្ងៃនេះ ត្រូវបានចាត់តាំង ឬសុំច្បាប់រួចហើយ</p>`;
    return;
  }

  memberPicker.innerHTML = members
    .map((name) => {
      const onLeave = leaveMembers.has(name);
      return `
        <div class="member-row${onLeave ? " on-leave" : ""}">
          <label class="member-check">
            <input type="checkbox" class="member-checkbox" value="${escapeHTML(name)}" ${onLeave ? "disabled" : ""}>
            <span>${escapeHTML(name)}</span>
          </label>
          <button type="button" class="leave-toggle${onLeave ? " active" : ""}" data-name="${escapeHTML(name)}" onclick="toggleLeave(this)">
            ${onLeave ? "✓ បានច្បាប់" : "ច្បាប់"}
          </button>
        </div>
      `;
    })
    .join("");
}

function toggleLeave(button) {
  const name = button.dataset.name;

  if (leaveMembers.has(name)) {
    leaveMembers.delete(name);
  } else {
    leaveMembers.add(name);
  }

  renderMemberPicker(Number(daySelect.value));
}

function addRow() {
  const names = Array.from(memberPicker.querySelectorAll(".member-checkbox:checked")).map(
    (checkbox) => checkbox.value
  );

  const leave = Array.from(leaveMembers);
  const responsibility = responsibilityInput.value;

  if (names.length === 0 && leave.length === 0) {
    alert("សូមជ្រើសរើសអ្នកទទួលខុសត្រូវយ៉ាងហោចណាស់ម្នាក់!");
    return;
  }

  if (!responsibility) {
    alert("សូមជ្រើសរើសការងារ!");
    return;
  }

  const entry = { day: Number(daySelect.value), names, leave, responsibility };

  if (editingIndex !== null) {
    rows[editingIndex] = entry;
  } else {
    rows.push(entry);
  }

  resetFormState();
  renderTable();
}

function resetFormState() {
  editingIndex = null;
  leaveMembers = new Set();

  submitButton.innerHTML = "＋ បន្ថែមការងារ";
  cancelEditButton.style.display = "none";

  suppressResetHandler = true;
  form.reset();
  suppressResetHandler = false;

  daySelect.value = String(getDefaultDayIndex());
  populateTaskSelect();
  renderMemberPicker(Number(daySelect.value));
}

function editRow(index) {
  const item = rows[index];
  editingIndex = index;
  leaveMembers = new Set(item.leave || []);

  daySelect.value = String(item.day);
  renderMemberPicker(item.day);

  memberPicker.querySelectorAll(".member-checkbox").forEach((checkbox) => {
    checkbox.checked = item.names.includes(checkbox.value);
  });

  responsibilityInput.value = item.responsibility;

  submitButton.innerHTML = "✓ រក្សាទុកការកែប្រែ";
  cancelEditButton.style.display = "inline-flex";

  renderTable();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function cancelEdit() {
  resetFormState();
  renderTable();
}

function renderTable() {
  tableBody.innerHTML = "";

  if (rows.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  let personCounter = 0;

  rows.forEach((item, entryIndex) => {
    const people = [
      ...item.names.map((name) => ({ name, onLeave: false })),
      ...(item.leave || []).map((name) => ({ name, onLeave: true }))
    ];

    people.forEach((person) => {
      personCounter += 1;

      const tr = document.createElement("tr");
      tr.onclick = () => editRow(entryIndex);
      if (entryIndex === editingIndex) tr.classList.add("editing");

      const nameClass = person.onLeave ? "person leave" : "person";
      const taskText = person.onLeave ? "" : escapeHTML(item.responsibility);
      const otherText = person.onLeave ? `<span class="leave-tag">ច្បាប់</span>` : "";

      tr.innerHTML = `
        <td data-label="ល.រ"><span class="row-index">${personCounter}.</span></td>
        <td data-label="គោត្តនាម និងនាម"><span class="${nameClass}">${escapeHTML(person.name)}</span></td>
        <td data-label="ភារកិច្ច"><div class="responsibility">${taskText}</div></td>
        <td data-label="ផ្សេងៗ">${otherText}</td>
      `;

      tableBody.appendChild(tr);
    });
  });
}

function updateDate() {
  const now = new Date();
  const formatted = `ថ្ងៃ${KHMER_DAYS[now.getDay()]} ទី ${now.getDate()} ខែ ${KHMER_MONTHS[now.getMonth()]} ឆ្នាំ ${now.getFullYear()}`;

  document.getElementById("currentDate").textContent = formatted;
  document.getElementById("previewDate").textContent = formatted;
}

async function downloadAsImage() {
  if (rows.length === 0) {
    alert("សូមបន្ថែមការងារជាមុនសិន!");
    return;
  }

  try {
    const tableCard = document.querySelector(".table-card");
    const canvas = await html2canvas(tableCard, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff"
    });

    const link = document.createElement("a");
    link.download = `វេនសម្អាតប្រចាំថ្ងៃ-${getISODate()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } catch (error) {
    console.error(error);
    alert("មិនអាចទាញយករូបភាពបានទេ!");
  }
}

async function downloadAsPDF() {
  if (rows.length === 0) {
    alert("សូមបន្ថែមការងារជាមុនសិន!");
    return;
  }

  try {
    const tableCard = document.querySelector(".table-card");
    const canvas = await html2canvas(tableCard, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff"
    });

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;

    const imageHeight = (canvas.height * availableWidth) / canvas.width;
    const height = Math.min(imageHeight, availableHeight);

    pdf.addImage(canvas.toDataURL("image/png"), "PNG", margin, margin, availableWidth, height);
    pdf.save(`វេនសម្អាតប្រចាំថ្ងៃ-${getISODate()}.pdf`);
  } catch (error) {
    console.error(error);
    alert("មិនអាចបង្កើត PDF បានទេ!");
  }
}

function getISODate() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}
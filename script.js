const KHMER_DAYS = ["អាទិត្យ", "ចន្ទ", "អង្គារ", "ពុធ", "ព្រហស្បតិ៍", "សុក្រ", "សៅរ៍"];
const KHMER_MONTHS = [
  "មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា",
  "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"
];

let rows = [];
let editingIndex = null;
let suppressResetHandler = false;

const nameInput = document.getElementById("name");
const responsibilityInput = document.getElementById("responsibility");
const otherInput = document.getElementById("other");
const form = document.getElementById("dailyWorkForm");
const submitButton = document.getElementById("submitButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const tableBody = document.getElementById("tableBody");
const emptyState = document.getElementById("emptyState");

document.addEventListener("DOMContentLoaded", () => {
  updateDate();
  renderTable();

  form.addEventListener("reset", () => {
    if (suppressResetHandler) return;
    setTimeout(cancelEdit, 0);
  });
});

function addRow() {
  const names = nameInput.value
    .trim()
    .split("\n")
    .map((name) => name.trim())
    .filter(Boolean);

  const responsibility = responsibilityInput.value.trim();
  const other = otherInput.value.trim();

  if (names.length === 0 || !responsibility) {
    alert("សូមបញ្ចូលអ្នកទទួលខុសត្រូវ និងការងារ!");
    return;
  }

  const entry = { names, responsibility, other };

  if (editingIndex !== null) {
    rows[editingIndex] = entry;
  } else {
    rows.push(entry);
  }

  resetFormState();
  renderTable();
  nameInput.focus();
}

function resetFormState() {
  editingIndex = null;
  submitButton.innerHTML = "＋ បន្ថែមការងារ";
  cancelEditButton.style.display = "none";

  suppressResetHandler = true;
  form.reset();
  suppressResetHandler = false;
}

function editRow(index) {
  const item = rows[index];
  editingIndex = index;

  nameInput.value = item.names.join("\n");
  responsibilityInput.value = item.responsibility;
  otherInput.value = item.other;

  submitButton.innerHTML = "✓ រក្សាទុកការកែប្រែ";
  cancelEditButton.style.display = "inline-flex";

  renderTable();
  nameInput.focus();
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

  rows.forEach((item, index) => {
    const row = document.createElement("tr");
    row.onclick = () => editRow(index);
    if (index === editingIndex) row.classList.add("editing");

    const namesHTML = item.names
      .map((name) => `<span class="person">${escapeHTML(name)}</span>`)
      .join("");

    row.innerHTML = `
      <td data-label="ល.រ"><span class="row-index">${index + 1}</span></td>
      <td data-label="អ្នកទទួលខុសត្រូវ"><div class="names">${namesHTML}</div></td>
      <td data-label="ការងារ"><div class="responsibility">${escapeHTML(item.responsibility)}</div></td>
      <td data-label="ផ្សេងៗ"><div class="other">${item.other ? escapeHTML(item.other) : ""}</div></td>
    `;

    tableBody.appendChild(row);
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
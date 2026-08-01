let rowNumber = 0;

function addRow() {
    const nameInput = document.getElementById("name");
    const responsibilityInput =document.getElementById("responsibility");
    const otherInput = document.getElementById("other");

    const name = nameInput.value.trim();
    const responsibility = responsibilityInput.value.trim();
    const other = otherInput.value.trim();

    if (!name || !responsibility) {
        alert("សូមបញ្ចូលឈ្មោះ និងការងារ!");
        return;
    }

    rowNumber++;

    const tableBody = document.querySelector("#dataTable tbody");
    const row = document.createElement("tr");
    row.innerHTML = `
        <td data-label="ល.រ">
            ${rowNumber}
        </td>

        <td data-label="ឈ្មោះ">
            ${escapeHTML(name)}
        </td>

        <td data-label="ការងារ">
            ${escapeHTML(responsibility)}
        </td>

        <td data-label="ផ្សេងៗ">
            ${other
                ? escapeHTML(other)
                : "-"
            }
        </td>

        <td data-label="សកម្មភាព">
            <button
                type="button"
                class="delete-btn"
                onclick="deleteRow(this)"
            >
                លុប
            </button>
        </td>
    `;
    tableBody.appendChild(row);
    updateTableState();
    document.getElementById("dailyWorkForm").reset();
    nameInput.focus();
}

function deleteRow(button) {
    const row = button.closest("tr");
    row.remove();
    renumberRows();
    updateTableState();
}

function renumberRows() {
    const rows = document.querySelectorAll("#dataTable tbody tr");
    rows.forEach((row, index) => {
        row.querySelector("td:first-child")
            .textContent = index + 1;
    });
    rowNumber = rows.length;
}


function updateTableState() {

    const rows = document.querySelectorAll("#dataTable tbody tr");
    const emptyState = document.getElementById("emptyState");
    const rowCount = document.getElementById("rowCount");
    if (rows.length === 0) {
        emptyState.style.display = "block";
    } else {
        emptyState.style.display = "none";
    }

    rowCount.textContent = `ចំនួន ${rows.length} ជួរ`;
}

//    Download as Image

async function downloadAsImage() {
    const tableCard = document.querySelector(".table-card");
    const rows = document.querySelectorAll("#dataTable tbody tr");

    if (rows.length === 0) {
        alert("សូមបន្ថែមទិន្នន័យជាមុនសិន!");
        return;
    }

    try {
        const canvas = await html2canvas(tableCard, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff"
        });
        const image = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `daily-work-${getDate()}.png`;
        link.href = image;
        link.click();
    } catch (error) {
        console.error(error);
        alert("មិនអាចទាញយករូបភាពបានទេ!");
    }
}


//    Download as PDF

async function downloadAsPDF() {
    const tableCard = document.querySelector(".table-card");
    const rows = document.querySelectorAll("#dataTable tbody tr");
    if (rows.length === 0) {
        alert("សូមបន្ថែមទិន្នន័យជាមុនសិន!");
        return;
    }

    try {
        const canvas =
            await html2canvas(tableCard, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff"
            });

        const image = canvas.toDataURL("image/png");
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({orientation: "portrait", unit: "mm",format: "a4"});
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const availableWidth = pageWidth - margin * 2;
        const imageHeight = (canvas.height * availableWidth) / canvas.width;
        let height = imageHeight;
        if (height > pageHeight - margin * 2) {
            height = pageHeight - margin * 2;
        }
        pdf.addImage(
            image,
            "PNG",
            margin,
            margin,
            availableWidth,
            height
        );

        pdf.save(`daily-work-${getDate()}.pdf`);
    } catch (error) {
        console.error(error);
        alert("មិនអាចបង្កើត PDF បានទេ!");
    }
}

function getDate() {

    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
}


document.addEventListener("DOMContentLoaded",() => {
        updateTableState();
    }
);
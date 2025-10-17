// menghapus class invalid
import { inputs, form } from "https://sipilku.vercel.app/page/urugan-tanah/uruganTanah.js";

const inputValid = () => {
  for (const input of inputs) {
    input.addEventListener("click", function () {
      if (input.classList.contains("is-invalid")) {
        input.classList.remove("is-invalid");
      }
    });
  }
};

// Navigasi Scroll Sipilku
window.onscroll = function () {
  const navbar = document.querySelector("#navbar");
  if (this.scrollY === 0) {
    navbar.style.backgroundColor = "transparent";
  } else {
    navbar.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
  }
};
// Akhir Navigasi Scroll Sipilku

// Reset Form
resetInput.addEventListener("click", function () {
  form.reset();
});
// Akhir Reset Form

// onclick = "exportToExcel('xlsx')";

// Export Excel
function exportToExcel(type, fn, dl) {
  var elt = document.getElementById("tbl_exporttable_to_xls");
  var wb = XLSX.utils.table_to_book(elt, { sheet: "sheet1" });
  return dl
    ? XLSX.write(wb, { bookType: type, bookSST: true, type: "base64" })
    : XLSX.writeFile(wb, fn || "Kebutuhan Material Balok." + (type || "xlsx"));
}

document.querySelector("#buttonExportExcel").onclick = function (e) {
  e.preventDefault();
  exportToExcel("xlsx");
};

// Akhir Export Excel

export default inputValid;
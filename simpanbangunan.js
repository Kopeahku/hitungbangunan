const inputs = document.querySelectorAll("#formInput input, #formInput select");
const calculateButtonTanahUrug = document.querySelector("#hitungMaterial");
const kebTanahUrug = document.querySelector("#kebTanahUrug");
const tableTanahUrug = document.querySelector("#tableTanahUrug");
import inputValid from "https://rawcdn.githack.com/Kopeahku/hitungbangunan/8dd64d3dfe1bb9f452b6e5c36ca14f5e9a719d66/exsporbangunan.js";
import Rumus from "https://sipilku.vercel.app/JS/rumus/rumusDasar.js";
const form = document.querySelector("#formInput");
const storageKey = "TANAHURUG_KEY";
let inputValidation = false;

document.addEventListener("DOMContentLoaded", function () {
  function validateInputs() {
    if (inputValidation) {
      inputValidation = false;
    } else {
      inputValidation = true;
    }
    inputs.forEach((input) => {
      if (input.value === "") {
        input.classList.add("is-invalid");
      }
    });
  }
  inputValid();

  class PerhitunganUrugan {
    constructor(inputs) {
      this.panjang = inputs[0].value * inputs[1].value;
      this.lebar = inputs[2].value * inputs[3].value;
      this.tinggi = inputs[4].value * inputs[5].value;
    }

    volUrugan(output) {
      const volume = Rumus.volumePekerjaan(
        this.panjang,
        this.lebar,
        this.tinggi
      );
      if (output) {
        output.innerHTML = `<li>Volume Pekerjaan : ${volume} m<sup>3</sup></li>
      <li>Kebutuhan Tanah Urug : ${parseFloat(
        (1.2 * volume).toFixed(3)
      )} m<sup>3</sup> atau ${parseFloat((volume / 7).toFixed(3))} truk</li>`;

        putVolume(`<li>Volume Pekerjaan : ${volume} m<sup>3</sup></li>
      <li>Kebutuhan Tanah Urug : ${parseFloat(
        (1.2 * volume).toFixed(3)
      )} m<sup>3</sup> atau ${parseFloat((volume / 7).toFixed(3))} truk</li>`);
      }
    }
  }

  calculateButtonTanahUrug.addEventListener("click", function (e) {
    e.preventDefault();
    validateInputs();
    const perhitunganUrugan = new PerhitunganUrugan(inputs);
    if (!inputValidation) {
      perhitunganUrugan.volUrugan(kebTanahUrug);
      perhitunganUrugan.volUrugan(tableTanahUrug);
    }
  });
});

export { inputs, form };

// local Storage
function putVolume(...data) {
  let dataVolume = data;
  localStorage.setItem(storageKey, JSON.stringify(dataVolume));
}

function getVolume() {
  if (localStorage.getItem(storageKey)) {
    const getVolume = JSON.parse(localStorage.getItem(storageKey));
    const arry = [];
    for (const volume of getVolume) {
      arry.push(volume);
    }
    if (kebTanahUrug) {
      kebTanahUrug.innerHTML = `${arry[0]}`;
      tableTanahUrug.innerHTML = `${arry[0]}`;
    }
  } else {
    return;
  }
}


getVolume();

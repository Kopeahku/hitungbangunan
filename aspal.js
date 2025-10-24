// =================================================================
// BAGIAN 1: KONSTANTA & VARIABEL GLOBAL
// =================================================================

// Biaya per Meter Kubik (m³)
const BIAYA_JENIS_ASPAL = {
    hotmixA: 950000, 
    hotmixB: 700000, 
    penetration: 500000
};

let hasilPerhitunganAspal = null; 

// =================================================================
// BAGIAN 2: UTILITY FUNCTIONS
// =================================================================

/**
 * Memformat angka menjadi string Rupiah.
 * @param {number} angka
 * @returns {string} Format Rp. XXX.XXX
 */
function formatRupiah(angka) {
    const roundedAngka = Math.round(angka);
    if (isNaN(roundedAngka) || roundedAngka < 0) return "Rp 0";
    
    // Menggunakan Intl.NumberFormat untuk formatting yang lebih rapi
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(roundedAngka);
}

/**
 * Mengaktifkan atau menonaktifkan mode harga manual vs otomatis.
 */
function toggleHargaMode() {
    const mode = document.getElementById('modeHarga').value;
    const jenisAspalSelect = document.getElementById('jenisAspal');
    const biayaManualInput = document.getElementById('biayaManual');

    // Default: Semua nonaktif
    biayaManualInput.disabled = true;
    jenisAspalSelect.disabled = true;

    if (mode === 'manual') {
        biayaManualInput.disabled = false;
        // Hanya set placeholder sebagai panduan, tidak mengubah nilai otomatis
        biayaManualInput.placeholder = 'Masukkan harga per m³'; 
    } else { // Otomatis
        jenisAspalSelect.disabled = false;
    }
    
    // Panggil update harga dan perhitungan setelah mode diubah
    updateHargaOtomatis();
    hitungBiayaAspal();
}

/**
 * Memperbarui nilai input manual dengan harga otomatis (saat mode 'otomatis' aktif).
 */
function updateHargaOtomatis() {
    const mode = document.getElementById('modeHarga').value;
    const jenisAspalValue = document.getElementById('jenisAspal').value;
    const biayaManualInput = document.getElementById('biayaManual');

    if (mode === 'otomatis') {
        let hargaOtomatis = BIAYA_JENIS_ASPAL[jenisAspalValue] || 0;
        
        // Atur nilai input manual ke harga otomatis (digunakan untuk perhitungan)
        biayaManualInput.value = hargaOtomatis;
        
        // Tampilkan format Rupiah di placeholder/sebagai feedback
        biayaManualInput.placeholder = formatRupiah(hargaOtomatis);
    }
}

// =================================================================
// BAGIAN 3: LOGIKA PERHITUNGAN
// =================================================================

function hitungBiayaAspal() {
    updateHargaOtomatis(); // Pastikan harga otomatis terbaru sudah dimuat

    // Ambil input dimensi
    const panjang = parseFloat(document.getElementById('panjang').value) || 0;
    const lebar = parseFloat(document.getElementById('lebar').value) || 0;
    const tinggiCm = parseFloat(document.getElementById('tinggi').value) || 0;
    const tinggiM = tinggiCm / 100;

    // Tentukan Biaya
    const modeHarga = document.getElementById('modeHarga').value;
    const jenisAspalValue = document.getElementById('jenisAspal').value;
    let biayaPerM3 = parseFloat(document.getElementById('biayaManual').value) || 0;
    let jenisLaporanText = "N/A";

    if (modeHarga === 'otomatis') {
        jenisLaporanText = document.getElementById('jenisAspal').options[document.getElementById('jenisAspal').selectedIndex].text;
    } else {
        jenisLaporanText = "Harga Manual";
    }

    // Validasi
    const downloadPdfBtn = document.getElementById('downloadPdfButton');
    const isValid = panjang > 0 && lebar > 0 && tinggiCm > 0 && biayaPerM3 > 0 && !(modeHarga === 'otomatis' && jenisAspalValue === 'default');

    if (!isValid) {
        document.getElementById('jenisTerpilih').textContent = 'Input/Harga tidak valid';
        document.getElementById('luasArea').textContent = '0';
        document.getElementById('volumeTotal').textContent = '0';
        document.getElementById('totalBiaya').textContent = 'Rp 0';
        downloadPdfBtn.disabled = true;
        hasilPerhitunganAspal = null;
        return;
    }

    // Perhitungan
    const luasArea = panjang * lebar;
    const volumeTotal = luasArea * tinggiM;
    const totalBiaya = volumeTotal * biayaPerM3;

    // Tampilkan Hasil di UI
    document.getElementById('jenisTerpilih').textContent = jenisLaporanText;
    document.getElementById('luasArea').textContent = luasArea.toFixed(2);
    document.getElementById('volumeTotal').textContent = volumeTotal.toFixed(3);
    document.getElementById('totalBiaya').textContent = formatRupiah(totalBiaya);
    
    // Simpan data hasil untuk PDF
    hasilPerhitunganAspal = {
        jenis: jenisLaporanText + (modeHarga === 'manual' ? ' (Harga Manual)' : ''),
        panjang: panjang,
        lebar: lebar,
        tinggiCm: tinggiCm,
        luas: luasArea.toFixed(2),
        volume: volumeTotal.toFixed(3),
        biayaM3: formatRupiah(biayaPerM3),
        total: totalBiaya
    };
    
    downloadPdfBtn.disabled = false;
}

// =================================================================
// BAGIAN 4: FUNGSI PDF GENERATION
// =================================================================

/**
 * Membuat konten HTML yang diformat untuk dimasukkan ke PDF (melalui html2canvas).
 * @returns {string} HTML string
 */
function createPdfContentHtml() {
    if (!hasilPerhitunganAspal) return '';

    return `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #007bff; border-bottom: 2px solid #ccc; padding-bottom: 10px;">Laporan Perkiraan Biaya Pengaspalan</h2>
            <p><strong>Tanggal:</strong> ${new Date().toLocaleString()}</p>
            
            <h3 style="margin-top: 20px; color: #333;">Detail Material & Dimensi</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="font-weight: bold; padding: 5px 0;">Jenis Aspal:</td><td>${hasilPerhitunganAspal.jenis}</td></tr>
                <tr><td style="font-weight: bold; padding: 5px 0;">Panjang:</td><td>${hasilPerhitunganAspal.panjang} meter</td></tr>
                <tr><td style="font-weight: bold; padding: 5px 0;">Lebar:</td><td>${hasilPerhitunganAspal.lebar} meter</td></tr>
                <tr><td style="font-weight: bold; padding: 5px 0;">Tinggi/Tebal:</td><td>${hasilPerhitunganAspal.tinggiCm} cm</td></tr>
                <tr><td style="font-weight: bold; padding: 5px 0;">Luas Total:</td><td>${hasilPerhitunganAspal.luas} m²</td></tr>
                <tr><td style="font-weight: bold; padding: 5px 0;">Volume Total:</td><td>${hasilPerhitunganAspal.volume} m³</td></tr>
            </table>

            <h3 style="margin-top: 20px; color: #333;">Rincian Biaya</h3>
            <p>Biaya per m³: <strong>${hasilPerhitunganAspal.biayaM3}</strong></p>
            <p style="font-size: 1.5em; color: #dc3545; margin-top: 15px;">TOTAL BIAYA: <strong>${formatRupiah(hasilPerhitunganAspal.total)}</strong></p>
            <p style="font-size: 0.8em; margin-top: 30px; border-top: 1px dashed #ccc; padding-top: 5px;">Perkiraan biaya ini mengasumsikan efisiensi 100% dan harga material/jasa per m³.</p>
        </div>
    `;
}

function generatePDF() {
    if (!hasilPerhitunganAspal) return;

    const JsPdfConstructor = window.jspdf && window.jspdf.jsPDF ? window.jspdf.jsPDF : window.jsPDF;
    
    if (typeof JsPdfConstructor === 'undefined') {
        alert("Library PDF (jsPDF) tidak ditemukan.");
        return;
    }

    const printContent = createPdfContentHtml();

    const tempElement = document.createElement('div');
    tempElement.innerHTML = printContent;
    document.body.appendChild(tempElement);
    
    html2canvas(tempElement, { scale: 3 }).then(canvas => {
        const pdf = new JsPdfConstructor({
            orientation: 'p', unit: 'mm', format: 'a4'
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 190; 
        const imgHeight = canvas.height * imgWidth / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        
        document.body.removeChild(tempElement);

        // Menggunakan output('dataurlnewwindow') untuk keandalan
        pdf.output('dataurlnewwindow');
    });
}

// =================================================================
// BAGIAN 5: INISIASI (Event Listeners)
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Event listener untuk mode harga dan jenis aspal
    document.getElementById('modeHarga').addEventListener('change', toggleHargaMode);
    document.getElementById('jenisAspal').addEventListener('change', hitungBiayaAspal); 

    // Event listener untuk semua input dimensi dan harga manual
    const inputs = ['panjang', 'lebar', 'tinggi', 'biayaManual'];
    inputs.forEach(id => {
        document.getElementById(id).addEventListener('input', hitungBiayaAspal);
    });

    // Panggil inisiasi saat startup
    toggleHargaMode();
});

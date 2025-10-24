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
// BAGIAN 2: UTILITY FUNCTIONS (Format & Toggle Mode)
// =================================================================

/**
 * Memformat angka menjadi string Rupiah menggunakan Intl.NumberFormat.
 */
function formatRupiah(angka) {
    const roundedAngka = Math.round(angka);
    if (isNaN(roundedAngka) || roundedAngka < 0) return "Rp 0";
    
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
        biayaManualInput.placeholder = 'Masukkan harga per m³'; 
    } else { // Otomatis
        jenisAspalSelect.disabled = false;
    }
    
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
        
        // Atur nilai input manual ke harga otomatis (nilai yang digunakan dalam perhitungan)
        biayaManualInput.value = hargaOtomatis;
        
        // Tampilkan format Rupiah di placeholder/sebagai feedback
        biayaManualInput.placeholder = formatRupiah(hargaOtomatis);
    } else {
        // Kosongkan placeholder jika mode manual
        biayaManualInput.placeholder = 'Masukkan harga per m³'; 
    }
}

// =================================================================
// BAGIAN 3: LOGIKA PERHITUNGAN UTAMA
// =================================================================

function hitungBiayaAspal() {
    updateHargaOtomatis(); 

    // Ambil input
    const panjang = parseFloat(document.getElementById('panjang').value) || 0;
    const lebar = parseFloat(document.getElementById('lebar').value) || 0;
    const tinggiCm = parseFloat(document.getElementById('tinggi').value) || 0;
    const densitasKgM3 = parseFloat(document.getElementById('densitas').value) || 0;
    
    const tinggiM = tinggiCm / 100;

    // Tentukan Biaya & Jenis
    const modeHarga = document.getElementById('modeHarga').value;
    const jenisAspalValue = document.getElementById('jenisAspal').value;
    let biayaPerM3 = parseFloat(document.getElementById('biayaManual').value) || 0;
    let jenisLaporanText = (modeHarga === 'otomatis' && jenisAspalValue !== 'default') 
        ? document.getElementById('jenisAspal').options[document.getElementById('jenisAspal').selectedIndex].text
        : "Harga Manual";

    // Validasi
    const downloadPdfBtn = document.getElementById('downloadPdfButton');
    const downloadCsvBtn = document.getElementById('downloadCsvButton');

    const isValid = panjang > 0 && lebar > 0 && tinggiCm > 0 && densitasKgM3 > 0 && biayaPerM3 > 0 && !(modeHarga === 'otomatis' && jenisAspalValue === 'default');

    if (!isValid) {
        // Reset UI dan nonaktifkan tombol
        document.getElementById('jenisTerpilih').textContent = 'Input/Harga tidak valid';
        document.getElementById('luasArea').textContent = '0';
        document.getElementById('volumeTotal').textContent = '0';
        document.getElementById('massaTotal').textContent = '0'; 
        document.getElementById('totalBiaya').textContent = 'Rp 0';
        downloadPdfBtn.disabled = true;
        downloadCsvBtn.disabled = true;
        hasilPerhitunganAspal = null;
        return;
    }

    // Perhitungan
    const luasArea = panjang * lebar;
    const volumeTotal = luasArea * tinggiM;
    const massaTotalKg = volumeTotal * densitasKgM3;
    const massaTotalTon = massaTotalKg / 1000;
    const totalBiaya = volumeTotal * biayaPerM3;

    // Tampilkan Hasil di UI
    document.getElementById('jenisTerpilih').textContent = jenisLaporanText;
    document.getElementById('luasArea').textContent = luasArea.toFixed(2);
    document.getElementById('volumeTotal').textContent = volumeTotal.toFixed(3);
    document.getElementById('massaTotal').textContent = massaTotalTon.toFixed(3);
    document.getElementById('totalBiaya').textContent = formatRupiah(totalBiaya);
    
    // Simpan data hasil untuk PDF/CSV
    hasilPerhitunganAspal = {
        jenis: jenisLaporanText + (modeHarga === 'manual' ? ' (Harga Manual)' : ''),
        panjang: panjang,
        lebar: lebar,
        tinggiCm: tinggiCm,
        densitas: densitasKgM3,
        luas: luasArea.toFixed(2),
        volume: volumeTotal.toFixed(3),
        massa: massaTotalTon.toFixed(3),
        biayaM3: formatRupiah(biayaPerM3),
        // Simpan nilai total mentah untuk CSV
        totalMentah: totalBiaya, 
        total: totalBiaya
    };
    
    downloadPdfBtn.disabled = false;
    downloadCsvBtn.disabled = false;
}

// =================================================================
// BAGIAN 4: FUNGSI DOWNLOAD PDF
// =================================================================

/**
 // =================================================================
// BAGIAN 4: FUNGSI DOWNLOAD PDF
// =================================================================

/**
 * Membuat konten HTML yang diformat untuk dimasukkan ke PDF.
 */
function createPdfContentHtml() {
    if (!hasilPerhitunganAspal) return '';

    // Ambil nilai yang sudah dihitung
    const volume = parseFloat(hasilPerhitunganAspal.volume); // m3
    const densitas = hasilPerhitunganAspal.densitas; // kg/m3
    const massaKg = volume * densitas;
    const massaTon = massaKg / 1000;

    return `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #007bff; border-bottom: 2px solid #ccc; padding-bottom: 10px;">Laporan Perkiraan Biaya Pengaspalan</h2>
            <p><strong>Tanggal:</strong> ${new Date().toLocaleString('id-ID')}</p>
            
            <h3 style="margin-top: 20px; color: #333;">Detail Material & Dimensi</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="font-weight: bold; padding: 5px 0;">Jenis Aspal:</td><td>${hasilPerhitunganAspal.jenis}</td></tr>
                <tr><td style="font-weight: bold; padding: 5px 0;">Panjang:</td><td>${hasilPerhitunganAspal.panjang} meter</td></tr>
                <tr><td style="font-weight: bold; padding: 5px 0;">Lebar:</td><td>${hasilPerhitunganAspal.lebar} meter</td></tr>
                <tr><td style="font-weight: bold; padding: 5px 0;">Tinggi/Tebal:</td><td>${hasilPerhitunganAspal.tinggiCm} cm</td></tr>
                <tr><td style="font-weight: bold; padding: 5px 0;">Densitas Aspal:</td><td>${hasilPerhitunganAspal.densitas} kg/m³</td></tr> 
                <tr><td style="font-weight: bold; padding: 5px 0;">Luas Total:</td><td>${hasilPerhitunganAspal.luas} m²</td></tr>
                <tr><td style="font-weight: bold; padding: 5px 0;">Volume Total:</td><td>${hasilPerhitunganAspal.volume} m³</td></tr>
            </table>

            <h3 style="margin-top: 20px; color: #333;">Rincian Perhitungan Massa Aspal</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 5px 0;">Volume Total</td>
                    <td>= ${volume.toFixed(3)} m³</td>
                </tr>
                <tr>
                    <td style="padding: 5px 0;">$\times$ Densitas</td>
                    <td>= ${densitas} kg/m³</td>
                </tr>
                <tr><td colspan="2" style="border-top: 1px solid #ccc;"></td></tr>
                <tr>
                    <td style="font-weight: bold; padding: 5px 0;">Massa Total (kg)</td>
                    <td style="font-weight: bold;">= ${massaKg.toFixed(3)} kg</td>
                </tr>
                <tr>
                    <td style="font-weight: bold; padding: 5px 0;">Massa Total (Ton)</td>
                    <td style="font-weight: bold; color: #dc3545;">= ${massaTon.toFixed(3)} Ton</td>
                </tr>
            </table>

            <h3 style="margin-top: 20px; color: #333;">Rincian Biaya</h3>
            <p>Biaya per m³: <strong>${hasilPerhitunganAspal.biayaM3}</strong></p>
            <p style="font-size: 1.5em; color: #dc3545; margin-top: 15px;">TOTAL BIAYA: <strong>${formatRupiah(hasilPerhitunganAspal.total)}</strong></p>
            <p style="font-size: 0.8em; margin-top: 30px; border-top: 1px dashed #ccc; padding-top: 5px;">Perkiraan biaya ini mengasumsikan efisiensi 100% dan harga material/jasa per m³.</p>
        </div>
    `;
}

// ... (sisa kode di bawahnya tetap sama) ...

function generatePDF() {
    if (!hasilPerhitunganAspal) return;

    const JsPdfConstructor = window.jspdf && window.jspdf.jsPDF ? window.jspdf.jsPDF : window.jsPDF;
    if (typeof JsPdfConstructor === 'undefined') {
        alert("Library PDF (jsPDF) tidak ditemukan. Periksa link CDN.");
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

        // Download Langsung menggunakan pdf.save()
        const totalRp = formatRupiah(hasilPerhitunganAspal.total);
        const safeName = hasilPerhitunganAspal.jenis.replace(/[^a-zA-Z0-9]/g, '_'); 
        const fileName = `Laporan_Aspal_${safeName}_Total_${totalRp.replace(/[^0-9]/g, '')}.pdf`;

        pdf.save(fileName);
    });
}

// =================================================================
// BAGIAN 5: FUNGSI DOWNLOAD CSV
// =================================================================

/**
 * Mengubah data hasil perhitungan menjadi format CSV dan memicu download.
 */
function generateCSV() {
    if (!hasilPerhitunganAspal) return;

    // Header CSV (Kolom)
    const header = [
        "Parameter", 
        "Nilai"
    ].join(",");
    
    // Data CSV (Baris). Menggunakan totalMentah untuk nilai numerik murni.
    const dataRows = [
        ["Jenis Aspal", hasilPerhitunganAspal.jenis],
        ["Panjang (m)", hasilPerhitunganAspal.panjang],
        ["Lebar (m)", hasilPerhitunganAspal.lebar],
        ["Tinggi/Tebal (cm)", hasilPerhitunganAspal.tinggiCm],
        ["Densitas (kg/m3)", hasilPerhitunganAspal.densitas],
        ["Luas Total (m2)", hasilPerhitunganAspal.luas],
        ["Volume Total (m3)", hasilPerhitunganAspal.volume],
        ["Massa Total (Ton)", hasilPerhitunganAspal.massa],
        // Ambil Biaya per M3 dari perhitungan total/volume (nilai mentah)
        ["Biaya per M3 (Rp)", (hasilPerhitunganAspal.totalMentah / hasilPerhitunganAspal.volume).toFixed(0)],
        ["TOTAL BIAYA", hasilPerhitunganAspal.totalMentah.toFixed(0)]
    ].map(row => row.join(",")).join("\n"); 

    const csvContent = header + "\n" + dataRows;
    
    // Membuat Blob dan URL untuk file download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    // Nama file
    const safeName = hasilPerhitunganAspal.jenis.replace(/[^a-zA-Z0-9]/g, '_'); 
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Aspal_${safeName}.csv`);
    
    // Memicu download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// =================================================================
// BAGIAN 6: INISIASI (Event Listeners)
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Event listener untuk mode harga dan jenis aspal
    document.getElementById('modeHarga').addEventListener('change', toggleHargaMode);
    document.getElementById('jenisAspal').addEventListener('change', hitungBiayaAspal); 

    // Event listener untuk semua input dimensi, densitas, dan harga manual
    const inputs = ['panjang', 'lebar', 'tinggi', 'densitas', 'biayaManual'];
    inputs.forEach(id => {
        document.getElementById(id).addEventListener('input', hitungBiayaAspal);
    });

    // Panggil inisiasi saat startup
    toggleHargaMode();
});

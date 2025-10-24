// Data Harga Aspal (Biaya per Meter Kubik)
const BIAYA_JENIS_ASPAL = {
    hotmixA: 950000, 
    hotmixB: 700000, 
    penetration: 500000
};

let hasilPerhitunganAspal = null; 

// Fungsi format Rupiah (tetap sama)
function formatRupiah(angka) {
    const roundedAngka = Math.round(angka);
    if (isNaN(roundedAngka) || roundedAngka < 0) return "Rp 0";
    
    const reverse = roundedAngka.toString().split('').reverse().join('');
    const ribuan = reverse.match(/\d{1,3}/g);
    const result = ribuan.join('.').split('').reverse().join('');
    return `Rp ${result}`;
}

// -----------------------------------------------------------------
// FUNGSI UTAMA: Mengubah Mode Input Harga
// -----------------------------------------------------------------
function toggleHargaMode() {
    const mode = document.getElementById('modeHarga').value;
    const jenisAspalSelect = document.getElementById('jenisAspal');
    const biayaManualInput = document.getElementById('biayaManual');
    
    // Nonaktifkan dan Atur ulang default
    biayaManualInput.disabled = true;
    jenisAspalSelect.disabled = true;

    if (mode === 'manual') {
        biayaManualInput.disabled = false;
        // Biarkan nilai jenis aspal tetap, tapi tidak digunakan
        
    } else { // Otomatis
        jenisAspalSelect.disabled = false;
        // Set harga manual ke 0 agar tidak mengganggu perhitungan
        biayaManualInput.value = 0; 

        // Panggil fungsi untuk memperbarui harga otomatis saat mode kembali
        updateHargaOtomatis();
    }
    
    hitungBiayaAspal();
}

// -----------------------------------------------------------------
// FUNGSI BARU: Memperbarui Harga Manual dengan Harga Otomatis
// -----------------------------------------------------------------
function updateHargaOtomatis() {
    const mode = document.getElementById('modeHarga').value;
    const jenisAspalValue = document.getElementById('jenisAspal').value;
    const biayaManualInput = document.getElementById('biayaManual');

    // Hanya bekerja dalam mode Otomatis
    if (mode === 'otomatis') {
        let hargaOtomatis = BIAYA_JENIS_ASPAL[jenisAspalValue] || 0;
        
        // Atur nilai input manual ke harga otomatis (meskipun disabled)
        // Ini memastikan biaya yang dipakai dalam perhitungan adalah harga yang ditampilkan
        biayaManualInput.value = hargaOtomatis;
        
        // Tampilkan harga di field yang disabled (sebagai feedback visual)
        biayaManualInput.placeholder = formatRupiah(hargaOtomatis);
    }
}


// -----------------------------------------------------------------
// FUNGSI PERHITUNGAN UTAMA (Dimodifikasi)
// -----------------------------------------------------------------
function hitungBiayaAspal() {
    // Panggil updateHargaOtomatis setiap kali hitungBiaya dipanggil
    updateHargaOtomatis(); 

    // 1. Ambil Input Dimensi
    const panjang = parseFloat(document.getElementById('panjang').value) || 0;
    const lebar = parseFloat(document.getElementById('lebar').value) || 0;
    const tinggiCm = parseFloat(document.getElementById('tinggi').value) || 0;
    const tinggiM = tinggiCm / 100;

    // 2. Tentukan Mode dan Biaya
    const modeHarga = document.getElementById('modeHarga').value;
    const jenisAspalValue = document.getElementById('jenisAspal').value;
    let biayaPerM3 = 0;
    let jenisLaporanText = "N/A";

    if (modeHarga === 'otomatis') {
        biayaPerM3 = parseFloat(document.getElementById('biayaManual').value) || 0; // Ambil nilai yang sudah diisi otomatis
        jenisLaporanText = document.getElementById('jenisAspal').options[document.getElementById('jenisAspal').selectedIndex].text;
    } else { // Manual
        biayaPerM3 = parseFloat(document.getElementById('biayaManual').value) || 0;
        jenisLaporanText = "Harga Manual";
    }

    // 3. Validasi dan Tampilan Awal
    const downloadPdfBtn = document.getElementById('downloadPdfButton');
    
    // Cek kondisi invalid
    if (panjang <= 0 || lebar <= 0 || tinggiCm <= 0 || biayaPerM3 <= 0 || (modeHarga === 'otomatis' && jenisAspalValue === 'default')) {
        document.getElementById('jenisTerpilih').textContent = 'Input/Harga tidak valid';
        document.getElementById('luasArea').textContent = '0';
        document.getElementById('volumeTotal').textContent = '0';
        document.getElementById('totalBiaya').textContent = 'Rp 0';
        downloadPdfBtn.disabled = true;
        hasilPerhitunganAspal = null;
        return;
    }

    // 4. Perhitungan
    const luasArea = panjang * lebar;
    const volumeTotal = luasArea * tinggiM;
    const totalBiaya = volumeTotal * biayaPerM3;

    // 5. Tampilkan Hasil
    document.getElementById('jenisTerpilih').textContent = jenisLaporanText;
    document.getElementById('luasArea').textContent = luasArea.toFixed(2);
    document.getElementById('volumeTotal').textContent = volumeTotal.toFixed(3);
    document.getElementById('totalBiaya').textContent = formatRupiah(totalBiaya);
    
    // 6. Simpan data untuk PDF
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

// -----------------------------------------------------------------
// FUNGSI PDF (Tidak ada perubahan, tetapi harus disertakan)
// -----------------------------------------------------------------
function generatePDF() {
    if (!hasilPerhitunganAspal) return;

    // 1. Tentukan Objek jsPDF
    // Gunakan window.jspdf.jsPDF (UMD) sebagai default, atau fallback ke window.jsPDF (Legacy)
    const JsPdfConstructor = window.jspdf && window.jspdf.jsPDF ? window.jspdf.jsPDF : window.jsPDF;
    
    if (typeof JsPdfConstructor === 'undefined') {
        alert("Library PDF (jsPDF) tidak ditemukan. Coba muat ulang halaman atau periksa tautan CDN.");
        return;
    }

    const printContent = `
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

    const tempElement = document.createElement('div');
    tempElement.innerHTML = printContent;
    document.body.appendChild(tempElement);
    
    html2canvas(tempElement, { scale: 3 }).then(canvas => {
        const pdf = new JsPdfConstructor({ 
        orientation: 'p', 
        unit: 'mm', 
        format: 'a4' 
    });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 190; 
        const imgHeight = canvas.height * imgWidth / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        
        document.body.removeChild(tempElement);

        const totalRp = formatRupiah(hasilPerhitunganAspal.total);
        const fileName = `Laporan_Aspal_${hasilPerhitunganAspal.jenis.replace(/[^a-zA-Z0-9]/g, '_')}_${totalRp.replace(/[^a-zA-Z0-9]/g, '')}.pdf`;
        pdf.save(fileName);
    });
}

// Inisiasi
document.addEventListener('DOMContentLoaded', () => {
    toggleHargaMode();
    // Tambahkan event listener untuk Jenis Aspal agar harga diperbarui saat pilihan berubah
    document.getElementById('jenisAspal').addEventListener('change', hitungBiayaAspal); 
    hitungBiayaAspal();
});

// Data Harga Aspal (DIUBAH KE BIAYA PER METER KUBIK)
const BIAYA_JENIS_ASPAL = {
    // Angka ini adalah biaya per meter kubik (m³).
    // Anggap Hotmix B 700.000, Hotmix A 950.000, Penetrasi 500.000 per m³
    hotmixA: 950000, 
    hotmixB: 700000, 
    penetration: 500000
};

let hasilPerhitunganAspal = null; 

function formatRupiah(angka) {
    const roundedAngka = Math.round(angka);
    if (isNaN(roundedAngka) || roundedAngka < 0) return "Rp 0";
    
    const reverse = roundedAngka.toString().split('').reverse().join('');
    const ribuan = reverse.match(/\d{1,3}/g);
    const result = ribuan.join('.').split('').reverse().join('');
    return `Rp ${result}`;
}

function hitungBiayaAspal() {
    // 1. Ambil Input
    const jenisAspalValue = document.getElementById('jenisAspal').value;
    const panjang = parseFloat(document.getElementById('panjang').value) || 0;
    const lebar = parseFloat(document.getElementById('lebar').value) || 0;
    const tinggiCm = parseFloat(document.getElementById('tinggi').value) || 0; // Input baru
    
    const tinggiM = tinggiCm / 100; // Konversi cm ke meter

    const downloadPdfBtn = document.getElementById('downloadPdfButton');
    const jenisTerpilihText = document.getElementById('jenisAspal').options[document.getElementById('jenisAspal').selectedIndex].text;

    let biayaPerM3 = BIAYA_JENIS_ASPAL[jenisAspalValue] || 0;
    
    // Tampilkan Biaya per M3 Otomatis
    document.getElementById('biayaM3DisplayInput').textContent = formatRupiah(biayaPerM3);

    if (panjang <= 0 || lebar <= 0 || tinggiCm <= 0 || biayaPerM3 <= 0) {
        document.getElementById('jenisTerpilih').textContent = 'Belum dipilih / Input tidak valid';
        document.getElementById('luasArea').textContent = '0';
        document.getElementById('volumeTotal').textContent = '0';
        document.getElementById('totalBiaya').textContent = 'Rp 0';
        downloadPdfBtn.disabled = true;
        hasilPerhitunganAspal = null;
        return;
    }

    // 2. Perhitungan Volume
    const luasArea = panjang * lebar;
    const volumeTotal = luasArea * tinggiM; // Volume = P x L x T(m)
    const totalBiaya = volumeTotal * biayaPerM3;

    // 3. Tampilkan Hasil
    document.getElementById('jenisTerpilih').textContent = jenisTerpilihText;
    document.getElementById('luasArea').textContent = luasArea.toFixed(2);
    document.getElementById('volumeTotal').textContent = volumeTotal.toFixed(3); // Tampilkan 3 desimal untuk volume
    document.getElementById('totalBiaya').textContent = formatRupiah(totalBiaya);
    
    // 4. Simpan data untuk PDF
    hasilPerhitunganAspal = {
        jenis: jenisTerpilihText,
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
// FUNGSI PDF (Menggunakan html2canvas & jsPDF)
// -----------------------------------------------------------------
function generatePDF() {
    if (!hasilPerhitunganAspal) return;

    // *Modifikasi:* Gunakan data yang disimpan di hasilPerhitunganAspal untuk konten yang lebih detail di PDF
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

    // 5. Buat elemen temporer untuk konten PDF
    const tempElement = document.createElement('div');
    tempElement.innerHTML = printContent;
    document.body.appendChild(tempElement);
    
    // 6. Gunakan html2canvas pada elemen temporer
    html2canvas(tempElement, { scale: 3 }).then(canvas => {
        const pdf = new window.jspdf.jsPDF({
            orientation: 'p', unit: 'mm', format: 'a4'
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 190; 
        const imgHeight = canvas.height * imgWidth / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        
        // Bersihkan elemen temporer
        document.body.removeChild(tempElement);

        // 7. Unduh PDF
        const totalRp = formatRupiah(hasilPerhitunganAspal.total);
        const fileName = `Laporan_Aspal_${hasilPerhitunganAspal.jenis}_${totalRp.replace(/[^a-zA-Z0-9]/g, '')}.pdf`;
        pdf.save(fileName);
    });
}

// Inisiasi
document.addEventListener('DOMContentLoaded', hitungBiayaAspal);

// Data Harga Aspal
const BIAYA_JENIS_ASPAL = {
    hotmixA: 95000,
    hotmixB: 70000,
    penetration: 50000
};

// Variabel untuk menyimpan data hasil (untuk PDF)
let hasilPerhitunganAspal = null; 

// Fungsi format Rupiah
function formatRupiah(angka) {
    const roundedAngka = Math.round(angka);
    if (isNaN(roundedAngka) || roundedAngka < 0) return "Rp 0";
    
    const reverse = roundedAngka.toString().split('').reverse().join('');
    const ribuan = reverse.match(/\d{1,3}/g);
    const result = ribuan.join('.').split('').reverse().join('');
    return `Rp ${result}`;
}

// Fungsi Perhitungan Utama
function hitungBiayaAspal() {
    const jenisAspalValue = document.getElementById('jenisAspal').value;
    const panjang = parseFloat(document.getElementById('panjang').value) || 0;
    const lebar = parseFloat(document.getElementById('lebar').value) || 0;
    
    const downloadPdfBtn = document.getElementById('downloadPdfButton');
    const jenisTerpilihText = document.getElementById('jenisAspal').options[document.getElementById('jenisAspal').selectedIndex].text;

    let biayaTerpilih = BIAYA_JENIS_ASPAL[jenisAspalValue] || 0;
    
    // Tampilkan Biaya per M2 Otomatis di input display
    document.getElementById('biayaM2DisplayInput').textContent = formatRupiah(biayaTerpilih);

    if (panjang <= 0 || lebar <= 0 || biayaTerpilih <= 0) {
        document.getElementById('jenisTerpilih').textContent = 'Belum dipilih / Input tidak valid';
        document.getElementById('luasArea').textContent = '0';
        document.getElementById('totalBiaya').textContent = 'Rp 0';
        downloadPdfBtn.disabled = true;
        hasilPerhitunganAspal = null;
        return;
    }

    const luasArea = panjang * lebar;
    const totalBiaya = luasArea * biayaTerpilih;

    // Tampilkan Hasil
    document.getElementById('jenisTerpilih').textContent = jenisTerpilihText;
    document.getElementById('luasArea').textContent = luasArea.toFixed(2);
    document.getElementById('totalBiaya').textContent = formatRupiah(totalBiaya);
    
    // Simpan data untuk PDF (untuk mencantumkan detail di nama file)
    hasilPerhitunganAspal = {
        jenis: jenisTerpilihText,
        total: totalBiaya
    };
    
    downloadPdfBtn.disabled = false;
}

// -----------------------------------------------------------------
// FUNGSI PDF (Menggunakan html2canvas & jsPDF)
// -----------------------------------------------------------------
function generatePDF() {
    if (!hasilPerhitunganAspal) return;

    // 1. Ambil elemen HTML yang berisi hasil laporan
    const element = document.getElementById('hasilLaporan');

    // 2. Gunakan html2canvas untuk mengubah elemen menjadi kanvas (gambar)
    html2canvas(element, { scale: 3 }).then(canvas => {
        // 3. Konfigurasi PDF
        const pdf = new window.jspdf.jsPDF({
            orientation: 'p', // Portrait
            unit: 'mm',
            format: 'a4'
        });

        // Ukuran gambar (kanvas) dan halaman PDF
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 190; // Lebar PDF A4 dalam mm dikurangi margin
        const pageHeight = 295;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        let position = 10; // Margin atas

        // 4. Tambahkan gambar ke PDF
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // 5. Tambahkan halaman baru jika konten melebihi satu halaman (biasanya tidak untuk kalkulator sederhana)
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight + 10;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        // 6. Unduh PDF dengan nama file yang informatif
        const totalRp = formatRupiah(hasilPerhitunganAspal.total);
        const fileName = `Laporan_Aspal_${hasilPerhitunganAspal.jenis}_${totalRp.replace(/[^a-zA-Z0-9]/g, '')}.pdf`;
        pdf.save(fileName);
    });
}

// Inisiasi
document.addEventListener('DOMContentLoaded', hitungBiayaAspal);

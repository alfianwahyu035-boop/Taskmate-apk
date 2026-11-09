# TaskMate · GitHub Pages

Deploy hanya file website: `index.html`, `app.js`, `styles.css`, `config.js`, `roster-data.js`, `excel-import.js`, `Template_Import_TaskMate_Jadwal_Rak.xlsx`, `sw.js`, `manifest.webmanifest`, folder `icons/`.

## Publikasi
1. Buat repo baru di GitHub, contoh `taskmate-reminder` (public jika menggunakan Pages di akun gratis).
2. Unggah **isi ZIP ini** ke root repo (jangan unggah ZIP sebagai satu file).
3. Buka Settings → Pages → Build and deployment → Deploy from a branch → `main` → `/(root)` → Save.
4. Buka URL yang GitHub tampilkan. Tunggu hingga status deployment berhasil.
5. Buat akun admin pertama, verifikasi email Supabase, lalu buat tim.
6. Dari menu Checklist Shift → **Hubungkan akun karyawan**, tekan **Unduh template Excel**. Isi sheet **Jadwal** (Nama, Tanggal, Kode Shift) dan **Rak** (Nama, Nomor Rak), lalu upload lewat dua tombol Import Excel. Format `.xlsx`, `.xls`, `.xlsm` didukung. Bisa satu file berisi dua sheet atau file terpisah. Jangan upload Excel karyawan ke GitHub. JSON versi lama tetap didukung sebagai opsi cadangan.
7. Minta setiap karyawan mendaftar dan memasukkan kode tim. Akun akan berstatus MENUNGGU dan tidak bisa melihat data. Admin membuka menu Tim & Anggota untuk menyetujui, menolak atau menonaktifkan akun, dan mengatur peran. Setelah disetujui admin menautkan nama ke akun satu kali. Impor Excel selanjutnya akan sinkron ke karyawan yang sudah tertaut; karyawan baru perlu ditautkan lebih dahulu.
8. Uji dua HP, bukti kamera, dan checklist sebelum digunakan operasional.

**Penting:** URL dan publishable key di `config.js` boleh berada di browser, tetapi **jangan** memasukkan `service_role` atau secret key. Roster/rak tidak ada dalam file publik. Bucket Supabase dibuat privat. GitHub Pages hanya hosting frontend: AI Vision dan Push memerlukan Edge Functions, secret, dan scheduler yang dikonfigurasi terpisah.

**Supabase Auth:** setelah situs GitHub Pages aktif, daftarkan URL situs di Supabase Dashboard → Authentication → URL Configuration → Redirect URLs (dan Site URL bila perlu), untuk tautan verifikasi/reset.

**Manajemen akun v10:** kode undangan tidak otomatis memberikan akses. Karyawan harus disetujui admin melalui menu Tim; RLS database memblokir akses anggota pending, ditolak, dan nonaktif. Admin terakhir tidak dapat diturunkan atau dinonaktifkan. Jangan sebarkan kode tim secara publik. Foto tetap tunduk pada validasi shift/time server yang sudah dipasang.

## Aturan pembaruan Excel
- Kolom `Nama` dicocokkan secara tepat (abaikan kapital/spasi ganda); nama lama dipertahankan supaya tautan akun tidak berubah. Jangan menggunakan nama panggilan berbeda untuk karyawan yang sama.
- Impor Jadwal menambah atau mengubah **tanggal yang ada dalam file saja**; tanggal lain tetap disimpan. Untuk akun tertaut, jadwal **besok dan seterusnya** diperbarui di roster online; jadwal hari ini/masa lalu tidak ditimpa agar audit aman.
- Impor Rak menggantikan daftar rak **untuk PIC yang tercantum di file saja**; penugasan lain tidak diubah. Rak yang dikeluarkan dari daftar dinonaktifkan, bukan dihapus, sehingga foto historis tetap ada.
- Kode shift yang didukung: `P7` (Shift 1), `S14` (Shift 2), `M22` (Shift 3), `O`, `AO`, `MT`, `C`; juga menerima label `SHIFT 1/2/3`, `OFF`, `CUTI`.
- File Excel diproses **di browser admin**, lalu hanya data terstruktur yang disimpan ke tabel Supabase privat `shift_staff_seed`. Website tidak mengunggah file asli ke GitHub.
- Pustaka pembaca Excel adalah **SheetJS Community Edition 0.20.3** dari CDN resmi dan membutuhkan koneksi internet saat pertama memuatnya.
- Format jadwal matriks kantor yang memiliki kolom `NAMA`, tanggal `1,2,...,30/31` dan judul seperti `SCHEDULE NOVEMBER 2026` juga didukung (contoh `2026NEW.xlsx`). Format daftar rak khusus lain yang belum mengikuti template perlu disesuaikan menjadi `Nama / Nomor Rak`.

## Upgrade v9 → v10 (Manajemen Akun)
- Jika v9 sudah diunggah, gunakan **ZIP patch v10**: ganti `app.js`, `sw.js`, dan `README.md` saja. Data Supabase tetap tersimpan.
- Server Supabase TASKMATE-REMINDER sudah menerima perubahan: status `pending/approved/rejected/disabled`, approval admin, dan pembatasan RLS. Tidak perlu menjalankan SQL manual.
- Admin: **Tim → Permintaan Persetujuan**, klik **Setujui / Tolak**. Akun aktif dapat ditetapkan Admin/Karyawan atau dinonaktifkan.
- Pendaftaran baru via login/daftar langsung di aplikasi, bukan membuat user lewat dashboard Supabase. Jika verifikasi email aktif, pengguna perlu verifikasi dulu.
- Jika website masih versi lama, bersihkan cache browser atau tutup dan buka kembali situs setelah memperbarui GitHub Pages.

## Membuat APK Android (tambahan v10)

Paket ini juga memiliki build APK otomatis dari **GitHub Actions**. Lihat [`README-APK.md`](README-APK.md) untuk langkah tanpa Android Studio. APK hasil Actions adalah **debug APK** untuk percobaan.

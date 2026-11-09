# TaskMate v10 — Build APK Android

Paket ini sekaligus menjalankan **website GitHub Pages** dan menyediakan workflow **GitHub Actions** untuk membangun APK Android. Backend tetap proyek Supabase `TASKMATE-REMINDER`. **Tidak ada password maupun service-role key** di dalam paket.

## Pilihan A — Buat APK langsung dari GitHub (tanpa Android Studio)

1. Ekstrak ZIP lengkap dan upload **seluruh isi folder** ke root repository GitHub `taskmate-reminder`, termasuk folder tersembunyi `.github/workflows/` dan folder `android-icons/`. Jangan upload file ZIP sebagai file tunggal.
2. Pastikan semua file terbaru sudah di-**Commit** di branch `main`. Website GitHub Pages tetap dipublikasikan dari root `main` seperti sebelumnya.
3. Masuk ke repository → tab **Actions** → pilih workflow **Build APK TaskMate**. Jika diminta, aktifkan GitHub Actions.
4. Klik **Run workflow → Run workflow**, atau buka hasil workflow yang otomatis berjalan setelah push.
5. Jika run bertanda hijau, buka detail run → bagian **Artifacts** → unduh **TaskMate-v10-debug-APK**.
6. Ekstrak hasil unduhan GitHub (ZIP); di dalamnya terdapat `app-debug.apk`. Salin APK ke HP Android, izinkan instalasi dari sumber yang Bang percaya, lalu pasang.

**APK ini debug** (untuk uji coba/internal), bukan APK release siap Google Play. Jangan menaruh keystore atau password signing di repository publik. Untuk versi produksi, buat keystore privat di Android Studio dan bangun APK/AAB release bertanda tangan.

## Pilihan B — Build di Android Studio

Syarat: Node.js 22+, Android Studio versi yang kompatibel dengan Capacitor v8, dan Android SDK (disiapkan melalui Android Studio).

```bash
npm install
npm run android:init
npx cap open android
```

Di Android Studio, jalankan **Build APK(s)** pada konfigurasi debug. APK ada di `android/app/build/outputs/apk/debug/app-debug.apk`.

Jika kode web diubah dan proyek `android/` sudah dibuat, jalankan:

```bash
npm run android:sync
```

Lalu build ulang di Android Studio. Jika folder `android/` belum ada, gunakan `npm run android:init` terlebih dahulu. Jangan jalankan `android:init` dua kali pada folder yang sama.

## Penting untuk operasional

- **Website GitHub Pages tetap berfungsi seperti v10**. File tambahan `package.json`, workflow, dan skrip hanya untuk proses APK.
- **API Supabase** dipakai untuk login, persetujuan admin, jadwal, rak, sinkronisasi, dan foto. Koneksi internet tetap diperlukan. URL dan publishable key di `config.js` memang boleh dibaca browser; **jangan menambahkan service_role atau API secret**.
- APK dibuka dari `https://localhost` secara lokal oleh Capacitor. Halaman memakai CDN Supabase dan SheetJS, sehingga aplikasi perlu internet saat pertama memuat pustaka.
- Izin **INTERNET** dan **CAMERA** ditambahkan ke manifest Android. Foto menggunakan `getUserMedia` dan cropping lama. **Periksa kamera serta penyimpanan foto di HP asli** sebelum dipakai untuk pekerjaan wajib. Izin kamera dapat berbeda antarmodel Android/WebView.
- **Web Push dari GitHub Pages tidak otomatis menjadi notifikasi native APK**. Push latar belakang APK/FCM, AI sisir harga, dan jadwal notifikasi server belum dikonfigurasi. Pengingat di aplikasi terbuka tetap bisa berfungsi jika didukung perangkat.
- Perubahan versi website **tidak langsung memperbarui APK yang sudah terpasang**. Build APK baru dan distribusikan setelah perubahan kode.
- **Tidak ada Excel roster asli atau daftar PIC privat** di paket. Impor Excel melalui halaman Admin sesudah akun disetujui.
- Tautan verifikasi/reset email Supabase perlu dikonfigurasi ke URL GitHub Pages melalui Supabase Auth → URL Configuration. Tautan tersebut bisa membuka browser, lalu pengguna kembali login di APK.
- Untuk menampilkan foto kamera secara benar, aplikasi harus meminta izin kamera dan perangkat harus memiliki Android System WebView yang mendukung.

## Struktur paket

- `.github/workflows/build-apk.yml` — Build otomatis APK melalui GitHub Actions.
- `package.json` dan `capacitor.config.json` — konfigurasi Capacitor 8 (app ID `com.taskmate.reminder`).
- `scripts/prepare-web.mjs` — salin **hanya** file web publik ke folder `www/` dan matikan service worker khusus dalam APK.
- `scripts/patch-native.mjs` — tambahkan izin kamera/internet dan ikon pada Android Manifest.
- `android-icons/` — ikon TaskMate berbagai ukuran untuk launcher Android.
- `index.html` + `app.js` + file web lain — website lama, tidak perlu diubah.

**Catatan biaya:** Build GitHub Actions bisa tunduk pada kuota/biaya GitHub sesuai jenis repository dan paket akun. Periksa penggunaan GitHub Actions jika akun dikenakan biaya; jangan upgrade berbayar tanpa sadar.

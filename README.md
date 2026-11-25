# DuitDulu

Buka `index.html` (otomatis menuju `login/index.html`). Alur: **login** (masuk ⇄ daftar) → **app** (halaman utama). `app/duit.html` kembali ke login bila belum masuk.

```
duitdulu/
├─ index.html                 pintu masuk (mengarahkan ke login/)
├─ login/                     halaman masuk & daftar
│  ├─ index.html   register.html
│  ├─ css/style.css
│  ├─ js/main.js              animasi logo + logika form
│  └─ assets/logo/            logo asli & potongan per huruf
├─ app/                       halaman utama (aplikasi SAW)
│  ├─ duit.html   d aja.png
│  ├─ css/duit.css   css/duit-motion.css
│  ├─ js/duit.js     js/duit-motion.js
│  └─ assets/images/
├─ shared/                    dipakai kedua halaman
│  ├─ config.js               ← ISI SUPABASE + atur kecepatan animasi di sini
│  ├─ motion-core.js          pengatur kecepatan/gerak animasi
│  └─ store.js                login, daftar, draft, riwayat (Supabase / mode demo)
└─ supabase/schema.sql        tabel + aturan keamanan (dijalankan di Supabase)
```

## Animasi
Di `shared/config.js`: `MOTION_SPEED` (1 = normal, 1.6 = bawaan lebih lambat, 2 = sangat lambat) dan `FORCE_MOTION` (true = tetap bergerak walau perangkat memilih "kurangi gerakan").

## Supabase
Selama `shared/config.js` kosong, berjalan dalam mode demo (akun & data hanya di browser ini). Isi URL dan anon key untuk memakai Supabase; jangan memakai key `service_role`. Untuk uji coba matikan "Confirm email".

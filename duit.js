"use strict";

/* ################################################################
   DUITDULU - LOGIKA & PERHITUNGAN (duit.js)
   ################################################################

   DAFTAR ISI (disusun berurutan sesuai tahapan)
     BAGIAN  1 . PENGATURAN & DATA YANG BOLEH ANDA UBAH
     BAGIAN  2 . ALAT BANTU (dipakai semua tahap)
     BAGIAN  3 . PENYIMPANAN DI BROWSER (data kerja, draft, riwayat)
     BAGIAN  4 . NAVIGASI (pindah halaman & sidebar)
     BAGIAN  5 . DASHBOARD
     BAGIAN  6 . TAHAP 1 · DANA
     BAGIAN  7 . TAHAP 2 · PENILAIAN (+ Panduan Skor & popup Selengkapnya)
     BAGIAN  8 . TAHAP 3 · HASIL SAW
     BAGIAN  9 . TAHAP 4 · ALOKASI DANA
     BAGIAN 10 . RIWAYAT (+ popup detail & laporan cetak)
     BAGIAN 11 . MULAI (menjalankan semuanya)  - HARUS PALING BAWAH

   CARA MEMBACA
   - Cari kata  BAGIAN 6  (misalnya) untuk melompat ke tahap tertentu.
   - Cari kata  GANTI TEKS   -> tulisan/pesan yang boleh Anda ganti.
   - Cari kata  JANGAN UBAH  -> bagian yang dipakai bagian lain (id, nama fungsi).
   - Cari kata  LANGKAH      -> penjelasan tahap demi tahap pada rumus perhitungan.
   - Setiap fungsi punya komentar di atasnya yang menjelaskan fungsinya.

   HUBUNGAN DENGAN FILE LAIN
   - duit.html : isi halaman (teks, gambar, ikon). Elemen yang dicari JavaScript
                 lewat id="..." (misalnya $("#totalFunds")) TIDAK boleh diganti id-nya.
   - duit.css  : tampilan. Nama bagiannya sejajar dengan BAGIAN di sini.
   ################################################################ */

/* ################################################################
   BAGIAN 1 · PENGATURAN & DATA YANG BOLEH ANDA UBAH
   Data yang dipakai seluruh website. Mengubah tulisan/angka di sini cukup untuk
   mengubah tampilan di banyak tempat sekaligus. Bagian ini di paling atas agar mudah dicari.
   ################################################################ */

/*
   1. NAMA PENGGUNA
   name = tulisan yang tampil di pojok kanan atas dan di sapaan "Halo, ...!".
   GANTI TEKS: ubah nilai name saja.
   JANGAN UBAH id: id dipakai sebagai bagian nama penyimpanan di browser.
   Bila id diubah, draft dan riwayat yang sudah tersimpan tidak akan terbaca.
*/
let user = {
  id: "local-user",
  name: "Pengguna",
};

/*
   2. DAFTAR KEBUTUHAN (ALTERNATIF)
   Format tiap baris:  ["KODE", "Nama lengkap kebutuhan"].
   GANTI TEKS : ubah nama lengkap di sebelah kanan kode.
   MENAMBAH KEBUTUHAN : tambahkan baris baru (misalnya ["A11", "Zakat dan donasi"]),
     lalu tambahkan juga kodenya di NEED_META di bawah. Kotak di Tahap 1 muncul otomatis.
   Nama lengkap ini dipakai di tabel penilaian, hasil, alokasi, dan riwayat.
*/
const ALTERNATIVES = [
  ["A1", "Kebutuhan pangan"],
  ["A2", "Tempat tinggal dan utilitas"],
  ["A3", "Transportasi"],
  ["A4", "Pendidikan dan pengembangan diri"],
  ["A5", "Kesehatan"],
  ["A6", "Komunikasi dan internet"],
  ["A7", "Kewajiban finansial"],
  ["A8", "Kebersihan dan kebutuhan pribadi"],
  ["A9", "Tabungan dan tujuan keuangan"],
  ["A10", "Hiburan dan keinginan pribadi"],
];

/*
   3. NAMA PENDEK & IKON TIAP KEBUTUHAN
   short = nama singkat pada kotak kebutuhan di Tahap 1.
   icon  = nama ikon (tanpa awalan "x-"), lihat daftar ikon di daftar ikon (sprite SVG) di duit.html.
            Contoh: icon "wallet" memanggil ikon x-wallet.
   GANTI IKON : ubah nilai icon dengan nama ikon lain yang ada di daftar ikon (sprite SVG) di duit.html.
*/
const NEED_META = {
  A1: { short: "Pangan", icon: "utensils" },
  A2: { short: "Tempat tinggal", icon: "house" },
  A3: { short: "Transportasi", icon: "car" },
  A4: { short: "Pendidikan", icon: "graduation" },
  A5: { short: "Kesehatan", icon: "heart-pulse" },
  A6: { short: "Komunikasi", icon: "smartphone" },
  A7: { short: "Kewajiban", icon: "file-text" },
  A8: { short: "Kebersihan", icon: "sparkles" },
  A9: { short: "Tabungan", icon: "coins" },
  A10: { short: "Hiburan", icon: "gamepad" },
};

/*
   metaOf(kode): mengambil nama pendek & ikon sebuah kebutuhan (cadangan bila kode tidak ditemukan).
*/
const metaOf = (id) => NEED_META[id] || { short: id || "", icon: "layers" };

/*
   4. BOBOT KRITERIA SAW  [C1, C2, C3, C4]
   Saat ini keempat kriteria berbobot sama (0,25 = 25%). Jumlah keempat bobot harus 1.
   PERINGATAN: mengubah angka ini MENGUBAH HASIL PERHITUNGAN SAW.
   Jika diubah, ubah juga tulisan "Bobot: 25% / kriteria" di
   duit.html (id="page-analysis") agar sesuai.
*/
const WEIGHTS = [0.25, 0.25, 0.25, 0.25];

/*
   5. TULISAN SKALA UMUM 1-5
   Tampil di kotak Panduan Skor saat belum ada kriteria yang diklik.
   Format: ["Nama tingkat", "keterangan (muncul sebagai tooltip)"].
   Urutan = skor 1 sampai 5.
*/
const SCALE = [
  ["Sangat rendah", "Tingkat paling rendah."],
  ["Rendah", "Tingkat rendah."],
  ["Sedang", "Tingkat menengah."],
  ["Tinggi", "Tingkat tinggi."],
  ["Sangat tinggi", "Tingkat paling tinggi."],
];

/*
   6. ISI POPUP "SELENGKAPNYA" TIAP KRITERIA
   Kuncinya C1-C4 (harus sama dengan data-crit di duit.html (id="page-analysis")).
   Setiap kriteria punya:
     icon  : nama ikon (lihat daftar ikon (sprite SVG) di duit.html)
     name  : nama kriteria (label hijau di popup)
     desc  : kalimat penjelasan kriteria
     scale : 5 tulisan keterangan, urutan = skor 1 sampai 5
             (juga dipakai sebagai tulisan skala di kotak Panduan Skor saat kriteria diklik)
     note  : kalimat di kotak hijau muda di bagian bawah popup
   GANTI TEKS : ubah tulisan di dalam tanda kutip. Jangan hapus tanda kutip dan koma.
*/
const CRIT_GUIDE = {
  C1: {
    icon: "x-star",
    name: "Penting",
    desc: "Kriteria ini digunakan untuk menilai seberapa penting suatu kebutuhan bagi pengguna.",
    scale: [
      "Sangat tidak penting",
      "Tidak penting",
      "Cukup penting",
      "Penting",
      "Sangat penting",
    ],
    note: "Semakin tinggi skor, semakin penting kebutuhan tersebut untuk diprioritaskan.",
  },
  C2: {
    icon: "x-bars",
    name: "Dampak",
    desc: "Kriteria ini digunakan untuk menilai seberapa besar akibat jika suatu kebutuhan tidak dipenuhi.",
    scale: [
      "Dampak sangat kecil",
      "Dampak kecil",
      "Dampak cukup besar",
      "Dampak besar",
      "Dampak sangat besar",
    ],
    note: "Semakin tinggi skor, semakin besar dampak positif yang diberikan kebutuhan tersebut.",
  },
  C3: {
    icon: "x-clock",
    name: "Waktu",
    desc: "Kriteria ini digunakan untuk menilai seberapa dekat suatu kebutuhan harus segera dipenuhi.",
    scale: [
      "Sangat tidak mendesak",
      "Tidak mendesak",
      "Cukup mendesak",
      "Mendesak",
      "Sangat mendesak",
    ],
    note: "Semakin tinggi skor, semakin mendesak kebutuhan tersebut untuk segera dipenuhi.",
  },
  C4: {
    icon: "x-credit-card",
    name: "Kewajiban",
    desc: "Kriteria ini digunakan untuk menilai seberapa besar sifat wajib atau tanggung jawab dari suatu kebutuhan.",
    scale: [
      "Sangat tidak wajib",
      "Tidak wajib",
      "Cukup wajib",
      "Wajib",
      "Sangat wajib",
    ],
    note: "Semakin tinggi skor, semakin besar tingkat kewajiban kebutuhan tersebut untuk dipenuhi.",
  },
};

/*
   7. WARNA POTONGAN GRAFIK DONAT (Tahap 4)
   Urutan warna = urutan peringkat kebutuhan. Format kode warna hex (#rrggbb).
   GANTI WARNA : ubah kode hex. Sebaiknya tersedia minimal 10 warna.
*/
const ALLOC_COLORS = [
  "#0b6b3f",
  "#1f8f57",
  "#3fae72",
  "#74c690",
  "#a9dcb8",
  "#e9a928",
  "#f2c35c",
  "#7560b6",
  "#4b9ca1",
  "#b0a28b",
];

/*
   8. Jumlah angka di belakang koma pada nilai preferensi (contoh 4 = 0,9000; ubah ke 2 = 0,90).
*/
const PREF_DECIMALS = 4; /* ubah ke 2 bila ingin tampil seperti contoh gambar (0,92) */

/*
   9. Jumlah baris riwayat yang tampil per halaman.
*/
const HISTORY_PAGE_SIZE = 5; /* jumlah riwayat per halaman */

/* ################################################################
   BAGIAN 2 · ALAT BANTU (dipakai semua tahap)
   Fungsi kecil: mengambil elemen, format rupiah, mengamankan teks, memanggil ikon,
   dan menampilkan notifikasi (toast). Biasanya TIDAK perlu diubah.
   ################################################################ */

/*
   Singkatan dari document.querySelector.  Contoh: $("#totalFunds") mengambil elemen ber-id totalFunds.
*/
const $ = (selector) => document.querySelector(selector);

/*
   Mengubah angka menjadi tulisan rupiah.  Contoh: 1500000 menjadi "Rp 1.500.000".
   Ubah "IDR"/"id-ID" untuk mata uang atau gaya penulisan lain.
*/
const money = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

/*
   Mengubah isian menjadi angka yang tidak negatif. Isian kosong atau huruf dianggap 0.
*/
const number = (value) => Math.max(0, Number(value) || 0);

/*
   Mengamankan teks sebelum disisipkan ke dalam HTML (mengganti tanda < > & dll.),
   supaya teks apa pun tidak merusak tampilan.
*/
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );

/*
   Menghasilkan HTML sebuah ikon dari namanya.  Contoh: icon("wallet") menampilkan ikon x-wallet.
   Daftar ikon: daftar ikon (sprite SVG) di duit.html.
*/
const icon = (name, cls = "ico") =>
  `<svg class="${cls}" aria-hidden="true"><use href="#x-${name}"/></svg>`;

/*
   Format nilai preferensi SAW memakai koma desimal. Jumlah angka diatur PREF_DECIMALS (BAGIAN 1 (PENGATURAN) di duit.js).
*/
const fmtPref = (value) =>
  Number(value).toFixed(PREF_DECIMALS).replace(".", ",");

/*
   Format persen dengan 1 angka di belakang koma.  Contoh: 12.34 menjadi "12,3%".
*/
const fmtPct = (value) => Number(value).toFixed(1).replace(".", ",") + "%";

/*
   Membuat warna hijau bertingkat untuk batang grafik hasil (peringkat bawah makin muda).
*/
function shadeGreen(index, total) {
  const t = total > 1 ? index / (total - 1) : 0;
  const from = [8, 115, 70];
  const to = [160, 214, 176];
  return `rgb(${from.map((c, i) => Math.round(c + (to[i] - c) * t)).join(",")})`;
}

/*
   Penghitung waktu agar notifikasi hilang sendiri (dipakai fungsi toast di bawah).
*/
let toastTimer = null;

/*
   Menampilkan notifikasi kecil di pojok kanan bawah.
   Contoh pemakaian: toast("Analisis berhasil disimpan.").
   GANTI LAMA TAMPIL : ubah angka 3000 (milidetik; 3000 = 3 detik).
*/
/* Getar + sorot merah pada elemen yang belum memenuhi syarat (animasi ada di duit-motion.js). */
const nudge = (element) => window.DuitMotion && DuitMotion.shake(element);

function toast(message) {
  const element = $("#toast");

  element.textContent = message;
  element.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    element.classList.remove("show");
  }, 6000); /* 6000 = lama tampil dalam milidetik */
}

/* ################################################################
   BAGIAN 3 · PENYIMPANAN DI BROWSER (data kerja, draft, riwayat)
   Semua data disimpan di localStorage browser (tidak ada server/database), sehingga
   hanya ada di browser & komputer yang sama dan hilang bila data browser dihapus.
   Kunci penyimpanan:
     duitdulu_draft_local-user    draft isian terakhir (total, cadangan, pilihan, skor, hasil)
     duitdulu_history_local-user  daftar riwayat analisis yang disimpan (maksimal 50)
     duitdulu_sidebar             keadaan sidebar diperkecil/tidak
   ################################################################ */

/*
   DATA KERJA APLIKASI (state)
   total, reserve : total dana & dana cadangan
   needs          : kebutuhan yang dipilih (Tahap 1)
   scores         : skor 1-5 tiap kebutuhan untuk C1-C4 (Tahap 2)
   results        : hasil SAW terurut (Tahap 3)
   allocation     : hasil alokasi dana (Tahap 4)
*/
let state = {
  total: 0,
  reserve: 0,
  needs: [],
  scores: {},
  results: [],
  allocation: [],
  maxima: [],
  lastSaved: null,
  savedSignature: null,
};

/*
   Nama kunci penyimpanan draft (memakai user.id dari BAGIAN 1 (PENGATURAN) di duit.js).
*/
const draftKey = () => "duitdulu_draft_" + user.id;

/*
   Nama kunci penyimpanan riwayat (memakai user.id dari BAGIAN 1 (PENGATURAN) di duit.js).
*/
const historyKey = () => "duitdulu_history_" + user.id;

/*
   Menyimpan isian & hasil terakhir ke browser. Dipanggil otomatis setiap ada perubahan.
*/
let currentPage = "dashboard"; /* halaman yang sedang dibuka (ikut disimpan di draft) */
let draftReady = false; /* false selama draft belum selesai dipulihkan, agar tidak menimpa draft lama */

function saveDraft() {
  if (!draftReady) return;
  try {
    /* localStorage = penyimpanan kecil di browser. Data diubah menjadi teks (JSON.stringify) agar bisa disimpan. */
    DuitStore.saveDraft({
      total: $("#totalFunds").value,
      reserve: $("#reserveFunds").value,
      page: currentPage,
      state,
    });
  } catch (error) {
    console.warn("Draft tidak dapat disimpan:", error);
  }
}

/*
   Memulihkan draft saat halaman dibuka/di-refresh: mengisi kembali dana, centang kebutuhan, dan hasil.
*/
function restoreDraft() {
  try {
    /* Kebalikan saveDraft: membaca teks tersimpan lalu mengubahnya kembali menjadi data (JSON.parse). */
    const draft = DuitStore.getDraft();

    if (!draft) return;

    $("#totalFunds").value = draft.total || "";
    $("#reserveFunds").value = draft.reserve || "";

    if (draft.state) {
      state = {
        ...state,
        ...draft.state,
      };
    }

    state.needs.forEach((need) => {
      const checkbox = document.querySelector(
        `#alternativeGrid input[value="${need.id}"]`,
      );

      if (checkbox) {
        checkbox.checked = true;
        checkbox.closest(".alternative-card").classList.add("selected");
      }

      if (!state.scores[need.id]) {
        state.scores[need.id] = [3, 3, 3, 3];
      }
    });

    updateSelected();
    updateMoneyPreview();
    updateDashboard();

    if (state.results.length) {
      renderResults();
    }

    if (state.allocation.length) {
      renderAllocation();
    }

    /* Tabel penilaian Tahap 2 dibuat ulang dari skor yang tersimpan. */
    if (state.needs.length) {
      renderScoringTable();
    }

    /* Buka halaman terakhir yang dipakai (bila datanya masih ada). */
    const needsData = {
      analysis: state.needs.length > 0,
      results: state.results.length > 0,
      allocation: state.allocation.length > 0,
    };
    const last = draft.page;

    if (last && last !== "dashboard" && (!(last in needsData) || needsData[last])) {
      showPage(last);
    }
  } catch (error) {
    console.warn("Draft gagal dipulihkan:", error);
  }
}

/*
   Membaca daftar riwayat dari browser (selalu mengembalikan daftar, kosong bila belum ada).
*/
function readHistory() {
  try {
    const list = DuitStore.getHistory();
    return Array.isArray(list) ? list : [];
  } catch (error) {
    return [];
  }
}

/* ################################################################
   BAGIAN 4 · NAVIGASI (pindah halaman & sidebar)
   Perpindahan halaman, judul di bagian atas, dan sidebar (diperkecil di komputer,
   menu geser di HP). Kunci halaman: dashboard, input, analysis, results, allocation, history;
   tiap kunci cocok dengan id="page-KUNCI" di duit.html dan data-page="KUNCI" pada menu.
   ################################################################ */

/*
   Keadaan sidebar: collapsed = diperkecil (komputer), open = terbuka (HP).
*/
const sidebarState = {
  collapsed: false,
  open: false,
};

/*
   Menampilkan satu halaman dan menyembunyikan yang lain, menandai menu aktif,
   mengganti judul di bagian atas, menutup menu geser, lalu menggulung ke atas.
*/
function showPage(name) {
  const target = $("#page-" + name);

  if (!target) return;

  /* Tahap 4 terbuka -> hasil otomatis tersimpan ke Riwayat. Riwayat terbuka -> daftar dimuat ulang. */
  if (name === "allocation" && state.allocation.length) autoSaveOnAllocation();
  if (name === "history") DuitStore.reloadHistory().then(loadHistory);

  currentPage = name;
  saveDraft();

  /* Hanya halaman ber-id "page-NAMA" yang diberi class active (tampil); halaman lain disembunyikan CSS. */
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.toggle("active", page.id === "page-" + name);
  });

  document.querySelectorAll(".nav-item[data-page]").forEach((button) => {
    const active = button.dataset.page === name;

    button.classList.toggle("active", active);

    if (active) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  /* GANTI TEKS: judul besar di bagian atas tiap halaman. */
  const titles = {
    dashboard: "Dashboard",
    input: "Analisis dana",
    analysis: "Penilaian SAW",
    results: "Hasil prioritas",
    allocation: "Alokasi dana",
    history: "Riwayat analisis",
  };

  /* GANTI TEKS: tulisan kecil di atas judul (sub-judul) tiap halaman. */
  const labels = {
    dashboard: "Ringkasan keuangan",
    input: "Tahap 1 · Dana dan kebutuhan",
    analysis: "Tahap 2 · Penilaian",
    results: "Tahap 3 · Hasil SAW",
    allocation: "Tahap 4 · Alokasi dana",
    history: "Arsip analisis",
  };

  /* Judul diambil dari daftar titles dan labels di atas, sesuai halaman yang dibuka. */
  $("#pageTitle").textContent = titles[name] || "DuitDulu";
  $("#topEyebrow").textContent = labels[name] || "";

  closeDrawer();

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

/*
   Memasang aksi klik: menu sidebar (data-page), tombol pindah halaman (data-go),
   tombol panah perkecil sidebar, tombol menu di HP, dan tombol Escape.
   PERBEDAAN PERANGKAT: pembeda tampilan HP dan laptop/desktop TIDAK memakai JavaScript, melainkan CSS
   (lebar layar). Laptop/desktop memakai sidebar tetap yang bisa diperkecil (class sb-collapsed);
   HP memakai menu geser (class drawer-open). JavaScript hanya menyalakan/mematikan class tersebut.
*/
function bindNavigation() {
  document.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", () => {
      showPage(button.dataset.page);
    });
  });

  document.querySelectorAll("[data-go]").forEach((button) => {
    button.addEventListener("click", () => {
      showPage(button.dataset.go);
    });
  });

  /* [LAPTOP / DESKTOP] Tombol panah: memperkecil/memperbesar sidebar. Pilihan disimpan di browser (duitdulu_sidebar). */
  $("#collapseToggle").addEventListener("click", () => {
    sidebarState.collapsed = !sidebarState.collapsed;

    localStorage.setItem(
      "duitdulu_sidebar",
      sidebarState.collapsed ? "1" : "0",
    );

    applySidebar();
  });

  /* [HP] Tombol menu (tiga garis): membuka sidebar sebagai menu geser. Tombolnya hanya tampil di HP (diatur CSS). */
  $("#menuToggle").addEventListener("click", () => {
    sidebarState.open = true;
    applySidebar();
  });

  /* [HP] Klik area gelap di luar menu geser = menutup menu. */
  $("#scrim").addEventListener("click", closeDrawer);

  document.addEventListener("keydown", (event) => {
    /* [HP] Tombol Escape juga menutup menu geser. */
    if (event.key === "Escape") {
      closeDrawer();
    }
  });

  const saved = localStorage.getItem("duitdulu_sidebar");

  sidebarState.collapsed = saved === null ? false : saved === "1";

  applySidebar();
}

/*
   Menerapkan keadaan sidebar ke tampilan (kelas CSS sb-collapsed & drawer-open).
   sb-collapsed = sidebar diperkecil  [LAPTOP / DESKTOP].   drawer-open = menu geser terbuka  [HP].
*/
function applySidebar() {
  document.body.classList.toggle("sb-collapsed", sidebarState.collapsed);

  document.body.classList.toggle("drawer-open", sidebarState.open);

  $("#sidebar").classList.toggle("open", sidebarState.open);

  $("#collapseToggle").setAttribute(
    "aria-expanded",
    String(!sidebarState.collapsed),
  );

  $("#collapseToggle").setAttribute(
    "aria-label",
    sidebarState.collapsed ? "Perluas sidebar" : "Perkecil sidebar",
  );

  $("#menuToggle").setAttribute("aria-expanded", String(sidebarState.open));
}

/*
   Menutup menu geser di HP.
*/
function closeDrawer() {
  if (!sidebarState.open) return;

  sidebarState.open = false;
  applySidebar();
}

/* ################################################################
   BAGIAN 5 · DASHBOARD
   Mengisi angka dan grafik donat di halaman Dashboard dari isian Tahap 1.
   HTML: duit.html (id="page-dashboard")   CSS: duit.css (BAGIAN 4)
   ################################################################ */

/*
   Menghitung dana operasional (total - cadangan), lalu mengisi kartu ringkasan,
   persen pada donat, legenda, dan kalimat keterangan.
   Dipanggil setiap isian Tahap 1 berubah.
   GANTI WARNA DONAT : ubah #087346 (bagian terpakai) dan #dce3df (bagian sisa).
   GANTI TEKS : kalimat keterangan di akhir fungsi.
*/
function updateDashboard() {
  const total = number($("#totalFunds").value);
  const reserve = number($("#reserveFunds").value);
  const operating = Math.max(0, total - reserve);

  $("#dashTotal").textContent = money(total);
  $("#dashReserve").textContent = money(reserve);
  $("#dashOperating").textContent = money(operating);

  updateSelected();

  const percent = total > 0 ? Math.round((operating / total) * 100) : 0;

  $("#dashboardDonutPercent").textContent = percent + "%";

  $("#dashboardDonut").style.background =
    `conic-gradient(#087346 0% ${percent}%, #dce3df ${percent}% 100%)`;

  $("#dashboardLegendFirstValue").textContent = money(operating);
  $("#dashboardLegendReserve").textContent = money(reserve);

  $("#dashboardAllocationHint").textContent =
    total > 0
      ? "Dana operasional dan cadangan telah diperbarui berdasarkan input terakhir."
      : "Masukkan dana untuk melihat ringkasan alokasi.";
}

/* ################################################################
   BAGIAN 6 · TAHAP 1 · DANA
   Isian total dana & cadangan, pilihan kebutuhan, validasi, dan lanjut ke Tahap 2.
   HTML: duit.html (id="page-input")   CSS: duit.css (BAGIAN 7)
   ################################################################ */

/*
   Memasang aksi untuk Tahap 1: ketik total/cadangan, tombol saran 10%, tombol lanjut.
   GANTI TEKS : tulisan toast("...") pada tombol saran.
*/
function bindTahap1Dana() {
  $("#totalFunds").addEventListener("input", () => {
    updateMoneyPreview();
    saveDraft();
    updateDashboard();
  });

  $("#reserveFunds").addEventListener("input", () => {
    updateMoneyPreview();
    saveDraft();
    updateDashboard();
  });

  /* Tombol "Gunakan saran": mengisi dana cadangan sebesar 10% dari total. */
  $("#useSuggestion").addEventListener("click", () => {
    const total = number($("#totalFunds").value);

    $("#reserveFunds").value = Math.round(total * 0.1); /* 0.1 = 10%. Ubah angka ini untuk persentase lain. */

    updateMoneyPreview();
    updateDashboard();
    saveDraft();

    toast("Saran dana cadangan sebesar 10% telah diterapkan.");
  });

  /* Tombol "Lanjut ke penilaian". */
  $("#toAnalysis").addEventListener("click", prepareAnalysis);
}

/*
   Memperbarui tulisan jumlah kebutuhan terpilih ("N dipilih" di Tahap 1 dan "N kebutuhan" di Dashboard).
*/
function updateSelected() {
  const count = state.needs.length;

  $("#selectedCount").textContent = count + " dipilih";
  $("#dashCount").textContent = count + " kebutuhan";
}

/*
   Memeriksa isian sebelum lanjut: total dana harus > 0, cadangan tidak boleh lebih besar
   dari total, dan minimal 1 kebutuhan dipilih. Bila tidak lolos, tampil notifikasi.
   GANTI TEKS : tulisan di dalam toast("...").
*/
function validateBudget() {
  const total = number($("#totalFunds").value);
  const reserve = number($("#reserveFunds").value);

  if (total <= 0) {
    toast("Masukkan total dana yang tersedia terlebih dahulu.");
    nudge($("#totalFunds"));
    $("#totalFunds").focus();
    return false;
  }

  if (reserve > total) {
    toast("Dana cadangan tidak boleh lebih besar dari total dana.");
    nudge($("#reserveFunds"));
    $("#reserveFunds").focus();
    return false;
  }

  if (state.needs.length === 0) {
    toast("Pilih setidaknya satu kebutuhan untuk dianalisis.");
    nudge($("#alternativeGrid"));
    return false;
  }

  return true;
}

/*
   Menghitung dana operasional (total - cadangan) dan menampilkannya di kartu Dana operasional.
*/
function updateMoneyPreview() {
  const total = number($("#totalFunds").value);
  const reserve = number($("#reserveFunds").value);
  const operating = Math.max(0, total - reserve);

  $("#operatingPreview").textContent = money(operating);
}

/*
   Dipanggil tombol "Lanjut ke penilaian": validasi, simpan dana, buat tabel penilaian, lalu pindah ke Tahap 2.
*/
function prepareAnalysis() {
  if (!validateBudget()) return;

  state.total = number($("#totalFunds").value);
  state.reserve = number($("#reserveFunds").value);

  renderScoringTable();
  showPage("analysis");
  saveDraft();
}

/*
   Membuat kotak kebutuhan A1-A10 dari ALTERNATIVES dan NEED_META (BAGIAN 1 (PENGATURAN) di duit.js)
   dan memasang aksi centang. Mencentang menambah kebutuhan ke state dengan skor awal 3.
*/
function renderAlternatives() {
  /* Membuat satu kotak (label) per kebutuhan. Struktur HTML satu kotak ada di dalam tanda backtick di bawah:
     ubah di sana bila ingin mengubah isi kotak (kode, ikon centang, ikon kebutuhan, nama pendek). */
  $("#alternativeGrid").innerHTML = ALTERNATIVES.map(([id, name], index) => {
    const meta = metaOf(id);

    return `
      <label class="alternative-card rd-need" data-alt="${id}" title="${esc(name)}" style="--i:${index}">
        <input type="checkbox" value="${id}">
        <small class="rd-need-code">${id}</small>
        <i class="rd-need-check">${icon("check")}</i>
        ${icon(meta.icon, "ico rd-need-ico")}
        <b class="rd-need-name">${esc(meta.short)}</b>
      </label>
    `;
  }).join("");

  $("#alternativeGrid")
    .querySelectorAll("input")
    .forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const id = checkbox.value;

        if (checkbox.checked) {
          if (!state.needs.some((item) => item.id === id)) {
            /* Dicentang: kebutuhan ditambahkan ke daftar dengan skor awal 3. */
            state.needs.push({ id, importance: 3 });
          }

          if (!state.scores[id]) {
            state.scores[id] = [3, 3, 3, 3];
          }
        } else {
          state.needs = state.needs.filter((item) => item.id !== id);
          delete state.scores[id];
        }

        checkbox
          .closest(".alternative-card")
          .classList.toggle("selected", checkbox.checked);

        updateSelected();
        saveDraft();
        updateDashboard();
      });
    });
}

/* ################################################################
   BAGIAN 7 · TAHAP 2 · PENILAIAN (+ Panduan Skor & popup Selengkapnya)
   Skala di Panduan Skor, tabel penilaian skor 1-5, peringatan pola skor, serta kartu kriteria
   C1-C4 yang bisa diklik dan popup "Selengkapnya" (hanya menampilkan informasi).
   HTML: duit.html (id="page-analysis" dan id="critModal")   CSS: duit.css (BAGIAN 8 dan 12)
   Teks isi popup: BAGIAN 1 (CRIT_GUIDE).
   ################################################################ */

/*
   Memasang aksi untuk Tahap 2: tombol "Hitung prioritas".
*/
function bindTahap2Penilaian() {
  /* Tombol "Hitung prioritas". */
  $("#calculateBtn").addEventListener("click", calculateAndShow);
}

/*
   Menggambar 5 kotak skala di Panduan Skor.
   Tanpa kriteria terpilih : memakai SCALE (BAGIAN 1 (PENGATURAN) di duit.js).
   Dengan kriteria terpilih: memakai tulisan skala kriteria itu (CRIT_GUIDE).
*/
function renderScaleGuide(code = selectedCrit) {
  const guide = code ? CRIT_GUIDE[code] : null;

  /* Tanpa kriteria terpilih: skala umum. Dengan kriteria terpilih: skala kriteria tersebut. */
  const items = guide
    ? guide.scale.map((label) => [label, `${code} · ${guide.name}: ${label}`])
    : SCALE;

  $("#scaleGuide").innerHTML = items
    .map(
      (item, index) => `
    <li title="${esc(item[1])}" style="animation-delay:${index * 60}ms">
      <b>${index + 1}</b>
      <span>${item[0]}</span>
    </li>
  `,
    )
    .join("");
}

/*
   Menggambar tabel penilaian: satu baris per kebutuhan terpilih, 4 pilihan skor (C1-C4).
   Setiap perubahan skor disimpan ke state (skor C1 juga dicatat sebagai tingkat kepentingan)
   lalu memicu pemeriksaan peringatan.
*/
function renderScoringTable() {
  const tbody = $("#scoringTable");

  if (!state.needs.length) {
    tbody.innerHTML = `
      <tr><td colspan="5" class="rd-muted-cell">Belum ada kebutuhan yang dipilih.</td></tr>
    `;
    return;
  }

  /* Membuat satu baris tabel per kebutuhan terpilih. Tiap baris punya 4 pilihan skor (<select> berisi 1-5) untuk C1-C4.
     Struktur HTML baris ada di dalam tanda backtick di bawah. */
  tbody.innerHTML = state.needs
    .map((need, rowIndex) => {
      const alternative = ALTERNATIVES.find((item) => item[0] === need.id);
      const scores = state.scores[need.id] || [3, 3, 3, 3];
      const meta = metaOf(need.id);

      return `
      <tr style="--i:${rowIndex}">
        <td>
          <div class="rd-need-cell">
            <span class="rd-need-badge">${icon(meta.icon)}</span>
            <span class="rd-need-text"><b>${need.id}</b> · ${alternative ? esc(alternative[1]) : ""}</span>
          </div>
        </td>

        ${scores
          .map(
            (score, index) => `
          <td class="rd-score-cell">
            <div class="rd-select-wrap ${index === 0 ? "is-primary" : ""}">
              <select class="rd-select"
                data-id="${need.id}"
                data-index="${index}"
                aria-label="${need.id} kriteria C${index + 1}">
                ${[1, 2, 3, 4, 5]
                  .map(
                    (value) => `
                  <option value="${value}" ${value === score ? "selected" : ""}>${value}</option>
                `,
                  )
                  .join("")}
              </select>
              ${icon("chevron-down")}
            </div>
          </td>
        `,
          )
          .join("")}
      </tr>
    `;
    })
    .join("");

  tbody.querySelectorAll(".rd-select").forEach((select) => {
    /* Saat skor diganti: simpan ke state.scores[kebutuhan][kriteria]; skor C1 juga dicatat sebagai tingkat kepentingan. */
    select.addEventListener("change", () => {
      const id = select.dataset.id;
      const index = Number(select.dataset.index);
      const value = Number(select.value);

      if (!state.scores[id]) {
        state.scores[id] = [3, 3, 3, 3];
      }

      state.scores[id][index] = value;

      const need = state.needs.find((item) => item.id === id);

      if (need) {
        need.importance = state.scores[id][0];
      }

      checkScorePatterns();
      saveDraft();
    });
  });

  checkScorePatterns();
}

/*
   Menampilkan peringatan bila pola skor janggal (semua 5, semua 1, atau kepentingan 1 tetapi dampak tinggi).
   GANTI TEKS : kalimat peringatan di dalam fungsi ini.
*/
function checkScorePatterns() {
  const warnings = [];

  state.needs.forEach((need) => {
    const scores = state.scores[need.id] || [];

    if (scores.length !== 4) return;

    if (scores.every((value) => value === 5)) {
      warnings.push(`
        <div class="warning-item">
          <b>${need.id}: seluruh kriteria diberi skor maksimum.</b>
          Pastikan setiap aspek memang berada pada tingkat sangat tinggi.
        </div>
      `);
    }

    if (scores.every((value) => value === 1)) {
      warnings.push(`
        <div class="warning-item">
          <b>${need.id}: seluruh kriteria diberi skor minimum.</b>
          Periksa kembali apakah kebutuhan ini masih perlu dimasukkan.
        </div>
      `);
    }

    if (scores[0] === 1 && scores[1] >= 4) {
      warnings.push(`
        <div class="warning-item">
          <b>${need.id}: pola kepentingan dan dampak perlu ditinjau.</b>
          Dampak tinggi dengan kepentingan sangat rendah perlu diperiksa kembali.
        </div>
      `);
    }
  });

  $("#scoreWarnings").innerHTML = warnings.join("");
}

/*
   Penanda keadaan Panduan Skor:
   critTrigger : elemen yang membuka popup (fokus dikembalikan ke sana saat popup ditutup)
   selectedCrit: kriteria yang sedang dipilih ("C1".."C4") atau null bila belum ada
*/
let critTrigger = null;
let selectedCrit = null;

/*
   Dipanggil saat kartu kriteria diklik: memilih kriteria (klik lagi = batal pilih),
   menandai kartu aktif, mengganti skala di Panduan Skor, dan menampilkan
   penanda "· C2 Dampak" serta tulisan "Selengkapnya" di kanan atas kotak.
*/
function selectCrit(code) {
  /* Klik kriteria yang sama sekali lagi = kembali ke skala umum. */
  selectedCrit = selectedCrit === code ? null : code;

  document.querySelectorAll(".rd-crit li[data-crit]").forEach((item) => {
    const active = item.dataset.crit === selectedCrit;

    item.classList.toggle("is-active", active);
    item.setAttribute("aria-pressed", active ? "true" : "false");
  });

  renderScaleGuide(selectedCrit);

  const guide = selectedCrit ? CRIT_GUIDE[selectedCrit] : null;

  $("#scaleFor").textContent = guide ? `· ${selectedCrit} ${guide.name}` : "";
  $("#scaleFor").hidden = !guide;
  $("#scaleMore").hidden = !guide;
}

/*
   Membuka popup panduan skor untuk kriteria tertentu: mengisi judul, nama, penjelasan,
   tabel skala 1-5, dan kotak info dari CRIT_GUIDE (BAGIAN 1 (PENGATURAN) di duit.js).
   GANTI TEKS "Panduan Skor Kriteria", "Skor", "Keterangan" : ubah di dalam fungsi ini.
*/
function openCritGuide(code, trigger) {
  const guide = CRIT_GUIDE[code];
  const modal = $("#critModal");

  if (!guide || !modal) return;

  critTrigger = trigger || null;

  $("#critBody").innerHTML = `
    <div class="rd-crit-head">
      <span class="rd-crit-ico${code === "C1" ? " is-fill" : ""}">
        <svg class="ico"><use href="#${guide.icon}" /></svg>
      </span>
      <h3 id="critTitle">Panduan Skor Kriteria ${code}</h3>
    </div>
    <span class="rd-crit-tag">${guide.name}</span>
    <p class="rd-crit-desc">${guide.desc}</p>
    <table class="rd-crit-table">
      <thead>
        <tr><th>Skor</th><th>Keterangan</th></tr>
      </thead>
      <tbody>
        ${guide.scale
          .map((label, index) => `<tr><td>${index + 1}</td><td>${label}</td></tr>`)
          .join("")}
      </tbody>
    </table>
    <div class="rd-crit-note">
      <svg class="ico"><use href="#x-info" /></svg>
      <p>${guide.note}</p>
    </div>
  `;

  modal.hidden = false;
  document.body.style.overflow = "hidden";
  $("#critClose").focus();
}

/*
   Menutup popup dan mengembalikan fokus ke tulisan "Selengkapnya".
*/
function closeCritGuide() {
  const modal = $("#critModal");

  if (!modal || modal.hidden) return;

  modal.hidden = true;
  document.body.style.overflow = "";

  if (critTrigger && document.contains(critTrigger)) critTrigger.focus();
  critTrigger = null;
}

/*
   Memasang aksi: klik kartu kriteria, klik "Selengkapnya", klik ikon x / area gelap di luar popup,
   serta tombol Escape dan Enter/Spasi pada kartu kriteria.
*/
function bindCritGuide() {
  document.addEventListener("click", (event) => {
    const item = event.target.closest(".rd-crit li[data-crit]");

    if (item) {
      selectCrit(item.dataset.crit);
      return;
    }

    const more = event.target.closest("#scaleMore");

    if (more) {
      openCritGuide(selectedCrit, more);
      return;
    }

    if (event.target.closest("[data-close-crit]")) closeCritGuide();
  });

  document.addEventListener("keydown", (event) => {
    const modal = $("#critModal");

    /* Kartu kriteria bisa dipilih memakai Enter atau Spasi. */
    if (modal.hidden && (event.key === "Enter" || event.key === " ")) {
      const item = event.target.closest?.(".rd-crit li[data-crit]");

      if (item) {
        event.preventDefault();
        selectCrit(item.dataset.crit);
      }
      return;
    }

    if (!modal || modal.hidden) return;

    if (event.key === "Escape") closeCritGuide();

    /* Fokus tetap berada di dalam popup selama popup terbuka. */
    if (event.key === "Tab") {
      event.preventDefault();
      $("#critClose").focus();
    }
  });
}

/* ################################################################
   BAGIAN 8 · TAHAP 3 · HASIL SAW
   Perhitungan SAW (normalisasi, pembobotan, peringkat) dan tampilan hasilnya.
   HTML: duit.html (id="page-results")   CSS: duit.css (BAGIAN 9)
   PERINGATAN: calculateSAW adalah RUMUS METODE. Jangan diubah kecuali memang ingin
   mengubah cara perhitungan. Bobot ada di BAGIAN 1 (WEIGHTS).
   ################################################################ */

/*
   Metode SAW:
   1) Normalisasi: skor dibagi skor TERBESAR pada kriteria yang sama (semua kriteria bersifat benefit).
   2) Nilai preferensi V = jumlah (hasil normalisasi x bobot) untuk C1-C4.
   3) Kebutuhan diurutkan dari V terbesar ke terkecil.
*/
function calculateSAW() {
  /* LANGKAH 1: kumpulkan skor tiap kebutuhan yang dipilih (skor awal 3 bila belum diisi). */
  const rows = state.needs.map((need) => {
    const alternative = ALTERNATIVES.find((item) => item[0] === need.id);

    return {
      id: need.id,
      name: alternative ? alternative[1] : need.id,
      scores: [...(state.scores[need.id] || [3, 3, 3, 3])],
    };
  });

  if (!rows.length) return { rows: [], maxima: [] };

  /* LANGKAH 2: cari skor TERBESAR di tiap kriteria (C1..C4). Dipakai sebagai pembagi normalisasi. */
  const maxima = [0, 1, 2, 3].map((index) => {
    return Math.max(...rows.map((row) => row.scores[index]));
  });

  rows.forEach((row) => {
    /* LANGKAH 3: normalisasi = skor dibagi skor terbesar kriteria itu (hasil antara 0 dan 1). */
    row.normalized = row.scores.map((score, index) => {
      return maxima[index] === 0 ? 0 : score / maxima[index];
    });

    /* LANGKAH 4: nilai preferensi V = jumlah (hasil normalisasi x bobot). Bobot ada di WEIGHTS (BAGIAN 1). */
    row.value = row.normalized.reduce((sum, value, index) => {
      return sum + value * WEIGHTS[index];
    }, 0);
  });

  /* LANGKAH 5: urutkan dari nilai V terbesar ke terkecil. Urutan pertama = peringkat 1. */
  rows.sort((a, b) => b.value - a.value);

  return { rows, maxima };
}

/*
   Dipanggil tombol "Hitung prioritas": validasi, hitung SAW & alokasi, tampilkan hasil, simpan draft, pindah ke Tahap 3.
*/
function calculateAndShow() {
  if (!validateBudget()) return;

  state.total = number($("#totalFunds").value);
  state.reserve = number($("#reserveFunds").value);

  const result = calculateSAW();

  state.results = result.rows;
  state.maxima = result.maxima;
  state.allocation = calculateAllocation();

  renderResults();
  renderAllocation();
  updateDashboard();
  saveDraft();

  showPage("results");
}

/*
   Menampilkan hasil SAW: kotak "Prioritas Utama", grafik batang nilai preferensi, dan tabel peringkat.
   GANTI TEKS : "Prioritas Utama" dan "Peringkat 1" di dalam fungsi ini.
*/
function renderResults() {
  if (!state.results.length) return;

  const top = state.results[0];
  const count = state.results.length;

  $("#resultSummary").innerHTML = `
    <span class="rd-trophy">${icon("trophy")}</span>
    <div class="rd-top-info">
      <span>Prioritas Utama</span>
      <strong>${esc(top.id)} · ${esc(top.name)}</strong>
    </div>
    <span class="rd-pill">${icon("star")}<b>Peringkat 1</b></span>
  `;

  $("#priorityChart").innerHTML = state.results
    .map(
      (row, index) => `
    <div class="rd-bar-row" style="--i:${index}">
      <span class="rd-bar-label">${esc(row.id)} · ${esc(row.name)}</span>
      <div class="rd-bar-track">
        <span class="rd-bar-fill"
          style="width:${(row.value * 100).toFixed(2)}%;background:${shadeGreen(index, count)}"></span>
      </div>
      <b class="rd-bar-value">${fmtPref(row.value)}</b>
    </div>
  `,
    )
    .join("");

  $("#resultTable").innerHTML = state.results
    .map(
      (row, index) => `
    <tr class="${index === 0 ? "is-top" : ""}" style="--i:${index}">
      <td><span class="rd-rank">${index + 1}</span></td>
      <td>${esc(row.id)} · ${esc(row.name)}</td>
      <td class="rd-num">${fmtPref(row.value)}</td>
    </tr>
  `,
    )
    .join("");
}

/* ################################################################
   BAGIAN 9 · TAHAP 4 · ALOKASI DANA
   Pembagian dana operasional ke tiap kebutuhan, tampilan alokasi, dan penyimpanan ke riwayat.
   HTML: duit.html (id="page-allocation")   CSS: duit.css (BAGIAN 10)
   Warna donat: BAGIAN 1 (ALLOC_COLORS).
   ################################################################ */

/*
   Memasang aksi untuk Tahap 4: tombol "Simpan analisis".
*/
function bindTahap4Alokasi() {
  /* Tombol "Simpan analisis". */
  $("#saveAnalysis").addEventListener("click", saveAnalysis);
}

/*
   RUMUS ALOKASI:
     dana operasional = total dana - dana cadangan
     alokasi tiap kebutuhan = dana operasional x (nilai V kebutuhan / jumlah semua nilai V)
   Kebutuhan peringkat terakhir mendapat SISA dana agar jumlah akhir pas (tanpa selisih pembulatan).
   PERINGATAN: mengubah fungsi ini mengubah hasil pembagian dana.
*/
function calculateAllocation() {
  /* LANGKAH 1: dana yang dibagi = total dana - dana cadangan (tidak boleh negatif). */
  const operating = Math.max(0, state.total - state.reserve);
  /* LANGKAH 2: jumlah seluruh nilai V (pembagi untuk mencari porsi tiap kebutuhan). */
  const totalValue = state.results.reduce((sum, row) => sum + row.value, 0);

  if (totalValue <= 0) {
    return state.results.map((row) => ({
      ...row,
      share: 0,
      allocated: 0,
    }));
  }

  let allocatedSoFar = 0;

  return state.results.map((row, index) => {
    /* LANGKAH 3: porsi (%) = nilai V kebutuhan / jumlah semua V x 100. */
    const share = (row.value / totalValue) * 100;

    let allocated;

    /* LANGKAH 4: peringkat TERAKHIR menerima SISA dana, agar jumlah akhir pas tanpa selisih pembulatan. */
    if (index === state.results.length - 1) {
      allocated = operating - allocatedSoFar;
    } else {
      /* Peringkat lainnya: dana operasional x V kebutuhan / jumlah semua V, dibulatkan ke rupiah. */
      allocated = Math.round((operating * row.value) / totalValue);
      allocatedSoFar += allocated;
    }

    return {
      ...row,
      share,
      allocated,
    };
  });
}

/*
   Menampilkan hasil alokasi: tiga kartu ringkasan, grafik donat, legenda, tabel rincian, dan kesimpulan.
   GANTI TEKS : "Dana Operasional", "Jumlah Kebutuhan", dan kalimat "Kesimpulan" di dalam fungsi ini.
*/
function renderAllocation() {
  if (!state.allocation.length) return;

  const operating = Math.max(0, state.total - state.reserve);
  const count = state.allocation.length;

  $("#allocationSummary").innerHTML = `
    <article class="rd-card rd-kpi rd-rise" style="--i:1">
      <span class="rd-kpi-ico">${icon("wallet")}</span>
      <div class="rd-kpi-body"><span>Dana Operasional</span><strong>${money(operating)}</strong></div>
    </article>
    <article class="rd-card rd-kpi rd-rise" style="--i:2">
      <span class="rd-kpi-ico">${icon("pie")}</span>
      <div class="rd-kpi-body"><span>Jumlah Kebutuhan</span><strong>${count} kebutuhan</strong></div>
    </article>
    <article class="rd-card rd-kpi rd-rise" style="--i:3">
      <span class="rd-kpi-ico amber">${icon("coins")}</span>
      <div class="rd-kpi-body"><span>Alokasi per Kebutuhan</span><small>Sesuai urutan prioritas</small></div>
    </article>
  `;

  $("#allocationDonutTotal").textContent = money(operating);

  let current = 0;

  const gradientParts = state.allocation.map((item, index) => {
    const start = current;
    current += item.share;

    return `${ALLOC_COLORS[index % ALLOC_COLORS.length]} ${start}% ${current}%`;
  });

  $("#allocationDonut").style.background = gradientParts.length
    ? `conic-gradient(${gradientParts.join(",")})`
    : "#e8eeea";

  $("#allocationLegend").innerHTML = state.allocation
    .map(
      (item, index) => `
    <div class="rd-legend-item" style="--i:${index}">
      <i style="background:${ALLOC_COLORS[index % ALLOC_COLORS.length]}"></i>
      <div>
        <span>${esc(item.id)} · ${esc(item.name)}</span>
        <small>${fmtPct(item.share)} · ${money(item.allocated)}</small>
      </div>
    </div>
  `,
    )
    .join("");

  $("#allocationTable").innerHTML = state.allocation
    .map(
      (item, index) => `
    <tr style="--i:${index}">
      <td><span class="rd-rank">${index + 1}</span></td>
      <td>${esc(item.id)} · ${esc(item.name)}</td>
      <td><span class="rd-chip">${fmtPct(item.share)}</span></td>
      <td class="rd-num">${money(item.allocated)}</td>
    </tr>
  `,
    )
    .join("");

  $("#allocationNote").innerHTML =
    `<b>Kesimpulan:</b> Dana sebesar <b>${money(operating)}</b> dialokasikan ke <b>${count}</b> kebutuhan ` +
    `sesuai tingkat prioritas hasil analisis SAW. Dana cadangan tetap dipisahkan.`;
}

/*
   Mengambil salinan data analisis saat ini (dana, kebutuhan, skor, hasil, alokasi, waktu) untuk disimpan ke riwayat.
*/
function snapshot() {
  return {
    total: state.total,
    reserve: state.reserve,
    needs: state.needs,
    scores: state.scores,
    results: state.results,
    allocation: state.allocation,
    createdAt: new Date().toISOString(),
  };
}

/*
   Tanda pengenal sebuah analisis (dana + hasil alokasi). Dipakai agar analisis yang sama
   tidak tersimpan dua kali ke riwayat.
*/
function analysisSignature() {
  return JSON.stringify([
    state.total,
    state.reserve,
    state.needs,
    state.scores,
    state.allocation.map((row) => [row.id, row.allocated]),
  ]);
}

/*
   Menyimpan analisis ke riwayat (Supabase atau browser). Dipanggil OTOMATIS saat Tahap 4 terbuka,
   dan juga oleh tombol "Simpan analisis". Analisis yang sama tidak disimpan dua kali.
   Mengembalikan true bila analisis ada di riwayat (baru disimpan atau sudah tersimpan sebelumnya).
*/
let savingAnalysis = false;
let lastSaveError = "";

async function persistAnalysis() {
  if (!state.results.length || !state.allocation.length) return false;

  const signature = analysisSignature();

  if (state.savedSignature === signature) return true; /* sudah tersimpan */
  if (savingAnalysis) return false;

  savingAnalysis = true;

  try {
    const data = snapshot();

    await DuitStore.addHistory(data);

    state.lastSaved = data;
    state.savedSignature = signature;

    saveDraft();
    loadHistory();

    return true;
  } catch (error) {
    console.error("Gagal menyimpan analisis:", error);
    /* Simpan alasan aslinya (mis. pesan dari Supabase) supaya bisa ditampilkan ke pengguna. */
    lastSaveError = (error && (error.message || error.details)) || String(error);
    return false;
  } finally {
    savingAnalysis = false;
  }
}

/*
   Dipanggil tombol "Simpan analisis": memastikan analisis tersimpan, lalu membuka halaman Riwayat.
   GANTI TEKS : tulisan di dalam toast("...").
*/
async function saveAnalysis() {
  if (!state.results.length || !state.allocation.length) {
    toast("Hitung prioritas terlebih dahulu.");
    nudge($("#saveAnalysis"));
    return;
  }

  const button = $("#saveAnalysis");
  if (button) button.disabled = true;

  const wasSaved = state.savedSignature === analysisSignature();
  const ok = await persistAnalysis();

  if (button) button.disabled = false;

  if (!ok) {
    toast("Analisis gagal disimpan: " + (lastSaveError || "periksa koneksi lalu coba lagi."));
    return;
  }

  toast(
    wasSaved
      ? "Analisis ini sudah tersimpan di Riwayat."
      : DuitStore.live
        ? "Analisis berhasil disimpan ke akun Anda."
        : "Analisis berhasil disimpan di browser.",
  );
  if (window.DuitMotion && !wasSaved) DuitMotion.celebrate(button);

  showPage("history");
}

/*
   Simpan otomatis: begitu Tahap 4 terbuka dan alokasi sudah ada, hasilnya langsung masuk Riwayat.
*/
async function autoSaveOnAllocation() {
  const wasSaved = state.savedSignature === analysisSignature();
  const ok = await persistAnalysis();

  if (ok && !wasSaved) toast("Hasil analisis otomatis tersimpan di Riwayat.");
  else if (!ok && state.results.length && state.allocation.length) {
    toast("Analisis belum tersimpan: " + (lastSaveError || "coba tekan Simpan analisis."));
  }
}

/* ################################################################
   BAGIAN 10 · RIWAYAT (+ popup detail & laporan cetak)
   Daftar riwayat: cari, filter periode, urutkan, nomor halaman, detail, laporan, dan hapus.
   HTML: duit.html (id="page-history" dan id="detailModal")   CSS: duit.css (BAGIAN 11)
   Jumlah riwayat per halaman: BAGIAN 1 (HISTORY_PAGE_SIZE).
   Laporan cetak membuka jendela baru; izinkan pop-up bila diblokir browser.
   ################################################################ */

/*
   Data sementara halaman Riwayat:
   historyCache : salinan riwayat yang sedang ditampilkan
   detailItem   : analisis yang sedang dibuka di popup detail
   historyView  : keadaan pencarian/filter/urutan/halaman saat ini
*/
let historyCache = [];
let detailItem = null;

const historyView = {
  page: 1,
  query: "",
  period: "all",
  sort: "newest",
};

/*
   Mengambil kebutuhan dengan nilai tertinggi (prioritas utama) dari sebuah analisis.
*/
function topOf(item) {
  return (
    (item.results || []).slice().sort((a, b) => b.value - a.value)[0] || null
  );
}

/*
   Memeriksa apakah tanggal analisis masuk filter periode (semua, 7 hari, 30 hari, bulan ini, tahun ini).
*/
function periodMatch(date, period) {
  if (period === "all") return true;

  const now = new Date();

  if (period === "7" || period === "30") {
    return now - date <= Number(period) * 86400000;
  }

  if (period === "month") {
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }

  if (period === "year") {
    return date.getFullYear() === now.getFullYear();
  }

  return true;
}

/*
   Format tanggal untuk tampilan, contoh "Jum, 20 Nov 2026".
*/
const dayLabel = (date) =>
  date.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/*
   Format jam untuk tampilan, contoh "10.00".
*/
const timeLabel = (date) =>
  date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

/*
   Membaca riwayat dari browser lalu menggambar ulang daftar.
*/
function loadHistory() {
  historyCache = readHistory();
  renderHistory();
}

/*
   Membuat HTML satu baris riwayat (ikon, tanggal, total dana, jumlah kebutuhan, prioritas utama, tombol).
   GANTI TEKS : "Analisis Keuangan", "Total Dana", "Kebutuhan", "Prioritas Utama", "Detail", "Laporan", "Hapus".
*/
function historyRowHTML(row, index) {
  const { item, date, top } = row;
  const meta = metaOf(top ? top.id : "");
  const id = esc(item.id);

  return `
    <article class="rd-hrow" style="--i:${index}">
      <div class="rd-hmain">
        <span class="rd-hicon">${icon(meta.icon)}</span>
        <div class="rd-htext">
          <h3>Analisis Keuangan</h3>
          <p>${icon("calendar")}${dayLabel(date)} · ${timeLabel(date)}</p>
        </div>
      </div>

      <div class="rd-hchips">
        <div class="rd-hchip">${icon("wallet")}
          <div><small>Total Dana</small><b>${money(item.total)}</b></div>
        </div>
        <div class="rd-hchip">${icon("pie")}
          <div><small>Kebutuhan</small><b>${item.needs?.length || 0} item</b></div>
        </div>
        <div class="rd-hchip amber">${icon("trophy")}
          <div><small>Prioritas Utama</small><b>${top ? esc(top.id) + " · " + esc(top.name) : "—"}</b></div>
        </div>
      </div>

      <div class="rd-hactions">
        <button class="rd-btn" type="button" data-act="detail" data-id="${id}">${icon("eye")}Detail</button>
        <button class="rd-btn" type="button" data-act="report" data-id="${id}">${icon("file-text")}Laporan</button>
        <button class="rd-btn danger" type="button" data-act="delete" data-id="${id}">${icon("trash")}Hapus</button>
      </div>
    </article>
  `;
}

/*
   Menentukan nomor halaman yang ditampilkan di bawah daftar (memakai tanda ... bila banyak).
*/
function pagerPages(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const list = [...new Set([1, total, current - 1, current, current + 1])]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const out = [];

  list.forEach((p, i) => {
    if (i && p - list[i - 1] > 1) out.push("…");
    out.push(p);
  });

  return out;
}

/*
   Menggambar halaman Riwayat: kartu statistik, daftar (sudah disaring/diurutkan/dipotong per halaman),
   keterangan jumlah, dan tombol nomor halaman.
*/
function renderHistory() {
  const all = historyCache;

  /* statistik dari seluruh riwayat */
  const counts = {};

  all.forEach((item) => {
    const top = topOf(item);
    if (top) counts[top.id] = (counts[top.id] || 0) + 1;
  });

  const favId = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  const fav = ALTERNATIVES.find(([id]) => id === favId);
  const sumTotal = all.reduce(
    (sum, item) => sum + (Number(item.total) || 0),
    0,
  );

  $("#histTotal").textContent = all.length;
  $("#histTop").textContent = favId ? `${favId} · ${fav ? fav[1] : ""}` : "—";
  $("#histFunds").textContent = money(sumTotal);

  /* siapkan baris, saring, urutkan */
  let rows = all.map((item) => ({
    item,
    date: new Date(item.createdAt || Date.now()),
    top: topOf(item),
  }));

  rows = rows.filter((row) => periodMatch(row.date, historyView.period));

  if (historyView.query) {
    rows = rows.filter(({ item, date, top }) => {
      const haystack = [
        "analisis keuangan",
        dayLabel(date),
        timeLabel(date),
        top ? top.id : "",
        top ? top.name : "",
        top ? metaOf(top.id).short : "",
        item.total,
        money(item.total),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(historyView.query);
    });
  }

  const sorters = {
    newest: (a, b) => b.date - a.date,
    oldest: (a, b) => a.date - b.date,
    highest: (a, b) =>
      (Number(b.item.total) || 0) - (Number(a.item.total) || 0),
    lowest: (a, b) => (Number(a.item.total) || 0) - (Number(b.item.total) || 0),
  };

  rows.sort(sorters[historyView.sort] || sorters.newest);

  /* halaman */
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / HISTORY_PAGE_SIZE));

  historyView.page = Math.min(Math.max(1, historyView.page), pages);

  const start = (historyView.page - 1) * HISTORY_PAGE_SIZE;
  const slice = rows.slice(start, start + HISTORY_PAGE_SIZE);

  /* daftar */
  if (!all.length) {
    $("#historyList").innerHTML = `
      <div class="rd-empty">
        ${icon("clock")}
        <b>Belum ada riwayat</b>
        <p>Analisis yang kamu simpan akan muncul di sini.</p>
      </div>
    `;
  } else if (!total) {
    $("#historyList").innerHTML = `
      <div class="rd-empty">
        ${icon("search")}
        <b>Tidak ada hasil yang cocok</b>
        <p>Ubah kata kunci atau filter periode.</p>
      </div>
    `;
  } else {
    $("#historyList").innerHTML = slice.map(historyRowHTML).join("");
  }

  /* info & pager */
  $("#historyInfo").textContent = total
    ? `Menampilkan ${start + 1}–${start + slice.length} dari ${total} analisis`
    : "0 analisis";

  if (!total) {
    $("#historyPager").innerHTML = "";
    return;
  }

  const current = historyView.page;

  $("#historyPager").innerHTML = `
    <button class="rd-page-btn" type="button" data-pg="prev" aria-label="Sebelumnya" ${current === 1 ? "disabled" : ""}>${icon("chevron-left")}</button>
    ${pagerPages(current, pages)
      .map((p) =>
        p === "…"
          ? `<span class="rd-page-gap">…</span>`
          : `<button class="rd-page-btn ${p === current ? "active" : ""}" type="button" data-pg="${p}">${p}</button>`,
      )
      .join("")}
    <button class="rd-page-btn" type="button" data-pg="next" aria-label="Berikutnya" ${current === pages ? "disabled" : ""}>${icon("chevron-right")}</button>
  `;
}

/*
   Menghapus satu riwayat (setelah konfirmasi) lalu menggambar ulang daftar.
*/
function deleteHistory(id) {
  const history = readHistory();
  const index = history.findIndex((item) => String(item.id) === String(id));

  if (index < 0) return;

  if (!confirm("Apakah kamu yakin ingin menghapus riwayat ini?")) {
    return;
  }

  DuitStore.removeHistory(id).then(() => {
    loadHistory();
    toast("Riwayat berhasil dihapus.");
  });
}

/*
   Membuka popup detail sebuah analisis: tanggal, total/cadangan/operasional, dan tabel alokasi.
*/
function openDetail(item) {
  detailItem = item;

  const date = new Date(item.createdAt || Date.now());
  const operating = (Number(item.total) || 0) - (Number(item.reserve) || 0);
  const rows =
    item.allocation && item.allocation.length
      ? item.allocation
      : item.results || [];

  $("#detailBody").innerHTML = `
    <div class="rd-detail-head">
      <span class="rd-card-ico">${icon("layers")}</span>
      <div>
        <h3 id="detailTitle">Detail Analisis</h3>
        <p>${dayLabel(date)} · ${timeLabel(date)}</p>
      </div>
    </div>

    <div class="rd-detail-tiles">
      <div class="rd-detail-tile"><span>Total dana</span><strong>${money(item.total)}</strong></div>
      <div class="rd-detail-tile"><span>Dana cadangan</span><strong>${money(item.reserve)}</strong></div>
      <div class="rd-detail-tile"><span>Dana operasional</span><strong>${money(operating)}</strong></div>
    </div>

    <div class="rd-table-wrap">
      <table class="rd-table">
        <thead>
          <tr>
            <th style="width:56px">#</th>
            <th>Kebutuhan</th>
            <th class="rd-num">Nilai</th>
            <th>Persentase</th>
            <th class="rd-num">Alokasi</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row, index) => `
            <tr class="${index === 0 ? "is-top" : ""}">
              <td><span class="rd-rank">${index + 1}</span></td>
              <td>${esc(row.id)} · ${esc(row.name)}</td>
              <td class="rd-num">${fmtPref(row.value)}</td>
              <td>${Number.isFinite(row.share) ? `<span class="rd-chip">${fmtPct(row.share)}</span>` : "—"}</td>
              <td class="rd-num">${Number.isFinite(row.allocated) ? money(row.allocated) : "—"}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  $("#detailModal").hidden = false;
  document.body.style.overflow = "hidden";
}

/*
   Menutup popup detail.
*/
function closeDetail() {
  $("#detailModal").hidden = true;
  document.body.style.overflow = "";
  detailItem = null;
}

/*
   Memasang aksi di halaman Riwayat: kolom cari, filter periode, urutan, nomor halaman,
   tombol Detail/Laporan/Hapus, tombol muat ulang, serta penutup popup detail (x, area luar, Escape).
*/
function bindHistoryControls() {
  $("#historySearch").addEventListener("input", (event) => {
    historyView.query = event.target.value.trim().toLowerCase();
    historyView.page = 1;
    renderHistory();
  });

  $("#historyPeriod").addEventListener("change", (event) => {
    historyView.period = event.target.value;
    historyView.page = 1;
    renderHistory();
  });

  $("#historySort").addEventListener("change", (event) => {
    historyView.sort = event.target.value;
    historyView.page = 1;
    renderHistory();
  });

  $("#historyPager").addEventListener("click", (event) => {
    const button = event.target.closest("[data-pg]");

    if (!button || button.disabled) return;

    const value = button.dataset.pg;

    if (value === "prev") historyView.page -= 1;
    else if (value === "next") historyView.page += 1;
    else historyView.page = Number(value);

    renderHistory();
    $("#historyList").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  /* Tombol muat ulang (ikon panah melingkar). */
  $("#refreshHistory").addEventListener("click", () =>
    DuitStore.reloadHistory().then(loadHistory),
  );

  $("#historyList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-act]");

    if (!button) return;

    const item = historyCache.find(
      (entry) => String(entry.id) === button.dataset.id,
    );

    if (!item) return;

    if (button.dataset.act === "detail") openDetail(item);
    if (button.dataset.act === "report") printReport(item);
    if (button.dataset.act === "delete") deleteHistory(item.id);
  });

  $("#detailModal").addEventListener("click", (event) => {
    if (event.target.closest("[data-close-modal]")) closeDetail();
  });

  $("#detailReport").addEventListener("click", () => {
    if (detailItem) printReport(detailItem);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !$("#detailModal").hidden) closeDetail();
  });
}

/*
   Menyusun laporan lengkap (ringkasan dana, peringkat SAW, alokasi) dan membukanya untuk dicetak.
*/
function printReport(item) {
  if (!item) return;

  const results = (item.results || [])
    .slice()
    .sort((a, b) => b.value - a.value);

  const allocation = item.allocation || [];

  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    toast("Izinkan pop-up browser untuk mencetak laporan.");
    return;
  }

  const resultRows = results
    .map(
      (row, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${row.id} · ${row.name}</td>
      ${row.scores.map((score) => `<td>${score}</td>`).join("")}
      <td>${Number(row.value).toFixed(4)}</td>
    </tr>
  `,
    )
    .join("");

  const allocationRows = allocation
    .map(
      (row) => `
    <tr>
      <td>${row.id} · ${row.name}</td>
      <td>${Number(row.share).toFixed(2)}%</td>
      <td>${money(row.allocated)}</td>
    </tr>
  `,
    )
    .join("");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Laporan DuitDulu</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          color: #24352e;
          padding: 30px;
          font-size: 12px;
        }
        h1 { color: #087346; }
        h2 { margin-top: 28px; color: #24583a; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
        }
        th, td {
          border: 1px solid #dce8de;
          padding: 9px;
          text-align: left;
        }
        th { background: #edf5ee; }
        .muted { color: #718078; }
      </style>
    </head>
    <body>
      <h1>DuitDulu — Laporan Analisis</h1>
      <p class="muted">Dicetak: ${new Date().toLocaleString("id-ID")}</p>

      <p>
        Total dana: <b>${money(item.total)}</b><br>
        Dana cadangan: <b>${money(item.reserve)}</b><br>
        Dana operasional: <b>${money(item.total - item.reserve)}</b>
      </p>

      <h2>Hasil perhitungan SAW</h2>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Alternatif</th>
            <th>C1</th>
            <th>C2</th>
            <th>C3</th>
            <th>C4</th>
            <th>Preferensi</th>
          </tr>
        </thead>
        <tbody>${resultRows}</tbody>
      </table>

      <h2>Rekomendasi alokasi dana</h2>
      <table>
        <thead>
          <tr>
            <th>Kebutuhan</th>
            <th>Proporsi</th>
            <th>Alokasi dana</th>
          </tr>
        </thead>
        <tbody>${allocationRows}</tbody>
      </table>

      <p class="muted">
        Perhitungan prioritas menggunakan metode Simple Additive Weighting (SAW)
        dengan bobot sama untuk empat kriteria.
      </p>

      <script>
        window.onload = function() {
          window.print();
        };
      <\/script>
    </body>
    </html>
  `);

  printWindow.document.close();
}

/* ################################################################
   BAGIAN 11 · MULAI (menjalankan semuanya)  - HARUS PALING BAWAH
   Setelah halaman selesai dimuat, init() menjalankan semua tahap satu per satu.
   Jika menambah fitur baru, panggil fungsi persiapannya di init().
   ################################################################ */

/*
   Menampilkan nama & inisial pengguna di pojok kanan atas dan sapaan dashboard (data: user di BAGIAN 1 (PENGATURAN) di duit.js).
*/
function renderUser() {
  $("#userName").textContent = user.name;

  $("#greetingName").textContent = user.name.trim().split(/\s+/)[0];

  $("#userAvatar").textContent = user.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

/*
   init(): urutan menjalankan website.
   Catatan: tidak ada login. Aplikasi langsung berjalan memakai pengguna lokal.
*/
async function init() {
  /* Wajib login: bila belum ada sesi, DuitStore mengarahkan ke index.html. */
  const session = await DuitStore.requireUser();
  if (!session) return;
  user = { id: session.id, name: session.name };
  await DuitStore.hydrate(user);

  /* tanggal hari ini di bagian atas */
  $("#todayLabel").textContent = new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  renderUser();

  /* menggambar bagian yang dibuat oleh JavaScript */
  renderAlternatives(); /* kotak kebutuhan Tahap 1 */
  renderScaleGuide(); /* skala Panduan Skor Tahap 2 */

  /* memasang aksi klik/ketik */
  bindNavigation(); /* BAGIAN 4 (NAVIGASI) di duit.js */
  $("#logoutBtn").addEventListener("click", () => DuitStore.signOut());
  bindTahap1Dana(); /* BAGIAN 6 · Tahap 1 */
  bindTahap2Penilaian(); /* BAGIAN 7 · Tahap 2 */
  bindTahap4Alokasi(); /* BAGIAN 9 · Tahap 4 */

  /* memulihkan draft terakhir lalu menyegarkan tampilan */
  restoreDraft();
  draftReady = true; /* mulai sekarang perubahan boleh disimpan */
  if (DuitStore.getDraft()) saveDraft();
  updateDashboard();
  loadHistory();

  bindHistoryControls(); /* BAGIAN 10 · Riwayat */
  bindCritGuide(); /* BAGIAN 7 · popup Selengkapnya */

  document.body.classList.remove("auth-pending"); /* tampilkan halaman */
  if (window.DuitMotion) DuitMotion.intro();
}

/* Jalankan init() setelah seluruh halaman selesai dimuat. */
document.addEventListener("DOMContentLoaded", init);

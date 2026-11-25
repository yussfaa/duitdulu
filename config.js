/*
  Pengaturan bersama untuk halaman login dan halaman utama.

  [ SUPABASE ]  Isi dari Supabase Dashboard → Project Settings → API:
    SUPABASE_URL      = "Project URL"           (contoh: https://abcdxyz.supabase.co)
    SUPABASE_ANON_KEY = "anon / publishable key"
  JANGAN memakai key "service_role" atau "secret" di file ini (file ini terlihat oleh pengunjung).
  Selama kosong, website berjalan dalam MODE DEMO (akun dan data disimpan di browser saja).

  [ ANIMASI ]
    MOTION_SPEED : kecepatan animasi. 1 = normal, 1.6 = lebih lambat (bawaan), 2 = sangat lambat, 1.2 = agak cepat.
    FORCE_MOTION : true  = animasi tetap jalan walau perangkat memakai "kurangi gerakan" (Windows: animasi dimatikan, dsb.)
                   false = hormati pengaturan perangkat (animasi mati bila pengguna memintanya).
*/
window.DUITDULU_CONFIG = {
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",
  MOTION_SPEED: 1.6,
  FORCE_MOTION: true,
};

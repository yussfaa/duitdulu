/*
  DuitStore: satu-satunya tempat yang bicara ke Supabase (login, daftar, draft, riwayat).
  Bila js/config.js masih kosong -> MODE DEMO (localStorage, tidak aman, hanya untuk uji coba).
  Dipakai oleh index.html, register.html (lewat window.DuitDuluAuth) dan duit.html.
*/
(() => {
  'use strict';
  const P = { login: 'index.html', app: 'duit.html' }; // semua file berada dalam satu folder
  const cfg = window.DUITDULU_CONFIG || {};
  const wantLive = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
  if (wantLive && !window.supabase) console.error('Supabase diisi di config.js tetapi library gagal dimuat (cek internet). Memakai mode demo.');
  const sb = wantLive && window.supabase ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;

  const KEY = { users: 'duitdulu_demo_users', session: 'duitdulu_demo_session' };
  const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (_) { return d; } };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const nameOf = (u) => (u.user_metadata && u.user_metadata.full_name) || (u.email || '').split('@')[0] || 'Pengguna';

  /* ---------- Sesi ---------- */
  async function getUser() {
    if (sb) {
      const { data } = await sb.auth.getSession();
      const u = data && data.session && data.session.user;
      return u ? { id: u.id, name: nameOf(u), email: u.email } : null;
    }
    return read(KEY.session, null);
  }
  async function requireUser() {
    const u = await getUser();
    if (!u) { location.replace(P.login); return null; }
    if (sb) sb.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_OUT') location.replace(P.login); });
    return u;
  }
  async function signOut() {
    try { if (sb) await sb.auth.signOut(); else localStorage.removeItem(KEY.session); } catch (e) { console.warn(e); }
    location.replace(P.login);
  }

  /* ---------- Login & daftar (dipanggil main.js lewat window.DuitDuluAuth) ---------- */
  async function login(email, password) {
    if (sb) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) {
        if (/invalid login/i.test(error.message)) return { ok: false, message: 'Email atau kata sandi tidak sesuai.' };
        if (/confirm/i.test(error.message)) return { ok: false, message: 'Email belum dikonfirmasi. Cek kotak masuk Anda.' };
        return { ok: false, message: 'Tidak dapat masuk: ' + error.message };
      }
      return { ok: true, redirect: P.app };
    }
    const u = read(KEY.users, []).find((x) => x.email === email.toLowerCase());
    if (!u) return { ok: false, message: 'Akun belum terdaftar (mode demo). Silakan daftar dulu.' };
    if (u.password !== password) return { ok: false, message: 'Email atau kata sandi tidak sesuai.' };
    write(KEY.session, { id: u.id, name: u.name, email: u.email });
    return { ok: true, redirect: P.app };
  }
  async function register(name, email, password) {
    if (sb) {
      const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name: name } } });
      if (error) return { ok: false, message: /registered/i.test(error.message) ? 'Email sudah terdaftar. Silakan masuk.' : error.message };
      // Konfirmasi email dimatikan -> sesi langsung ada. Jika masih aktif, arahkan ke halaman masuk.
      return { ok: true, redirect: data.session ? P.app : P.login + '?sheet=1' };
    }
    const users = read(KEY.users, []);
    if (users.some((x) => x.email === email.toLowerCase())) return { ok: false, message: 'Email sudah terdaftar. Silakan masuk.' };
    const u = { id: 'demo-' + Date.now(), name, email: email.toLowerCase(), password }; // DEMO: tidak diacak
    users.push(u); write(KEY.users, users);
    write(KEY.session, { id: u.id, name: u.name, email: u.email });
    return { ok: true, redirect: P.app };
  }
  window.DuitDuluAuth = { login, register };

  // Sudah login? Lewati halaman masuk/daftar.
  document.addEventListener('DOMContentLoaded', () => {
    const c = document.body.classList;
    if (c.contains('page-login') || c.contains('page-register')) getUser().then((u) => { if (u) location.replace(P.app); });
  });

  /* ---------- Data pengguna: draft & riwayat ---------- */
  let me = null, draft = null, history = [], timer = null;

  const cacheKey = (id) => 'duitdulu_draftcache_' + id;
  let draftAt = 0; // waktu (ms) perubahan draft terakhir

  async function hydrate(user) {
    me = user;
    if (sb) {
      // Draft dan riwayat dibaca terpisah: gagal satu tidak membuang yang lain.
      let serverAt = 0;
      try {
        const d = await sb.from('drafts').select('data,updated_at').eq('user_id', user.id).maybeSingle();
        if (d.error) throw d.error;
        draft = d.data ? d.data.data : null;
        serverAt = d.data && d.data.updated_at ? new Date(d.data.updated_at).getTime() : 0;
      } catch (e) {
        console.error('Gagal membaca draft dari Supabase (apakah schema.sql sudah dijalankan?)', e);
      }
      try {
        const h = await sb.from('analyses').select('id,data,created_at').order('created_at', { ascending: false }).limit(50);
        if (h.error) throw h.error;
        history = (h.data || []).map((r) => ({ ...r.data, id: r.id, createdAt: (r.data && r.data.createdAt) || r.created_at }));
      } catch (e) {
        console.error('Gagal membaca riwayat dari Supabase (apakah schema.sql sudah dijalankan?)', e);
      }
      // Salinan di browser dipakai bila lebih baru (misalnya halaman di-refresh sebelum draft sempat terkirim).
      const cached = read(cacheKey(user.id), null);
      if (cached && cached.data && cached.t > serverAt) {
        draft = cached.data;
        draftAt = cached.t;
        pushDraft();
      }
      return;
    }
    draft = read('duitdulu_draft_' + user.id, null);
    history = read('duitdulu_history_' + user.id, []);
  }

  async function pushDraft() {
    if (!me) return;
    if (sb) {
      const { error } = await sb.from('drafts').upsert({ user_id: me.id, data: draft, updated_at: new Date(draftAt || Date.now()).toISOString() });
      if (error) console.warn('Draft belum tersimpan:', error.message);
    } else write('duitdulu_draft_' + me.id, draft);
  }
  const saveDraft = (obj) => {
    draft = obj;
    draftAt = Date.now();
    // Tulis ke browser SEKETIKA (tahan refresh), kirim ke Supabase setelah jeda singkat.
    if (me) { try { write(cacheKey(me.id), { t: draftAt, data: draft }); } catch (_) { /* penyimpanan penuh */ } }
    clearTimeout(timer);
    timer = setTimeout(() => { timer = null; pushDraft(); }, 600);
  };
  const flushDraft = () => { if (timer) { clearTimeout(timer); timer = null; pushDraft(); } };
  document.addEventListener('visibilitychange', () => { if (document.hidden) flushDraft(); });
  window.addEventListener('pagehide', flushDraft);

  // Muat ulang riwayat dari Supabase (dipanggil saat halaman Riwayat dibuka / tombol muat ulang).
  async function reloadHistory() {
    if (!sb || !me) return history;
    const { data, error } = await sb.from('analyses').select('id,data,created_at').order('created_at', { ascending: false }).limit(50);
    if (error) { console.error('Gagal memuat riwayat:', error); return history; }
    history = (data || []).map((r) => ({ ...r.data, id: r.id, createdAt: (r.data && r.data.createdAt) || r.created_at }));
    return history;
  }

  async function addHistory(item) {
    let id = 'local-' + Date.now();
    if (sb) {
      // user_id diisi eksplisit (bukan hanya default auth.uid()) supaya lolos aturan keamanan (RLS)
      const { data, error } = await sb.from('analyses').insert({ user_id: me.id, data: item }).select('id').single();
      if (error) throw error;
      id = data.id;
    }
    history.unshift({ ...item, id });
    history = history.slice(0, 50);
    if (!sb) write('duitdulu_history_' + me.id, history);
    return id;
  }
  async function removeHistory(id) {
    if (sb && !String(id).startsWith('local-')) {
      const { error } = await sb.from('analyses').delete().eq('id', id);
      if (error) { console.error(error); return; }
    }
    history = history.filter((x) => String(x.id) !== String(id));
    if (!sb) write('duitdulu_history_' + me.id, history);
  }

  window.DuitStore = {
    live: !!sb, getUser, requireUser, signOut, hydrate,
    getDraft: () => draft, saveDraft, getHistory: () => history, addHistory, removeHistory, reloadHistory,
  };
})();

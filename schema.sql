-- Jalankan di Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Aman dijalankan BERULANG KALI (tidak error bila tabel/aturan sudah ada).

create table if not exists public.drafts (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.analyses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data       jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists analyses_user_created_idx on public.analyses (user_id, created_at desc);

-- Row Level Security: tiap pengguna hanya bisa melihat dan mengubah datanya sendiri.
alter table public.drafts   enable row level security;
alter table public.analyses enable row level security;

-- Hapus aturan lama (bila ada) lalu buat ulang, supaya tidak terhenti di tengah jalan.
drop policy if exists "drafts: baca milik sendiri"     on public.drafts;
drop policy if exists "drafts: tambah milik sendiri"   on public.drafts;
drop policy if exists "drafts: ubah milik sendiri"     on public.drafts;
drop policy if exists "analyses: baca milik sendiri"   on public.analyses;
drop policy if exists "analyses: tambah milik sendiri" on public.analyses;
drop policy if exists "analyses: hapus milik sendiri"  on public.analyses;

create policy "drafts: baca milik sendiri"     on public.drafts   for select using (auth.uid() = user_id);
create policy "drafts: tambah milik sendiri"   on public.drafts   for insert with check (auth.uid() = user_id);
create policy "drafts: ubah milik sendiri"     on public.drafts   for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "analyses: baca milik sendiri"   on public.analyses for select using (auth.uid() = user_id);
create policy "analyses: tambah milik sendiri" on public.analyses for insert with check (auth.uid() = user_id);
create policy "analyses: hapus milik sendiri"  on public.analyses for delete using (auth.uid() = user_id);

-- Izin akses untuk pengguna yang sudah masuk (login).
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.drafts   to authenticated;
grant select, insert, delete          on public.analyses to authenticated;

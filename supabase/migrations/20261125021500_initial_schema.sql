-- Remove unused legacy tables from previous project
drop table if exists public.chat_messages cascade;
drop table if exists public.chat_users cascade;
drop table if exists public.menu cascade;
drop table if exists public.users cascade;

-- 1. Site settings table (single-row configuration for the wedding template)
create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  theme_preset text not null default 'klasik_megah' check (theme_preset in ('klasik_megah', 'modern_elegan')),
  event_title text not null default 'Intat Linto Baro',
  groom_data jsonb not null default '{}'::jsonb,
  bride_data jsonb not null default '{}'::jsonb,
  holy_verse text not null default '',
  post_event_message text not null default '',
  enable_digital_gift boolean not null default true,
  digital_gift_data jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- 2. Event schedule table (focused on Resepsi Intat Linto Baro)
create table if not exists public.event_schedule (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Resepsi Intat Linto Baro',
  event_date timestamptz not null,
  start_time_wib text not null,
  end_time_wib text not null,
  venue_name text not null,
  address text not null,
  google_maps_url text not null,
  maps_embed_url text not null,
  updated_at timestamptz not null default now()
);

-- 3. Gallery photos table
create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  storage_key text not null,
  caption text not null,
  width int not null check (width > 0),
  height int not null check (height > 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 4. Private guest wishes table (never exposed to public anonymous SELECT)
create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  sender_name text not null check (char_length(sender_name) between 1 and 80),
  sender_relation text not null default '' check (char_length(sender_relation) <= 80),
  type text not null check (type in ('TEXT', 'VIDEO')),
  text_content text check (text_content is null or char_length(text_content) <= 200),
  video_r2_key text,
  video_file_name text,
  video_duration_sec int check (video_duration_sec is null or (video_duration_sec > 0 and video_duration_sec <= 60)),
  video_size_bytes int check (video_size_bytes is null or (video_size_bytes > 0 and video_size_bytes <= 83886080)),
  status text not null default 'PUBLISHED' check (status in ('PUBLISHED', 'PENDING_MODERATION', 'HIDDEN')),
  flagged_words jsonb not null default '[]'::jsonb,
  edit_token_hash text not null,
  ip_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_wishes_status_created_at on public.wishes (status, created_at desc);

-- 5. Banned words dictionary (Indonesian & Acehnese profanity filter)
create table if not exists public.banned_words (
  id uuid primary key default gen_random_uuid(),
  word text not null unique,
  language text not null check (language in ('id', 'aceh')),
  match_type text not null default 'exact' check (match_type in ('exact', 'contains')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_banned_words_active on public.banned_words (is_active, language);

-- Enable Row Level Security on all public tables
alter table public.site_settings enable row level security;
alter table public.event_schedule enable row level security;
alter table public.gallery_photos enable row level security;
alter table public.wishes enable row level security;
alter table public.banned_words enable row level security;

-- Explicit table grants for Data API roles (RLS still governs row visibility)
grant usage on schema public to anon, authenticated;
grant select on public.site_settings, public.event_schedule, public.gallery_photos to anon, authenticated;
grant all on public.site_settings, public.event_schedule, public.gallery_photos, public.wishes, public.banned_words to authenticated;
revoke all on public.wishes, public.banned_words from anon;

-- Public read-only policies for non-sensitive invitation metadata
drop policy if exists "public_read_site_settings" on public.site_settings;
create policy "public_read_site_settings" on public.site_settings
  for select to anon, authenticated
  using (true);

drop policy if exists "public_read_event_schedule" on public.event_schedule;
create policy "public_read_event_schedule" on public.event_schedule
  for select to anon, authenticated
  using (true);

drop policy if exists "public_read_gallery_photos" on public.gallery_photos;
create policy "public_read_gallery_photos" on public.gallery_photos
  for select to anon, authenticated
  using (true);

-- Admin policies for authenticated non-anonymous owners
drop policy if exists "admin_manage_site_settings" on public.site_settings;
create policy "admin_manage_site_settings" on public.site_settings
  for all to authenticated
  using ((select auth.uid()) is not null and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false)
  with check ((select auth.uid()) is not null and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false);

drop policy if exists "admin_manage_event_schedule" on public.event_schedule;
create policy "admin_manage_event_schedule" on public.event_schedule
  for all to authenticated
  using ((select auth.uid()) is not null and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false)
  with check ((select auth.uid()) is not null and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false);

drop policy if exists "admin_manage_gallery_photos" on public.gallery_photos;
create policy "admin_manage_gallery_photos" on public.gallery_photos
  for all to authenticated
  using ((select auth.uid()) is not null and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false)
  with check ((select auth.uid()) is not null and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false);

drop policy if exists "admin_manage_wishes" on public.wishes;
create policy "admin_manage_wishes" on public.wishes
  for all to authenticated
  using ((select auth.uid()) is not null and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false)
  with check ((select auth.uid()) is not null and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false);

drop policy if exists "admin_manage_banned_words" on public.banned_words;
create policy "admin_manage_banned_words" on public.banned_words
  for all to authenticated
  using ((select auth.uid()) is not null and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false)
  with check ((select auth.uid()) is not null and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false);

-- Initial Seed Data: Banned Words (Indonesian & Acehnese including user additions)
insert into public.banned_words (word, language, match_type, is_active) values
  ('anjing', 'id', 'exact', true),
  ('bangsat', 'id', 'exact', true),
  ('bodoh', 'id', 'exact', true),
  ('goblok', 'id', 'exact', true),
  ('tolol', 'id', 'exact', true),
  ('babi', 'id', 'exact', true),
  ('kampret', 'id', 'exact', true),
  ('kontol', 'id', 'exact', true),
  ('memek', 'id', 'exact', true),
  ('tai', 'id', 'exact', true),
  ('asee', 'aceh', 'exact', true),
  ('buya', 'aceh', 'exact', true),
  ('pungo', 'aceh', 'exact', true),
  ('paleh', 'aceh', 'exact', true),
  ('bangai', 'aceh', 'exact', true),
  ('buy', 'aceh', 'exact', true),
  ('capok', 'aceh', 'exact', true),
  ('puko', 'aceh', 'exact', true),
  ('pukoe', 'aceh', 'exact', true),
  ('pukoe lempap', 'aceh', 'exact', true),
  ('bajeng', 'aceh', 'exact', true),
  ('ek boh', 'aceh', 'exact', true)
on conflict (word) do nothing;

-- Initial Seed Data: Default Site Settings & Event Schedule
insert into public.site_settings (
  id,
  theme_preset,
  event_title,
  groom_data,
  bride_data,
  holy_verse,
  post_event_message,
  enable_digital_gift,
  digital_gift_data
) values (
  '00000000-0000-0000-0000-000000000001',
  'klasik_megah',
  'Intat Linto Baro',
  '{"fullName":"Teuku Faisal Reza, M.Sc.","nickname":"Teuku Faisal","fatherName":"Bapak Teuku H. Abdullah Usman","motherName":"Ibu Cut Hj. Maryam"}'::jsonb,
  '{"fullName":"Cut Sarah Zahara, S.T.","nickname":"Cut Sarah","fatherName":"Bapak Teuku H. Muhammad Yunus","motherName":"Ibu Cut Hj. Rohani"}'::jsonb,
  'Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih dan sayang. (QS. Ar-Rum: 21)',
  'Alhamdulillah, Acara Resepsi Intat Linto Baro Telah Terlaksana. Terima kasih yang tulus kami haturkan kepada seluruh keluarga, kerabat, dan sahabat yang telah hadir maupun mengirimkan doa serta video ucapan.',
  true,
  '[{"id":"bsi-aceh","bankName":"Bank Syariah Indonesia (BSI)","accountNumber":"7182930415","accountHolder":"a.n. Cut Sarah Zahara"},{"id":"bank-aceh","bankName":"Bank Aceh Syariah","accountNumber":"010020304050","accountHolder":"a.n. Teuku Faisal Reza"}]'::jsonb
) on conflict (id) do nothing;

insert into public.event_schedule (
  id,
  title,
  event_date,
  start_time_wib,
  end_time_wib,
  venue_name,
  address,
  google_maps_url,
  maps_embed_url
) values (
  '00000000-0000-0000-0000-000000000002',
  'Resepsi Intat Linto Baro',
  '2026-08-15T10:00:00+07:00',
  '10.00 WIB',
  '16.00 WIB',
  'Kediaman Keluarga Besar Dara Baro (Balee Meuligoe)',
  'Jl. Teuku Nyak Arief No. 45, Gampong Lamnyong, Kec. Syiah Kuala, Kota Banda Aceh',
  'https://www.google.com/maps/search/?api=1&query=5.5736,95.3583',
  'https://www.openstreetmap.org/export/embed.html?bbox=95.3483%2C5.5656%2C95.3683%2C5.5816&layer=mapnik&marker=5.5736%2C95.3583'
) on conflict (id) do nothing;

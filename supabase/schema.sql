-- Production migration target for Sermon Song Maker.
-- The current MVP defaults to local file storage so it can be tested without external services.
create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  audio_url text,
  video_url text,
  thumbnail_url text,
  song_title text not null,
  sermon_title text,
  scripture text not null,
  worship_type text not null,
  worship_date date not null,
  preacher text,
  sermon_series text,
  series_number integer,
  template_id text default 'navy-gold',
  render_status text not null default 'queued',
  render_progress integer not null default 0,
  render_message text,
  render_error text,
  youtube_title text,
  youtube_description text,
  youtube_tags text,
  recommended_playlist text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_status_created_idx on public.projects(render_status, created_at);
create index if not exists projects_worship_date_idx on public.projects(worship_date desc);
create index if not exists projects_series_idx on public.projects(sermon_series);

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  intro_image_url text,
  main_image_url text,
  outro_image_url text,
  channel_name text default 'Paul의 믿음일기',
  series_title text default '설교가 찬양이 되다',
  outro_message text default '오늘 들은 말씀이 이번 한 주의 삶이 되기를 기도합니다.',
  font_title text,
  font_body text,
  color_primary text default '#071A2F',
  color_accent text default '#C7A85A',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

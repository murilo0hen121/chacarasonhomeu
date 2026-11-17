-- =====================================================================
--  Chácara Sonho Meu | Configuração do Supabase
--  Rode este arquivo UMA vez: Supabase > SQL Editor > New query > colar > Run
--  ANTES de rodar, troque SEU_EMAIL_AQUI pelo e-mail que você vai usar no painel.
-- =====================================================================

-- 1) Quem é administrador (somente estes e-mails conseguem alterar o site)
create table if not exists admins (email text primary key);
alter table admins enable row level security;
insert into admins (email) values ('SEU_EMAIL_AQUI') on conflict do nothing;

create or replace function sou_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;
revoke all on function sou_admin() from public;
grant execute on function sou_admin() to anon, authenticated;

-- 2) Tabelas
create table if not exists site_content (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
insert into site_content (id) values (1) on conflict do nothing;

create table if not exists photos (
  id bigint generated always as identity primary key,
  url text not null,
  path text,
  alt text default '',
  cat text default 'ext' check (cat in ('pis','ext','laz')),
  pos int default 0,
  created_at timestamptz default now()
);

create table if not exists reserved_dates (day date primary key);

create table if not exists leads (
  id bigint generated always as identity primary key,
  created_at timestamptz default now(),
  nome text not null check (char_length(nome) <= 120),
  nascimento date,
  inicio date,
  fim date,
  motivo text check (char_length(motivo) <= 120),
  pessoas int check (pessoas between 1 and 5000),
  status text not null default 'novo' check (status in ('novo','contatado','fechado','perdido')),
  obs text default ''
);

create table if not exists visits (
  id bigint generated always as identity primary key,
  created_at timestamptz default now(),
  visitor text not null check (char_length(visitor) <= 64),
  page text not null check (char_length(page) <= 30),
  dispositivo text check (char_length(dispositivo) <= 20),
  origem text check (char_length(origem) <= 100)
);
create index if not exists visits_created_idx on visits (created_at);

-- 3) Fotos iniciais (as mesmas que já estão na pasta assets/fotos)
insert into photos (url, alt, cat, pos)
select * from (values
  ('assets/fotos/01.jpg', 'Duas piscinas e o jardim', 'pis', 1),
  ('assets/fotos/02.jpg', 'Mesa de sinuca', 'laz', 2),
  ('assets/fotos/03.jpg', 'Piscina e área verde', 'pis', 3),
  ('assets/fotos/04.jpg', 'Churrasqueira', 'laz', 4),
  ('assets/fotos/05.jpg', 'Gramado e escadaria', 'ext', 5),
  ('assets/fotos/06.jpg', 'Piscina e caminho iluminado', 'pis', 6),
  ('assets/fotos/07.jpg', 'Campinho de futebol', 'laz', 7),
  ('assets/fotos/08.jpg', 'Jardim com pérgola florida', 'ext', 8),
  ('assets/fotos/09.jpg', 'Mesas sob as árvores', 'ext', 9)
) v (url, alt, cat, pos)
where not exists (select 1 from photos);

-- 4) Segurança (RLS): o público só lê o site e envia pedidos/visitas; só o admin altera
alter table site_content   enable row level security;
alter table photos         enable row level security;
alter table reserved_dates enable row level security;
alter table leads          enable row level security;
alter table visits         enable row level security;

create policy "todos leem conteudo"  on site_content   for select using (true);
create policy "todos leem fotos"     on photos         for select using (true);
create policy "todos leem datas"     on reserved_dates for select using (true);
create policy "admin altera conteudo" on site_content   for all to authenticated using (sou_admin()) with check (sou_admin());
create policy "admin altera fotos"    on photos         for all to authenticated using (sou_admin()) with check (sou_admin());
create policy "admin altera datas"    on reserved_dates for all to authenticated using (sou_admin()) with check (sou_admin());

create policy "visitante envia pedido" on leads  for insert to anon, authenticated with check (status = 'novo');
create policy "admin gerencia pedidos" on leads  for all to authenticated using (sou_admin()) with check (sou_admin());
create policy "visitante registra visita" on visits for insert to anon, authenticated with check (true);
create policy "admin le visitas"        on visits for select to authenticated using (sou_admin());

-- 5) Estatísticas de visitas (só o admin consegue chamar)
create or replace function visit_stats(dias int default 30) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb; desde timestamptz := now() - make_interval(days => dias);
begin
  if not sou_admin() then raise exception 'acesso negado'; end if;
  select jsonb_build_object(
    'por_dia', coalesce((select jsonb_agg(x order by x.dia) from (
        select (created_at at time zone 'America/Sao_Paulo')::date as dia, count(*) as visitas, count(distinct visitor) as unicos
        from visits where created_at >= desde group by 1) x), '[]'::jsonb),
    'total',   (select count(*) from visits where created_at >= desde),
    'unicos',  (select count(distinct visitor) from visits where created_at >= desde),
    'agora',   (select count(distinct visitor) from visits where created_at >= now() - interval '5 minutes'),
    'paginas', coalesce((select jsonb_agg(x) from (select page as k, count(*) as n from visits where created_at >= desde group by 1 order by 2 desc) x), '[]'::jsonb),
    'dispositivos', coalesce((select jsonb_agg(x) from (select coalesce(dispositivo,'?') as k, count(*) as n from visits where created_at >= desde group by 1 order by 2 desc) x), '[]'::jsonb),
    'origens', coalesce((select jsonb_agg(x) from (select coalesce(origem,'direto') as k, count(*) as n from visits where created_at >= desde group by 1 order by 2 desc limit 8) x), '[]'::jsonb)
  ) into r;
  return r;
end $$;
revoke all on function visit_stats(int) from public, anon;
grant execute on function visit_stats(int) to authenticated;

-- 6) Armazenamento de fotos e vídeo (pasta pública para leitura, envio só do admin)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site', 'site', true, 52428800, array['image/jpeg','image/png','image/webp','video/mp4','video/quicktime'])
on conflict (id) do nothing;
create policy "admin le arquivos"   on storage.objects for select to authenticated using (bucket_id = 'site' and sou_admin());
create policy "admin envia arquivos" on storage.objects for insert to authenticated with check (bucket_id = 'site' and sou_admin());
create policy "admin altera arquivos" on storage.objects for update to authenticated using (bucket_id = 'site' and sou_admin());
create policy "admin apaga arquivos"  on storage.objects for delete to authenticated using (bucket_id = 'site' and sou_admin());

-- 7) Tempo real: o site público e o painel atualizam sozinhos
alter publication supabase_realtime add table site_content, photos, reserved_dates, leads;

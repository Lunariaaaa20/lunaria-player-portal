create table if not exists public.character_owned_cosmetics (
  id uuid primary key default gen_random_uuid(),
  character_id text not null,
  cosmetic_id uuid not null references public.cosmetics(id) on delete cascade,
  acquired_from text not null default 'shop',
  created_at timestamptz not null default now(),
  unique(character_id, cosmetic_id)
);

create index if not exists character_owned_cosmetics_character_id_idx
  on public.character_owned_cosmetics(character_id);

create index if not exists character_owned_cosmetics_cosmetic_id_idx
  on public.character_owned_cosmetics(cosmetic_id);

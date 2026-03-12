# Auto-SEO — Supabase Changes

Claude Code documents database changes here. User applies them via Supabase Dashboard or migrations.

## Pending

### 1. Profiles table (auto-created on signup)
```sql
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### 2. Projects table
```sql
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  url text,
  created_at timestamptz default now()
);

alter table public.projects enable row level security;

create policy "Users can CRUD own projects"
  on public.projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

### 3. Keywords table
```sql
create table public.keywords (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  keyword text not null,
  position integer,
  search_volume integer,
  created_at timestamptz default now()
);

alter table public.keywords enable row level security;

create policy "Users can CRUD own keywords"
  on public.keywords for all
  using (
    project_id in (
      select id from public.projects where user_id = auth.uid()
    )
  )
  with check (
    project_id in (
      select id from public.projects where user_id = auth.uid()
    )
  );
```

### 4. Analyses table
```sql
create table public.analyses (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  url text not null,
  score integer,
  suggestions jsonb,
  raw_response jsonb,
  created_at timestamptz default now()
);

alter table public.analyses enable row level security;

create policy "Users can CRUD own analyses"
  on public.analyses for all
  using (
    project_id in (
      select id from public.projects where user_id = auth.uid()
    )
  )
  with check (
    project_id in (
      select id from public.projects where user_id = auth.uid()
    )
  );
```

## Completed

_No completed changes yet._

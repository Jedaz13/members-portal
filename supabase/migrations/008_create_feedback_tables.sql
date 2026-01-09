-- =====================================================
-- FEEDBACK & FEATURE REQUESTS SYSTEM
-- Migration: 008_create_feedback_tables.sql
-- =====================================================

-- Table 1: feedback
-- Stores bug reports, feature requests, and general feedback
create table if not exists public.feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null check (type in ('bug', 'feature', 'general')),
  title text not null,
  description text not null,
  screenshot_url text,
  status text default 'submitted' check (status in ('submitted', 'under_review', 'planned', 'in_progress', 'completed', 'declined')),
  is_public boolean default false,
  admin_notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Indexes for faster queries
create index if not exists feedback_user_id_idx on public.feedback(user_id);
create index if not exists feedback_status_idx on public.feedback(status);
create index if not exists feedback_type_idx on public.feedback(type);
create index if not exists feedback_is_public_idx on public.feedback(is_public);
create index if not exists feedback_created_at_idx on public.feedback(created_at);

-- Table 2: feedback_votes
-- Tracks user votes on public feature requests
create table if not exists public.feedback_votes (
  id uuid default gen_random_uuid() primary key,
  feedback_id uuid references public.feedback(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(feedback_id, user_id)
);

-- Index for faster vote counting
create index if not exists feedback_votes_feedback_id_idx on public.feedback_votes(feedback_id);
create index if not exists feedback_votes_user_id_idx on public.feedback_votes(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on both tables
alter table public.feedback enable row level security;
alter table public.feedback_votes enable row level security;

-- Feedback policies
-- Users can insert their own feedback
create policy "Users can insert own feedback"
  on public.feedback for insert
  with check (auth.uid() = user_id);

-- Users can view their own feedback
create policy "Users can view own feedback"
  on public.feedback for select
  using (auth.uid() = user_id);

-- Users can view public feedback (feature requests made public)
create policy "Users can view public feedback"
  on public.feedback for select
  using (is_public = true);

-- Users can update their own feedback
create policy "Users can update own feedback"
  on public.feedback for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own feedback
create policy "Users can delete own feedback"
  on public.feedback for delete
  using (auth.uid() = user_id);

-- Votes policies
-- Users can insert their own votes
create policy "Users can insert own votes"
  on public.feedback_votes for insert
  with check (auth.uid() = user_id);

-- Users can view all votes (needed for vote counts)
create policy "Users can view all votes"
  on public.feedback_votes for select
  using (true);

-- Users can delete their own votes (unvote)
create policy "Users can delete own votes"
  on public.feedback_votes for delete
  using (auth.uid() = user_id);

-- =====================================================
-- HELPER VIEW FOR VOTE COUNTS
-- =====================================================

-- Create a view that includes vote counts and user vote status
create or replace view public.feedback_with_votes as
select
  f.*,
  u.name as user_name,
  coalesce(vote_counts.vote_count, 0) as vote_count,
  exists(
    select 1 from public.feedback_votes
    where feedback_id = f.id and user_id = auth.uid()
  ) as user_has_voted
from public.feedback f
left join public.users u on f.user_id = u.id
left join (
  select feedback_id, count(*) as vote_count
  from public.feedback_votes
  group by feedback_id
) vote_counts on f.id = vote_counts.feedback_id;

-- =====================================================
-- STORAGE BUCKET FOR SCREENSHOTS
-- =====================================================

-- Note: Run this in Supabase Dashboard SQL Editor or via Supabase CLI
-- insert into storage.buckets (id, name, public)
-- values ('feedback-screenshots', 'feedback-screenshots', true)
-- on conflict (id) do nothing;

-- Storage policies for feedback-screenshots bucket (run in Dashboard):
-- CREATE POLICY "Allow authenticated uploads"
-- ON storage.objects FOR INSERT TO authenticated
-- WITH CHECK (bucket_id = 'feedback-screenshots');

-- CREATE POLICY "Allow public read"
-- ON storage.objects FOR SELECT TO public
-- USING (bucket_id = 'feedback-screenshots');

-- CREATE POLICY "Allow users to delete own screenshots"
-- ON storage.objects FOR DELETE TO authenticated
-- USING (bucket_id = 'feedback-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =====================================================
-- UPDATED_AT TRIGGER
-- =====================================================

-- Create function to update updated_at timestamp
create or replace function public.update_feedback_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for feedback table
drop trigger if exists feedback_updated_at on public.feedback;
create trigger feedback_updated_at
  before update on public.feedback
  for each row
  execute function public.update_feedback_updated_at();

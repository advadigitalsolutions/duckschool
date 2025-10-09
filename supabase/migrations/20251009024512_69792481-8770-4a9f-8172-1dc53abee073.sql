-- Extensions
create extension if not exists vector;
create extension if not exists pgcrypto;

-- ENUMS
create type role_t as enum ('student','parent','admin');
create type artifact_t as enum ('file','link','text');
create type item_t as enum ('lesson','quiz','project','video','reading');
create type status_t as enum ('draft','assigned','submitted','graded');
create type grader_t as enum ('ai','human','both');
create type prog_event_t as enum ('start','stop','focus','blur','heartbeat','click','question');

-- PROFILES TABLE
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role role_t not null default 'parent',
  name text,
  email text unique,
  timezone text default 'Europe/Madrid',
  locale text default 'en-US',
  created_at timestamptz default now()
);

-- STUDENTS TABLE
create table students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  parent_id uuid references profiles(id) on delete set null,
  name text not null,
  dob date,
  grade_level text,
  accommodations jsonb default '{}',
  goals jsonb default '{}',
  created_at timestamptz default now()
);

-- COURSES TABLE
create table courses (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  subject text not null,
  title text not null,
  description text,
  credits numeric default 1.0,
  grade_level text,
  standards_scope jsonb default '[]',
  created_at timestamptz default now()
);

-- STANDARDS TABLE
create table standards (
  id uuid primary key default gen_random_uuid(),
  framework text not null,
  code text not null unique,
  grade_band text,
  subject text,
  text text not null,
  tags text[],
  parent_code text,
  embedding vector(1536)
);

create index on standards using ivfflat (embedding vector_cosine_ops);

-- ARTIFACTS TABLE
create table artifacts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  uploader_id uuid references profiles(id) on delete set null,
  type artifact_t not null,
  storage_path text,
  url text,
  ocr_text text,
  meta jsonb default '{}',
  created_at timestamptz default now()
);

-- CURRICULUM ITEMS TABLE
create table curriculum_items (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  source_artifact_id uuid references artifacts(id) on delete set null,
  title text not null,
  type item_t not null,
  body jsonb not null,
  est_minutes int default 30,
  standards jsonb default '[]',
  created_at timestamptz default now()
);

-- ASSIGNMENTS TABLE
create table assignments (
  id uuid primary key default gen_random_uuid(),
  curriculum_item_id uuid references curriculum_items(id) on delete cascade,
  due_at timestamptz,
  status status_t not null default 'draft',
  weight numeric default 1.0,
  rubric jsonb,
  created_at timestamptz default now()
);

-- SUBMISSIONS TABLE
create table submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid references assignments(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  submitted_at timestamptz default now(),
  content jsonb,
  files jsonb,
  attempt_no int default 1,
  time_spent_seconds int default 0
);

-- GRADES TABLE
create table grades (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid references assignments(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  score numeric,
  max_score numeric default 100,
  rubric_scores jsonb,
  graded_at timestamptz default now(),
  grader grader_t not null default 'ai',
  notes text,
  needs_human boolean default false
);

-- PROGRESS EVENTS TABLE
create table progress_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  assignment_id uuid references assignments(id) on delete set null,
  event prog_event_t not null,
  ts timestamptz not null default now(),
  meta jsonb default '{}'
);

-- TRANSCRIPTS TABLE
create table transcripts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  term text,
  gpa numeric,
  issued_at timestamptz default now(),
  pdf_path text,
  meta jsonb default '{}'
);

-- ATTENDANCE LOGS TABLE
create table attendance_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  date date not null,
  minutes int default 0,
  notes text
);

create unique index on attendance_logs(student_id, date);

-- ACCOMMODATIONS TABLE
create table accommodations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  name text not null,
  description text,
  params jsonb default '{}',
  active boolean default true,
  created_at timestamptz default now()
);

-- AI RUNS TABLE
create table ai_runs (
  id uuid primary key default gen_random_uuid(),
  agent text,
  input_ref text,
  output_ref text,
  latency_ms int,
  success boolean default true,
  notes text,
  created_at timestamptz default now()
);

-- AUDIT LOGS TABLE
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor uuid references profiles(id),
  action text,
  entity text,
  entity_id uuid,
  ts timestamptz default now(),
  meta jsonb default '{}'
);

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table students enable row level security;
alter table courses enable row level security;
alter table artifacts enable row level security;
alter table curriculum_items enable row level security;
alter table assignments enable row level security;
alter table submissions enable row level security;
alter table grades enable row level security;
alter table progress_events enable row level security;
alter table transcripts enable row level security;
alter table attendance_logs enable row level security;
alter table accommodations enable row level security;
alter table ai_runs enable row level security;
alter table audit_logs enable row level security;
alter table standards enable row level security;

-- RLS POLICIES

-- Profiles: Users can view and update their own profile
create policy "Users can view own profile" on profiles
  for select using (id = auth.uid());

create policy "Users can update own profile" on profiles
  for update using (id = auth.uid());

-- Students: Parent owns student, student can view own
create policy "Parents can manage their students" on students
  for all using (parent_id = auth.uid());

create policy "Students can view own profile" on students
  for select using (user_id = auth.uid());

-- Courses: Accessible by parent or student
create policy "Courses accessible by parent or student" on courses
  for all using (
    exists(
      select 1 from students s 
      where s.id = courses.student_id 
      and (s.parent_id = auth.uid() or s.user_id = auth.uid())
    )
  );

-- Artifacts: Accessible by parent or student
create policy "Artifacts accessible by parent or student" on artifacts
  for all using (
    exists(
      select 1 from students s 
      where s.id = artifacts.student_id 
      and (s.parent_id = auth.uid() or s.user_id = auth.uid())
    )
  );

-- Curriculum Items: Accessible by parent or student
create policy "Curriculum items accessible by parent or student" on curriculum_items
  for all using (
    exists(
      select 1 from courses c 
      join students s on c.student_id = s.id 
      where c.id = curriculum_items.course_id 
      and (s.parent_id = auth.uid() or s.user_id = auth.uid())
    )
  );

-- Assignments: Accessible by parent or student
create policy "Assignments accessible by parent or student" on assignments
  for all using (
    exists(
      select 1 from curriculum_items ci 
      join courses c on ci.course_id = c.id 
      join students s on c.student_id = s.id 
      where assignments.curriculum_item_id = ci.id 
      and (s.parent_id = auth.uid() or s.user_id = auth.uid())
    )
  );

-- Submissions: Accessible by parent or student
create policy "Submissions accessible by parent or student" on submissions
  for all using (
    student_id in (
      select id from students 
      where parent_id = auth.uid() or user_id = auth.uid()
    )
  );

-- Grades: Read by parent or student, write by parent only
create policy "Grades readable by parent or student" on grades
  for select using (
    student_id in (
      select id from students 
      where parent_id = auth.uid() or user_id = auth.uid()
    )
  );

create policy "Grades writable by parent" on grades
  for insert with check (
    student_id in (
      select id from students 
      where parent_id = auth.uid()
    )
  );

create policy "Grades updatable by parent" on grades
  for update using (
    student_id in (
      select id from students 
      where parent_id = auth.uid()
    )
  );

-- Progress Events: Accessible by parent or student
create policy "Progress events accessible by parent or student" on progress_events
  for all using (
    student_id in (
      select id from students 
      where parent_id = auth.uid() or user_id = auth.uid()
    )
  );

-- Transcripts: Accessible by parent or student, writable by parent
create policy "Transcripts readable by parent or student" on transcripts
  for select using (
    student_id in (
      select id from students 
      where parent_id = auth.uid() or user_id = auth.uid()
    )
  );

create policy "Transcripts writable by parent" on transcripts
  for insert with check (
    student_id in (
      select id from students 
      where parent_id = auth.uid()
    )
  );

-- Attendance Logs: Accessible by parent or student, writable by parent
create policy "Attendance logs readable by parent or student" on attendance_logs
  for select using (
    student_id in (
      select id from students 
      where parent_id = auth.uid() or user_id = auth.uid()
    )
  );

create policy "Attendance logs writable by parent" on attendance_logs
  for insert with check (
    student_id in (
      select id from students 
      where parent_id = auth.uid()
    )
  );

-- Accommodations: Accessible by parent or student, writable by parent
create policy "Accommodations readable by parent or student" on accommodations
  for select using (
    student_id in (
      select id from students 
      where parent_id = auth.uid() or user_id = auth.uid()
    )
  );

create policy "Accommodations writable by parent" on accommodations
  for insert with check (
    student_id in (
      select id from students 
      where parent_id = auth.uid()
    )
  );

-- Standards: Publicly readable
create policy "Standards are publicly readable" on standards
  for select using (true);

-- AI Runs: Parent can view their student's AI runs
create policy "AI runs viewable by parent" on ai_runs
  for select using (true);

-- Audit Logs: Viewable by the actor
create policy "Audit logs viewable by actor" on audit_logs
  for select using (actor = auth.uid());

-- Trigger to auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::role_t, 'parent')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
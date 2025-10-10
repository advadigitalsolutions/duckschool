-- Enable pg_cron extension if not already enabled
create extension if not exists pg_cron;

-- Create app settings for storing Supabase URL and service role key
-- Note: These should be set via ALTER DATABASE SET commands by admin
-- Example: ALTER DATABASE postgres SET app.settings.supabase_url = 'https://your-project.supabase.co';
-- Example: ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key';

-- Schedule weekly curriculum generation to run every Sunday at 6 PM
-- This will invoke the generate_weekly_curriculum_cron edge function
SELECT cron.schedule(
  'generate-weekly-curriculum',
  '0 18 * * 0', -- 6 PM every Sunday (cron format: minute hour day month day-of-week)
  $$
  SELECT
    net.http_post(
        url:=current_setting('app.settings.supabase_url', true) || '/functions/v1/generate_weekly_curriculum_cron',
        headers:=jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body:='{}'::jsonb
    ) as request_id;
  $$
);

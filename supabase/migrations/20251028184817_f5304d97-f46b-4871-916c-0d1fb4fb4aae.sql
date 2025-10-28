-- Enable realtime for xp_events table so XP displays update instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.xp_events;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'vip_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.vip_members;
  END IF;
END;
$$;
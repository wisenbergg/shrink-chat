-- conversational-memory storage (JSONB embedding)
CREATE TABLE IF NOT EXISTS public.memory (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id     uuid NOT NULL,
  author_role   text CHECK (author_role IN ('user','engine')),
  message_id    uuid, 
  summary       text NOT NULL,
  embedding     jsonb,
  salience      smallint DEFAULT 50 CHECK (salience BETWEEN 0 AND 100),
  tags          text[] DEFAULT '{}',
  created_at    timestamptz DEFAULT now(),
  last_accessed timestamptz DEFAULT now()
);

-- index for quick retrieval
CREATE INDEX ON public.memory (thread_id, salience DESC);

-- open Row-Level Security for dev
ALTER TABLE public.memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dev open memory" ON public.memory
  FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS quiz_generation_drafts (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payload jsonb,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  title text NOT NULL DEFAULT 'Quiz in progress',
  category text NOT NULL DEFAULT 'Others/General',
  requested integer NOT NULL CHECK (requested BETWEEN 3 AND 20),
  status text NOT NULL CHECK (status IN ('running', 'paused', 'complete')),
  run_token varchar NOT NULL,
  lease_until timestamp NOT NULL,
  updated_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS quiz_generation_drafts_user_idx ON quiz_generation_drafts(user_id);

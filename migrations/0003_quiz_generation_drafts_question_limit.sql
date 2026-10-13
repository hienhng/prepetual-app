ALTER TABLE quiz_generation_drafts
  DROP CONSTRAINT IF EXISTS quiz_generation_drafts_requested_check,
  ADD CONSTRAINT quiz_generation_drafts_requested_check
    CHECK (requested BETWEEN 3 AND 40);

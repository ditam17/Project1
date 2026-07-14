-- Adds chapter grouping to existing questions without touching any data.
-- Existing rows get chapter = NULL, which the frontend will bucket under "General".
ALTER TABLE questions ADD COLUMN IF NOT EXISTS chapter VARCHAR(150);
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON questions(chapter);
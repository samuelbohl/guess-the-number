-- Migrate player_guess_feedback enum to host values: low | high | correct

BEGIN;

-- Create new enum with desired values
CREATE TYPE "public"."player_guess_feedback_new" AS ENUM ('low', 'high', 'correct');

-- Alter column to new enum, converting existing values
ALTER TABLE "public"."player_guesses"
  ALTER COLUMN "feedback" TYPE "public"."player_guess_feedback_new"
  USING (
    CASE feedback::text
      WHEN 'higher' THEN 'low'
      WHEN 'lower' THEN 'high'
      ELSE feedback::text
    END
  )::"public"."player_guess_feedback_new";

-- Drop old enum type
DROP TYPE "public"."player_guess_feedback";

-- Rename new enum to original name
ALTER TYPE "public"."player_guess_feedback_new" RENAME TO "player_guess_feedback";

COMMIT;
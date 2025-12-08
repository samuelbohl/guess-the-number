CREATE TYPE "public"."player_game_mode" AS ENUM('manual', 'bot');--> statement-breakpoint
CREATE TYPE "public"."player_game_status" AS ENUM('active', 'completed');--> statement-breakpoint
CREATE TYPE "public"."player_guess_feedback" AS ENUM('higher', 'lower', 'correct');--> statement-breakpoint
CREATE TABLE "player_games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" text NOT NULL,
	"mode" "player_game_mode" NOT NULL,
	"host_game_id" uuid NOT NULL,
	"algorithm" text,
	"status" "player_game_status" DEFAULT 'active' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"range_min" integer DEFAULT 1 NOT NULL,
	"range_max" integer DEFAULT 10000 NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp,
	"last_guess_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "player_guesses" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" uuid NOT NULL,
	"value" integer NOT NULL,
	"feedback" "player_guess_feedback" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "player_guesses" ADD CONSTRAINT "player_guesses_game_id_player_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."player_games"("id") ON DELETE cascade ON UPDATE no action;
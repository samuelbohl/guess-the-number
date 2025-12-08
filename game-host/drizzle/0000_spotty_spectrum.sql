CREATE TYPE "public"."game_status" AS ENUM('active', 'completed');--> statement-breakpoint
CREATE TYPE "public"."guess_result" AS ENUM('low', 'high', 'correct');--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" integer NOT NULL,
	"target_number" integer NOT NULL,
	"status" "game_status" DEFAULT 'active' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp,
	"last_guess_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "guesses" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" uuid NOT NULL,
	"player_id" integer NOT NULL,
	"value" integer NOT NULL,
	"result" "guess_result" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text NOT NULL,
	"idp" text,
	"email" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "players_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guesses" ADD CONSTRAINT "guesses_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guesses" ADD CONSTRAINT "guesses_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;
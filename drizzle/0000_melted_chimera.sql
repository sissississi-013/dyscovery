CREATE TYPE "public"."consent_type" AS ENUM('data_collection', 'ai_processing', 'third_party_share');--> statement-breakpoint
CREATE TYPE "public"."construct" AS ENUM('phonological_awareness', 'rapid_naming', 'phonological_working_memory', 'verbal_working_memory', 'sustained_attention', 'selective_attention', 'response_inhibition', 'processing_speed', 'decoding');--> statement-breakpoint
CREATE TYPE "public"."focus_area" AS ENUM('dyslexia', 'adhd', 'general');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('in_progress', 'completed', 'abandoned');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"action" text NOT NULL,
	"detail" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "child_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"avatar" text,
	"age_band" text NOT NULL,
	"focus_areas" "focus_area"[] DEFAULT '{}' NOT NULL,
	"accessibility_prefs" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid NOT NULL,
	"child_profile_id" uuid,
	"type" "consent_type" NOT NULL,
	"granted" boolean NOT NULL,
	"method" text,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "construct_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"construct" "construct" NOT NULL,
	"score" real NOT NULL,
	"confidence" real
);
--> statement-breakpoint
CREATE TABLE "game_blueprints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mechanic" text NOT NULL,
	"content_hash" text NOT NULL,
	"target_construct" "construct" NOT NULL,
	"difficulty" integer NOT NULL,
	"payload" jsonb NOT NULL,
	"validated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "game_blueprints_content_hash_unique" UNIQUE("content_hash")
);
--> statement-breakpoint
CREATE TABLE "game_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_profile_id" uuid NOT NULL,
	"blueprint_id" uuid,
	"mechanic" text NOT NULL,
	"target_construct" "construct" NOT NULL,
	"difficulty" integer NOT NULL,
	"score" integer,
	"accuracy" real,
	"construct_deltas" jsonb,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "parents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"auth_subject" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "parents_email_unique" UNIQUE("email"),
	CONSTRAINT "parents_auth_subject_unique" UNIQUE("auth_subject")
);
--> statement-breakpoint
CREATE TABLE "progress_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_profile_id" uuid NOT NULL,
	"taken_at" timestamp with time zone DEFAULT now() NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "screening_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"construct" "construct" NOT NULL,
	"task_type" text NOT NULL,
	"stimulus" jsonb,
	"response" jsonb,
	"correct" boolean,
	"latency_ms" integer,
	"order_index" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "screening_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_profile_id" uuid NOT NULL,
	"focus_area" "focus_area" NOT NULL,
	"status" "session_status" DEFAULT 'in_progress' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "skill_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_profile_id" uuid NOT NULL,
	"construct" "construct" NOT NULL,
	"estimate" real NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_parent_id_parents_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."parents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child_profiles" ADD CONSTRAINT "child_profiles_parent_id_parents_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."parents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_parent_id_parents_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."parents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "construct_scores" ADD CONSTRAINT "construct_scores_session_id_screening_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."screening_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_blueprint_id_game_blueprints_id_fk" FOREIGN KEY ("blueprint_id") REFERENCES "public"."game_blueprints"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_snapshots" ADD CONSTRAINT "progress_snapshots_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_responses" ADD CONSTRAINT "screening_responses_session_id_screening_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."screening_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_sessions" ADD CONSTRAINT "screening_sessions_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_states" ADD CONSTRAINT "skill_states_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "child_profiles_parent_idx" ON "child_profiles" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "consent_parent_idx" ON "consent_records" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "score_session_idx" ON "construct_scores" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "game_child_idx" ON "game_sessions" USING btree ("child_profile_id");--> statement-breakpoint
CREATE INDEX "snapshot_child_idx" ON "progress_snapshots" USING btree ("child_profile_id");--> statement-breakpoint
CREATE INDEX "response_session_idx" ON "screening_responses" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "screening_child_idx" ON "screening_sessions" USING btree ("child_profile_id");--> statement-breakpoint
CREATE INDEX "skill_child_idx" ON "skill_states" USING btree ("child_profile_id");
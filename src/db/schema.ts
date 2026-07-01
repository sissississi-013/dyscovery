import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  real,
  boolean,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ enums */

/** Cognitive constructs measured by screening and trained by games. */
export const constructEnum = pgEnum("construct", [
  "phonological_awareness",
  "rapid_naming",
  "phonological_working_memory",
  "verbal_working_memory",
  "sustained_attention",
  "selective_attention",
  "response_inhibition",
  "processing_speed",
  "decoding",
]);

export const focusAreaEnum = pgEnum("focus_area", [
  "dyslexia",
  "adhd",
  "general",
]);

/** COPPA: every category of processing tracks its own verifiable consent. */
export const consentTypeEnum = pgEnum("consent_type", [
  "data_collection", // integral to the service
  "ai_processing", // sending de-identified data to the LLM director/narration
  "third_party_share", // non-integral — separate consent required
]);

export const sessionStatusEnum = pgEnum("session_status", [
  "in_progress",
  "completed",
  "abandoned",
]);

/* --------------------------------------------------------------- accounts */

/** The consenting adult. Children never own an account (COPPA-by-design). */
export const parents = pgTable("parents", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  // Auth provider linkage (e.g. Auth.js / Clerk subject id); password handling
  // is delegated to the auth layer, never stored here.
  authSubject: text("auth_subject").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const childProfiles = pgTable(
  "child_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    parentId: uuid("parent_id")
      .notNull()
      .references(() => parents.id, { onDelete: "cascade" }),
    // Display name only — we avoid collecting a child's legal name.
    displayName: text("display_name").notNull(),
    avatar: text("avatar"),
    // Coarse age band rather than date of birth, to minimize PII.
    ageBand: text("age_band").notNull(), // e.g. "6-7", "8-9", "10-12"
    focusAreas: focusAreaEnum("focus_areas").array().notNull().default([]),
    accessibilityPrefs: jsonb("accessibility_prefs"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("child_profiles_parent_idx").on(t.parentId)],
);

/* ---------------------------------------------------------------- consent */

export const consentRecords = pgTable(
  "consent_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    parentId: uuid("parent_id")
      .notNull()
      .references(() => parents.id, { onDelete: "cascade" }),
    childProfileId: uuid("child_profile_id").references(() => childProfiles.id, {
      onDelete: "cascade",
    }),
    type: consentTypeEnum("type").notNull(),
    granted: boolean("granted").notNull(),
    // Verifiable-parental-consent method, e.g. "knowledge_based", "card_auth".
    method: text("method"),
    grantedAt: timestamp("granted_at", { withTimezone: true }).defaultNow().notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [index("consent_parent_idx").on(t.parentId)],
);

/* -------------------------------------------------------------- screening */

export const screeningSessions = pgTable(
  "screening_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    childProfileId: uuid("child_profile_id")
      .notNull()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    focusArea: focusAreaEnum("focus_area").notNull(),
    status: sessionStatusEnum("status").notNull().default("in_progress"),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [index("screening_child_idx").on(t.childProfileId)],
);

/** Raw, per-item responses. Scoring is deterministic; AI never scores. */
export const screeningResponses = pgTable(
  "screening_responses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => screeningSessions.id, { onDelete: "cascade" }),
    construct: constructEnum("construct").notNull(),
    taskType: text("task_type").notNull(),
    stimulus: jsonb("stimulus"),
    response: jsonb("response"),
    correct: boolean("correct"),
    latencyMs: integer("latency_ms"),
    orderIndex: integer("order_index").notNull(),
  },
  (t) => [index("response_session_idx").on(t.sessionId)],
);

/** The Reference Profile: one normalized score per construct per session. */
export const constructScores = pgTable(
  "construct_scores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => screeningSessions.id, { onDelete: "cascade" }),
    construct: constructEnum("construct").notNull(),
    score: real("score").notNull(), // 0-100 band
    confidence: real("confidence"), // 0-1
  },
  (t) => [index("score_session_idx").on(t.sessionId)],
);

/* ------------------------------------------------------------------ games */

/** Validated, reusable AI "Game Blueprint" (schema-governed, never raw code). */
export const gameBlueprints = pgTable("game_blueprints", {
  id: uuid("id").defaultRandom().primaryKey(),
  mechanic: text("mechanic").notNull(),
  // Stable hash of the blueprint payload for caching/reuse across children.
  contentHash: text("content_hash").notNull().unique(),
  targetConstruct: constructEnum("target_construct").notNull(),
  difficulty: integer("difficulty").notNull(),
  payload: jsonb("payload").notNull(),
  validatedAt: timestamp("validated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const gameSessions = pgTable(
  "game_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    childProfileId: uuid("child_profile_id")
      .notNull()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    blueprintId: uuid("blueprint_id").references(() => gameBlueprints.id, {
      onDelete: "set null",
    }),
    mechanic: text("mechanic").notNull(),
    targetConstruct: constructEnum("target_construct").notNull(),
    difficulty: integer("difficulty").notNull(),
    score: integer("score"),
    accuracy: real("accuracy"),
    // Per-construct deltas estimated from this session.
    constructDeltas: jsonb("construct_deltas"),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
  },
  (t) => [index("game_child_idx").on(t.childProfileId)],
);

/** Live, current best estimate per construct — drives adaptive difficulty. */
export const skillStates = pgTable(
  "skill_states",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    childProfileId: uuid("child_profile_id")
      .notNull()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    construct: constructEnum("construct").notNull(),
    estimate: real("estimate").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("skill_child_idx").on(t.childProfileId)],
);

/** Periodic rollups powering the caregiver trend charts on the Grow page. */
export const progressSnapshots = pgTable(
  "progress_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    childProfileId: uuid("child_profile_id")
      .notNull()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    takenAt: timestamp("taken_at", { withTimezone: true }).defaultNow().notNull(),
    payload: jsonb("payload").notNull(),
  },
  (t) => [index("snapshot_child_idx").on(t.childProfileId)],
);

/* ------------------------------------------------------------- audit log */

export const auditLog = pgTable("audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  parentId: uuid("parent_id").references(() => parents.id, {
    onDelete: "set null",
  }),
  action: text("action").notNull(), // e.g. "data_export", "data_delete", "consent_grant"
  detail: jsonb("detail"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

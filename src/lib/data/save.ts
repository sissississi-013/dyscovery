import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  screeningSessions,
  screeningResponses,
  constructScores,
  skillStates,
  progressSnapshots,
  gameSessions,
} from "@/db/schema";
import { Construct, FocusArea } from "@/lib/games/types";
import { MechanicId } from "@/lib/games/blueprint";

type ScoreInput = { construct: Construct; score: number; confidence: number };
type ResponseInput = {
  construct: Construct;
  taskType: string;
  stimulus?: unknown;
  response?: unknown;
  correct?: boolean;
  latencyMs?: number;
};

/** Set a construct's live skill estimate to an absolute value (screening). */
async function setSkill(childProfileId: string, construct: Construct, estimate: number) {
  const existing = await db
    .select({ id: skillStates.id })
    .from(skillStates)
    .where(
      and(
        eq(skillStates.childProfileId, childProfileId),
        eq(skillStates.construct, construct),
      ),
    )
    .limit(1);
  if (existing[0]) {
    await db
      .update(skillStates)
      .set({ estimate, updatedAt: new Date() })
      .where(eq(skillStates.id, existing[0].id));
  } else {
    await db.insert(skillStates).values({ childProfileId, construct, estimate });
  }
}

/** Nudge a construct estimate toward a new observation (gameplay). */
async function nudgeSkill(
  childProfileId: string,
  construct: Construct,
  observed: number,
  rate = 0.25,
) {
  const existing = await db
    .select({ id: skillStates.id, estimate: skillStates.estimate })
    .from(skillStates)
    .where(
      and(
        eq(skillStates.childProfileId, childProfileId),
        eq(skillStates.construct, construct),
      ),
    )
    .limit(1);
  if (existing[0]) {
    const next = existing[0].estimate + rate * (observed - existing[0].estimate);
    await db
      .update(skillStates)
      .set({ estimate: next, updatedAt: new Date() })
      .where(eq(skillStates.id, existing[0].id));
  } else {
    await db.insert(skillStates).values({ childProfileId, construct, estimate: observed });
  }
}

export async function persistScreening(args: {
  childProfileId: string;
  focusArea: FocusArea;
  responses: ResponseInput[];
  scores: ScoreInput[];
}): Promise<string> {
  const [session] = await db
    .insert(screeningSessions)
    .values({
      childProfileId: args.childProfileId,
      focusArea: args.focusArea,
      status: "completed",
      completedAt: new Date(),
    })
    .returning();

  if (args.responses.length) {
    await db.insert(screeningResponses).values(
      args.responses.map((r, i) => ({
        sessionId: session.id,
        construct: r.construct,
        taskType: r.taskType,
        stimulus: r.stimulus ?? null,
        response: r.response ?? null,
        correct: r.correct ?? null,
        latencyMs: r.latencyMs ?? null,
        orderIndex: i,
      })),
    );
  }

  if (args.scores.length) {
    await db.insert(constructScores).values(
      args.scores.map((s) => ({
        sessionId: session.id,
        construct: s.construct,
        score: s.score,
        confidence: s.confidence,
      })),
    );
    for (const s of args.scores) {
      await setSkill(args.childProfileId, s.construct, s.score);
    }
  }

  await db.insert(progressSnapshots).values({
    childProfileId: args.childProfileId,
    payload: { kind: "screening", sessionId: session.id, scores: args.scores },
  });

  return session.id;
}

export async function persistGame(args: {
  childProfileId: string;
  mechanic: MechanicId;
  targetConstruct: Construct;
  difficulty: number;
  score: number;
  accuracy: number;
}): Promise<string> {
  const [gs] = await db
    .insert(gameSessions)
    .values({
      childProfileId: args.childProfileId,
      mechanic: args.mechanic,
      targetConstruct: args.targetConstruct,
      difficulty: args.difficulty,
      score: args.score,
      accuracy: args.accuracy,
      constructDeltas: { [args.targetConstruct]: args.accuracy * 100 },
      endedAt: new Date(),
    })
    .returning();

  await nudgeSkill(args.childProfileId, args.targetConstruct, args.accuracy * 100);

  await db.insert(progressSnapshots).values({
    childProfileId: args.childProfileId,
    payload: {
      kind: "game",
      mechanic: args.mechanic,
      targetConstruct: args.targetConstruct,
      score: args.score,
      accuracy: args.accuracy,
    },
  });

  return gs.id;
}

/** Suggest a 1-5 difficulty for a construct from the live skill estimate. */
export async function suggestedDifficulty(
  childProfileId: string,
  construct: Construct,
): Promise<number> {
  const rows = await db
    .select({ estimate: skillStates.estimate })
    .from(skillStates)
    .where(
      and(
        eq(skillStates.childProfileId, childProfileId),
        eq(skillStates.construct, construct),
      ),
    )
    .limit(1);
  if (!rows[0]) return 2;
  // Map a 0-100 estimate to difficulty 1-5.
  return Math.min(5, Math.max(1, Math.round(1 + (rows[0].estimate / 100) * 4)));
}

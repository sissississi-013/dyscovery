import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  gameSessions,
  screeningSessions,
  constructScores,
  skillStates,
} from "@/db/schema";
import { Construct } from "@/lib/games/types";

export type GrowData = {
  gameCount: number;
  screeningCount: number;
  lastPlayed: Date | null;
  dayStreak: number;
  skills: { construct: Construct; estimate: number; updatedAt: Date }[];
  recentGames: {
    mechanic: string;
    targetConstruct: Construct;
    score: number | null;
    accuracy: number | null;
    startedAt: Date;
  }[];
  screenings: {
    sessionId: string;
    completedAt: Date | null;
    focusArea: string;
    scores: { construct: Construct; score: number }[];
  }[];
};

function computeStreak(days: Date[]): number {
  if (days.length === 0) return 0;
  const dayKeys = new Set(
    days.map((d) => new Date(d).toISOString().slice(0, 10)),
  );
  let streak = 0;
  const cursor = new Date();
  // Allow the streak to count today or yesterday as the anchor.
  const todayKey = cursor.toISOString().slice(0, 10);
  if (!dayKeys.has(todayKey)) cursor.setDate(cursor.getDate() - 1);
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (dayKeys.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else break;
  }
  return streak;
}

export async function getGrowData(childProfileId: string): Promise<GrowData> {
  const [gameCountRow] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(gameSessions)
    .where(eq(gameSessions.childProfileId, childProfileId));

  const [screeningCountRow] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(screeningSessions)
    .where(eq(screeningSessions.childProfileId, childProfileId));

  const skills = await db
    .select({
      construct: skillStates.construct,
      estimate: skillStates.estimate,
      updatedAt: skillStates.updatedAt,
    })
    .from(skillStates)
    .where(eq(skillStates.childProfileId, childProfileId))
    .orderBy(desc(skillStates.estimate));

  const recentGames = await db
    .select({
      mechanic: gameSessions.mechanic,
      targetConstruct: gameSessions.targetConstruct,
      score: gameSessions.score,
      accuracy: gameSessions.accuracy,
      startedAt: gameSessions.startedAt,
    })
    .from(gameSessions)
    .where(eq(gameSessions.childProfileId, childProfileId))
    .orderBy(desc(gameSessions.startedAt))
    .limit(10);

  const playDays = await db
    .select({ startedAt: gameSessions.startedAt })
    .from(gameSessions)
    .where(eq(gameSessions.childProfileId, childProfileId))
    .orderBy(desc(gameSessions.startedAt))
    .limit(120);

  const sessions = await db
    .select({
      id: screeningSessions.id,
      completedAt: screeningSessions.completedAt,
      focusArea: screeningSessions.focusArea,
    })
    .from(screeningSessions)
    .where(
      and(
        eq(screeningSessions.childProfileId, childProfileId),
        eq(screeningSessions.status, "completed"),
      ),
    )
    .orderBy(desc(screeningSessions.completedAt))
    .limit(8);

  const screenings = [];
  for (const s of sessions) {
    const scores = await db
      .select({ construct: constructScores.construct, score: constructScores.score })
      .from(constructScores)
      .where(eq(constructScores.sessionId, s.id));
    screenings.push({
      sessionId: s.id,
      completedAt: s.completedAt,
      focusArea: s.focusArea,
      scores,
    });
  }

  return {
    gameCount: gameCountRow?.c ?? 0,
    screeningCount: screeningCountRow?.c ?? 0,
    lastPlayed: recentGames[0]?.startedAt ?? null,
    dayStreak: computeStreak(playDays.map((p) => p.startedAt)),
    skills: skills as GrowData["skills"],
    recentGames: recentGames as GrowData["recentGames"],
    screenings: screenings as GrowData["screenings"],
  };
}

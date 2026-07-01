"use server";

import { getActiveProfile } from "@/lib/profile/actions";
import { persistScreening, persistGame, suggestedDifficulty } from "./save";
import { Construct, FocusArea } from "@/lib/games/types";
import { MechanicId } from "@/lib/games/blueprint";

export async function recordGameResult(input: {
  mechanic: MechanicId;
  targetConstruct: Construct;
  difficulty: number;
  score: number;
  accuracy: number;
}): Promise<{ saved: boolean }> {
  const profile = await getActiveProfile();
  if (!profile) return { saved: false };
  await persistGame({ childProfileId: profile.id, ...input });
  return { saved: true };
}

export async function submitScreening(input: {
  focusArea: FocusArea;
  responses: {
    construct: Construct;
    taskType: string;
    stimulus?: unknown;
    response?: unknown;
    correct?: boolean;
    latencyMs?: number;
  }[];
  scores: { construct: Construct; score: number; confidence: number }[];
}): Promise<{ saved: boolean; sessionId?: string }> {
  const profile = await getActiveProfile();
  if (!profile) return { saved: false };
  const sessionId = await persistScreening({
    childProfileId: profile.id,
    focusArea: input.focusArea,
    responses: input.responses,
    scores: input.scores,
  });
  return { saved: true, sessionId };
}

export async function getSuggestedDifficulty(
  construct: Construct,
): Promise<number> {
  const profile = await getActiveProfile();
  if (!profile) return 2;
  return suggestedDifficulty(profile.id, construct);
}

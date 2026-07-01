"use server";

import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  parents,
  childProfiles,
  consentRecords,
  auditLog,
} from "@/db/schema";
import { AgeBand, FocusArea } from "@/lib/games/types";
import {
  readProfileCookie,
  setProfileCookie,
  clearProfileCookie,
} from "./cookie";
import type { ActiveProfile, CreateProfileInput } from "./types";

async function ensureParent(parentEmail?: string): Promise<string> {
  const existing = await readProfileCookie();
  if (existing?.parentId) {
    const rows = await db
      .select({ id: parents.id })
      .from(parents)
      .where(eq(parents.id, existing.parentId))
      .limit(1);
    if (rows[0]) return rows[0].id;
  }
  const email = parentEmail?.trim() || `guardian-${randomUUID()}@local.dyscovery`;
  const [created] = await db
    .insert(parents)
    .values({ email })
    .returning({ id: parents.id });
  return created.id;
}

export async function createProfile(
  input: CreateProfileInput,
): Promise<ActiveProfile> {
  if (!input.consent) {
    throw new Error("Parental consent is required to create a profile.");
  }
  const displayName = input.displayName.trim().slice(0, 40) || "Explorer";
  const parentId = await ensureParent(input.parentEmail);

  const [profile] = await db
    .insert(childProfiles)
    .values({
      parentId,
      displayName,
      ageBand: input.ageBand,
      focusAreas: input.focusAreas,
    })
    .returning();

  // Record COPPA-style consent (data collection + AI processing).
  await db.insert(consentRecords).values([
    {
      parentId,
      childProfileId: profile.id,
      type: "data_collection",
      granted: true,
      method: "parent_attested",
    },
    {
      parentId,
      childProfileId: profile.id,
      type: "ai_processing",
      granted: true,
      method: "parent_attested",
    },
  ]);

  await db.insert(auditLog).values({
    parentId,
    action: "profile_create",
    detail: { childProfileId: profile.id },
  });

  await setProfileCookie({ parentId, childProfileId: profile.id });

  return {
    id: profile.id,
    displayName: profile.displayName,
    ageBand: profile.ageBand as AgeBand,
    avatar: profile.avatar,
    focusAreas: profile.focusAreas as FocusArea[],
  };
}

export async function getActiveProfile(): Promise<ActiveProfile | null> {
  const cookie = await readProfileCookie();
  if (!cookie) return null;
  const rows = await db
    .select()
    .from(childProfiles)
    .where(
      and(
        eq(childProfiles.id, cookie.childProfileId),
        eq(childProfiles.parentId, cookie.parentId),
      ),
    )
    .limit(1);
  const p = rows[0];
  if (!p) return null;
  return {
    id: p.id,
    displayName: p.displayName,
    ageBand: p.ageBand as AgeBand,
    avatar: p.avatar,
    focusAreas: p.focusAreas as FocusArea[],
  };
}

export async function listProfiles(): Promise<ActiveProfile[]> {
  const cookie = await readProfileCookie();
  if (!cookie) return [];
  const rows = await db
    .select()
    .from(childProfiles)
    .where(eq(childProfiles.parentId, cookie.parentId))
    .orderBy(desc(childProfiles.createdAt));
  return rows.map((p) => ({
    id: p.id,
    displayName: p.displayName,
    ageBand: p.ageBand as AgeBand,
    avatar: p.avatar,
    focusAreas: p.focusAreas as FocusArea[],
  }));
}

export async function switchProfile(childProfileId: string): Promise<void> {
  const cookie = await readProfileCookie();
  if (!cookie) throw new Error("No active family session.");
  const rows = await db
    .select({ id: childProfiles.id })
    .from(childProfiles)
    .where(
      and(
        eq(childProfiles.id, childProfileId),
        eq(childProfiles.parentId, cookie.parentId),
      ),
    )
    .limit(1);
  if (!rows[0]) throw new Error("Profile not found.");
  await setProfileCookie({ parentId: cookie.parentId, childProfileId });
}

export async function deleteActiveProfile(): Promise<void> {
  const cookie = await readProfileCookie();
  if (!cookie) return;
  await db
    .delete(childProfiles)
    .where(
      and(
        eq(childProfiles.id, cookie.childProfileId),
        eq(childProfiles.parentId, cookie.parentId),
      ),
    );
  await db.insert(auditLog).values({
    parentId: cookie.parentId,
    action: "profile_delete",
    detail: { childProfileId: cookie.childProfileId },
  });

  const remaining = await db
    .select({ id: childProfiles.id })
    .from(childProfiles)
    .where(eq(childProfiles.parentId, cookie.parentId))
    .limit(1);
  if (remaining[0]) {
    await setProfileCookie({
      parentId: cookie.parentId,
      childProfileId: remaining[0].id,
    });
  } else {
    await clearProfileCookie();
  }
}

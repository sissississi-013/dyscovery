import { NextResponse } from "next/server";
import { z } from "zod";
import { generateBlueprint } from "@/lib/games/director";
import { MECHANIC_IDS } from "@/lib/games/blueprint";
import { CONSTRUCTS, AGE_BANDS } from "@/lib/games/types";

export const runtime = "nodejs";

const requestSchema = z.object({
  mechanic: z.enum(MECHANIC_IDS),
  targetConstruct: z.enum(CONSTRUCTS),
  difficulty: z.number().int().min(1).max(5).default(2),
  ageBand: z.enum(AGE_BANDS).default("8-9"),
  themeHint: z.string().max(40).optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const result = await generateBlueprint(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/games/generate] failed:", err);
    return NextResponse.json(
      { error: "Could not generate a game right now." },
      { status: 500 },
    );
  }
}

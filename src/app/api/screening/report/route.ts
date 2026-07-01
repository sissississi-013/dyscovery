import { NextResponse } from "next/server";
import { z } from "zod";
import { generateReport } from "@/lib/ai/report";
import { CONSTRUCTS, FOCUS_AREAS, AGE_BANDS } from "@/lib/games/types";

export const runtime = "nodejs";

const requestSchema = z.object({
  ageBand: z.enum(AGE_BANDS),
  focusArea: z.enum(FOCUS_AREAS),
  scores: z
    .array(
      z.object({
        construct: z.enum(CONSTRUCTS),
        score: z.number().min(0).max(100),
      }),
    )
    .min(1)
    .max(9),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    const result = await generateReport(
      parsed.data.scores,
      parsed.data.ageBand,
      parsed.data.focusArea,
    );
    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/screening/report] failed:", err);
    return NextResponse.json({ error: "Could not build report." }, { status: 500 });
  }
}

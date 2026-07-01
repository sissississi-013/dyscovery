import "server-only";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

/**
 * Thin wrapper around the Google Gen AI SDK (Gemini) for schema-constrained
 * structured generation. The model is forced to return JSON matching a schema;
 * we then re-validate with Zod before trusting it.
 */

export function getGoogleApiKey(): string {
  return process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY ?? "";
}

export function hasGoogleAI(): boolean {
  return getGoogleApiKey().length > 0;
}

export const DEFAULT_MODEL = process.env.LLM_MODEL || "gemini-2.5-flash";

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!client) client = new GoogleGenAI({ apiKey: getGoogleApiKey() });
  return client;
}

/**
 * Gemini's structured-output mode supports a subset of JSON Schema. Strip only
 * the keywords that can trigger 400s. We intentionally KEEP min/maxLength and
 * min/maxItems so the model respects size limits (otherwise Zod rejects valid-
 * looking but over-long output). Zod still enforces the full contract after.
 */
const STRIP_KEYS = new Set([
  "$schema",
  "additionalProperties",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "pattern",
  "format",
  "default",
]);

function sanitize(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(sanitize);
  if (node && typeof node === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (STRIP_KEYS.has(k)) continue;
      out[k] = sanitize(v);
    }
    return out;
  }
  return node;
}

export async function generateStructured<T>(
  schema: z.ZodType<T>,
  opts: { prompt: string; system?: string; model?: string; temperature?: number },
): Promise<T> {
  const jsonSchema = sanitize(z.toJSONSchema(schema));
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: opts.model ?? DEFAULT_MODEL,
    contents: opts.prompt,
    config: {
      systemInstruction: opts.system,
      responseMimeType: "application/json",
      responseJsonSchema: jsonSchema,
      temperature: opts.temperature ?? 0.9,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Gemini returned an empty response");

  const parsed: unknown = JSON.parse(text);
  return schema.parse(parsed); // throws on contract violation -> caller retries
}

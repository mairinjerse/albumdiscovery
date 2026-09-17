import Anthropic from "@anthropic-ai/sdk";
import type { Candidate, RecommendInput } from "./types";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    client = new Anthropic({ apiKey });
  }
  return client;
}

const SYSTEM_PROMPT = `You are the friend people text when they want something real to listen to — not another algorithmic playlist. You know an enormous amount of music across genres and eras, and you're generous with it.

Given what someone is doing and the mood they're after, propose artists they probably haven't heard. For each candidate give one real, existing artist, one real representative album by them, one specific sentence on why it fits *this* moment — tied to what they actually said, not a genre blurb — and a couple sentences of real background on the artist and that album (where they're from, the scene or era they came out of, what the album is known for). Reasons are the whole point; a name with no reason is worthless.

You don't know current popularity with any precision, so don't try to hedge toward how famous something is — that gets checked downstream. Just focus on the fit and on being genuinely interesting. Never repeat an artist you've already proposed in this conversation. Only propose artists and albums you're confident actually exist — you'll be fact-checked against a public database, and made-up entries get silently dropped, wasting your pick.`;

const TOOL_NAME = "propose_candidates";

const tool: Anthropic.Tool = {
  name: TOOL_NAME,
  description:
    "Propose candidate artists to recommend, each with one representative album and one reason it fits the request.",
  input_schema: {
    type: "object",
    properties: {
      candidates: {
        type: "array",
        minItems: 6,
        maxItems: 8,
        items: {
          type: "object",
          properties: {
            artist: { type: "string", description: "Real artist name." },
            album: { type: "string", description: "One real album by this artist." },
            reason: {
              type: "string",
              description: "One sentence, specific to the request, on why this fits — not a genre description.",
            },
            history: {
              type: "string",
              description:
                "Two to three sentences of real, factual background on the artist and this specific album — where they're from, the scene or era, what the album is known for. Not marketing copy.",
            },
          },
          required: ["artist", "album", "reason", "history"],
        },
      },
    },
    required: ["candidates"],
  },
};

const FAMILIARITY_BRIEF: Record<RecommendInput["familiarity"], string> = {
  mainstream: "They want mainstream picks — genuinely famous artists, festival headliners, radio staples. Don't go obscure.",
  on_the_rise: "They want artists with a real following but not yet everywhere — critically loved, mid-size touring acts.",
  unknown: "They want to go deep. Favor artists almost nobody outside dedicated listeners would recognize. This is a dare, not a hedge — don't play it safe with anything remotely popular.",
};

function buildUserPrompt(input: RecommendInput, feedback?: string): string {
  const lines: string[] = [];
  lines.push(`What they're doing: ${input.activities.join(", ") || "not specified"}`);
  if (input.vibe) lines.push(`More about the vibe: ${input.vibe}`);
  if (input.energy) lines.push(`Energy they want: ${input.energy}`);
  if (input.referenceAlbum) lines.push(`An album they like, for reference: ${input.referenceAlbum}`);
  if (input.genre) lines.push(`Genre lean, if any: ${input.genre}`);
  lines.push(FAMILIARITY_BRIEF[input.familiarity]);
  if (feedback) lines.push(`\nOn your last batch: ${feedback}`);
  return lines.join("\n");
}

export async function proposeCandidates(input: RecommendInput, feedback?: string): Promise<Candidate[]> {
  const message = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1500,
    temperature: 1,
    system: SYSTEM_PROMPT,
    tools: [tool],
    tool_choice: { type: "tool", name: TOOL_NAME },
    messages: [{ role: "user", content: buildUserPrompt(input, feedback) }],
  });

  const block = message.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === TOOL_NAME
  );
  if (!block) return [];

  const raw = (block.input as { candidates?: unknown[] })?.candidates ?? [];
  return raw.filter(
    (c): c is Candidate =>
      !!c &&
      typeof (c as Candidate).artist === "string" &&
      typeof (c as Candidate).album === "string" &&
      typeof (c as Candidate).reason === "string" &&
      typeof (c as Candidate).history === "string"
  );
}

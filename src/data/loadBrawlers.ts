import raw from "./brawlers.tagged.json";
import type { RawTaggedBrawler, TaggedBrawler, RawBrawlerTags } from "./types";

const KEY_RENAMES: Record<string, string> = {
  rangeBucket: "range",
  damageProfile: "damage",
  controlScore: "control",
  sustainScore: "sustain",
  gemCarrierSuitability: "gem",
  antiTank: "anti_tank",
  antiAssassin: "anti_assassin",
};

function flattenTags(tagObj: RawBrawlerTags): string[] {
  const out: string[] = [];

  for (const [key, val] of Object.entries(tagObj)) {
    if (val === null || val === undefined) continue;

    const k = (KEY_RENAMES[key] ?? key).toLowerCase();
    const v = String(val).toLowerCase();

    out.push(`${k}:${v}`);

    // bonus “capability” tags for booleans
    if (val === true) out.push(`has:${k}`);
  }

  return out;
}

const rawBrawlers = raw.brawlers as RawTaggedBrawler[];

export const BRAWLERS: TaggedBrawler[] = rawBrawlers.map((b) => ({
  ...b,
  tagObj: b.tags,
  tags: flattenTags(b.tags),
}));

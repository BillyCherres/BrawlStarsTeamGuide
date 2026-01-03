import type { TaggedBrawler } from "../data/types";
import { toTagSet, getTagValue, getTagNumber, hasTag } from "./tagParse";

export type TeamFeatures = {
  rangeCounts: { short: number; mid: number; long: number };
  mobilityCounts: { low: number; med: number; high: number };
  damageCounts: { burst: number; sustained: number; poke: number };
  tankinessCounts: { low: number; med: number; high: number };

  avgControl: number;   // from control:#
  avgSustain: number;   // from sustain:#

  antiTank: { low: number; med: number; high: number };
  antiAssassin: { low: number; med: number; high: number };

  hasWallbreak: boolean;
  hasVision: boolean;
  hasAreaDamage: boolean;

  gemSuit: { low: number; med: number; high: number };

  // debugging / UI
  teamTagSet: Set<string>;
};

function bucket3(v: string | null): "low" | "med" | "high" | null {
  if (!v) return null;
  if (v === "low") return "low";
  if (v === "med" || v === "medium") return "med";
  if (v === "high") return "high";
  return null;
}

function rangeBucket(v: string | null): "short" | "mid" | "long" | null {
  if (!v) return null;
  if (v === "short") return "short";
  if (v === "mid" || v === "medium") return "mid";
  if (v === "long") return "long";
  return null;
}

export function computeTeamFeatures(team: TaggedBrawler[]): TeamFeatures {
  const rangeCounts = { short: 0, mid: 0, long: 0 };
  const mobilityCounts = { low: 0, med: 0, high: 0 };
  const damageCounts = { burst: 0, sustained: 0, poke: 0 };
  const tankinessCounts = { low: 0, med: 0, high: 0 };

  const antiTank = { low: 0, med: 0, high: 0 };
  const antiAssassin = { low: 0, med: 0, high: 0 };
  const gemSuit = { low: 0, med: 0, high: 0 };

  let controlSum = 0;
  let controlN = 0;
  let sustainSum = 0;
  let sustainN = 0;

  let hasWallbreak = false;
  let hasVision = false;
  let hasAreaDamage = false;

  const teamTagSet = new Set<string>();

  for (const b of team) {
    const set = toTagSet(b.tags);
    for (const t of set) teamTagSet.add(t);

    const r = rangeBucket(getTagValue(set, "range"));
    if (r) rangeCounts[r]++;

    const mob = bucket3(getTagValue(set, "mobility"));
    if (mob) mobilityCounts[mob]++;

    const dmg = getTagValue(set, "damage");
    if (dmg === "burst" || dmg === "sustained" || dmg === "poke") damageCounts[dmg]++;

    const tank = bucket3(getTagValue(set, "tankiness"));
    if (tank) tankinessCounts[tank]++;

    const c = getTagNumber(set, "control");
    if (c != null) { controlSum += c; controlN++; }

    const s = getTagNumber(set, "sustain");
    if (s != null) { sustainSum += s; sustainN++; }

    const at = bucket3(getTagValue(set, "anti_tank"));
    if (at) antiTank[at]++;

    const aa = bucket3(getTagValue(set, "anti_assassin"));
    if (aa) antiAssassin[aa]++;

    const gem = bucket3(getTagValue(set, "gem"));
    if (gem) gemSuit[gem]++;

    // booleans: we add has:key tags in your flattener when true
    if (hasTag(set, "has:wallbreak")) hasWallbreak = true;
    if (hasTag(set, "has:vision")) hasVision = true;
    if (hasTag(set, "has:areadamage")) hasAreaDamage = true;
  }

  return {
    rangeCounts,
    mobilityCounts,
    damageCounts,
    tankinessCounts,
    avgControl: controlN ? controlSum / controlN : 0,
    avgSustain: sustainN ? sustainSum / sustainN : 0,
    antiTank,
    antiAssassin,
    hasWallbreak,
    hasVision,
    hasAreaDamage,
    gemSuit,
    teamTagSet,
  };
}

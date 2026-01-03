import type { TaggedBrawler, TaggedMap } from "../data/types";
import { toTagSet, getTagValue, hasTag } from "./tagParse";
import { computeTeamFeatures } from "./teamFeatures";

export type SynergyResult = {
  score: number; // 0..100
  reasons: string[];
  strengths: string[];
  weaknesses: string[];
};

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

function pushOnce(arr: string[], s: string) {
  if (!arr.includes(s)) arr.push(s);
}

function modeFromMap(map: TaggedMap): string | null {
  const mapSet = toTagSet(map.tags);
  return getTagValue(mapSet, "mode");
}

// Helper for "more extreme" scoring:
// - Start at 0
// - Add big points for meeting important criteria
// - Subtract big points for failing important criteria
// - Then hard clamp 0..100
type RuleCtx = {
  f: ReturnType<typeof computeTeamFeatures>;
  mode: string | null;
  mapSet: Set<string>;
  strengths: string[];
  weaknesses: string[];
};

function add(points: number, msg: string, ctx: RuleCtx) {
  if (points <= 0) return;
  pushOnce(ctx.strengths, msg);
  return points;
}

function sub(points: number, msg: string, ctx: RuleCtx) {
  if (points <= 0) return;
  pushOnce(ctx.weaknesses, msg);
  return -points;
}

export function scoreTeamOnMap(team: TaggedBrawler[], map: TaggedMap): SynergyResult {
  const f = computeTeamFeatures(team);
  const mapSet = toTagSet(map.tags);
  const mode = modeFromMap(map);

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  const ctx: RuleCtx = { f, mode, mapSet, strengths, weaknesses };

  let score = 0;

  // =========================
  // GLOBAL CORE (max ~70)
  // =========================

  // Range diversity (huge in almost all modes)
  const rangeBuckets =
    (f.rangeCounts.short > 0 ? 1 : 0) +
    (f.rangeCounts.mid > 0 ? 1 : 0) +
    (f.rangeCounts.long > 0 ? 1 : 0);

  if (rangeBuckets === 3) score += add(18, "Excellent range diversity (short + mid + long)", ctx) ?? 0;
  else if (rangeBuckets === 2) score += add(12, "Good range diversity", ctx) ?? 0;
  else score += sub(16, "Low range diversity (team is one-dimensional)", ctx) ?? 0;

  // Control (scaled)
  if (f.avgControl >= 2.2) score += add(16, "High crowd control presence", ctx) ?? 0;
  else if (f.avgControl >= 1.5) score += add(10, "Solid crowd control presence", ctx) ?? 0;
  else if (f.avgControl <= 0.8) score += sub(12, "Low crowd control", ctx) ?? 0;

  // Sustain (scaled)
  if (f.avgSustain >= 1.8) score += add(12, "Great sustain (healing/shields/regen)", ctx) ?? 0;
  else if (f.avgSustain >= 1.2) score += add(7, "Good sustain", ctx) ?? 0;
  else if (f.avgSustain <= 0.5) score += sub(8, "Low sustain (can get chipped out)", ctx) ?? 0;

  // Anti-tank coverage (big)
  if (f.antiTank.high >= 1) score += add(14, "Has at least one strong anti-tank option", ctx) ?? 0;
  else if (f.antiTank.med >= 2) score += add(8, "Decent anti-tank coverage", ctx) ?? 0;
  else if (f.antiTank.low >= 2) score += sub(18, "Struggles into tanks", ctx) ?? 0;

  // Anti-assassin / dive defense
  // If you have high control OR explicit anti-assassin, count it
  const assassinDefenseGood = f.antiAssassin.high >= 1 || f.avgControl >= 2.0;
  if (assassinDefenseGood) score += add(12, "Good defense into assassins / dives", ctx) ?? 0;
  else if (f.antiAssassin.low >= 2) score += sub(16, "Weak into assassins / dives", ctx) ?? 0;

  // Utility (moderate)
  if (f.hasWallbreak) score += add(8, "Has wallbreak utility", ctx) ?? 0;
  if (f.hasVision) score += add(6, "Has vision / bush-check utility", ctx) ?? 0;
  if (f.hasAreaDamage) score += add(8, "Has area damage (good vs grouped teams)", ctx) ?? 0;

  // =========================
  // MODE BONUSES (max ~35)
  // =========================

  if (mode === "bounty" || mode === "knockout" || mode === "wipeout") {
    // Elim modes heavily reward long range + pick potential
    if (f.rangeCounts.long >= 1) score += add(16, "Long range helps in elimination modes", ctx) ?? 0;
    else score += sub(18, "No long range (tough to take safe fights)", ctx) ?? 0;

    if (f.damageCounts.poke >= 1 || f.damageCounts.burst >= 1) score += add(12, "Has pick potential (poke/burst)", ctx) ?? 0;
    else score += sub(10, "Low pick potential (hard to secure kills)", ctx) ?? 0;

    // risky comp penalty
    if (f.mobilityCounts.high >= 2 && f.tankinessCounts.low >= 2) score += sub(10, "Risky comp (squishy + dive-heavy)", ctx) ?? 0;
  }

  if (mode === "gem grab") {
    // Must-have: a gem carrier
    if (f.gemSuit.high >= 1) score += add(18, "Has a strong gem carrier", ctx) ?? 0;
    else if (f.gemSuit.med >= 1) score += add(10, "Has a workable gem carrier", ctx) ?? 0;
    else score += sub(18, "No reliable gem carrier", ctx) ?? 0;

    // Control matters a lot for mid
    if (f.avgControl >= 1.8) score += add(14, "Strong control for holding mid", ctx) ?? 0;
    else if (f.avgControl >= 1.3) score += add(8, "Decent control for holding mid", ctx) ?? 0;
    else score += sub(12, "Low control makes it hard to hold mid", ctx) ?? 0;
  }

  if (mode === "brawl ball") {
    // Mobility + control + frontline
    if (f.mobilityCounts.high >= 1) score += add(12, "Mobility helps create goal pressure", ctx) ?? 0;
    else score += sub(10, "Low mobility (hard to convert goals)", ctx) ?? 0;

    if (f.avgControl >= 1.5 || f.hasAreaDamage) score += add(14, "Control/area damage helps win lanes", ctx) ?? 0;
    else score += sub(12, "Low control (hard to stop pushes)", ctx) ?? 0;

    if (f.tankinessCounts.high >= 1 || f.tankinessCounts.med >= 2) score += add(10, "Has frontline presence for ball fights", ctx) ?? 0;
    else score += sub(6, "Low frontline presence", ctx) ?? 0;
  }

  if (mode === "heist") {
    // Safe damage is everything; punish hard if missing
    const hasHeistDamage = f.damageCounts.sustained >= 1 || f.damageCounts.burst >= 1;
    if (hasHeistDamage) score += add(20, "Has damage profile that can threaten the safe", ctx) ?? 0;
    else score += sub(26, "Low safe damage (hard to win Heist)", ctx) ?? 0;

    if (f.hasWallbreak) score += add(10, "Wallbreak can open safe lanes", ctx) ?? 0;
  }

  if (mode === "hot zone") {
    // Control + sustain + area damage
    if (f.avgControl >= 2.0) score += add(22, "Strong control for holding zones", ctx) ?? 0;
    else if (f.avgControl >= 1.5) score += add(14, "Decent control for holding zones", ctx) ?? 0;
    else score += sub(18, "Low control (hard to hold zone)", ctx) ?? 0;

    if (f.avgSustain >= 1.2) score += add(12, "Sustain helps stay in zone", ctx) ?? 0;
    else score += sub(10, "Low sustain (can’t stay in zone long)", ctx) ?? 0;

    if (f.hasAreaDamage) score += add(10, "Area damage is great for zone pressure", ctx) ?? 0;
  }

  // =========================
  // MAP TAG TWEAKS (small)
  // =========================
  if (hasTag(mapSet, "theme:elim")) {
    // Elim maps punish no-long-range extra
    if (f.rangeCounts.long === 0) score += sub(10, "Elimination-style map with no long range", ctx) ?? 0;
  }

  // =========================
  // POST-PROCESSING FOR UX
  // =========================
  // If everything we *show* is green (no weaknesses), score should feel high.
  // Guarantee: if 4+ strengths and 0 weaknesses => at least 80.
  const greens = strengths.length;
  const reds = weaknesses.length;

  let finalScore = clamp(score);

  if (reds === 0 && greens >= 4) {
    finalScore = Math.max(finalScore, 80);
  }
  if (reds === 0 && greens >= 6) {
    finalScore = Math.max(finalScore, 90);
  }

  // Also allow truly awful comps to be very low
  // (nothing special needed; clamping keeps it 0+)

  const reasons = [
    ...strengths.map((s) => `✅ ${s}`),
    ...weaknesses.map((w) => `⚠️ ${w}`),
  ].slice(0, 10);

  return {
    score: finalScore,
    reasons,
    strengths,
    weaknesses,
  };
}

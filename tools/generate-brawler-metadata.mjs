/**
 * Generate brawler metadata JSON with heuristic "tags" + per-brawler notes.
 * Usage:
 *   node tools/generate-brawler-metadata.mjs
 *
 * Output:
 *   ./brawlers.rewritten.json
 */

import fs from "node:fs/promises";

const BRAWLIFY_BRAWLERS_URL = "https://api.brawlify.com/v1/brawlers";

const slug = (s) =>
  String(s || "")
    .trim()
    .toUpperCase()
    .replace(/['’]/g, "")
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

function collectText(b) {
  const parts = [];
  if (b?.description) parts.push(b.description);

  // Gadgets / Star Powers include descriptions in Brawlify
  for (const g of b?.gadgets || []) {
    if (g?.name) parts.push(g.name);
    if (g?.description) parts.push(g.description);
  }
  for (const sp of b?.starPowers || []) {
    if (sp?.name) parts.push(sp.name);
    if (sp?.description) parts.push(sp.description);
  }

  return parts.join(" ").toLowerCase();
}

function rangeBucketFromClass(cls) {
  switch (cls) {
    case "ARTILLERY":
      return "thrower";
    case "MARKSMAN":
      return "long";
    case "ASSASSIN":
    case "TANK":
      return "short";
    default:
      return "mid";
  }
}

function damageProfileFromClass(cls) {
  switch (cls) {
    case "MARKSMAN":
    case "ARTILLERY":
      return "poke";
    case "ASSASSIN":
      return "burst";
    default:
      return "sustained";
  }
}

function mobilityFromSignals(cls, text) {
  // Keyword-based mobility bumps
  const highSignals = [
    "dash",
    "jump",
    "leap",
    "teleport",
    "blink",
    "speed",
    "faster",
    "sprint",
    "roll",
    "charge",
    "grappling",
  ];
  const medSignals = ["boost", "move faster", "movement speed"];

  const highHit = highSignals.some((k) => text.includes(k));
  const medHit = medSignals.some((k) => text.includes(k));

  if (highHit) return "high";

  // Default by class
  if (cls === "ASSASSIN") return medHit ? "high" : "med";
  if (cls === "TANK") return "low";
  if (cls === "MARKSMAN") return "low";
  if (cls === "ARTILLERY") return "low";

  return medHit ? "med" : "low";
}

function scoreControl(cls, text) {
  // base by class
  let score =
    cls === "CONTROLLER" ? 2 :
    cls === "ARTILLERY" ? 1 :
    cls === "TANK" ? 1 :
    cls === "SUPPORT" ? 1 :
    0;

  const ccKeywords = [
    "stun",
    "slow",
    "freeze",
    "silence",
    "knockback",
    "pull",
    "push",
    "root",
    "immobil",
    "trap",
    "reduce",
    "blocked",
    "disable",
  ];

  const hits = ccKeywords.filter((k) => text.includes(k)).length;
  score += hits >= 3 ? 2 : hits >= 1 ? 1 : 0;

  return clamp(score, 0, 3);
}

function scoreSustain(cls, text) {
  let score =
    cls === "SUPPORT" ? 2 :
    cls === "TANK" ? 1 :
    0;

  const sustainKeywords = [
    "heal",
    "heals",
    "healing",
    "regenerate",
    "restore",
    "shield",
    "lifesteal",
    "recover",
    "health",
  ];
  const hits = sustainKeywords.filter((k) => text.includes(k)).length;
  score += hits >= 3 ? 2 : hits >= 1 ? 1 : 0;

  return clamp(score, 0, 3);
}

function tankinessFromClassAndSustain(cls, sustainScore) {
  let t =
    cls === "TANK" ? "high" :
    (cls === "ASSASSIN" || cls === "MARKSMAN" || cls === "ARTILLERY") ? "low" :
    "med";

  // If they have strong sustain/shields, bump one step
  if (sustainScore >= 3 && t === "low") t = "med";
  if (sustainScore >= 3 && t === "med") t = "high";

  return t;
}

function boolWallbreak(text) {
  return (
    text.includes("break") && (text.includes("wall") || text.includes("walls")) ||
    text.includes("destroy") && (text.includes("wall") || text.includes("walls")) ||
    text.includes("destroy obstacles") ||
    text.includes("blow up") && (text.includes("wall") || text.includes("walls"))
  );
}

function boolVision(text) {
  return (
    text.includes("reveal") ||
    (text.includes("bush") && (text.includes("see") || text.includes("reveal"))) ||
    text.includes("invisible") && text.includes("detect")
  );
}

function boolAreaDamage(cls, text) {
  if (cls === "ARTILLERY") return true;
  return (
    text.includes("area") ||
    text.includes("splash") ||
    text.includes("explod") ||
    text.includes("hits multiple") ||
    text.includes("pierce") ||
    text.includes("chain")
  );
}

function antiTankRating(text) {
  // Strong signal: % / max health style
  if (text.includes("max health") || text.includes("maximum health") || text.includes("%")) return "high";
  // Otherwise: anti-tank if lots of "damage" / "increase damage" language
  if (text.includes("increase damage") || text.includes("extra damage")) return "med";
  return "low";
}

function antiAssassinRating(controlScore, text) {
  // CC and “get off me” tools tend to counter assassins
  if (controlScore >= 3) return "high";
  if (controlScore >= 2) return "med";
  if (text.includes("knockback") || text.includes("stun") || text.includes("slow")) return "med";
  return "low";
}

function gemSuitability(cls, rangeBucket, tankiness, sustainScore, controlScore) {
  // Simple heuristic: survivability + control + not-short-range is better
  let score = 0;
  if (cls === "SUPPORT" || cls === "CONTROLLER") score += 2;
  if (rangeBucket === "long" || rangeBucket === "mid") score += 1;
  if (tankiness === "high") score += 2;
  if (tankiness === "med") score += 1;
  if (sustainScore >= 2) score += 1;
  if (controlScore >= 2) score += 1;
  if (cls === "ASSASSIN" && rangeBucket === "short") score -= 2;

  if (score >= 5) return "high";
  if (score >= 3) return "med";
  return "low";
}

function deriveTags(b) {
  const cls = (b?.class?.name || "Unknown").toUpperCase();
  const text = collectText(b);

  const rangeBucket = rangeBucketFromClass(cls);
  const damageProfile = damageProfileFromClass(cls);
  const mobility = mobilityFromSignals(cls, text);
  const controlScore = scoreControl(cls, text);
  const sustainScore = scoreSustain(cls, text);
  const tankiness = tankinessFromClassAndSustain(cls, sustainScore);

  const wallbreak = boolWallbreak(text);
  const vision = boolVision(text);
  const areaDamage = boolAreaDamage(cls, text);

  const antiTank = antiTankRating(text);
  const antiAssassin = antiAssassinRating(controlScore, text);

  const gemCarrierSuitability = gemSuitability(
    cls,
    rangeBucket,
    tankiness,
    sustainScore,
    controlScore
  );

  return {
    tags: {
      rangeBucket,
      damageProfile,
      mobility,
      controlScore,
      sustainScore,
      tankiness,
      antiTank,        // "low" | "med" | "high"
      antiAssassin,    // "low" | "med" | "high"
      wallbreak,
      vision,
      areaDamage,
      gemCarrierSuitability,
    },
    notes: {
      classUsed: cls,
      keywordDrivenSignals: {
        wallbreak,
        vision,
        areaDamage,
      },
      rationale:
        "Tags derived from class archetype + keyword detection over Brawlify gadget/star power descriptions.",
    },
  };
}

async function main() {
  const res = await fetch(BRAWLIFY_BRAWLERS_URL);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);

  const data = await res.json();

  const rewritten = {
    brawlers: (data?.list || []).map((b) => {
      const cls = b?.class?.name || "Unknown";
      const rar = b?.rarity?.name || "Unknown";

      const starPowers = (b?.starPowers || []).map((sp) => slug(sp?.name));
      const gadgets = (b?.gadgets || []).map((g) => slug(g?.name));

      const derived = deriveTags(b);

      return {
        id: b?.id,
        name: slug(b?.name || ""),
        class: cls ? cls.toUpperCase().replace(/\s+/g, "-") : "Unknown",
        rarity: rar ? rar[0].toUpperCase() + rar.slice(1).toLowerCase() : "Unknown",
        imageUrl: `https://cdn.brawlify.com/brawlers/borderless/${b?.id}.png`,
        starPowers,
        gadgets,
        tags: derived.tags,
        tagRevisionNotes: {
          sources: ["Brawlify API (/v1/brawlers)"],
          derivedFrom: ["class archetype", "gadget descriptions", "star power descriptions"],
          notes: derived.notes,
        },
      };
    }),
    notes: {
      source: "Generated from Brawlify API. Tags are heuristic + keyword-based; refine with playtesting.",
      schemaVersion: 2,
      generatedAt: new Date().toISOString(),
    },
  };

  await fs.writeFile(
    "src/data/brawlers.rewritten.json",
    JSON.stringify(rewritten, null, 2),
    "utf8"
  );

  console.log(`✅ Wrote brawlers.rewritten.json with ${rewritten.brawlers.length} brawlers.`);
}

main().catch((e) => {
  console.error("❌ Failed:", e);
  process.exit(1);
});

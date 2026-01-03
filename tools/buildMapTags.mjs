// scripts/buildMapTags.mjs
// Run: node scripts/buildMapTags.mjs
// Output: src/data/maps.tagged.json

import fs from "node:fs";
import path from "node:path";

const OUT_PATH = path.join(process.cwd(), "src", "data", "maps.tagged.json");

// ✅ Use your existing source (Brawlify is common).
// If your fetchMaps() hits a different URL, replace this endpoint with yours.
const MAPS_ENDPOINT = "https://api.brawlify.com/v1/maps";

function norm(s) {
  return String(s ?? "")
    .toLowerCase()
    .trim();
}

function uniqueSorted(arr) {
  return [...new Set(arr.filter(Boolean))].sort();
}

// --- Tag rules (edit freely) ---
function deriveTags(map) {
  const tags = [];

  // Mode / Game mode tags
  const modeName = norm(map?.gameMode?.name);
  const modeId = norm(map?.gameMode?.id); // sometimes exists
  const mode = modeName || modeId;

  if (mode) tags.push(`mode:${mode}`);

  // Common mode aliases (optional)
  const modeAliases = [
    ["gem grab", "objective"],
    ["brawl ball", "sports"],
    ["heist", "safe"],
    ["hot zone", "control"],
    ["bounty", "elim"],
    ["knockout", "elim"],
    ["wipeout", "elim"],
    ["siege", "objective"],
    ["duels", "1v1-ish"],
    ["showdown", "br"],
  ];
  for (const [needle, alias] of modeAliases) {
    if (mode.includes(needle)) tags.push(`theme:${alias}`);
  }

  // Environment / theme
  const env = norm(map?.environment?.name) || norm(map?.environment);
  if (env) tags.push(`env:${env}`);

  // Map source / type
  // (Brawlify often uses: mapType: "trophy" | "powerLeague" | "ranked" | etc.)
  const mapType = norm(map?.mapType);
  if (mapType) tags.push(`type:${mapType}`);

  // Disabled / rotation
  if (map?.disabled === true) tags.push("status:disabled");
  if (map?.disabled === false) tags.push("status:active");

  // --- Modifiers (if present) ---
  // Brawlify sometimes: map.modifiers = [{ id, name }]
  const modifiers = Array.isArray(map?.modifiers) ? map.modifiers : [];
  for (const mod of modifiers) {
    const m = norm(mod?.name || mod?.id);
    if (m) tags.push(`mod:${m}`);
  }

  // --- Size heuristics (optional) ---
  // Some APIs include "size" or "width/height" or "data" about tiles. If not, ignore.
  // If you do have tile data later, you can add:
  // tags.push("size:small" | "size:medium" | "size:large")

  // --- Name-based heuristics (optional but useful) ---
  // Tag a few recognizable patterns by map name:
  const name = norm(map?.name);
  if (name.includes("cavern")) tags.push("style:cavern");
  if (name.includes("island")) tags.push("style:islands");
  if (name.includes("river")) tags.push("style:river");
  if (name.includes("factory")) tags.push("style:factory");

  // --- “Competitive-friendly” starter tags (totally optional) ---
  // If it’s ranked/power league maps, you can tag it as comp:
  if (mapType.includes("rank") || mapType.includes("power")) tags.push("pool:competitive");

  return uniqueSorted(tags);
}

function shapeOutput(map) {
  return {
    id: map?.id ?? null,
    name: map?.name ?? "",
    // Keep minimal info you’ll use in the app
    gameMode: map?.gameMode?.name ?? map?.gameMode ?? null,
    environment: map?.environment?.name ?? map?.environment ?? null,
    mapType: map?.mapType ?? null,
    imageUrl:
      map?.imageUrl ??
      map?.images?.map ??
      map?.images?.preview ??
      null,
    tags: deriveTags(map),
  };
}

async function main() {
  console.log(`Fetching maps from: ${MAPS_ENDPOINT}`);
  const res = await fetch(MAPS_ENDPOINT);

  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();

  // Brawlify returns { list: [...] }
  const maps = Array.isArray(json?.list) ? json.list : Array.isArray(json) ? json : [];

  if (!maps.length) {
    throw new Error("No maps found in response. Check endpoint / response shape.");
  }

  const tagged = maps.map(shapeOutput);

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(tagged, null, 2), "utf8");

  console.log(`✅ Wrote ${tagged.length} maps -> ${OUT_PATH}`);
}

main().catch((err) => {
  console.error("❌ buildMapTags failed:", err);
  process.exit(1);
});

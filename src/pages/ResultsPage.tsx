import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { TeamState } from "../types/teamState";
import type { MapState } from "../types/mapState";
import { scoreTeamOnMap } from "../logic/synergy";
import { BRAWLERS } from "../data/loadBrawlers";
import { MAPS } from "../data/loadMaps";
import type { TaggedBrawler, TaggedMap } from "../data/types";

// ✅ adjust this import to where you put it
import ScoreBar from "../components/ScoreBar";

function isTaggedBrawler(x: any): x is TaggedBrawler {
  return x && Array.isArray(x.tags);
}
function isTaggedMap(x: any): x is TaggedMap {
  return x && Array.isArray(x.tags);
}

function upgradeBrawler(b: any): TaggedBrawler | null {
  if (!b) return null;
  if (isTaggedBrawler(b)) return b;

  const id = b.id;
  const tagged = BRAWLERS.find((tb) => tb.id === id);
  return tagged ?? null;
}

function upgradeMap(m: any): TaggedMap | null {
  if (!m) return null;
  if (isTaggedMap(m)) return m;

  const id = m.id;
  const tagged = MAPS.find((tm) => tm.id === id);
  return tagged ?? null;
}

function getBrawlerImg(b: any) {
  return b?.imageUrl2 ?? b?.imageUrl ?? null;
}

export default function ResultsPage({ team, map }: { team: TeamState; map: MapState }) {
  const navigate = useNavigate();

  const upgraded = useMemo(() => {
    const upgradedTeam = team.map(upgradeBrawler);
    const upgradedMap = upgradeMap(map);

    const completeTeam = upgradedTeam.length === 3 && upgradedTeam.every(Boolean);

    return {
      upgradedTeam: completeTeam ? (upgradedTeam as TaggedBrawler[]) : null,
      upgradedMap,
    };
  }, [team, map]);

  const result = useMemo(() => {
    if (!upgraded.upgradedTeam || !upgraded.upgradedMap) return null;
    return scoreTeamOnMap(upgraded.upgradedTeam, upgraded.upgradedMap);
  }, [upgraded]);

  if (!result || !upgraded.upgradedTeam || !upgraded.upgradedMap) {
    return (
      <div className="p-6 text-white">
        <div className="text-xl font-semibold">Can’t compute results yet</div>
        <p className="mt-2 text-zinc-300">
          Make sure you picked 3 brawlers + a map. (Also: the selected IDs must exist in your tagged JSON.)
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 rounded bg-blue-600 px-4 py-2 hover:bg-blue-500"
        >
          Back
        </button>
      </div>
    );
  }

  const selectedMap = upgraded.upgradedMap;
  const selectedTeam = upgraded.upgradedTeam;

  return (
    <div className="mx-auto max-w-5xl p-6 text-white">
      <button
        onClick={() => navigate("/")}
        className="mb-4 rounded bg-white/10 px-3 py-1 hover:bg-white/15"
      >
        ← Back
      </button>

      {/* Score + Bar */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="text-3xl font-bold">Synergy Score: {result.score}/100</div>
        <div className="mt-3">
          <ScoreBar score={result.score} />
        </div>
      </div>

      {/* Map Card w/ image */}
      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 overflow-hidden rounded-lg bg-black/20">
            {selectedMap.imageUrl ? (
              <img
                src={selectedMap.imageUrl}
                alt={selectedMap.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
                No image
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="text-lg font-semibold truncate">Map: {selectedMap.name}</div>
            <div className="text-sm text-white/70">
              {selectedMap.gameMode} • {selectedMap.environment}
            </div>

            {/* Tags (optional nice touch) */}
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedMap.tags.slice(0, 6).map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/80"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reasons */}
      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="text-lg font-semibold">Why</div>

        <ul className="mt-3 space-y-2 text-white/90">
          {result.reasons.map((r) => (
            <li key={r} className="flex items-start gap-2">
              <span className="mt-0.5">
                {r.startsWith("✅") ? "✅" : r.startsWith("⚠️") ? "⚠️" : "•"}
              </span>
              <span>{r.replace(/^✅\s?|^⚠️\s?/, "")}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Team Cards w/ images */}
      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="text-lg font-semibold">Team</div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {selectedTeam.map((b) => {
            const img = getBrawlerImg(b);
            return (
              <div
                key={b.id}
                className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center gap-3"
              >
                <div className="h-14 w-14 overflow-hidden rounded-lg bg-black/20 flex items-center justify-center">
                  {img ? (
                    <img
                      src={img}
                      alt={b.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="text-xs text-white/40">No image</div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="font-semibold truncate">{b.name}</div>
                  <div className="text-xs text-white/70">
                    {b.rarity} • {b.class}
                  </div>

                  {/* Tags (optional nice touch) */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {b.tags.slice(0, 4).map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/80"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

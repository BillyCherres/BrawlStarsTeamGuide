import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type React from "react";
import { fetchMaps, type BrawlifyMap } from "../api/brawlmapapi";

type Props = {
  map: BrawlifyMap | null;
  setMap: React.Dispatch<React.SetStateAction<BrawlifyMap | null>>;
};

export default function ChooseMapPage({ setMap }: Props) {
  const navigate = useNavigate();

  const [maps, setMaps] = useState<BrawlifyMap[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMaps()
      .then((list) => setMaps(list.filter((m) => !m.disabled)))
      .catch((e) => setError(e instanceof Error ? e.message : "Unknown error"));
  }, []);

  if (error) return <div className="p-6 text-white">Error: {error}</div>;
  if (maps.length === 0) return <div className="p-6 text-white">Loading maps…</div>;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white">Choose a Map</h1>

        <button
          onClick={() => navigate("/")}
          className="rounded-lg bg-white/10 px-4 py-2 font-semibold text-white hover:bg-white/15"
        >
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {maps.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setMap(m);      // ✅ actually sets the map
              navigate("/");
            }}
            className="overflow-hidden rounded-xl border border-white/10 bg-white/5 text-left hover:bg-white/10"
          >
            <img src={m.imageUrl} alt={m.name} className="h-36 w-full object-cover" />
            <div className="p-4">
              <div className="text-white font-semibold">{m.name}</div>
              <div className="text-white/70 text-sm">{m.gameMode.name}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

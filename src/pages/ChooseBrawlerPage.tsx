import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type React from "react";
import BrawlerCard from "../components/BrawlerCard";
import { fetchBrawlers, type BrawlApiBrawler } from "../api/brawlapi";
import type { TeamState } from "../types/teamState";

type Props = {
  team: TeamState;
  setTeam: React.Dispatch<React.SetStateAction<TeamState>>;
};

export default function ChooseBrawlerPage({ team, setTeam }: Props) {
  const navigate = useNavigate();
  const { slot } = useParams(); // "1" | "2" | "3"

  // Convert slot string -> number (1..3) safely
  const slotNum = useMemo(() => {
    const n = Number(slot);
    return Number.isFinite(n) ? n : NaN;
  }, [slot]);

  // Convert slot number -> index (0..2)
  const slotIndex = slotNum - 1;

  const [brawlers, setBrawlers] = useState<BrawlApiBrawler[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBrawlers()
      .then(setBrawlers)
      .catch((e) => setError(e instanceof Error ? e.message : "Unknown error"));
  }, []);

  // Guard: invalid slot in the URL
  if (!slot || ![1, 2, 3].includes(slotNum)) {
    return (
      <div className="p-6 text-white">
        Invalid slot. Go back to{" "}
        <button className="underline" onClick={() => navigate("/")}>
          Team Builder
        </button>
        .
      </div>
    );
  }

  if (error) return <div className="p-6 text-white">Error: {error}</div>;
  if (brawlers.length === 0) return <div className="p-6 text-white">Loading brawlers…</div>;

  const handleSelect = (b: BrawlApiBrawler) => {
    // prevent duplicates (don’t allow picking same brawler twice)
    const alreadyPicked = team.some((x) => x?.id === b.id);
    if (alreadyPicked) {
      alert("You already picked that brawler.");
      return;
    }

    // update lifted state immutably
    setTeam((prev) => {
      const next = [...prev] as TeamState;
      next[slotIndex] = b;
      return next;
    });

    // navigate after selection
    // Option A: go back to Team Builder
    navigate("/");

    // Option B (better UX): auto-advance to next slot
    // if (slotIndex < 2) navigate(`/choose/${slotIndex + 2}`);
    // else navigate("/");
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white">Choose Brawler #{slotNum}</h1>

        <button
          onClick={() => navigate("/")}
          className="rounded-lg bg-white/10 px-4 py-2 font-semibold text-white hover:bg-white/15"
        >
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brawlers.map((b) => (
          <BrawlerCard
            key={b.id}
            name={b.name}
            imageUrl={b.imageUrl2 ?? b.imageUrl}
            onSelect={() => handleSelect(b)}
          />
        ))}
      </div>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import type { TeamState } from "../types/teamState";
import type { MapState } from "../types/mapState";

type Props = {
  team: TeamState;
  map: MapState;
  setTeam: React.Dispatch<React.SetStateAction<TeamState>>;
  setMap: React.Dispatch<React.SetStateAction<MapState>>;
};

function TeamBuilderPage({ team, map, setTeam, setMap }: Props) {
  const navigate = useNavigate();
  const canShowResults = team.every(Boolean) && map !== null;
  return (
    <div className="mx-auto max-w-4xl p-6">
      <header className="mb-6 flex items-center gap-4">
        <img src={logo} alt="Brawl Stars" className="h-12 w-12" />
        <h1 className="text-3xl font-bold text-red-200">Team Builder</h1>
      </header>

      <div className="space-y-4">
        {[0, 1, 2].map((i) => {
          const locked = i > 0 && !team[i - 1]; // slot 2 locked until slot 1 chosen, etc.
          return (
            <div
              key={i}
              className="rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {team[i] && (
                    <img
                      src={team[i]!.imageUrl2 ?? team[i]!.imageUrl}
                      alt={team[i]!.name}
                      className="h-14 w-14 rounded-lg bg-black/20 object-contain"
                    />
                  )}

                  <div>
                    <div className="text-white font-semibold">
                      Brawler #{i + 1}
                    </div>
                    <div className="text-white/70 text-sm">
                      {team[i] ? `Selected: ${team[i]!.name}` : "Not selected"}
                    </div>
                  </div>
                </div>

                <button
                  disabled={locked}
                  onClick={() => navigate(`/choose/${i + 1}`)}
                  className={`rounded-lg px-4 py-2 font-semibold ${
                    locked
                      ? "bg-white/10 text-white/40 cursor-not-allowed"
                      : "bg-yellow-400 text-black hover:bg-yellow-300"
                  }`}
                >
                  {team[i] ? "Change" : `Choose #${i + 1}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {map && (
              <img
                src={map.imageUrl}
                alt={map.name}
                className="h-14 w-14 rounded-lg bg-black/20 object-cover"
              />
            )}

            <div>
              <div className="text-white font-semibold">Map</div>
              <div className="text-white/70 text-sm">
                {map
                  ? `Selected: ${map.name} (${map.gameMode.name})`
                  : "Not selected"}
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate("/choose-map")}
            className="rounded-lg bg-yellow-400 px-4 py-2 font-semibold text-black hover:bg-yellow-300"
          >
            {map ? "Change" : "Choose Map"}
          </button>
        </div>
      </div>
      <div>
        <button
          onClick={() => {
            setTeam([null, null, null]);
            setMap(null);
          }}
          className="ml-auto rounded-lg bg-white/10 px-4 py-2 font-semibold text-white hover:bg-white/15"
        >
          Reset
        </button>
        <button
          disabled={!canShowResults}
          onClick={() => navigate("/results")}
          className={`mt-4 rounded px-4 py-2 ${
            canShowResults
              ? "bg-green-600 hover:bg-green-500"
              : "bg-gray-600 cursor-not-allowed"
          }`}
        >
          Show Results
        </button>
      </div>
    </div>
  );
}

export default TeamBuilderPage;

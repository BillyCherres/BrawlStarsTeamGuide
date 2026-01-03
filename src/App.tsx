import TeamBuilderPage from "./pages/TeamBuilderPage";
import ChooseBrawlerPage from "./pages/ChooseBrawlerPage";
import ResultsPage from "./pages/ResultsPage";
import Background from "./components/Background";
import { Navigate, Route, Routes } from "react-router-dom";
import { useState } from "react";
import type { TeamState } from "./types/teamState";
import type { MapState } from "./types/mapState";
import ChooseMapPage from "./pages/ChooseMapPage";

export default function App() {
  const [team, setTeam] = useState<TeamState>([null, null, null]);
  const [map, setMap] = useState<MapState>(null);
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Background>
        <Routes>
          <Route
            path="/"
            element={
              <TeamBuilderPage
                team={team}
                setTeam={setTeam}
                map={map}
                setMap={setMap}
              />
            }
          />

          <Route
            path="/choose/:slot"
            element={<ChooseBrawlerPage team={team} setTeam={setTeam} />}
          />

          <Route
            path="/choose-map"
            element={<ChooseMapPage map={map} setMap={setMap} />}
          />
          <Route path="/results" element={<ResultsPage team={team} map={map} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Background>
    </div>
  );
}

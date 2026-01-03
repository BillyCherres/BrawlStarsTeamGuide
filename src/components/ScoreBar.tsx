function scoreColor(score: number) {
    if (score >= 75) return "bg-green-500";
    if (score >= 55) return "bg-yellow-400";
    if (score >= 35) return "bg-orange-500";
    return "bg-red-500";
  }
  
  function ScoreBar({ score }: { score: number }) {
    const width = `${Math.max(0, Math.min(100, score))}%`;
    const color = scoreColor(score);
  
    return (
      <div className="mt-3">
        <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full ${color} transition-all duration-500`}
            style={{ width }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-white/70">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>
    );
  }

  export default ScoreBar;
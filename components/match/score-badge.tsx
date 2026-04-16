import { getScoreBg, getScoreColor, getScoreLabel } from "@/lib/ai/match-skills";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ScoreBadge({ score, size = "md", showLabel = false }: ScoreBadgeProps) {
  const colorClass = getScoreColor(score);
  const bgClass = getScoreBg(score);
  const label = getScoreLabel(score);

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5 font-bold",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold score-ring ${sizeClasses[size]} ${bgClass}`}
    >
      <span className={colorClass}>{score}%</span>
      {showLabel && (
        <span className="text-white/50 font-normal text-xs">{label}</span>
      )}
    </span>
  );
}

interface ScoreRingProps {
  score: number;
}

export function ScoreRing({ score }: ScoreRingProps) {
  const colorClass = getScoreColor(score);
  const label = getScoreLabel(score);
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  const strokeColor =
    score >= 80
      ? "#10b981"
      : score >= 60
      ? "#eab308"
      : score >= 40
      ? "#f97316"
      : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-24 h-24 score-ring">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="6"
          />
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke={strokeColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${colorClass}`}>{score}</span>
          <span className="text-xs text-white/40">%</span>
        </div>
      </div>
      <span className="text-xs font-medium text-white/60">{label}</span>
    </div>
  );
}

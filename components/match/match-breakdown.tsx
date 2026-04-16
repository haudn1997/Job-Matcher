import { CheckCircle2, XCircle, Star, AlertCircle } from "lucide-react";

interface MatchBreakdownProps {
  matchedSkills: string[];
  missingSkills: string[];
  bonusSkills: string[];
  aiSummary?: string | null;
  shouldApply?: boolean | null;
}

export function MatchBreakdown({
  matchedSkills,
  missingSkills,
  bonusSkills,
  aiSummary,
  shouldApply,
}: MatchBreakdownProps) {
  return (
    <div className="space-y-4">
      {/* AI Summary */}
      {aiSummary && (
        <div
          className="flex gap-3 p-4 rounded-xl"
          style={{
            background: shouldApply
              ? "rgba(16, 185, 129, 0.08)"
              : "rgba(239, 68, 68, 0.08)",
            border: `1px solid ${shouldApply ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
          }}
        >
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
            style={{ color: shouldApply ? "#10b981" : "#ef4444" }}
          />
          <p className="text-sm text-white/80 leading-relaxed">{aiSummary}</p>
        </div>
      )}

      {/* Matched */}
      {matchedSkills.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Matched ({matchedSkills.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {matchedSkills.map((skill) => (
              <SkillPill key={skill} skill={skill} variant="matched" />
            ))}
          </div>
        </div>
      )}

      {/* Missing */}
      {missingSkills.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <XCircle size={14} className="text-red-400" />
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">
              Cần học thêm ({missingSkills.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {missingSkills.map((skill) => (
              <SkillPill key={skill} skill={skill} variant="missing" />
            ))}
          </div>
        </div>
      )}

      {/* Bonus */}
      {bonusSkills.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Star size={14} className="text-yellow-400" />
            <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">
              Điểm cộng ({bonusSkills.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {bonusSkills.map((skill) => (
              <SkillPill key={skill} skill={skill} variant="bonus" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type PillVariant = "matched" | "missing" | "bonus" | "neutral";

export function SkillPill({ skill, variant = "neutral" }: { skill: string; variant?: PillVariant }) {
  const styles: Record<PillVariant, { bg: string; text: string; border: string }> = {
    matched: {
      bg: "rgba(16, 185, 129, 0.12)",
      text: "#6ee7b7",
      border: "rgba(16, 185, 129, 0.25)",
    },
    missing: {
      bg: "rgba(239, 68, 68, 0.12)",
      text: "#fca5a5",
      border: "rgba(239, 68, 68, 0.25)",
    },
    bonus: {
      bg: "rgba(234, 179, 8, 0.12)",
      text: "#fde68a",
      border: "rgba(234, 179, 8, 0.25)",
    },
    neutral: {
      bg: "rgba(255, 255, 255, 0.06)",
      text: "rgba(255,255,255,0.7)",
      border: "rgba(255,255,255,0.1)",
    },
  };

  const s = styles[variant];

  return (
    <span
      className="skill-tag inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border"
      style={{ background: s.bg, color: s.text, borderColor: s.border }}
    >
      {skill}
    </span>
  );
}

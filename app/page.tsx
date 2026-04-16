"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase, TrendingUp, Send, MessageSquare, AlertCircle,
  ArrowRight, Zap, Target,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ScoreBadge } from "@/components/match/score-badge";
import { Job, JobMatch } from "@prisma/client";

type JobWithMatch = Job & { match: JobMatch | null };

interface Stats {
  totalJobs: number;
  avgMatchScore: number;
  appliedCount: number;
  interviewCount: number;
  topMissingSkills: { skill: string; count: number }[];
  recentHighMatch: JobWithMatch[];
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  subtitle,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}20` }}
        >
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-white/50 mt-0.5">{label}</p>
      {subtitle && <p className="text-xs text-white/25 mt-1">{subtitle}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card p-5 h-32 shimmer" />
          ))}
        </div>
      </div>
    );
  }

  const hasNoData = !stats || stats.totalJobs === 0;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          <span className="text-white">Xin chào! </span>
          <span className="gradient-text">JobMatcher Dashboard</span>
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Theo dõi quá trình tìm việc của bạn
        </p>
      </div>

      {hasNoData ? (
        /* Onboarding state */
        <div className="space-y-4">
          <div className="glass-card p-8 flex flex-col items-center text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(129,140,248,0.2))" }}
            >
              <Zap size={30} className="text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Bắt đầu nào!</h2>
            <p className="text-white/50 text-sm max-w-md">
              Upload CV để AI extract skills, sau đó thêm job bạn muốn apply để xem mức độ phù hợp
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => router.push("/cv")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)" }}
              >
                <Zap size={15} />
                Upload CV
              </button>
              <button
                onClick={() => router.push("/jobs/import")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:bg-white/5"
                style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}
              >
                Thêm Job
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

          {/* Quick tips */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: "1", title: "Upload CV", desc: "AI tự động extract skills, experience từ CV PDF của bạn", color: "#6366f1" },
              { step: "2", title: "Thêm Jobs", desc: "Paste JD từ TopCV, ITviec hoặc bất kỳ nguồn nào", color: "#22d3ee" },
              { step: "3", title: "Xem Match", desc: "AI phân tích và ranking jobs theo mức độ phù hợp với bạn", color: "#10b981" },
            ].map((tip) => (
              <div key={tip.step} className="glass-card p-5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold mb-3"
                  style={{ background: `${tip.color}20`, color: tip.color }}
                >
                  {tip.step}
                </div>
                <h3 className="font-semibold text-white text-sm">{tip.title}</h3>
                <p className="text-xs text-white/40 mt-1">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Briefcase}
              label="Tổng số jobs"
              value={stats.totalJobs}
              color="#6366f1"
              subtitle="đã thu thập"
            />
            <StatCard
              icon={Target}
              label="Match score TB"
              value={`${stats.avgMatchScore}%`}
              color="#22d3ee"
              subtitle="trung bình tất cả jobs"
            />
            <StatCard
              icon={Send}
              label="Đã apply"
              value={stats.appliedCount}
              color="#10b981"
              subtitle="vị trí"
            />
            <StatCard
              icon={MessageSquare}
              label="Phỏng vấn"
              value={stats.interviewCount}
              color="#f59e0b"
              subtitle="đang trong quá trình"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top missing skills chart */}
            <div className="glass-card p-6">
              <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                <AlertCircle size={15} className="text-orange-400" />
                Skills hay bị thiếu nhất
              </h2>
              <p className="text-xs text-white/30 mb-5">
                Những skills xuất hiện nhiều trong các job mà bạn chưa có
              </p>
              {stats.topMissingSkills.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={stats.topMissingSkills}
                    layout="vertical"
                    margin={{ left: 0, right: 20 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="skill"
                      tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#1a1a28",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                        color: "white",
                        fontSize: 12,
                      }}
                      formatter={(v) => [`${v} jobs`, "Thiếu trong"]}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {stats.topMissingSkills.map((_, i) => (
                        <Cell
                          key={i}
                          fill={`rgba(239, 68, 68, ${0.8 - i * 0.08})`}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-white/25 text-sm text-center py-8">
                  Chưa có dữ liệu
                </p>
              )}
            </div>

            {/* Recent high match */}
            <div className="glass-card p-6">
              <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                <TrendingUp size={15} className="text-emerald-400" />
                Jobs phù hợp nhất
              </h2>
              <p className="text-xs text-white/30 mb-4">Match score ≥ 75%</p>
              {stats.recentHighMatch.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentHighMatch.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => router.push(`/jobs/${job.id}`)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
                      style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}
                      >
                        {job.company.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{job.title}</p>
                        <p className="text-xs text-white/40">{job.company}</p>
                      </div>
                      {job.match && (
                        <ScoreBadge score={Math.round(job.match.matchScore)} size="sm" />
                      )}
                      <ArrowRight size={14} className="text-white/20 shrink-0" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-white/25 text-sm text-center py-8">
                  Chưa có job nào match ≥ 75%
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

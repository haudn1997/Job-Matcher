"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Job, JobMatch } from "@prisma/client";
import {
  ArrowLeft, ExternalLink, MapPin, DollarSign, Clock,
  Building2, RefreshCw, FileText, ChevronDown, Loader2,
} from "lucide-react";
import { ScoreRing } from "@/components/match/score-badge";
import { MatchBreakdown } from "@/components/match/match-breakdown";
import { toast } from "sonner";

type JobWithMatch = Job & { match: JobMatch | null };

const STATUS_OPTIONS = [
  { value: "NEW", label: "🆕 Mới" },
  { value: "BOOKMARKED", label: "🔖 Đã lưu" },
  { value: "APPLIED", label: "📤 Đã apply" },
  { value: "PHONE_SCREEN", label: "📞 Phone screen" },
  { value: "INTERVIEW", label: "🤝 Phỏng vấn" },
  { value: "OFFER", label: "🎉 Offer" },
  { value: "REJECTED", label: "❌ Rejected" },
  { value: "IGNORED", label: "🚫 Bỏ qua" },
];

function formatSalary(min: number | null, max: number | null, currency: string) {
  if (!min && !max) return "Không hiển thị lương";
  const fmt = (n: number) =>
    currency === "VND"
      ? `${(n / 1_000_000).toFixed(0)} triệu`
      : `$${n.toLocaleString()}`;
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `Từ ${fmt(min)}`;
  return `Đến ${fmt(max!)}`;
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<JobWithMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [rematching, setRematching] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setJob(data);
        setNotes(data.match?.notes ?? "");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (status: string) => {
    if (!job) return;
    await fetch(`/api/jobs/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setJob((j) =>
      j && j.match ? { ...j, match: { ...j.match, status: status as JobMatch["status"] } } : j
    );
    toast.success("Đã cập nhật status");
  };

  const handleRematch = async () => {
    setRematching(true);
    try {
      const res = await fetch(`/api/jobs/${id}/match`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setJob((j) => (j ? { ...j, match: data.match } : j));
      toast.success("Đã re-match thành công!");
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Lỗi re-match");
    } finally {
      setRematching(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    await fetch(`/api/jobs/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setSavingNotes(false);
    toast.success("Đã lưu notes");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-8 text-center text-white/40">Job không tồn tại</div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-white/40 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Quay lại
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header card */}
          <div className="glass-card p-6">
            <div className="flex items-start gap-4">
              <div
                className="flex items-center justify-center w-14 h-14 rounded-2xl text-xl font-bold shrink-0"
                style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}
              >
                {job.company.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-white">{job.title}</h1>
                <p className="text-white/50 flex items-center gap-1.5 mt-1">
                  <Building2 size={14} />
                  {job.company}
                </p>
                <div className="flex flex-wrap gap-3 mt-3 text-sm text-white/40">
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={13} /> {job.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <DollarSign size={13} />
                    {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                  </span>
                  {job.isRemote && (
                    <span className="px-2 py-0.5 rounded-md text-xs font-medium"
                      style={{ background: "rgba(16,185,129,0.12)", color: "#34d399" }}>
                      Remote
                    </span>
                  )}
                  {job.seniority && (
                    <span className="px-2 py-0.5 rounded-md text-xs capitalize"
                      style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
                      {job.seniority}
                    </span>
                  )}
                </div>
              </div>
              {job.url && !job.url.startsWith("manual-") && (
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/10 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={14} />
                  Xem job
                </a>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText size={14} />
              Mô tả công việc
            </h2>
            <div
              className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap"
              style={{ maxHeight: "400px", overflowY: "auto" }}
            >
              {job.description}
            </div>
          </div>

          {/* Notes */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
              Ghi chú cá nhân
            </h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú về job này (recruiter contact, next steps, ...)"
              rows={4}
              className="w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-indigo-500/50 resize-none"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            />
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="mt-2 px-4 py-2 rounded-xl text-sm text-white font-medium disabled:opacity-50 transition-all"
              style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)" }}
            >
              {savingNotes ? "Đang lưu..." : "Lưu notes"}
            </button>
          </div>
        </div>

        {/* Right: Match & Actions */}
        <div className="space-y-6">
          {/* Score */}
          <div className="glass-card p-6 flex flex-col items-center gap-4">
            {job.match ? (
              <>
                <ScoreRing score={Math.round(job.match.matchScore)} />
                <button
                  onClick={handleRematch}
                  disabled={rematching}
                  className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={12} className={rematching ? "animate-spin" : ""} />
                  Re-match với CV hiện tại
                </button>
              </>
            ) : (
              <button
                onClick={handleRematch}
                disabled={rematching}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white font-medium disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)" }}
              >
                {rematching ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <RefreshCw size={15} />
                )}
                Chạy AI Match
              </button>
            )}
          </div>

          {/* Status */}
          <div className="glass-card p-5">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
              Trạng thái
            </h3>
            <div className="relative">
              <select
                value={job.match?.status ?? "NEW"}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full bg-white/5 border rounded-xl px-3 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-indigo-500/50"
                style={{ borderColor: "rgba(255,255,255,0.1)" }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value} className="bg-gray-900">
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            </div>
          </div>

          {/* Match Breakdown */}
          {job.match && (
            <div className="glass-card p-5">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">
                Chi tiết match
              </h3>
              <MatchBreakdown
                matchedSkills={job.match.matchedSkills}
                missingSkills={job.match.missingSkills}
                bonusSkills={job.match.bonusSkills}
                aiSummary={job.match.aiSummary}
                shouldApply={job.match.shouldApply}
              />
            </div>
          )}

          {/* Source info */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between text-xs text-white/30">
              <span>Nguồn: <span className="capitalize">{job.source}</span></span>
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {new Date(job.scrapedAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

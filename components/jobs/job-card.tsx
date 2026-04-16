"use client";

import { useState } from "react";
import { Job, JobMatch } from "@prisma/client";
import { useRouter } from "next/navigation";
import {
  MapPin, Clock, DollarSign, ExternalLink,
  Building2, Bookmark, Send, MoreHorizontal, Trash2,
} from "lucide-react";
import { ScoreBadge } from "@/components/match/score-badge";
import { SkillPill } from "@/components/match/match-breakdown";
import { toast } from "sonner";

type JobWithMatch = Job & { match: JobMatch | null };

const STATUS_CONFIG = {
  NEW: { label: "Mới", color: "rgba(148,163,184,0.3)", text: "#94a3b8" },
  BOOKMARKED: { label: "Đã lưu", color: "rgba(99,102,241,0.3)", text: "#818cf8" },
  APPLIED: { label: "Đã apply", color: "rgba(6,182,212,0.3)", text: "#22d3ee" },
  PHONE_SCREEN: { label: "Phone screen", color: "rgba(234,179,8,0.3)", text: "#facc15" },
  INTERVIEW: { label: "Phỏng vấn", color: "rgba(249,115,22,0.3)", text: "#fb923c" },
  OFFER: { label: "Offer!", color: "rgba(16,185,129,0.3)", text: "#34d399" },
  REJECTED: { label: "Rejected", color: "rgba(239,68,68,0.3)", text: "#f87171" },
  IGNORED: { label: "Bỏ qua", color: "rgba(75,85,99,0.3)", text: "#6b7280" },
};

function formatSalary(min: number | null, max: number | null, currency: string) {
  if (!min && !max) return null;
  const fmt = (n: number) =>
    currency === "VND"
      ? `${(n / 1_000_000).toFixed(0)}M`
      : `$${n.toLocaleString()}`;
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `Từ ${fmt(min)}`;
  return `Đến ${fmt(max!)}`;
}

function timeSince(date: Date | string) {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Hôm nay";
  if (days === 1) return "Hôm qua";
  if (days < 7) return `${days} ngày trước`;
  if (days < 30) return `${Math.floor(days / 7)} tuần trước`;
  return `${Math.floor(days / 30)} tháng trước`;
}

interface JobCardProps {
  job: JobWithMatch;
  onStatusChange?: (jobId: string, status: string) => void;
  onDelete?: (jobId: string) => void;
}

export function JobCard({ job, onStatusChange, onDelete }: JobCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();
  const score = job.match?.matchScore ?? null;
  const status = job.match?.status ?? "NEW";
  const statusConfig = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.currency);

  const handleStatusChange = async (newStatus: string) => {
    try {
      await fetch(`/api/jobs/${job.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      onStatusChange?.(job.id, newStatus);
      toast.success(`Đã cập nhật: ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG]?.label}`);
    } catch {
      toast.error("Lỗi cập nhật status");
    }
    setShowMenu(false);
  };

  const handleDelete = async () => {
    if (!confirm("Xóa job này?")) return;
    await fetch(`/api/jobs/${job.id}`, { method: "DELETE" });
    onDelete?.(job.id);
    toast.success("Đã xóa job");
    setShowMenu(false);
  };

  return (
    <div
      className="glass-card p-5 cursor-pointer hover:border-indigo-500/30 transition-all duration-200 group relative"
      onClick={() => router.push(`/jobs/${job.id}`)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Company avatar */}
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 text-sm font-bold"
            style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}
          >
            {job.company.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
              {job.title}
            </h3>
            <p className="text-xs text-white/50 flex items-center gap-1 mt-0.5">
              <Building2 size={11} />
              {job.company}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {score !== null && <ScoreBadge score={Math.round(score)} />}

          {/* Menu */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <MoreHorizontal size={14} className="text-white/60" />
            </button>
            {showMenu && (
              <div
                className="absolute right-0 top-full mt-1 w-44 rounded-xl border py-1 z-10"
                style={{ background: "#1a1a28", borderColor: "rgba(255,255,255,0.1)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => handleStatusChange("BOOKMARKED")}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Bookmark size={13} /> Lưu lại
                </button>
                <button
                  onClick={() => handleStatusChange("APPLIED")}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Send size={13} /> Đã apply
                </button>
                <button
                  onClick={() => handleStatusChange("IGNORED")}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Bỏ qua
                </button>
                <div className="h-px mx-2 my-1" style={{ background: "rgba(255,255,255,0.08)" }} />
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={13} /> Xóa
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {job.location && (
          <span className="flex items-center gap-1 text-xs text-white/40">
            <MapPin size={10} />
            {job.location}
          </span>
        )}
        {job.isRemote && (
          <span className="text-xs px-1.5 py-0.5 rounded-md font-medium"
            style={{ background: "rgba(16,185,129,0.12)", color: "#34d399" }}>
            Remote
          </span>
        )}
        {salary && (
          <span className="flex items-center gap-1 text-xs text-white/40">
            <DollarSign size={10} />
            {salary}
          </span>
        )}
        {job.seniority && (
          <span className="text-xs px-1.5 py-0.5 rounded-md capitalize"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
            {job.seniority}
          </span>
        )}
        <span className="flex items-center gap-1 text-xs text-white/30 ml-auto">
          <Clock size={10} />
          {timeSince(job.scrapedAt)}
        </span>
      </div>

      {/* Skills preview */}
      {job.match && (
        <div className="flex flex-wrap gap-1 mb-3">
          {job.match.matchedSkills.slice(0, 4).map((s) => (
            <SkillPill key={s} skill={s} variant="matched" />
          ))}
          {job.match.missingSkills.slice(0, 2).map((s) => (
            <SkillPill key={s} skill={s} variant="missing" />
          ))}
          {(job.match.matchedSkills.length + job.match.missingSkills.length > 6) && (
            <span className="text-xs text-white/30 self-center">+{job.match.matchedSkills.length + job.match.missingSkills.length - 6}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ background: statusConfig.color, color: statusConfig.text }}
        >
          {statusConfig.label}
        </span>
        <span className="text-xs capitalize" style={{ color: "rgba(255,255,255,0.25)" }}>
          {job.source}
        </span>
      </div>
    </div>
  );
}

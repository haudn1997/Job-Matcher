"use client";

import { DraggableProvided, DraggableStateSnapshot } from "@hello-pangea/dnd";
import { Job, JobMatch } from "@prisma/client";
import { useRouter } from "next/navigation";
import { ExternalLink, TrendingUp } from "lucide-react";

type JobWithMatch = Job & { match: JobMatch | null };

const scoreColor = (score: number) => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f59e0b";
    if (score >= 40) return "#f97316";
    return "#ef4444";
};

export function KanbanCard({
    job,
    provided,
    snapshot,
}: {
    job: JobWithMatch;
    provided: DraggableProvided;
    snapshot: DraggableStateSnapshot;
}) {
    const router = useRouter();
    const score = Math.round(job.match?.matchScore ?? 0);
    const color = scoreColor(score);

    return (
        <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{
                ...provided.draggableProps.style,
                background: snapshot.isDragging
                    ? "rgba(99,102,241,0.15)"
                    : "rgba(255,255,255,0.04)",
                border: `1px solid ${snapshot.isDragging ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.07)"}`,
                boxShadow: snapshot.isDragging ? "0 8px 32px rgba(0,0,0,0.4)" : "none",
            }}
            className="rounded-xl p-3 mb-2 cursor-grab active:cursor-grabbing transition-shadow"
        >
            {/* Company initial + score */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}
                >
                    {job.company.charAt(0).toUpperCase()}
                </div>
                <span
                    className="text-xs font-bold px-1.5 py-0.5 rounded-md"
                    style={{ background: `${color}20`, color }}
                >
                    {score}%
                </span>
            </div>

            {/* Title */}
            <p className="text-sm font-medium text-white leading-snug line-clamp-2 mb-1">
                {job.title}
            </p>
            <p className="text-xs text-white/40 truncate">{job.company}</p>

            {/* Actions */}
            <div className="flex gap-1 mt-2 pt-2 border-t border-white/5">
                <button
                    onClick={() => router.push(`/jobs/${job.id}`)}
                    className="flex items-center gap-1 text-xs text-white/30 hover:text-indigo-400 transition-colors"
                >
                    <TrendingUp size={11} />
                    Chi tiết
                </button>
                <span className="text-white/15 mx-1">·</span>
                <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-xs text-white/30 hover:text-emerald-400 transition-colors"
                >
                    <ExternalLink size={11} />
                    Nguồn
                </a>
            </div>
        </div>
    );
}

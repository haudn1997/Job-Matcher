"use client";

import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Job, JobMatch } from "@prisma/client";
import { KanbanCard } from "./kanban-card";

type JobWithMatch = Job & { match: JobMatch | null };

const COLUMN_META: Record<string, { label: string; color: string; emoji: string }> = {
    BOOKMARKED: { label: "Saved", color: "#6366f1", emoji: "🔖" },
    APPLIED: { label: "Applied", color: "#22d3ee", emoji: "📤" },
    PHONE_SCREEN: { label: "Phone Screen", color: "#a78bfa", emoji: "📞" },
    INTERVIEW: { label: "Interview", color: "#f59e0b", emoji: "🎯" },
    OFFER: { label: "Offer", color: "#10b981", emoji: "🎉" },
    REJECTED: { label: "Rejected", color: "#ef4444", emoji: "❌" },
};

export function KanbanColumn({
    status,
    jobs,
}: {
    status: string;
    jobs: JobWithMatch[];
}) {
    const meta = COLUMN_META[status] ?? { label: status, color: "#6366f1", emoji: "📌" };

    return (
        <div
            className="flex flex-col rounded-2xl min-w-[240px] w-[240px]"
            style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
            }}
        >
            {/* Column header */}
            <div className="flex items-center gap-2 px-3 py-3 border-b border-white/5">
                <span className="text-base leading-none">{meta.emoji}</span>
                <span className="text-sm font-semibold text-white">{meta.label}</span>
                <span
                    className="ml-auto text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: `${meta.color}20`, color: meta.color }}
                >
                    {jobs.length}
                </span>
            </div>

            {/* Droppable area */}
            <Droppable droppableId={status}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="flex-1 p-2 min-h-[120px] transition-colors rounded-b-2xl"
                        style={{
                            background: snapshot.isDraggingOver
                                ? `${meta.color}08`
                                : "transparent",
                        }}
                    >
                        {jobs.map((job, index) => (
                            <Draggable key={job.id} draggableId={job.id} index={index}>
                                {(provided, snapshot) => (
                                    <KanbanCard
                                        job={job}
                                        provided={provided}
                                        snapshot={snapshot}
                                    />
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                        {jobs.length === 0 && !snapshot.isDraggingOver && (
                            <p className="text-xs text-white/15 text-center py-6 px-2">
                                Kéo job vào đây
                            </p>
                        )}
                    </div>
                )}
            </Droppable>
        </div>
    );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { Job, JobMatch } from "@prisma/client";
import { KanbanColumn } from "./kanban-column";
import { Loader2 } from "lucide-react";

type JobWithMatch = Job & { match: JobMatch | null };

const COLUMNS = ["BOOKMARKED", "APPLIED", "PHONE_SCREEN", "INTERVIEW", "OFFER", "REJECTED"];

export function KanbanBoard() {
    const [columns, setColumns] = useState<Record<string, JobWithMatch[]>>({});
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        const res = await fetch("/api/tracker");
        const data = await res.json();
        setColumns(data.columns ?? {});
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const srcCol = [...(columns[source.droppableId] ?? [])];
        const dstCol =
            source.droppableId === destination.droppableId
                ? srcCol
                : [...(columns[destination.droppableId] ?? [])];

        const [moved] = srcCol.splice(source.index, 1);
        dstCol.splice(destination.index, 0, moved);

        // Optimistic update
        setColumns((prev) => ({
            ...prev,
            [source.droppableId]: srcCol,
            [destination.droppableId]: dstCol,
        }));

        // Persist to DB
        try {
            await fetch(`/api/tracker/${draggableId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: destination.droppableId }),
            });
        } catch {
            // Revert on failure
            fetchData();
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-indigo-400" size={28} />
            </div>
        );
    }

    const totalTracked = COLUMNS.reduce((sum, col) => sum + (columns[col]?.length ?? 0), 0);

    if (totalTracked === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: "rgba(99,102,241,0.1)" }}
                >
                    <span className="text-3xl">📋</span>
                </div>
                <p className="text-white font-semibold mb-2">Chưa có job nào đang theo dõi</p>
                <p className="text-white/40 text-sm max-w-sm">
                    Vào Job Board, mở chi tiết một job và đổi status thành{" "}
                    <span className="text-indigo-400">Bookmarked</span> để nó xuất hiện ở đây.
                </p>
            </div>
        );
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: "60vh" }}>
                {COLUMNS.map((status) => (
                    <KanbanColumn
                        key={status}
                        status={status}
                        jobs={columns[status] ?? []}
                    />
                ))}
            </div>
        </DragDropContext>
    );
}

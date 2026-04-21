import { KanbanBoard } from "@/components/tracker/kanban-board";
import { KanbanSquare } from "lucide-react";

export default function TrackerPage() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(99,102,241,0.15)" }}
          >
            <KanbanSquare size={18} className="text-indigo-400" />
          </div>
          <h1 className="text-xl font-bold text-white">Application Tracker</h1>
        </div>
        <p className="text-sm text-white/40 ml-12">
          Kéo thả job card giữa các cột để theo dõi tiến trình apply
        </p>
      </div>

      {/* Kanban board */}
      <KanbanBoard />
    </div>
  );
}

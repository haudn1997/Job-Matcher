import { KanbanSquare } from "lucide-react";

export default function TrackerPage() {
  return (
    <div className="p-8 flex flex-col items-center justify-center h-full text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "rgba(99,102,241,0.1)" }}
      >
        <KanbanSquare size={28} className="text-indigo-400" />
      </div>
      <h1 className="text-xl font-bold text-white">Application Tracker</h1>
      <p className="text-white/40 text-sm mt-2 max-w-sm">
        Kanban board theo dõi quá trình apply — Coming in Phase 3!
      </p>
      <p className="text-white/20 text-xs mt-4">
        Hiện tại bạn có thể cập nhật status ngay trên từng job card
      </p>
    </div>
  );
}

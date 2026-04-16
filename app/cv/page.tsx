"use client";

import { useEffect, useState, useRef } from "react";
import { UserSkill } from "@prisma/client";
import {
  Upload, Loader2, FileText, Plus, X, Edit2, Check, Brain,
  Code2, Database, Server, Wrench, Heart, Cpu,
} from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { id: "backend", label: "Backend", icon: Server, color: "#6366f1" },
  { id: "frontend", label: "Frontend", icon: Code2, color: "#22d3ee" },
  { id: "database", label: "Database", icon: Database, color: "#f59e0b" },
  { id: "devops", label: "DevOps", icon: Cpu, color: "#10b981" },
  { id: "tools", label: "Tools", icon: Wrench, color: "#a78bfa" },
  { id: "soft", label: "Soft Skills", icon: Heart, color: "#f472b6" },
];

const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] as const;
const LEVEL_LABELS = { BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced", EXPERT: "Expert" };
const LEVEL_COLORS = {
  BEGINNER: "#94a3b8",
  INTERMEDIATE: "#60a5fa",
  ADVANCED: "#34d399",
  EXPERT: "#f59e0b",
};

interface UserProfile {
  name?: string | null;
  currentTitle?: string | null;
  yearsExperience?: number | null;
  desiredTitles?: string[];
  desiredLocations?: string[];
  salaryMin?: number | null;
  salaryMax?: number | null;
}

export default function CVPage() {
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [profile, setProfile] = useState<UserProfile>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: "", category: "backend", level: "INTERMEDIATE" as const });
  const [addingSkill, setAddingSkill] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/cv")
      .then((r) => r.json())
      .then((data) => {
        setSkills(data.skills ?? []);
        setProfile(data.profile ?? {});
      })
      .finally(() => setLoading(false));
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith(".pdf")) {
      toast.error("Chỉ hỗ trợ file PDF");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/cv/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSkills(data.skills);
      setProfile((p) => ({ ...p, ...data.profile }));
      toast.success(`Đã extract ${data.skills.length} skills từ CV!`);
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Upload thất bại");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const deleteSkill = async (name: string) => {
    await fetch(`/api/cv?skill=${encodeURIComponent(name)}`, { method: "DELETE" });
    setSkills((s) => s.filter((sk) => sk.name !== name));
  };

  const addSkill = async () => {
    if (!newSkill.name.trim()) return;
    const res = await fetch("/api/cv", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skills: [newSkill] }),
    });
    if (res.ok) {
      setSkills((s) => [
        ...s,
        { ...newSkill, id: Date.now().toString(), source: "manual", createdAt: new Date(), updatedAt: new Date(), yearsExp: null },
      ]);
      setNewSkill({ name: "", category: "backend", level: "INTERMEDIATE" });
      setAddingSkill(false);
      toast.success("Đã thêm skill");
    }
  };

  const skillsByCategory = CATEGORIES.map((cat) => ({
    ...cat,
    skills: skills.filter((s) => s.category === cat.id),
  }));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">CV & Skills</h1>
        <p className="text-sm text-white/40 mt-1">
          Upload CV để AI tự động extract skills, hoặc thêm tay từng skill
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload zone */}
        <div className="lg:col-span-1 space-y-6">
          {/* Drop zone */}
          <div
            className="glass-card p-6 border-dashed border-2 text-center cursor-pointer transition-all duration-200"
            style={{
              borderColor: dragOver ? "#6366f1" : "rgba(255,255,255,0.1)",
              background: dragOver ? "rgba(99,102,241,0.08)" : undefined,
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
              }}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <Brain size={32} className="text-indigo-400 animate-pulse" />
                <p className="text-sm text-white/60">AI đang phân tích CV...</p>
                <p className="text-xs text-white/30">Có thể mất 10-20 giây</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(99,102,241,0.15)" }}
                >
                  <Upload size={22} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/70">
                    Kéo thả CV vào đây
                  </p>
                  <p className="text-xs text-white/30 mt-1">hoặc click để chọn file</p>
                  <p className="text-xs text-white/20 mt-1">Chỉ hỗ trợ PDF</p>
                </div>
              </div>
            )}
          </div>

          {/* Profile info */}
          {profile.currentTitle && (
            <div className="glass-card p-5 space-y-3">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-2">
                <FileText size={13} />
                Thông tin từ CV
              </h3>
              {profile.name && (
                <div>
                  <p className="text-xs text-white/30">Tên</p>
                  <p className="text-sm font-medium text-white">{profile.name}</p>
                </div>
              )}
              {profile.currentTitle && (
                <div>
                  <p className="text-xs text-white/30">Vị trí hiện tại</p>
                  <p className="text-sm font-medium text-white">{profile.currentTitle}</p>
                </div>
              )}
              {profile.yearsExperience && (
                <div>
                  <p className="text-xs text-white/30">Kinh nghiệm</p>
                  <p className="text-sm font-medium text-white">{profile.yearsExperience} năm</p>
                </div>
              )}
              {profile.desiredTitles && profile.desiredTitles.length > 0 && (
                <div>
                  <p className="text-xs text-white/30 mb-1.5">Vị trí mong muốn</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.desiredTitles.map((t) => (
                      <span
                        key={t}
                        className="text-xs px-2 py-0.5 rounded-lg"
                        style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc" }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="glass-card p-5">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
              Thống kê skills
            </h3>
            <div className="space-y-2">
              {CATEGORIES.map((cat) => {
                const count = skills.filter((s) => s.category === cat.id).length;
                if (count === 0) return null;
                const Icon = cat.icon;
                return (
                  <div key={cat.id} className="flex items-center gap-2">
                    <Icon size={13} style={{ color: cat.color }} />
                    <span className="text-xs text-white/50 flex-1">{cat.label}</span>
                    <span className="text-xs font-medium text-white/70">{count}</span>
                  </div>
                );
              })}
              {skills.length === 0 && (
                <p className="text-xs text-white/25 text-center py-2">Upload CV để xem thống kê</p>
              )}
            </div>
          </div>
        </div>

        {/* Skills list */}
        <div className="lg:col-span-2 space-y-5">
          {/* Add skill */}
          <div className="glass-card p-4">
            {!addingSkill ? (
              <button
                onClick={() => setAddingSkill(true)}
                className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                <Plus size={16} />
                Thêm skill thủ công
              </button>
            ) : (
              <div className="flex gap-2 items-end flex-wrap">
                <div className="flex-1 min-w-32">
                  <label className="text-xs text-white/40 mb-1 block">Tên skill</label>
                  <input
                    value={newSkill.name}
                    onChange={(e) => setNewSkill((s) => ({ ...s, name: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addSkill()}
                    placeholder="e.g. Next.js"
                    autoFocus
                    className="w-full bg-white/5 border rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-indigo-500/50"
                    style={{ borderColor: "rgba(255,255,255,0.1)" }}
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Category</label>
                  <select
                    value={newSkill.category}
                    onChange={(e) => setNewSkill((s) => ({ ...s, category: e.target.value }))}
                    className="bg-white/5 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                    style={{ borderColor: "rgba(255,255,255,0.1)" }}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id} className="bg-gray-900">{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Level</label>
                  <select
                    value={newSkill.level}
                    onChange={(e) => setNewSkill((s) => ({ ...s, level: e.target.value as never }))}
                    className="bg-white/5 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                    style={{ borderColor: "rgba(255,255,255,0.1)" }}
                  >
                    {LEVELS.map((l) => (
                      <option key={l} value={l} className="bg-gray-900">{LEVEL_LABELS[l]}</option>
                    ))}
                  </select>
                </div>
                <button onClick={addSkill} className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
                  <Check size={16} />
                </button>
                <button onClick={() => setAddingSkill(false)} className="p-2 rounded-lg hover:bg-white/10 text-white/40 transition-colors">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="glass-card p-8 flex items-center justify-center">
              <Loader2 className="animate-spin text-indigo-400" size={28} />
            </div>
          ) : skills.length === 0 ? (
            <div
              className="glass-card p-12 flex flex-col items-center text-center"
            >
              <Brain size={40} className="text-indigo-400/50 mb-4" />
              <p className="text-white/40 font-medium">Chưa có skills nào</p>
              <p className="text-white/20 text-sm mt-1">
                Upload CV PDF hoặc thêm skills thủ công
              </p>
            </div>
          ) : (
            skillsByCategory
              .filter((c) => c.skills.length > 0)
              .map((cat) => {
                const Icon = cat.icon;
                return (
                  <div key={cat.id} className="glass-card p-5">
                    <h3
                      className="flex items-center gap-2 text-sm font-semibold mb-4"
                      style={{ color: cat.color }}
                    >
                      <Icon size={15} />
                      {cat.label}
                      <span className="text-white/25 font-normal text-xs ml-auto">
                        {cat.skills.length} skills
                      </span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {cat.skills.map((skill) => (
                        <div
                          key={skill.id}
                          className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg border skill-tag"
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            borderColor: "rgba(255,255,255,0.1)",
                          }}
                        >
                          <span className="text-sm text-white/80">{skill.name}</span>
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-md"
                            style={{
                              background: `${LEVEL_COLORS[skill.level as keyof typeof LEVEL_COLORS]}20`,
                              color: LEVEL_COLORS[skill.level as keyof typeof LEVEL_COLORS],
                            }}
                          >
                            {LEVEL_LABELS[skill.level as keyof typeof LEVEL_LABELS]}
                          </span>
                          {skill.yearsExp && (
                            <span className="text-xs text-white/25">{skill.yearsExp}yr</span>
                          )}
                          <button
                            onClick={() => deleteSkill(skill.name)}
                            className="opacity-0 group-hover:opacity-100 ml-1 text-white/20 hover:text-red-400 transition-all"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { JobCard } from "@/components/jobs/job-card";
import { Job, JobMatch } from "@prisma/client";
import { Search, SlidersHorizontal, PlusCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type JobWithMatch = Job & { match: JobMatch | null };

const SOURCES = ["topcv", "itviec", "manual", "manual-url"];
const STATUSES = [
  { value: "", label: "Tất cả" },
  { value: "NEW", label: "Mới" },
  { value: "BOOKMARKED", label: "Đã lưu" },
  { value: "APPLIED", label: "Đã apply" },
  { value: "INTERVIEW", label: "Phỏng vấn" },
  { value: "REJECTED", label: "Rejected" },
];

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobWithMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("score");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (minScore) params.set("minScore", minScore);
      if (source) params.set("source", source);
      if (status) params.set("status", status);
      params.set("sort", sort);
      params.set("page", String(page));

      const res = await fetch(`/api/jobs?${params}`);
      const data = await res.json();
      setJobs(data.jobs);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch {
      toast.error("Không thể tải danh sách jobs");
    } finally {
      setLoading(false);
    }
  }, [search, minScore, source, status, sort, page]);

  useEffect(() => {
    const t = setTimeout(fetchJobs, 300);
    return () => clearTimeout(t);
  }, [fetchJobs]);

  const handleStatusChange = (jobId: string, newStatus: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId && j.match
          ? { ...j, match: { ...j.match, status: newStatus as JobMatch["status"] } }
          : j
      )
    );
  };

  const handleDelete = (jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    setTotal((t) => t - 1);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Job Board
            <span className="ml-2 text-sm font-normal text-white/40">
              {total} jobs
            </span>
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Sắp xếp theo độ phù hợp với CV của bạn
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchJobs}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white/60 border transition-colors hover:text-white hover:bg-white/5"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}
          >
            <RefreshCw size={15} />
            Tải lại
          </button>
          <Link
            href="/jobs/import"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white font-medium transition-all"
            style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)" }}
          >
            <PlusCircle size={15} />
            Thêm Job
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6 flex flex-wrap gap-3 items-center">
        <SlidersHorizontal size={16} className="text-white/40" />

        {/* Search */}
        <div className="relative flex-1 min-w-52">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm theo tên job, công ty..."
            className="w-full bg-white/5 border rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}
          />
        </div>

        {/* Min Score */}
        <select
          value={minScore}
          onChange={(e) => { setMinScore(e.target.value); setPage(1); }}
          className="bg-white/5 border rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          <option value="" className="bg-gray-900">Tất cả điểm</option>
          <option value="80" className="bg-gray-900">≥ 80% (Rất phù hợp)</option>
          <option value="60" className="bg-gray-900">≥ 60% (Phù hợp)</option>
          <option value="40" className="bg-gray-900">≥ 40%</option>
        </select>

        {/* Source */}
        <select
          value={source}
          onChange={(e) => { setSource(e.target.value); setPage(1); }}
          className="bg-white/5 border rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          <option value="" className="bg-gray-900">Tất cả nguồn</option>
          {SOURCES.map((s) => (
            <option key={s} value={s} className="bg-gray-900 capitalize">
              {s}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="bg-white/5 border rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value} className="bg-gray-900">
              {s.label}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="bg-white/5 border rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          <option value="score" className="bg-gray-900">Sắp xếp: Điểm match</option>
          <option value="date" className="bg-gray-900">Sắp xếp: Ngày mới nhất</option>
        </select>
      </div>

      {/* Job Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card p-5 h-52 shimmer" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(99,102,241,0.1)" }}
          >
            <Search size={28} className="text-indigo-400" />
          </div>
          <p className="text-white/60 font-medium">Chưa có job nào</p>
          <p className="text-white/30 text-sm mt-1">
            Thêm job đầu tiên của bạn ngay
          </p>
          <Link
            href="/jobs/import"
            className="mt-4 px-5 py-2.5 rounded-xl text-sm text-white font-medium transition-all"
            style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)" }}
          >
            Thêm Job Ngay
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="w-9 h-9 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: p === page ? "linear-gradient(135deg, #6366f1, #818cf8)" : "rgba(255,255,255,0.06)",
                    color: p === page ? "white" : "rgba(255,255,255,0.5)",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

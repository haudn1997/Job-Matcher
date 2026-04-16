"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Link as LinkIcon, ClipboardPaste, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

type Mode = "text" | "url";

export default function ImportJobPage() {
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    const content = mode === "text" ? text : `Importing from: ${url}`;
    if (!content.trim() && mode === "text") {
      toast.error("Vui lòng nhập nội dung JD");
      return;
    }
    if (!url.trim() && mode === "url") {
      toast.error("Vui lòng nhập URL");
      return;
    }

    setLoading(true);
    try {
      const body =
        mode === "text"
          ? { text, url: undefined }
          : { text: `Job URL: ${url}\n\n(Nội dung sẽ được fetch tự động)`, url };

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      const score = data.job?.match?.matchScore;
      toast.success(
        score !== undefined
          ? `Import thành công! Match score: ${Math.round(score)}%`
          : "Import thành công!"
      );
      router.push(`/jobs/${data.job.id}`);
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Import thất bại, thử lại nhé");
    } finally {
      setLoading(false);
    }
  };

  const sampleJD = `Senior Fullstack Developer (.NET / React)

Công ty: TechCorp Vietnam
Địa điểm: Hà Nội (Hybrid)
Mức lương: 40-60 triệu VND

Mô tả công việc:
- Thiết kế và phát triển các ứng dụng web sử dụng ASP.NET Core và ReactJS
- Xây dựng RESTful API và tích hợp với các hệ thống third-party
- Làm việc với SQL Server và Entity Framework Core
- Tham gia vào architectural decisions và code review

Yêu cầu bắt buộc:
- 3+ năm kinh nghiệm với .NET (C#, ASP.NET Core)
- Thành thạo ReactJS, TypeScript
- Kinh nghiệm với SQL Server, Entity Framework
- Hiểu biết về REST API, Microservices

Ưu tiên có:
- Kinh nghiệm với Docker, Azure
- Biết NextJS
- Có kinh nghiệm với GraphQL`;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Thêm Job Mới</h1>
        <p className="text-sm text-white/40 mt-1">
          Paste nội dung JD hoặc URL — AI sẽ tự động phân tích và match với skills của bạn
        </p>
      </div>

      {/* Mode tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-6 w-fit"
        style={{ background: "rgba(255,255,255,0.05)" }}
      >
        {(["text", "url"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: mode === m ? "rgba(99,102,241,0.3)" : "transparent",
              color: mode === m ? "#818cf8" : "rgba(255,255,255,0.4)",
              border: mode === m ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
            }}
          >
            {m === "text" ? (
              <>
                <ClipboardPaste size={14} />
                Paste JD
              </>
            ) : (
              <>
                <LinkIcon size={14} />
                Nhập URL
              </>
            )}
          </button>
        ))}
      </div>

      <div className="glass-card p-6 space-y-5">
        {mode === "url" && (
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              URL Job (TopCV, ITviec, LinkedIn...)
            </label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://topcv.vn/viec-lam/..."
              className="w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-indigo-500/50"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            />
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-white/60">
              {mode === "text"
                ? "Nội dung JD (copy từ website tuyển dụng)"
                : "Nội dung bổ sung (tùy chọn)"}
            </label>
            {mode === "text" && (
              <button
                onClick={() => setText(sampleJD)}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Dùng mẫu demo
              </button>
            )}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              mode === "text"
                ? "Paste toàn bộ nội dung Job Description vào đây...\n\nBao gồm: tên vị trí, công ty, yêu cầu, mô tả, mức lương..."
                : "Thêm thông tin bổ sung nếu cần (tùy chọn)..."
            }
            rows={14}
            className="w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-indigo-500/50 resize-none font-mono leading-relaxed"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}
          />
          <p className="text-xs text-white/25 mt-1.5">
            {text.length} ký tự
            {text.length < 50 && text.length > 0 && " (cần ít nhất 50 ký tự)"}
          </p>
        </div>

        {/* Tips */}
        <div
          className="p-4 rounded-xl text-sm"
          style={{
            background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(99,102,241,0.15)",
          }}
        >
          <p className="text-indigo-300 font-medium mb-1">💡 Tips:</p>
          <ul className="text-white/50 space-y-1 text-xs">
            <li>• Copy toàn bộ JD từ website tuyển dụng, bao gồm cả requirements và nice-to-have</li>
            <li>• AI sẽ tự động extract: title, company, skills, salary, location</li>
            <li>• Sau khi import, AI sẽ tự động chạy matching với CV của bạn</li>
            <li>• Bạn cần upload CV trước để có kết quả match chính xác</li>
          </ul>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || (mode === "text" && text.length < 50) || (mode === "url" && !url)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all"
          style={{
            background: "linear-gradient(135deg, #6366f1, #818cf8)",
            boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
          }}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              AI đang phân tích...
            </>
          ) : (
            <>
              <FileUp size={16} />
              Import & Phân tích với AI
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

import { Job, JobMatch } from "@prisma/client";

type JobWithMatch = Job & { match: JobMatch | null };

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export async function sendTelegramMessage(text: string): Promise<void> {
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!process.env.TELEGRAM_BOT_TOKEN || !chatId) {
        // Telegram not configured — skip silently
        return;
    }

    await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: "HTML",
            disable_web_page_preview: true,
        }),
    });
}

export async function sendJobAlert(job: JobWithMatch): Promise<void> {
    if (!job.match) return;

    const score = Math.round(job.match.matchScore);
    const scoreEmoji = score >= 80 ? "🟢" : score >= 65 ? "🟡" : "🟠";

    const matched = job.match.matchedSkills.slice(0, 5).join(", ") || "Không có";
    const missing = job.match.missingSkills.slice(0, 4).join(", ") || "Không có";

    const text =
        `${scoreEmoji} <b>Job mới phù hợp ${score}%!</b>\n\n` +
        `💼 <b>${job.title}</b>\n` +
        `🏢 ${job.company}\n` +
        `📍 ${job.location ?? "Không rõ"}\n\n` +
        `✅ <b>Matched:</b> ${matched}\n` +
        `❌ <b>Thiếu:</b> ${missing}\n\n` +
        `💬 ${job.match.aiSummary ?? ""}\n\n` +
        `🔗 <a href="${job.url}">Xem job gốc</a>`;

    await sendTelegramMessage(text);
}

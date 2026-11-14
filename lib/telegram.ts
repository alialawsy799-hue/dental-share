export async function sendTelegramMessage(text: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) {
    return { ok: false, error: "بوت تلغرام غير مضبوط. أضف TELEGRAM_BOT_TOKEN و TELEGRAM_CHAT_ID." };
  }
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: false,
    }),
  });
  const payload = (await response.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
  if (!response.ok || !payload?.ok) {
    return { ok: false, error: payload?.description ?? "تعذر إرسال رسالة تلغرام." };
  }
  return { ok: true };
}

function telegramConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) return null;
  return { token, chatId };
}

export function telegramConfigured() {
  return Boolean(telegramConfig());
}

export function clinicTelegramCaption(input: {
  title: string;
  doctor: string;
  clinic: string;
  when: string;
  location: string;
  note: string;
}) {
  return [
    input.title,
    "",
    `الطبيب: ${input.doctor}`,
    `العيادة: ${input.clinic}`,
    `الوقت: ${input.when}`,
    `الموقع: ${input.location}`,
    `الملاحظات: ${input.note}`,
  ]
    .join("\n")
    .slice(0, 1024);
}

export function baghdadStamp(at = new Date()) {
  return new Intl.DateTimeFormat("ar-IQ", {
    numberingSystem: "latn",
    timeZone: "Asia/Baghdad",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(at);
}

async function telegramResult(response: Response) {
  const payload = (await response.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
  if (!response.ok || !payload?.ok) {
    return { ok: false as const, error: payload?.description ?? "تعذر إرسال رسالة تلغرام." };
  }
  return { ok: true as const };
}

export async function sendTelegramMessage(text: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const config = telegramConfig();
  if (!config) return { ok: false, error: "بوت تلغرام غير مضبوط. أضف TELEGRAM_BOT_TOKEN و TELEGRAM_CHAT_ID." };
  const response = await fetch(`https://api.telegram.org/bot${config.token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: config.chatId,
      text,
      disable_web_page_preview: false,
    }),
  });
  return telegramResult(response);
}

export async function sendTelegramDocument(input: {
  filename: string;
  mime?: string;
  bytes: ArrayBuffer | Uint8Array;
  caption: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const config = telegramConfig();
  if (!config) return { ok: false, error: "بوت تلغرام غير مضبوط. أضف TELEGRAM_BOT_TOKEN و TELEGRAM_CHAT_ID." };
  const body = new FormData();
  const bytes = Buffer.from(input.bytes instanceof Uint8Array ? input.bytes : new Uint8Array(input.bytes));
  body.append("chat_id", config.chatId);
  body.append("caption", input.caption);
  body.append("document", new File([bytes], input.filename, { type: input.mime || "application/zip" }));
  const response = await fetch(`https://api.telegram.org/bot${config.token}/sendDocument`, {
    method: "POST",
    body,
  });
  return telegramResult(response);
}

"use client";

import { useSearchParams } from "next/navigation";
import { NOTICES } from "@/lib/domain/labels";

export function NoticeBanner() {
  const params = useSearchParams();
  const code = params.get("notice");
  if (!code || !NOTICES[code]) return null;
  return (
    <div role="status" className="mb-4 rounded-2xl border border-violet/20 bg-white/90 px-4 py-3 text-sm font-bold leading-7 text-plum shadow-card">
      {NOTICES[code]}
    </div>
  );
}

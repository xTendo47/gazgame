"use client";

// Аватарка в «Профиле». С Premium — голубое светящееся кольцо и подпись «💎 Premium».
import Link from "next/link";
import { cn } from "@gazgame/ui";
import { usePremium } from "@/lib/premium";

export function ProfileAvatar() {
  const premium = usePremium();
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={cn(
          "flex size-16 items-center justify-center rounded-full bg-surface text-3xl",
          premium && "premium-ring",
        )}
      >
        👤
      </span>
      {premium && (
        <Link href="/premium" className="text-sm font-bold text-[#62D2FF]">
          💎 Premium включён
        </Link>
      )}
    </div>
  );
}

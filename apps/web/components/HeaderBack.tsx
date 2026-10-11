"use client";

// Маленькое «← Назад» в шапке экранов «Premium» и Ultimate: по истории браузера, без истории — в меню.
import { useRouter } from "next/navigation";

export function HeaderBack() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
      className="min-h-11 py-1 text-[15px] font-medium text-cream"
    >
      ← Назад
    </button>
  );
}

"use client";

// «Хочу первым 🔔» на экране Ultimate. После нажатия — плашка «Записали 🔥»; запоминается на устройстве,
// при повторном заходе сразу плашка. Событие ultimate_waitlist — один раз на устройство.
import { useSyncExternalStore } from "react";
import type { UltimateFile } from "@gazgame/content";
import { trackUltimateWaitlist } from "@/lib/analytics";
import { getProgress } from "@/lib/progress";

const EVENT = "gazgame:ultimate-waitlist";

function subscribe(listener: () => void) {
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}

export function UltimateWaitlist({ texts }: { texts: Pick<UltimateFile, "cta" | "done"> }) {
  const joined = useSyncExternalStore(subscribe, () => getProgress().hasJoinedUltimateWaitlist(), () => false);

  if (joined) {
    return (
      <div role="status" className="rounded-[18px] border border-[#FF6E28]/60 bg-surface p-4 text-center">
        <p className="font-display text-[15px] font-bold">{texts.done.title}</p>
        <p className="mt-1.5 text-[13px] text-muted">{texts.done.text}</p>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => {
        if (getProgress().joinUltimateWaitlist()) trackUltimateWaitlist();
        window.dispatchEvent(new Event(EVENT));
      }}
      className="min-h-14 rounded-[18px] bg-[linear-gradient(90deg,#FF5A1F,#FF8A2A)] px-4 py-4 font-display text-base font-bold text-white shadow-[0_8px_26px_rgb(255_90_31/0.45)]"
    >
      {texts.cta}
    </button>
  );
}

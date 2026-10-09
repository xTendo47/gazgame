import type { ReactNode } from "react";
import { Lock } from "lucide-react";

/** Закрытая «глубокая» часть результата: видно начало, остальное — по подписке. */
export function DeepTeaser({ text, label = "Глубже", children }: { text: string; label?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-card border border-line bg-surface p-5">
      <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-lime">
        <Lock aria-hidden="true" size={16} />
        {label}
      </div>
      <p className="text-lg font-semibold">{text}</p>
      <div aria-hidden="true" className="mt-2 space-y-2 blur-[3px] select-none">
        <p className="text-muted">Здесь будет полный разбор: сильные стороны, слабые места, советы…</p>
        <p className="text-muted">…и что делать с этим в отношениях, учёбе и с друзьями.</p>
      </div>
      {children && <div className="mt-4">{children}</div>}
    </section>
  );
}

import type { ReactNode } from "react";
import { cn } from "./cn";

/** Колонка экрана: на телефоне во всю ширину, на компьютере — узкая по центру. */
export function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main
      className={cn(
        "mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-5 px-4 pb-10",
        "pt-[max(1.5rem,env(safe-area-inset-top))]",
        className,
      )}
    >
      {children}
    </main>
  );
}

export interface PageHeaderProps {
  title: string;
  emoji?: string;
  subtitle?: string;
  /** Слот для ссылки «назад» (приложение передаёт свою ссылку). */
  back?: ReactNode;
  badge?: ReactNode;
}

export function PageHeader({ title, emoji, subtitle, back, badge }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-2">
      {back}
      <h1 className="font-display text-3xl font-bold leading-tight">
        {title} {emoji && <span aria-hidden="true">{emoji}</span>}
      </h1>
      {subtitle && <p className="text-muted">{subtitle}</p>}
      {badge && <div>{badge}</div>}
    </header>
  );
}

/** Логотип GAZ GAME. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex flex-col font-display font-black leading-[0.9] tracking-tight", className)}>
      <span>GAZ</span>
      <span className="text-orange">GAME</span>
    </span>
  );
}

/** Заглушка «Скоро» для разделов, которых ещё нет. */
export function ComingSoon({
  emoji,
  title,
  text,
  children,
}: {
  emoji: string;
  title: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-4 py-10 text-center">
      <div aria-hidden="true" className="text-7xl">
        {emoji}
      </div>
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      <p className="max-w-sm text-lg text-muted">{text}</p>
      {children && <div className="mt-4 flex w-full flex-col gap-3">{children}</div>}
    </section>
  );
}

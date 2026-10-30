// Физические кнопки дизайна v6.4. Стили — в ./physical.css (классы gz-*).
// Ссылкой делается так: <Link className={backTagClass()}>…</Link>, <Link className={jetonClass()}>…</Link>.
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

/** Классы таблички «назад» — для <Link>. */
export function backTagClass(className?: string): string {
  return cn("gz-back focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-lime", className);
}

/** Классы жетона (главное действие) — для <Link>. */
export function jetonClass({ ice = false, className }: { ice?: boolean; className?: string } = {}): string {
  return cn(
    "gz-jeton select-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-lime disabled:pointer-events-none disabled:opacity-50",
    ice && "gz-jeton-ice",
    className,
  );
}

type BtnProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & { className?: string };

/** Деревянная табличка «← назад» с гвоздём. */
export function BackTag({ children = "← Назад", className, type = "button", ...props }: BtnProps) {
  return (
    <button type={type} className={backTagClass(className)} {...props}>
      {children}
    </button>
  );
}

/** Объёмный жетон — основное действие. `ice` — голубой, для VIP. */
export function Jeton({ ice, className, type = "button", ...props }: BtnProps & { ice?: boolean }) {
  return <button type={type} className={jetonClass({ ice, className })} {...props} />;
}

/** Билет «Продолжим: …» с корешком «оторви». `torn` включает анимацию отрыва корешка. */
export function ContinueTicket({
  stub = "GAZ",
  number,
  torn,
  className,
  children,
  type = "button",
  ...props
}: BtnProps & { stub?: string; number?: string; torn?: boolean }) {
  return (
    <button type={type} className={cn("gz-obj gz-ticket", torn && "gz-tear", className)} {...props}>
      <span className="gz-ticket-stub">
        <b>{stub}</b>
        {number && <small>{number}</small>}
      </span>
      <span className="gz-ticket-main">{children}</span>
    </button>
  );
}

/** Бумажный билет режима: ADMIT ONE / TWO / ALL. Выбранный — оранжевый. */
export function AdmitTicket({
  admit,
  label,
  serial,
  pressed,
  className,
  type = "button",
  ...props
}: BtnProps & { admit: "ONE" | "TWO" | "ALL"; label: string; serial?: string; pressed?: boolean }) {
  return (
    <button type={type} aria-pressed={pressed} className={cn("gz-admit gz-obj", className)} {...props}>
      <small>ADMIT {admit}</small>
      <b>{label}</b>
      {serial && <i>{serial}</i>}
    </button>
  );
}

/** Деревянная (или картонная, `card`) бирка-подпись. */
export function Tag({ card, className, children }: { card?: boolean; className?: string; children: ReactNode }) {
  return <span className={cn("gz-tag", card && "gz-tag-card", className)}>{children}</span>;
}

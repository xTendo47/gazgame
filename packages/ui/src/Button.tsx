import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "accent" | "ghost" | "outline" | "option";
export type ButtonSize = "lg" | "md";

const VARIANTS: Record<ButtonVariant, string> = {
  // Тёмный текст на оранжевом — контраст выше, чем у белого (доступность).
  primary: "bg-orange text-bg hover:brightness-110",
  accent: "bg-lime text-bg hover:brightness-105",
  ghost: "bg-surface text-cream hover:bg-surface-2",
  outline: "border-2 border-line text-cream hover:border-muted",
  option: "bg-surface text-cream justify-start text-left font-semibold hover:bg-surface-2 border border-line",
};

const SIZES: Record<ButtonSize, string> = {
  lg: "min-h-16 px-6 py-4 text-lg",
  md: "min-h-12 px-5 py-3 text-base",
};

/** Классы кнопки — чтобы сделать кнопкой ссылку: <Link className={buttonVariants()}>. */
export function buttonVariants({
  variant = "primary",
  size = "lg",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}): string {
  return cn(
    "inline-flex w-full select-none items-center justify-center gap-2 rounded-card font-extrabold",
    "transition duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-lime",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonVariants({ variant, size, className })} {...props} />;
}

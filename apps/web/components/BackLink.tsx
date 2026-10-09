import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function BackLink({ href, children = "Назад" }: { href: string; children?: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="-ml-1 inline-flex min-h-11 items-center gap-1 self-start rounded-full pr-3 text-[15px] font-semibold text-muted hover:text-cream"
    >
      <ChevronLeft aria-hidden="true" size={20} />
      {children}
    </Link>
  );
}

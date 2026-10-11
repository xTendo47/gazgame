// SVG-трезубец Ultimate из макета (drafts-ultimate/mock.html) в огненном градиенте, мягко покачивается.
import { useId } from "react";

export function Trident({ size = 92 }: { size?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" className="trident">
      <defs>
        <linearGradient id={`${id}fire`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#FF5A1F" />
          <stop offset=".6" stopColor="#FF9A2E" />
          <stop offset="1" stopColor="#FFE07A" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${id}fire)`}
        d="M50 4 L58 22 L53 22 L53 52 Q66 50 68 34 L64 34 L72 16 L80 34 L76 34 Q74 60 53 62 L53 84 L60 84 L60 92 L40 92 L40 84 L47 84 L47 62 Q26 60 24 34 L20 34 L28 16 L36 34 L32 34 Q34 50 47 52 L47 22 L42 22 Z"
      />
    </svg>
  );
}

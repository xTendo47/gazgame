// @gazgame/ui — дизайн-система GAZ Game.
// Чистые React-компоненты на Tailwind. Не знают про Next.js, контент и движок —
// всё нужное получают через props. Токены (цвета, шрифты) — в ./theme.css.
export { cn } from "./cn";
export { Button, buttonVariants, type ButtonProps, type ButtonVariant, type ButtonSize } from "./Button";
export { Tile, type TileProps, type TileAccent } from "./Tile";
export { Badge, type BadgeTone } from "./Badge";
export { ProgressBar, type ProgressBarProps } from "./ProgressBar";
export { Screen, PageHeader, Logo, ComingSoon, type PageHeaderProps } from "./Layout";
export { DeepTeaser } from "./DeepTeaser";
export { ShareCard, type ShareCardProps } from "./ShareCard";

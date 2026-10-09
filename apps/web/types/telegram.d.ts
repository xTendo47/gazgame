// Минимальные типы Telegram Mini App (telegram-web-app.js) — только то, что мы используем.
// Полное описание: https://core.telegram.org/bots/webapps

interface TelegramBackButton {
  show(): void;
  hide(): void;
  onClick(callback: () => void): void;
  offClick(callback: () => void): void;
}

interface TelegramWebApp {
  initData: string;
  platform: string;
  colorScheme: "light" | "dark";
  ready(): void;
  expand(): void;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  setBottomBarColor?(color: string): void;
  disableVerticalSwipes?(): void;
  BackButton: TelegramBackButton;
}

interface Window {
  Telegram?: { WebApp?: TelegramWebApp };
}

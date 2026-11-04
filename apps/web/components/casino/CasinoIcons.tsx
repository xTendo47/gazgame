// Значок игры на карточках «Тусовки»: настоящее эмодзи, которым игра помечена в sections.json (как в эталоне 05).
// Размер задаёт оформление карточки (.cd-emoji в casino-deck.css).

export function GameIcon({ emoji }: { emoji: string }) {
  return (
    <span className="cd-emoji" aria-hidden="true">
      {emoji}
    </span>
  );
}

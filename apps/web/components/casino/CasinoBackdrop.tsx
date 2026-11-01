// Задний план казино для экранов игр «Тусовки» и итогов: зелёное сукно, края круглого стола в углах, внизу полоса дерева.
// Лежит под содержимым (fixed, z-index −1); сама игра и её экраны остаются как есть, а цвета карточек и плашек
// внутри страницы перекрашивает класс .cg-skin (casino.css).
export function CasinoBackdrop() {
  return (
    <div className="cg-backdrop" aria-hidden="true">
      <span className="cs-rim cs-rim-l" />
      <span className="cs-rim cs-rim-r" />
      <span className="cg-wood" />
    </div>
  );
}

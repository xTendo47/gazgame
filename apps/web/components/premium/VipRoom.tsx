// Комната VIP (макет v6.4, блок .room74): луч прожектора, бархатный канат на латунных столбиках и золотая пыль.
// Только оформление: под содержимым, не нажимается. Анимация — пылинки поднимаются и гаснут (opacity/transform).

/** Пылинки: положение и задержка считаются по номеру, как в макете (22 штуки). */
const DUST = Array.from({ length: 22 }, (_, i) => ({ x: (i * 37) % 100, y: (i * 53) % 100, delay: -(i % 7), size: 1 + (i % 3) }));

export function VipRoom() {
  return (
    <div className="vip-room" aria-hidden="true">
      <span className="vip-spot" />
      <span className="vip-rope">
        <i className="vip-post vip-post-l" />
        <i className="vip-post vip-post-r" />
        <svg viewBox="0 0 300 60" preserveAspectRatio="none">
          <path d="M10 14Q150 64 290 14" stroke="#7a0a1a" strokeWidth="9" fill="none" strokeLinecap="round" />
          <path d="M10 12Q150 60 290 12" stroke="#c42a3a" strokeWidth="3" fill="none" opacity=".6" strokeLinecap="round" />
        </svg>
      </span>
      {DUST.map((d, i) => (
        <i key={i} className="vip-dust" style={{ left: `${d.x}%`, top: `${d.y}%`, animationDelay: `${d.delay}s`, width: d.size, height: d.size }} />
      ))}
    </div>
  );
}

// Карта VIP (макет v6.4, блоки .kc64 и .det74): чёрная с золотом, чип, волны NFC, голограмма, золотое «VIP».
// Ток бежит по краю (пунктир по рамке), по карте скользит блик, голограмма переливается; карта слегка парит.
import type { CSSProperties } from "react";

export function VipCard({ burst }: { burst?: boolean }) {
  return (
    <div className="vip-card" data-burst={burst ? "true" : undefined}>
      <span className="vip-card-top">GAZ GAME</span>
      <span className="vip-card-chip" aria-hidden="true" />
      <span className="vip-card-nfc" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="vip-card-holo" aria-hidden="true" />
      <span className="vip-card-vip">VIP</span>
      <span className="vip-card-num">0007 2026 GAZ0 0001</span>
      <span className="vip-card-open">ВСЁ ОТКРЫТО</span>
      <span className="vip-card-since">MEMBER SINCE 2026</span>
      <span className="vip-card-shine" aria-hidden="true" />
      {/* ток по краю: пунктир бежит по рамке */}
      <svg className="vip-card-cur" viewBox="0 0 100 64" preserveAspectRatio="none" aria-hidden="true">
        <rect x="1" y="1" width="98" height="62" rx="5" pathLength="100" />
      </svg>
    </div>
  );
}

/** Искры вокруг карты при верном коде. */
export function VipSparks({ sparks }: { sparks: { dx: string; dy: string }[] }) {
  return (
    <span aria-hidden="true" className="vip-sparks">
      {sparks.map((s, i) => (
        <span key={i} className="premium-spark" style={{ "--dx": s.dx, "--dy": s.dy } as CSSProperties} />
      ))}
    </span>
  );
}

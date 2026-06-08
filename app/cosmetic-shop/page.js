"use client";

import { useEffect, useState } from "react";

export default function CosmeticShopPreviewPage() {
  const [cosmetics, setCosmetics] = useState([]);
  const [message, setMessage] = useState("Loading cosmetic preview...");

  useEffect(() => {
    loadPreview();
  }, []);

  async function loadPreview() {
    try {
      const response = await fetch("/api/cosmetics/list", {
        cache: "no-store",
      });

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Gagal load cosmetic preview.");
      }

      setCosmetics(payload.cosmetics || []);
      setMessage("Preview cosmetic berhasil dimuat.");
    } catch (error) {
      setMessage(error.message || "Gagal load cosmetic preview.");
    }
  }

  const borderItems = cosmetics.filter((item) => String(item.cosmetic_type).toLowerCase() === "border");
  const effectItems = cosmetics.filter((item) => String(item.cosmetic_type).toLowerCase() === "effect");

  function priceLabel(item) {
    const silver = Number(item.price_silver || 0);
    const bronze = Number(item.price_bronze || 0);

    if (silver && bronze) return `${silver}S ${bronze}B`;
    if (silver) return `${silver}S`;
    if (bronze) return `${bronze}B`;
    return "Free";
  }

  function renderCard(item) {
    return (
      <article key={item.id} className="cos-card">
        <div className="cos-preview">
          <div className={item.css_class || ""}>{item.preview_text || item.name}</div>
        </div>

        <div className="cos-body">
          <div className="cos-top">
            <h3>{item.name}</h3>
            <span>{item.rarity}</span>
          </div>

          <p>{item.description}</p>

          <div className="cos-meta">
            <span>{item.cosmetic_type}</span>
            <strong>{priceLabel(item)}</strong>
          </div>

          <div className="btn-row">
            <button type="button" disabled className="btn btn-secondary">
              Buy Soon
            </button>
            <button type="button" disabled className="btn btn-primary">
              Equip Soon
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <main className="shop-shell">
      <style jsx global>{`
        * { box-sizing: border-box; }

        body {
          margin: 0;
          background: #06070b;
          color: #f6f0df;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .shop-shell {
          min-height: 100vh;
          padding: 26px 14px 42px;
          background:
            radial-gradient(circle at top left, rgba(226, 184, 83, .16), transparent 34%),
            radial-gradient(circle at top right, rgba(104, 137, 211, .12), transparent 30%),
            linear-gradient(135deg, #07080c, #111622 48%, #050508);
        }

        .shop-wrap {
          width: min(1180px, 100%);
          margin: 0 auto;
        }

        .panel,
        .cos-card {
          border: 1px solid rgba(255,255,255,.10);
          background: rgba(255,255,255,.045);
          box-shadow: 0 24px 70px rgba(0,0,0,.36);
          backdrop-filter: blur(12px);
        }

        .hero {
          border-radius: 28px;
          padding: 24px;
          margin-bottom: 16px;
        }

        .eyebrow {
          margin: 0 0 10px;
          color: rgba(232,202,127,.82);
          letter-spacing: .28em;
          text-transform: uppercase;
          font-size: 12px;
          font-weight: 900;
        }

        h1 {
          margin: 0;
          font-size: clamp(32px, 6vw, 54px);
          letter-spacing: -.05em;
        }

        .sub {
          color: rgba(246,240,223,.62);
          line-height: 1.65;
          max-width: 820px;
        }

        .message {
          margin-top: 14px;
          border-radius: 16px;
          background: rgba(232,202,127,.10);
          border: 1px solid rgba(232,202,127,.16);
          padding: 12px 14px;
          color: rgba(246,240,223,.76);
          font-size: 13px;
        }

        .section-title {
          margin: 20px 4px 12px;
          color: rgba(246,240,223,.76);
          letter-spacing: .14em;
          text-transform: uppercase;
          font-size: 13px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .cos-card {
          border-radius: 24px;
          overflow: hidden;
        }

        .cos-preview {
          min-height: 96px;
          display: grid;
          place-items: center;
          background: rgba(0,0,0,.28);
          padding: 18px;
          text-align: center;
          font-weight: 950;
        }

        .cos-body {
          padding: 16px;
        }

        .cos-top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: start;
        }

        .cos-top h3 {
          margin: 0;
          font-size: 16px;
        }

        .cos-top span {
          color: rgba(232,202,127,.78);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: .12em;
          font-weight: 900;
        }

        .cos-body p {
          color: rgba(246,240,223,.58);
          line-height: 1.55;
          min-height: 48px;
          font-size: 13px;
        }

        .cos-meta {
          display: flex;
          justify-content: space-between;
          margin: 12px 0;
          color: rgba(246,240,223,.70);
          font-size: 13px;
        }

        .btn-row {
          display: flex;
          gap: 9px;
        }

        .btn {
          border: 0;
          border-radius: 13px;
          padding: 11px 14px;
          font-weight: 950;
          width: 100%;
        }

        .btn-primary {
          background: linear-gradient(135deg, #f5d77f, #b88933);
          color: #110d05;
        }

        .btn-secondary {
          background: rgba(255,255,255,.08);
          color: #f6f0df;
          border: 1px solid rgba(255,255,255,.10);
        }

        .btn:disabled {
          opacity: .55;
        }

        @media (max-width: 880px) {
          .grid { grid-template-columns: 1fr; }
          .hero { padding: 16px; border-radius: 22px; }
        }
      `}</style>

      <section className="shop-wrap">
        <div className="panel hero">
          <p className="eyebrow">Lunaria Player Portal</p>
          <h1>Cosmetic Shop</h1>
          <p className="sub">
            Preview border dan effect cosmetic Lunaria. Buy/Equip sedang dalam finalisasi admin system.
          </p>
          <div className="message">{message}</div>
        </div>

        <h2 className="section-title">Border Cosmetics</h2>
        <div className="grid">{borderItems.map(renderCard)}</div>

        <h2 className="section-title">Effect Cosmetics</h2>
        <div className="grid">{effectItems.map(renderCard)}</div>
      </section>
    </main>
  );
}

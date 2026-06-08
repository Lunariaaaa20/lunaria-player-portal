"use client";

const links = [
  {
    title: "Profile",
    href: "/profile",
    desc: "Edit profile character, quote, age, personality, appearance, dan backstory.",
    status: "Stable",
  },
  {
    title: "ID Card",
    href: "/id-card",
    desc: "Lihat dan copy ID Card karakter Lunaria.",
    status: "Stable",
  },
  {
    title: "Registration",
    href: "/registration",
    desc: "Daftar karakter baru untuk masuk approval admin.",
    status: "Open",
  },
  {
    title: "Leaderboard",
    href: "/leaderboard",
    desc: "Ranking player berdasarkan score.",
    status: "Basic",
  },
  {
    title: "Cosmetic Shop",
    href: "/cosmetic-shop",
    desc: "Preview border dan effect cosmetic. Buy/Equip sedang finalisasi.",
    status: "Preview",
  },
];

export default function HomePage() {
  return (
    <main className="shell">
      <style jsx global>{`
        * { box-sizing: border-box; }

        body {
          margin: 0;
          background: #06070b;
          color: #f6f0df;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .shell {
          min-height: 100vh;
          padding: 28px 14px 42px;
          background:
            radial-gradient(circle at top left, rgba(226, 184, 83, .16), transparent 34%),
            radial-gradient(circle at top right, rgba(104, 137, 211, .12), transparent 30%),
            linear-gradient(135deg, #07080c, #111622 48%, #050508);
        }

        .wrap {
          width: min(1120px, 100%);
          margin: 0 auto;
        }

        .hero,
        .card {
          border: 1px solid rgba(255,255,255,.10);
          background: rgba(255,255,255,.045);
          box-shadow: 0 24px 70px rgba(0,0,0,.36);
          backdrop-filter: blur(12px);
        }

        .hero {
          border-radius: 30px;
          padding: 26px;
          margin-bottom: 18px;
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
          font-size: clamp(34px, 7vw, 62px);
          letter-spacing: -.06em;
          line-height: .96;
        }

        .sub {
          color: rgba(246,240,223,.66);
          max-width: 780px;
          line-height: 1.65;
          margin: 16px 0 0;
        }

        .notice {
          margin-top: 18px;
          border-radius: 18px;
          padding: 13px 15px;
          background: rgba(232,202,127,.10);
          border: 1px solid rgba(232,202,127,.18);
          color: rgba(246,240,223,.78);
          font-size: 13px;
          line-height: 1.55;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .card {
          display: block;
          text-decoration: none;
          color: inherit;
          border-radius: 24px;
          padding: 18px;
          transition: transform .18s ease, border-color .18s ease, background .18s ease;
        }

        .card:hover {
          transform: translateY(-2px);
          border-color: rgba(232,202,127,.32);
          background: rgba(255,255,255,.065);
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: start;
        }

        h2 {
          margin: 0;
          font-size: 20px;
          letter-spacing: -.02em;
        }

        .badge {
          border-radius: 999px;
          padding: 5px 9px;
          background: rgba(232,202,127,.12);
          border: 1px solid rgba(232,202,127,.18);
          color: rgba(232,202,127,.86);
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        .card p {
          color: rgba(246,240,223,.58);
          line-height: 1.55;
          font-size: 13px;
          margin: 14px 0 0;
        }

        @media (max-width: 860px) {
          .grid { grid-template-columns: 1fr; }
          .hero { padding: 20px; border-radius: 24px; }
        }
      `}</style>

      <section className="wrap">
        <div className="hero">
          <p className="eyebrow">Lunaria Player Portal</p>
          <h1>Welcome to Lunaria</h1>
          <p className="sub">
            Portal resmi untuk profile character, ID Card, registration, leaderboard, dan preview cosmetic Lunaria.
          </p>
          <div className="notice">
            MVP public mode aktif. Profile dan claim code sudah stabil. Cosmetic Buy/Equip dan avatar upload sedang dalam finalisasi admin system.
          </div>
        </div>

        <div className="grid">
          {links.map((item) => (
            <a className="card" href={item.href} key={item.href}>
              <div className="card-top">
                <h2>{item.title}</h2>
                <span className="badge">{item.status}</span>
              </div>
              <p>{item.desc}</p>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}

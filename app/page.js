import Link from "next/link";

export default function HomePage() {
  return (
    <main className="portal-home">
      <section className="portal-hero">
        <p className="eyebrow">LUNARIA CHARACTER PORTAL</p>
        <h1>LUNARIA PLAYER PORTAL</h1>
        <p className="hero-copy">
          Portal resmi untuk identitas karakter, ID card, profile adventurer,
          leaderboard, dan cosmetic prestige komunitas roleplay fantasy Lunaria.
        </p>

        <div className="hero-meta-grid">
          <div className="hero-stat-card">
            <span>System Focus</span>
            <strong>Character Portal</strong>
          </div>
          <div className="hero-stat-card">
            <span>Status</span>
            <strong>MVP Active</strong>
          </div>
          <div className="hero-stat-card">
            <span>Theme</span>
            <strong>Luxury Fantasy</strong>
          </div>
        </div>
      </section>

      <section className="portal-section">
        <p className="eyebrow">QUICK ACCESS</p>
        <h2>Lunaria Core Services</h2>
        <p className="muted">
          Akses utama untuk registrasi karakter, registry, leaderboard, profile,
          ID card, cosmetic shop, dan admin control.
        </p>

        <div className="portal-grid">
          <Link className="portal-card" href="/registration">
            <strong>Character Registration</strong>
            <span>Daftarkan karakter baru untuk masuk review admin.</span>
          </Link>

          <Link className="portal-card" href="/registry">
            <strong>Adventurer Registry</strong>
            <span>Lihat daftar karakter aktif Lunaria.</span>
          </Link>

          <Link className="portal-card" href="/leaderboard">
            <strong>Leaderboard</strong>
            <span>Lihat ranking karakter berdasarkan progress dan poin.</span>
          </Link>

          <Link className="portal-card" href="/profile">
            <strong>Character Profile</strong>
            <span>Kelola avatar, bio, quote, dan identitas karakter.</span>
          </Link>

          <Link className="portal-card" href="/id-card">
            <strong>ID Card</strong>
            <span>Lihat dan salin ID card resmi karakter.</span>
          </Link>

          <Link className="portal-card" href="/cosmetic-shop">
            <strong>Cosmetic Shop</strong>
            <span>Beli border dan name effect premium untuk karakter.</span>
          </Link>

          <Link className="portal-card" href="/admin">
            <strong>Admin Panel</strong>
            <span>Approve registrasi dan kelola data resmi karakter.</span>
          </Link>
        </div>
      </section>

      <section className="portal-section">
        <p className="eyebrow">GUILD NOTICE</p>
        <h2>Official Lunaria MVP Scope</h2>
        <p className="muted">
          Fitur aktif difokuskan pada character identity, profile, leaderboard,
          dan cosmetic prestige. Sistem economy kompleks dipindahkan ke phase berikutnya.
        </p>
      </section>
    </main>
  );
}

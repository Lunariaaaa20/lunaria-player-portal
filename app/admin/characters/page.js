"use client";

import Link from "next/link";

export default function AdminCharactersPage() {
  return (
    <main className="admin-page">
      <section className="admin-panel">
        <p className="eyebrow">LUNARIA ADMIN</p>
        <h1>Character Admin Temporarily Locked</h1>
        <p className="muted">
          Halaman admin characters sedang distabilkan ulang setelah update ID Card.
          Data karakter tidak dihapus. Ini hanya pengaman sementara agar build dan deploy kembali hijau.
        </p>

        <div className="admin-actions">
          <Link className="admin-secondary" href="/">
            Back to Home
          </Link>
          <Link className="admin-secondary" href="/registry">
            Open Registry
          </Link>
        </div>
      </section>
    </main>
  );
}

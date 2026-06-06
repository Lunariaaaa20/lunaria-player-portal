"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const ADMIN_PASSWORD = "lunaria-admin";

const modules = [
  {
    title: "Character Management",
    href: "/admin/characters",
    status: "Active",
    description: "Approve, suspend, edit, dan kelola ID Card karakter Lunaria.",
    stats: [
      ["Review", "Pending"],
      ["Registry", "Active"],
    ],
  },
  {
    title: "Quest Applications",
    href: "/admin/applications",
    status: "Active",
    description: "Approve Take Quest sebelum player menjalankan misi.",
    stats: [
      ["Take Quest", "Approval"],
      ["Quest Lock", "Active"],
    ],
  },
  {
    title: "Quest Reports",
    href: "/admin/reports",
    status: "Active",
    description: "Review laporan quest dan apply reward distribution ke ID Card.",
    stats: [
      ["Reward", "Auto"],
      ["Party", "Supported"],
    ],
  },
  {
    title: "Quest Management",
    href: "/admin/quests",
    status: "Active",
    description: "Tambah, edit, hapus, dan kelola status quest Lunaria.",
    stats: [
      ["Board", "Public"],
      ["Status", "Managed"],
    ],
  },
  {
    title: "Economy Management",
    href: "/admin/economy",
    status: "Active",
    description: "Kelola harga item, makanan, blacksmith, material, dan layanan.",
    stats: [
      ["Items", "Managed"],
      ["Shop", "Ready"],
    ],
  },
  {
    title: "Rules Management",
    href: "/admin/rules",
    status: "Active",
    description: "Kelola aturan rank, pathway, reward, inventory, combat, dan komunitas.",
    stats: [
      ["Rules", "Managed"],
      ["Guide", "Public"],
    ],
  },
];

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedPassword = window.localStorage.getItem("lunaria_admin_password");

    if (savedPassword === ADMIN_PASSWORD) {
      setPassword(savedPassword);
      setUnlocked(true);
    }
  }, []);

  function handleLogin(event) {
    event.preventDefault();

    if (password === ADMIN_PASSWORD) {
      window.localStorage.setItem("lunaria_admin_password", password);
      setUnlocked(true);
      setMessage("");
      return;
    }

    setMessage("Password salah.");
  }

  function logoutAdmin() {
    window.localStorage.removeItem("lunaria_admin_password");
    setUnlocked(false);
    setPassword("");
  }

  return (
    <div className="page">
      <aside className="sidebar">
        <div className="logo">LUNARIA</div>
        <div className="subtitle">Admin Dashboard</div>

        <nav className="nav">
          <div className="nav-section-title">PUBLIC</div>
          <Link href="/">Home</Link>
          <Link href="/registry">Adventurer Registry</Link>
          <Link href="/quests">Quest Board</Link>
          <Link href="/quest-report">Quest Report</Link>
          <Link href="/economy">Economy System</Link>
          <Link href="/rules">Rules & Guide</Link>

          <div className="nav-section-title">PLAYER</div>
          <Link href="/registration">Character Registration</Link>

          <div className="nav-section-title">ADMIN</div>
          <Link href="/admin">Admin Dashboard</Link>
          <Link href="/admin/characters">Character Admin</Link>
          <Link href="/admin/applications">Applications Admin</Link>
          <Link href="/admin/reports">Reports Admin</Link>
          <Link href="/admin/quests">Quest Admin</Link>
          <Link href="/admin/economy">Economy Admin</Link>
          <Link href="/admin/rules">Rules Admin</Link>
        </nav>
      </aside>

      <main className="content">
        <section className="hero">
          <h1>ADMIN PANEL</h1>
          <p>
            Dashboard utama pengelolaan sistem Lunaria. Pilih modul kerja admin sesuai kebutuhan operasional.
          </p>
        </section>

        {!unlocked ? (
          <section className="section admin-lock">
            <h2>Admin Access</h2>

            <form className="admin-form" onSubmit={handleLogin}>
              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Masukkan password admin"
                  required
                />
              </label>

              <button className="admin-submit" type="submit">
                Unlock Admin Panel
              </button>

              {message && <p className="admin-message">{message}</p>}
            </form>
          </section>
        ) : (
          <>
            <div className="admin-top-actions">
              <button className="admin-secondary" type="button">
                System Online
              </button>

              <button className="admin-danger" type="button" onClick={logoutAdmin}>
                Logout Admin
              </button>
            </div>

            <section className="section">
              <h2>Management Modules</h2>

              <div className="admin-module-grid">
                {modules.map((module) => (
                  <Link className="admin-module-card" href={module.href} key={module.title}>
                    <div className="admin-module-header">
                      <h3>{module.title}</h3>
                      <span>{module.status}</span>
                    </div>

                    <p>{module.description}</p>

                    <div className="admin-module-stats">
                      {module.stats.map(([label, value]) => (
                        <div key={`${module.title}-${label}`}>
                          <strong>{value}</strong>
                          <span>{label}</span>
                        </div>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

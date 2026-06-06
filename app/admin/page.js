"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const ADMIN_PASSWORD = "lunaria-admin";

const adminModules = [
  {
    key: "quests",
    title: "Quest Management",
    href: "/admin/quests",
    status: "Active",
    description:
      "Tambah, edit, hapus, dan kelola status quest Lunaria. Quest Draft tidak tampil di Quest Board public.",
  },
  {
    key: "economy",
    title: "Economy Management",
    href: "/admin/economy",
    status: "Active",
    description:
      "Tambah, edit, hapus, dan kelola harga item, makanan, blacksmith, layanan, material, dan loot exchange.",
  },
  {
    key: "rules",
    title: "Rules Management",
    href: "/admin/rules",
    status: "Active",
    description:
      "Tambah, edit, hapus, dan kelola aturan rank, pathway, quest, reward, inventory, combat, dan sistem komunitas.",
  },
  {
    key: "characters",
    title: "Character Management",
    href: "/admin/characters",
    status: "Active",
    description:
      "Tambah, edit, approve, suspend, dan kelola ID Card karakter Lunaria.",
  },
];

function getStatValue(stats, moduleKey, groupKey, valueKey) {
  return stats?.[moduleKey]?.[groupKey]?.[valueKey] || 0;
}

export default function AdminDashboardPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsMessage, setStatsMessage] = useState("");

  async function loadStats(currentPassword = password) {
    setStatsLoading(true);
    setStatsMessage("");

    const response = await fetch("/api/admin/stats", {
      headers: {
        "x-admin-password": currentPassword,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      setStatsMessage(result.error || "Gagal memuat admin stats.");
      setStatsLoading(false);
      return;
    }

    setStats(result);
    setStatsLoading(false);
  }

  useEffect(() => {
    const savedPassword = window.localStorage.getItem("lunaria_admin_password");

    if (savedPassword === ADMIN_PASSWORD) {
      setPassword(savedPassword);
      setUnlocked(true);
      loadStats(savedPassword);
    }
  }, []);

  async function handleLogin(event) {
    event.preventDefault();

    if (password === ADMIN_PASSWORD) {
      window.localStorage.setItem("lunaria_admin_password", password);
      setUnlocked(true);
      setLoginMessage("");
      await loadStats(password);
      return;
    }

    setLoginMessage("Password salah.");
  }

  function logoutAdmin() {
    window.localStorage.removeItem("lunaria_admin_password");
    setUnlocked(false);
    setPassword("");
    setStats(null);
  }

  return (
    <div className="page">
      <aside className="sidebar">
        <div className="logo">LUNARIA</div>
        <div className="subtitle">Admin Dashboard</div>

        <nav className="nav">
          <Link href="/">Home</Link>
          <Link href="/registry">Adventurer Registry</Link>
          <Link href="/quests">Quest Board</Link>
          <Link href="/economy">Economy System</Link>
          <Link href="/rules">Rules & Guide</Link>
          <Link href="/admin">Admin Dashboard</Link>
          <Link href="/admin/characters">Character Admin</Link>
          <Link href="/admin/quests">Quest Admin</Link>
          <Link href="/admin/economy">Economy Admin</Link>
          <Link href="/admin/rules">Rules Admin</Link>
        </nav>
      </aside>

      <main className="content">
        <section className="hero">
          <h1>ADMIN PANEL</h1>
          <p>
            Dashboard utama pengelolaan sistem Lunaria. Pilih modul kerja admin
            sesuai kebutuhan operasional.
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
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password admin"
                  required
                />
              </label>

              <button className="admin-submit" type="submit">
                Unlock Admin Dashboard
              </button>

              {loginMessage && <p className="admin-message">{loginMessage}</p>}
            </form>
          </section>
        ) : (
          <>
            <div className="admin-top-actions">
              <button
                className="admin-secondary"
                type="button"
                onClick={() => loadStats()}
                disabled={statsLoading}
              >
                {statsLoading ? "Refreshing..." : "Refresh Stats"}
              </button>

              <button className="admin-danger" type="button" onClick={logoutAdmin}>
                Logout Admin
              </button>
            </div>

            {statsMessage && <p className="admin-message">{statsMessage}</p>}

            <section className="section">
              <h2>Management Modules</h2>

              <div className="admin-module-grid">
                {adminModules.map((module) => (
                  <Link className="admin-module-card" href={module.href} key={module.title}>
                    <div className="admin-module-header">
                      <h3>{module.title}</h3>
                      <span>{module.status}</span>
                    </div>

                    <p>{module.description}</p>

                    {module.key === "quests" && (
                      <div className="admin-stat-grid">
                        <div>
                          <strong>{stats?.quests?.total || 0}</strong>
                          <span>Total Quests</span>
                        </div>
                        <div>
                          <strong>{getStatValue(stats, "quests", "byStatus", "Available")}</strong>
                          <span>Available</span>
                        </div>
                        <div>
                          <strong>{getStatValue(stats, "quests", "byStatus", "Draft")}</strong>
                          <span>Draft</span>
                        </div>
                        <div>
                          <strong>{getStatValue(stats, "quests", "byStatus", "Closed")}</strong>
                          <span>Closed</span>
                        </div>
                      </div>
                    )}

                    {module.key === "economy" && (
                      <div className="admin-stat-grid">
                        <div>
                          <strong>{stats?.economy?.total || 0}</strong>
                          <span>Total Items</span>
                        </div>
                        <div>
                          <strong>{getStatValue(stats, "economy", "byAvailability", "Available")}</strong>
                          <span>Available</span>
                        </div>
                        <div>
                          <strong>{getStatValue(stats, "economy", "byAvailability", "Limited")}</strong>
                          <span>Limited</span>
                        </div>
                        <div>
                          <strong>{getStatValue(stats, "economy", "byAvailability", "Restricted")}</strong>
                          <span>Restricted</span>
                        </div>
                      </div>
                    )}

                    {module.key === "rules" && (
                      <div className="admin-stat-grid">
                        <div>
                          <strong>{stats?.rules?.total || 0}</strong>
                          <span>Total Rules</span>
                        </div>
                        <div>
                          <strong>{getStatValue(stats, "rules", "byStatus", "Active")}</strong>
                          <span>Active</span>
                        </div>
                        <div>
                          <strong>{getStatValue(stats, "rules", "byStatus", "Draft")}</strong>
                          <span>Draft</span>
                        </div>
                        <div>
                          <strong>{getStatValue(stats, "rules", "byStatus", "Archived")}</strong>
                          <span>Archived</span>
                        </div>
                      </div>
                    )}

                    {module.key === "characters" && (
                      <div className="admin-stat-grid">
                        <div>
                          <strong>{stats?.characters?.total || 0}</strong>
                          <span>Total Characters</span>
                        </div>
                        <div>
                          <strong>{getStatValue(stats, "characters", "byStatus", "Active")}</strong>
                          <span>Active</span>
                        </div>
                        <div>
                          <strong>{getStatValue(stats, "characters", "byStatus", "Pending")}</strong>
                          <span>Pending</span>
                        </div>
                        <div>
                          <strong>{getStatValue(stats, "characters", "byStatus", "Suspended")}</strong>
                          <span>Suspended</span>
                        </div>
                      </div>
                    )}
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
